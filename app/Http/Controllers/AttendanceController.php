<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Athlete;
use App\Models\Dojo;
use App\Models\FinanceRecord;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    private const TOTP_PERIOD = 30;

    public function index()
    {
        $dojoQr = $this->buildDojoQrPayload();

        $attendances = Attendance::query()
            ->with('athlete.belt')
            ->whereDate('recorded_at', now()->toDateString())
            ->latest('recorded_at')
            ->get();

        return Inertia::render('Attendance/Index', [
            'attendances' => Inertia::defer(fn () => $attendances),
            'dojoQr' => Inertia::defer(fn () => $dojoQr),
        ]);
    }

    public function scan()
    {
        return Inertia::render('Attendance/Scan');
    }

    public function dojoQr()
    {
        return response()->json($this->buildDojoQrPayload());
    }

    public function store(Request $request)
    {
        $request->validate([
            'athlete_code' => 'required|string',
        ]);

        $athlete = $this->resolveAthleteByCode($request->athlete_code);
        $this->recordAttendance($athlete, 'checkin');

        return back()->with('success', 'Check-in berhasil dicatat untuk ' . $athlete->full_name);
    }

    public function scanDojo(Request $request)
    {
        $validated = $request->validate([
            'athlete_code' => 'required|string',
            'dojo_payload' => 'required|string',
            'action' => 'nullable|in:checkin,checkout',
            'athlete_feedback' => 'nullable|string|max:1000',
            'athlete_mood' => 'nullable|string|max:30',
        ]);

        $athlete = $this->resolveAthleteByCode($validated['athlete_code']);

        $payload = $this->parseDojoPayload($validated['dojo_payload']);
        if (!$payload) {
            throw ValidationException::withMessages([
                'dojo_payload' => 'QR Dojo tidak valid.',
            ]);
        }

        $dojo = Dojo::find($payload['dojo_id']);
        if (!$dojo || !$dojo->attendance_secret) {
            throw ValidationException::withMessages([
                'dojo_payload' => 'QR Dojo tidak dapat diverifikasi.',
            ]);
        }

        if ((int) $athlete->dojo_id !== (int) $dojo->id) {
            throw ValidationException::withMessages([
                'dojo_payload' => 'QR bukan milik dojo atlet ini.',
            ]);
        }

        $currentStep = intdiv(time(), self::TOTP_PERIOD);
        if (abs($payload['step'] - $currentStep) > 1) {
            throw ValidationException::withMessages([
                'dojo_payload' => 'QR Dojo sudah kedaluwarsa. Silakan scan QR terbaru.',
            ]);
        }

        $expectedCode = $this->generateTotp($dojo->attendance_secret, $payload['step']);
        if (!hash_equals($expectedCode, $payload['code'])) {
            throw ValidationException::withMessages([
                'dojo_payload' => 'Kode TOTP tidak cocok.',
            ]);
        }

        $action = $validated['action'] ?? 'checkin';
        $attendance = $this->recordAttendance($athlete, $action, $validated);

        $message = $action === 'checkout'
            ? 'Check-out berhasil. Terima kasih untuk feedback latihan hari ini.'
            : 'Check-in berhasil dicatat. Selamat berlatih!';

        return back()->with('success', $message);
    }

    public function senseiFeedback(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'sensei_feedback' => 'nullable|string|max:1000',
            'sensei_mood_assessment' => 'nullable|string|max:30',
        ]);

        $attendance->update([
            'sensei_feedback' => $validated['sensei_feedback'] ?? null,
            'sensei_mood_assessment' => $validated['sensei_mood_assessment'] ?? null,
        ]);

        return back()->with('success', 'Feedback sensei berhasil disimpan.');
    }

    private function recordAttendance(Athlete $athlete, string $action = 'checkin', array $payload = []): Attendance
    {
        $attendance = Attendance::query()
            ->where('athlete_id', $athlete->id)
            ->whereDate('recorded_at', now()->toDateString())
            ->first();

        if ($action === 'checkin') {
            $this->ensureAthleteHasNoOutstandingBills($athlete);

            if ($attendance && $attendance->check_in_at) {
                throw ValidationException::withMessages([
                    'athlete_code' => 'Check-in hari ini sudah tercatat.',
                ]);
            }

            if (! $attendance) {
                $attendance = Attendance::create([
                    'athlete_id' => $athlete->id,
                    'status' => 'present',
                    'recorded_at' => now(),
                    'check_in_at' => now(),
                ]);
            } else {
                $attendance->update([
                    'status' => 'present',
                    'check_in_at' => now(),
                ]);
            }

            return $attendance;
        }

        if (! $attendance || ! $attendance->check_in_at) {
            throw ValidationException::withMessages([
                'athlete_code' => 'Atlet belum check-in hari ini.',
            ]);
        }

        if ($attendance->check_out_at) {
            throw ValidationException::withMessages([
                'athlete_code' => 'Check-out hari ini sudah tercatat.',
            ]);
        }

        $attendance->update([
            'check_out_at' => now(),
            'athlete_feedback' => $payload['athlete_feedback'] ?? null,
            'athlete_mood' => $payload['athlete_mood'] ?? null,
        ]);

        return $attendance;
    }

    private function ensureAthleteHasNoOutstandingBills(Athlete $athlete): void
    {
        $overdueInvoice = FinanceRecord::query()
            ->where('athlete_id', $athlete->id)
            ->where('status', 'unpaid')
            ->orderBy('due_date')
            ->first();

        if (!$overdueInvoice) {
            return;
        }

        throw ValidationException::withMessages([
            'athlete_code' => 'Absensi ditolak. Masih ada tunggakan "' . $overdueInvoice->description . '" dengan jatuh tempo ' . \Carbon\Carbon::parse($overdueInvoice->due_date)->translatedFormat('d M Y') . '.',
        ]);
    }

    private function buildDojoQrPayload(): array
    {
        $dojoId = auth()->user()?->dojo_id;
        $dojo = $dojoId ? Dojo::find($dojoId) : Dojo::first();

        if (!$dojo) {
            return [
                'payload' => null,
                'expires_in' => 0,
                'dojo_name' => null,
            ];
        }

        if (!$dojo->attendance_secret) {
            $dojo->attendance_secret = $this->generateBase32Secret();
            $dojo->save();
        }

        $step = intdiv(time(), self::TOTP_PERIOD);
        $totp = $this->generateTotp($dojo->attendance_secret, $step);
        $expiresIn = self::TOTP_PERIOD - (time() % self::TOTP_PERIOD);

        return [
            'payload' => "ATHLIX-DOJO|{$dojo->id}|{$step}|{$totp}",
            'expires_in' => $expiresIn,
            'dojo_name' => $dojo->name,
            'generated_at' => now()->format('H:i:s'),
        ];
    }

    private function parseDojoPayload(string $payload): ?array
    {
        $parts = explode('|', trim($payload));
        if (count($parts) !== 4 || $parts[0] !== 'ATHLIX-DOJO') {
            return null;
        }

        if (!is_numeric($parts[1]) || !is_numeric($parts[2])) {
            return null;
        }

        return [
            'dojo_id' => (int) $parts[1],
            'step' => (int) $parts[2],
            'code' => trim($parts[3]),
        ];
    }

    private function resolveAthleteByCode(string $rawCode): Athlete
    {
        $athleteCode = $this->extractAthleteCode($rawCode);
        if (!$athleteCode) {
            throw ValidationException::withMessages([
                'athlete_code' => 'Kode atlet tidak valid.',
            ]);
        }

        $athlete = Athlete::whereRaw("REPLACE(UPPER(athlete_code), '-', '') = ?", [strtoupper($athleteCode)])->first();
        if (!$athlete) {
            throw ValidationException::withMessages([
                'athlete_code' => 'Kode atlet tidak ditemukan.',
            ]);
        }

        return $athlete;
    }

    private function extractAthleteCode(string $rawValue): ?string
    {
        $value = trim($rawValue);
        if ($value === '') {
            return null;
        }

        $decodedJson = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decodedJson)) {
            $jsonCode = $decodedJson['athlete_code'] ?? $decodedJson['code'] ?? null;
            if (is_string($jsonCode) && $jsonCode !== '') {
                return strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $jsonCode));
            }
        }

        return strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $value)) ?: null;
    }

    private function generateBase32Secret(int $length = 16): string
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < $length; $i++) {
            $secret .= $chars[random_int(0, strlen($chars) - 1)];
        }

        return $secret;
    }

    private function generateTotp(string $secret, int $step): string
    {
        $key = $this->base32Decode($secret);
        $binaryStep = pack('N*', 0) . pack('N*', $step);
        $hash = hash_hmac('sha1', $binaryStep, $key, true);
        $offset = ord(substr($hash, -1)) & 0x0F;
        $value = (
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF)
        );

        return str_pad((string) ($value % 1000000), 6, '0', STR_PAD_LEFT);
    }

    private function base32Decode(string $secret): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret));
        $bits = '';

        foreach (str_split($secret) as $char) {
            $position = strpos($alphabet, $char);
            if ($position === false) {
                continue;
            }
            $bits .= str_pad(decbin($position), 5, '0', STR_PAD_LEFT);
        }

        $binary = '';
        foreach (str_split($bits, 8) as $chunk) {
            if (strlen($chunk) === 8) {
                $binary .= chr(bindec($chunk));
            }
        }

        return $binary;
    }
}
