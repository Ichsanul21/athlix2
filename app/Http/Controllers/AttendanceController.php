<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Athlete;
use App\Models\Dojo;
use App\Models\FinanceRecord;
use App\Models\TrainingProgram;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $requestedDojoId = request('dojo_id') ? (int) request('dojo_id') : null;
        $selectedDojoId = $this->resolveDojoId($user, $requestedDojoId);
        $isAllDojos = $user?->isSuperAdmin() && !$selectedDojoId;

        $dojoQr = $this->buildDojoQrPayload($selectedDojoId);

        $athleteQuery = $this->scopeAthletesForUser(Athlete::query(), $user);
        if ($selectedDojoId) {
            $athleteQuery->where('dojo_id', $selectedDojoId);
        }

        $attendances = Attendance::query()
            ->with('athlete.level')
            ->whereIn('athlete_id', $athleteQuery->select('id'))
            ->whereDate('recorded_at', now()->toDateString())
            ->latest('recorded_at')
            ->get();

        return Inertia::render('Attendance/Index', [
            'attendances'    => Inertia::defer(fn () => $attendances),
            'dojoQr'         => Inertia::defer(fn () => $dojoQr),
            'dojos'          => Inertia::defer(fn () => $user?->isSuperAdmin() ? Dojo::orderBy('name')->get(['id', 'name']) : []),
            'selectedDojoId' => Inertia::defer(fn () => $isAllDojos ? null : $selectedDojoId),
            'isAllDojos'     => Inertia::defer(fn () => $isAllDojos),
        ]);
    }

    public function scan()
    {
        return Inertia::render('Attendance/Scan');
    }

    public function dojoQr()
    {
        $user = auth()->user();
        $requestedDojoId = request('dojo_id') ? (int) request('dojo_id') : null;
        $selectedDojoId = $this->resolveDojoId($user, $requestedDojoId);

        if ($requestedDojoId && ! $user?->isSuperAdmin() && (int) $user?->dojo_id !== (int) $requestedDojoId) {
            abort(403);
        }

        return response()->json($this->buildDojoQrPayload($selectedDojoId));
    }

    public function store(Request $request)
    {
        $request->validate([
            'athlete_code' => 'required|string',
        ]);

        $athlete = $this->resolveAthleteByCode($request->athlete_code);
        $user = auth()->user();
        if ($user?->isSensei() && (int) $athlete->dojo_id !== (int) $user->dojo_id) {
            abort(403);
        }
        $this->recordAttendance($athlete, 'checkin');

        return back()->with('success', 'Check-in berhasil dicatat untuk ' . $athlete->full_name);
    }

    public function scanDojo(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'athlete_code'     => 'required|string',
            'dojo_payload'     => 'required|string',
            'action'           => 'nullable|in:checkin,checkout',
            'check_in_feedback'  => 'nullable|string|max:1000',
            'check_in_mood'      => 'nullable|string|max:30',
            'check_in_document'  => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'athlete_feedback'   => 'nullable|string|max:1000',
            'athlete_mood'       => 'nullable|string|max:30',
            // Geolocation fields
            'check_in_lat'   => 'nullable|numeric|between:-90,90',
            'check_in_lng'   => 'nullable|numeric|between:-180,180',
            'check_out_lat'  => 'nullable|numeric|between:-90,90',
            'check_out_lng'  => 'nullable|numeric|between:-180,180',
        ]);

        $athlete = $this->resolveAthleteByCode($validated['athlete_code']);
        if ($user?->athlete_id && (int) $user->athlete_id === (int) $athlete->id) {
            // Self check-in is allowed
        } elseif ($user?->isAtlet()) {
            if ((int) $user->athlete_id !== (int) $athlete->id) {
                throw ValidationException::withMessages([
                    'athlete_code' => 'Kode atlet tidak sesuai dengan akun ini.',
                ]);
            }
        } elseif ($user?->isSensei()) {
            $allowed = $user->senseiAthletes()->whereKey($athlete->id)->exists();
            if (! $allowed) {
                throw ValidationException::withMessages([
                    'athlete_code' => 'Atlet tidak terdaftar dalam daftar atlet Anda.',
                ]);
            }
        }

        $payload = $this->parseDojoPayload($validated['dojo_payload']);
        if (!$payload) {
            throw ValidationException::withMessages([
                'dojo_payload' => 'QR Dojo tidak valid.',
            ]);
        }

        $dojo = Dojo::find($payload['dojo_id']);
        if (!$dojo) {
            throw ValidationException::withMessages([
                'dojo_payload' => 'QR Dojo tidak dapat diverifikasi.',
            ]);
        }

        if ((int) $athlete->dojo_id !== (int) $dojo->id) {
            throw ValidationException::withMessages([
                'dojo_payload' => 'QR bukan milik dojo atlet ini.',
            ]);
        }

        $action = $validated['action'] ?? 'checkin';
        $payload = $validated;

        if ($request->hasFile('check_in_document')) {
            $payload['check_in_document_path'] = $request->file('check_in_document')->store('attendance-documents', 'public');
            $payload['check_in_document_mime'] = $request->file('check_in_document')->getClientMimeType();
        }

        $this->recordAttendance($athlete, $action, $payload);

        $message = $action === 'checkout'
            ? 'Check-out berhasil. Silakan isi feedback latihan.'
            : 'Check-in berhasil dicatat. Selamat berlatih!';

        return back()->with('success', $message);
    }

    public function submitPostTrainingFeedback(Request $request)
    {
        $validated = $request->validate([
            'athlete_code'   => 'required|string',
            'mood_rating'    => 'required|integer|min:1|max:10',
            'load_rating'    => 'required|integer|min:1|max:10',
            'pre_mood_rating' => 'nullable|integer|min:1|max:10',
            'notes'          => 'nullable|string|max:1000',
        ]);

        $athlete = $this->resolveAthleteByCode($validated['athlete_code']);
        $user = auth()->user();
        if ($user?->athlete_id && (int) $user->athlete_id === (int) $athlete->id) {
            // Self feedback is allowed
        } elseif ($user?->isMurid()) {
            if ((int) $user->athlete_id !== (int) $athlete->id) {
                throw ValidationException::withMessages([
                    'athlete_code' => 'Kode atlet tidak sesuai dengan akun ini.',
                ]);
            }
        } elseif ($user?->isSensei()) {
            $allowed = $user->senseiAthletes()->whereKey($athlete->id)->exists();
            if (! $allowed) {
                throw ValidationException::withMessages([
                    'athlete_code' => 'Atlet tidak terdaftar dalam daftar atlet Anda.',
                ]);
            }
        }

        $attendance = Attendance::query()
            ->where('athlete_id', $athlete->id)
            ->whereDate('recorded_at', now()->toDateString())
            ->first();

        if ($attendance === null || ! $attendance->check_out_at) {
            throw ValidationException::withMessages([
                'mood_rating' => 'Feedback hanya bisa dikirim setelah check-out berhasil.',
            ]);
        }

        $attendance->update([
            'post_training_mood_rating'  => (int) $validated['mood_rating'],
            'post_training_load_rating'  => (int) $validated['load_rating'],
            'check_in_mood'             => isset($validated['pre_mood_rating']) ? 'Mood ' . $validated['pre_mood_rating'] . '/10' : $attendance->check_in_mood,
            'check_in_feedback'         => $validated['notes'] ?? $attendance->check_in_feedback,
            'post_training_submitted_at' => now(),
            'athlete_mood'               => 'Mood ' . (int) $validated['mood_rating'] . '/10',
            'athlete_feedback'           => 'Penilaian beban latihan ' . (int) $validated['load_rating'] . '/10',
        ]);

        return back()->with('success', 'Feedback pasca latihan berhasil dikirim.');
    }

    public function senseiFeedback(Request $request, Attendance $attendance)
    {
        $user = auth()->user();
        if (! $user) {
            abort(403);
        }

        $athleteQuery = $this->scopeAthletesForUser(\App\Models\Athlete::query(), $user);
        $allowed = $athleteQuery->whereKey($attendance->athlete_id)->exists();

        if (! $allowed) {
            abort(403);
        }

        $validated = $request->validate([
            'sensei_feedback'        => 'nullable|string|max:1000',
            'sensei_mood_assessment' => 'nullable|string|max:30',
        ]);

        $attendance->update([
            'sensei_feedback'        => $validated['sensei_feedback'] ?? null,
            'sensei_mood_assessment' => $validated['sensei_mood_assessment'] ?? null,
        ]);

        return back()->with('success', 'Feedback sensei berhasil disimpan.');
    }

    public function markStatus(Request $request)
    {
        $validated = $request->validate([
            'athlete_code'    => 'required|string',
            'status'          => 'required|in:sick,excused',
            'absence_reason'  => 'nullable|string|max:1000',
            'absence_document' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:5120',
            ],
        ]);

        $athlete = $this->resolveAthleteByCode($validated['athlete_code']);
        $user = auth()->user();
        if ($user?->athlete_id && (int) $user->athlete_id === (int) $athlete->id) {
            // Self status change is allowed
        } elseif ($user?->isMurid()) {
            if ((int) $user->athlete_id !== (int) $athlete->id) {
                throw ValidationException::withMessages([
                    'athlete_code' => 'Kode atlet tidak sesuai dengan akun ini.',
                ]);
            }
        } elseif ($user?->isSensei()) {
            $allowed = $user->senseiAthletes()->whereKey($athlete->id)->exists();
            if (! $allowed) {
                throw ValidationException::withMessages([
                    'athlete_code' => 'Atlet tidak terdaftar dalam daftar atlet Anda.',
                ]);
            }
        }

        $attendance = Attendance::query()
            ->where('athlete_id', $athlete->id)
            ->whereDate('recorded_at', now()->toDateString())
            ->first();

        if ($attendance !== null && ($attendance->check_in_at || $attendance->check_out_at)) {
            throw ValidationException::withMessages([
                'status' => 'Status izin/sakit tidak bisa diubah karena absensi check-in/check-out sudah tercatat.',
            ]);
        }

        $newDocumentPath = null;
        $newDocumentMime = null;
        $newDocumentPath = $request->file('absence_document')->store('attendance-documents', 'public');
        $newDocumentMime = $request->file('absence_document')->getClientMimeType();
        if (! $attendance) {
            Attendance::create([
                'athlete_id'            => $athlete->id,
                'status'                => $validated['status'],
                'recorded_at'           => now(),
                'absence_reason'        => $validated['absence_reason'] ?? null,
                'absence_document_path' => $newDocumentPath,
                'absence_document_mime' => $newDocumentMime,
            ]);
        } else {
            if ($attendance->absence_document_path) {
                Storage::disk('public')->delete($attendance->absence_document_path);
            }

            $attendance->update([
                'status'                => $validated['status'],
                'absence_reason'        => $validated['absence_reason'] ?? null,
                'check_in_at'           => null,
                'check_out_at'          => null,
                'absence_document_path' => $newDocumentPath,
                'absence_document_mime' => $newDocumentMime,
            ]);
        }

        $label = $validated['status'] === 'sick' ? 'sakit' : 'izin';

        return back()->with('success', 'Status absensi berhasil dikirim sebagai ' . $label . '.');
    }

    // ────────────────────────────────────────────────────────────────────────
    // REKAP ABSENSI
    // ────────────────────────────────────────────────────────────────────────

    public function recap(Request $request)
    {
        $user          = auth()->user();
        $month         = (int) $request->get('month', now()->month);
        $year          = (int) $request->get('year', now()->year);
        $dojoId        = $request->get('dojo_id') ? (int) $request->get('dojo_id') : null;
        $athleteSearch = $request->get('search', '');

        $resolvedDojoId = $this->resolveDojoId($user, $dojoId);

        $athleteQuery = $this->scopeAthletesForUser(Athlete::query(), $user)
            ->with('dojo:id,name', 'level:id,name')
            ->when($resolvedDojoId, fn ($q) => $q->where('dojo_id', $resolvedDojoId))
            ->when($athleteSearch, fn ($q) => $q->where(function ($sub) use ($athleteSearch) {
                $sub->where('full_name', 'like', "%{$athleteSearch}%")
                    ->orWhere('athlete_code', 'like', "%{$athleteSearch}%");
            }))
            ->orderBy('full_name');

        $athletes = $athleteQuery->get(['id', 'full_name', 'athlete_code', 'dojo_id', 'level_id']);

        $athleteIds = $athletes->pluck('id');

        // Hitung jumlah hari kerja dalam bulan ini (sesuai jadwal dojo)
        $daysInMonth = Carbon::createFromDate($year, $month)->daysInMonth;

        // Ambil semua absensi bulan ini
        $attendances = Attendance::query()
            ->whereIn('athlete_id', $athleteIds)
            ->whereYear('recorded_at', $year)
            ->whereMonth('recorded_at', $month)
            ->get(['id', 'athlete_id', 'status', 'recorded_at', 'check_in_at', 'check_out_at', 'check_in_lat', 'check_in_lng']);

        $grouped = $attendances->groupBy('athlete_id');

        $recap = $athletes->map(function (Athlete $athlete) use ($grouped, $daysInMonth) {
            $records = $grouped->get($athlete->id, collect());
            $present  = $records->where('status', 'present')->count();
            $sick     = $records->where('status', 'sick')->count();
            $excused  = $records->where('status', 'excused')->count();
            $absent   = $records->where('status', 'absent')->count();
            $total    = $records->count();
            $rate     = $daysInMonth > 0 ? round(($present / $daysInMonth) * 100, 1) : 0;

            // Lokasi terbaru yang tersimpan
            $lastWithLocation = $records
                ->whereNotNull('check_in_lat')
                ->whereNotNull('check_in_lng')
                ->sortByDesc('recorded_at')
                ->first();

            return [
                'id'            => $athlete->id,
                'full_name'     => $athlete->full_name,
                'athlete_code'  => $athlete->athlete_code,
                'dojo_name'     => $athlete->dojo?->name ?? '-',
                'level_name'    => $athlete->level?->name ?? '-',
                'present'       => $present,
                'sick'          => $sick,
                'excused'       => $excused,
                'absent'        => $absent,
                'total'         => $total,
                'days_in_month' => $daysInMonth,
                'rate'          => $rate,
                'last_lat'      => $lastWithLocation?->check_in_lat,
                'last_lng'      => $lastWithLocation?->check_in_lng,
                'last_checkin'  => $lastWithLocation
                    ? Carbon::parse($lastWithLocation->recorded_at)->translatedFormat('d M Y')
                    : null,
            ];
        })->values();

        return Inertia::render('Attendance/Recap', [
            'recap'     => Inertia::defer(fn () => $recap),
            'dojos'     => Inertia::defer(fn () => $user?->isSuperAdmin()
                ? Dojo::orderBy('name')->get(['id', 'name'])
                : []
            ),
            'filters'   => [
                'month'   => $month,
                'year'    => $year,
                'dojo_id' => $resolvedDojoId,
                'search'  => $athleteSearch,
            ],
        ]);
    }

    public function exportPdf(Request $request)
    {
        $user    = auth()->user();
        $month   = (int) $request->get('month', now()->month);
        $year    = (int) $request->get('year', now()->year);
        $dojoId  = $request->get('dojo_id') ? (int) $request->get('dojo_id') : null;
        $search  = $request->get('search', '');

        $resolvedDojoId = $this->resolveDojoId($user, $dojoId);

        $athletes = $this->scopeAthletesForUser(Athlete::query(), $user)
            ->with('dojo:id,name', 'level:id,name')
            ->when($resolvedDojoId, fn ($q) => $q->where('dojo_id', $resolvedDojoId))
            ->when($search, fn ($q) => $q->where(function ($sub) use ($search) {
                $sub->where('full_name', 'like', "%{$search}%")
                    ->orWhere('athlete_code', 'like', "%{$search}%");
            }))
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'athlete_code', 'dojo_id', 'level_id']);

        $athleteIds  = $athletes->pluck('id');
        $daysInMonth = Carbon::createFromDate($year, $month)->daysInMonth;

        $attendances = Attendance::query()
            ->whereIn('athlete_id', $athleteIds)
            ->whereYear('recorded_at', $year)
            ->whereMonth('recorded_at', $month)
            ->get(['athlete_id', 'status', 'recorded_at']);

        $grouped = $attendances->groupBy('athlete_id');

        $recap = $athletes->map(function (Athlete $athlete) use ($grouped, $daysInMonth) {
            $records = $grouped->get($athlete->id, collect());
            $present = $records->where('status', 'present')->count();
            $sick    = $records->where('status', 'sick')->count();
            $excused = $records->where('status', 'excused')->count();
            $absent  = $records->where('status', 'absent')->count();
            $rate    = $daysInMonth > 0 ? round(($present / $daysInMonth) * 100, 1) : 0;

            return [
                'full_name'    => $athlete->full_name,
                'athlete_code' => $athlete->athlete_code,
                'dojo_name'    => $athlete->dojo?->name ?? '-',
                'level_name'   => $athlete->level?->name ?? '-',
                'present'      => $present,
                'sick'         => $sick,
                'excused'      => $excused,
                'absent'       => $absent,
                'rate'         => $rate,
            ];
        })->values();

        $monthName = Carbon::createFromDate($year, $month)->translatedFormat('F Y');
        $dojoName  = $resolvedDojoId ? (Dojo::find($resolvedDojoId)?->name ?? 'Semua Dojo') : 'Semua Dojo';

        $pdf = Pdf::loadView('attendance.recap-pdf', compact('recap', 'monthName', 'dojoName', 'year', 'month'))
            ->setPaper('a4', 'landscape');

        $filename = 'rekap-absensi-' . $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '.pdf';

        return $pdf->download($filename);
    }

    public function exportExcel(Request $request)
    {
        $user   = auth()->user();
        $month  = (int) $request->get('month', now()->month);
        $year   = (int) $request->get('year', now()->year);
        $dojoId = $request->get('dojo_id') ? (int) $request->get('dojo_id') : null;
        $search = $request->get('search', '');

        $resolvedDojoId = $this->resolveDojoId($user, $dojoId);

        $athletes = $this->scopeAthletesForUser(Athlete::query(), $user)
            ->with('dojo:id,name', 'level:id,name')
            ->when($resolvedDojoId, fn ($q) => $q->where('dojo_id', $resolvedDojoId))
            ->when($search, fn ($q) => $q->where(function ($sub) use ($search) {
                $sub->where('full_name', 'like', "%{$search}%")
                    ->orWhere('athlete_code', 'like', "%{$search}%");
            }))
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'athlete_code', 'dojo_id', 'level_id']);

        $athleteIds  = $athletes->pluck('id');
        $daysInMonth = Carbon::createFromDate($year, $month)->daysInMonth;

        $attendances = Attendance::query()
            ->whereIn('athlete_id', $athleteIds)
            ->whereYear('recorded_at', $year)
            ->whereMonth('recorded_at', $month)
            ->get(['athlete_id', 'status', 'recorded_at', 'check_in_at', 'check_out_at', 'check_in_lat', 'check_in_lng']);

        $grouped = $attendances->groupBy('athlete_id');

        $data = $athletes->map(function (Athlete $athlete) use ($grouped, $daysInMonth) {
            $records = $grouped->get($athlete->id, collect());
            $present = $records->where('status', 'present')->count();
            $sick    = $records->where('status', 'sick')->count();
            $excused = $records->where('status', 'excused')->count();
            $absent  = $records->where('status', 'absent')->count();
            $rate    = $daysInMonth > 0 ? round(($present / $daysInMonth) * 100, 1) : 0;

            $lastWithLocation = $records
                ->whereNotNull('check_in_lat')
                ->sortByDesc('recorded_at')
                ->first();

            return [
                'Nama'         => $athlete->full_name,
                'Kode'         => $athlete->athlete_code,
                'Dojo'         => $athlete->dojo?->name ?? '-',
                'Level'        => $athlete->level?->name ?? '-',
                'Hadir'        => $present,
                'Sakit'        => $sick,
                'Izin'         => $excused,
                'Alpa'         => $absent,
                'Total Sesi'   => $records->count(),
                'Persen (%)'   => $rate,
                'Lat (Lokasi)' => $lastWithLocation?->check_in_lat,
                'Lng (Lokasi)' => $lastWithLocation?->check_in_lng,
            ];
        })->values()->toArray();

        return response()->json([
            'data'  => $data,
            'month' => $month,
            'year'  => $year,
        ]);
    }

    // ────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ────────────────────────────────────────────────────────────────────────

    private function recordAttendance(Athlete $athlete, string $action = 'checkin', array $payload = []): Attendance
    {
        // Auto-close stale check-ins from previous days
        $this->autoCloseStaleCheckIns($athlete);

        $attendance = Attendance::query()
            ->where('athlete_id', $athlete->id)
            ->whereDate('recorded_at', now()->toDateString())
            ->first();

        if ($action === 'checkin') {
            // Validate training schedule
            $this->ensureTrainingScheduleToday($athlete);
            $this->ensureAthleteHasNoOutstandingBills($athlete);

            if ($attendance && $attendance->check_in_at) {
                throw ValidationException::withMessages([
                    'athlete_code' => 'Check-in hari ini sudah tercatat.',
                ]);
            }

            if (! $attendance) {
                $attendance = Attendance::create([
                    'athlete_id'             => $athlete->id,
                    'status'                 => 'present',
                    'recorded_at'            => now(),
                    'check_in_at'            => now(),
                    'check_in_lat'           => isset($payload['check_in_lat']) ? (float) $payload['check_in_lat'] : null,
                    'check_in_lng'           => isset($payload['check_in_lng']) ? (float) $payload['check_in_lng'] : null,
                    'check_in_feedback'      => $payload['check_in_feedback'] ?? null,
                    'check_in_mood'          => $payload['check_in_mood'] ?? null,
                    'check_in_document_path' => $payload['check_in_document_path'] ?? null,
                    'check_in_document_mime' => $payload['check_in_document_mime'] ?? null,
                ]);
            } else {
                $attendance->update([
                    'status'                 => 'present',
                    'check_in_at'            => now(),
                    'check_in_lat'           => isset($payload['check_in_lat']) ? (float) $payload['check_in_lat'] : null,
                    'check_in_lng'           => isset($payload['check_in_lng']) ? (float) $payload['check_in_lng'] : null,
                    'check_in_feedback'      => $payload['check_in_feedback'] ?? null,
                    'check_in_mood'          => $payload['check_in_mood'] ?? null,
                    'check_in_document_path' => $payload['check_in_document_path'] ?? $attendance->check_in_document_path,
                    'check_in_document_mime' => $payload['check_in_document_mime'] ?? $attendance->check_in_document_mime,
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
            'check_out_at'      => now(),
            'check_out_lat'     => isset($payload['check_out_lat']) ? (float) $payload['check_out_lat'] : null,
            'check_out_lng'     => isset($payload['check_out_lng']) ? (float) $payload['check_out_lng'] : null,
            'athlete_feedback'  => $payload['athlete_feedback'] ?? null,
            'athlete_mood'      => $payload['athlete_mood'] ?? null,
        ]);

        return $attendance;
    }

    private function ensureAthleteHasNoOutstandingBills(Athlete $athlete): void
    {
        $overdueInvoice = FinanceRecord::query()
            ->where('athlete_id', $athlete->id)
            ->where('status', '!=', 'paid')
            ->orderBy('due_date')
            ->first();

        if (!$overdueInvoice) {
            return;
        }

        throw ValidationException::withMessages([
            'athlete_code' => 'Absensi ditolak. Masih ada tunggakan "' . $overdueInvoice->description . '" dengan jatuh tempo ' . \Carbon\Carbon::parse($overdueInvoice->due_date)->translatedFormat('d M Y') . '.',
        ]);
    }

    private function buildDojoQrPayload(?int $dojoId = null): array
    {
        $dojoId = $dojoId ?? auth()->user()?->dojo_id;
        $dojo = $dojoId ? Dojo::find($dojoId) : Dojo::first();

        if (!$dojo) {
            return [
                'payload'    => null,
                'expires_in' => null,
                'dojo_name'  => null,
            ];
        }

        return [
            'payload'      => "ATHLIX-DOJO|{$dojo->id}",
            'expires_in'   => null,
            'dojo_name'    => $dojo->name,
            'generated_at' => null,
        ];
    }

    private function parseDojoPayload(string $payload): ?array
    {
        $parts = explode('|', trim($payload));
        if (count($parts) !== 2 || $parts[0] !== 'ATHLIX-DOJO') {
            return null;
        }

        if (!is_numeric($parts[1])) {
            return null;
        }

        return [
            'dojo_id' => (int) $parts[1],
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

    /**
     * Check if there's a training program scheduled today for the athlete's dojo.
     */
    private function ensureTrainingScheduleToday(Athlete $athlete): void
    {
        $dojoId = $athlete->dojo_id;
        if (! $dojoId) return;

        $dayMap = [
            'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu',
        ];
        $todayIndo = $dayMap[Carbon::now()->format('l')] ?? 'Senin';

        $hasProgram = TrainingProgram::where('dojo_id', $dojoId)
            ->where('day', $todayIndo)
            ->exists();

        if (! $hasProgram) {
            throw ValidationException::withMessages([
                'athlete_code' => "Tidak ada jadwal latihan hari ini ({$todayIndo}). Check-in tidak dapat dilakukan.",
            ]);
        }
    }

    /**
     * Auto-close any check-in from previous days that was never checked out.
     */
    private function autoCloseStaleCheckIns(Athlete $athlete): void
    {
        Attendance::query()
            ->where('athlete_id', $athlete->id)
            ->whereNotNull('check_in_at')
            ->whereNull('check_out_at')
            ->whereDate('recorded_at', '<', now()->toDateString())
            ->update(['check_out_at' => \DB::raw('check_in_at')]);
    }
}
