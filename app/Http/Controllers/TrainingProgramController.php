<?php

namespace App\Http\Controllers;

use App\Models\Dojo;
use App\Models\TrainingProgram;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TrainingProgramController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $requestedDojoId = request('dojo_id') ? (int) request('dojo_id') : null;
        $selectedDojoId = $this->resolveDojoId($user, $requestedDojoId);
        $isAllDojos = $user?->isSuperAdmin() && !$selectedDojoId;

        $days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        $programs = TrainingProgram::query()
            ->when($selectedDojoId, fn ($query) => $query->where('dojo_id', $selectedDojoId))
            ->orderBy('start_time')
            ->get()
            ->groupBy('day');

        $structuredPrograms = [];
        foreach ($days as $day) {
            $structuredPrograms[$day] = $programs->get($day, collect())->map(function ($p) {
                $nextDate = $this->resolveNextDate($p->day, Carbon::now());

                return [
                    'id'            => $p->id,
                    'title'         => $p->title,
                    'dojo_id'       => $p->dojo_id,
                    'day'           => $p->day,
                    'start_time'    => substr($p->start_time, 0, 5),
                    'end_time'      => substr($p->end_time, 0, 5),
                    'time'          => substr($p->start_time, 0, 5) . ' - ' . substr($p->end_time, 0, 5),
                    'coach'         => $p->coach_name,
                    'type'          => $p->type,
                    'desc'          => $p->description,
                    'next_date'     => $nextDate->translatedFormat('d M Y'),
                    'agenda_items'  => collect($p->agenda_items ?? [])
                        ->map(fn ($item) => [
                            'start_time'  => $item['start_time'] ?? null,
                            'end_time'    => $item['end_time'] ?? null,
                            'title'       => $item['title'] ?? '',
                            'description' => $item['description'] ?? null,
                        ])
                        ->filter(fn ($item) => $item['start_time'] && $item['end_time'] && $item['title'])
                        ->values(),
                ];
            });
        }

        $senseis = \App\Models\User::query()
            ->whereIn('role', ['super_admin', 'dojo_admin', 'head_coach', 'sensei', 'assistant'])
            ->when($selectedDojoId && !$isAllDojos, function ($query) use ($selectedDojoId) {
                $query->whereIn('id', function ($q) use ($selectedDojoId) {
                    $q->select('sensei_id')
                    ->from('sensei_athlete')
                    ->where('dojo_id', $selectedDojoId)
                    ->distinct();
                });
            })
            ->get(['id', 'name', 'role']);

        $performanceStats = $this->calculateDojoPerformanceStats($selectedDojoId);

        return Inertia::render('TrainingPrograms/Index', [
            'weeklySchedule' => Inertia::defer(fn () => $structuredPrograms),
            'dojos'          => Inertia::defer(fn () => $user?->isSuperAdmin()
                                ? Dojo::orderBy('name')->get(['id', 'name', 'ppa_file_path', 'ppa_file_name', 'ppa_file_size', 'ppa_uploaded_at'])
                                : ($selectedDojoId ? Dojo::where('id', $selectedDojoId)->get(['id', 'name', 'ppa_file_path', 'ppa_file_name', 'ppa_file_size', 'ppa_uploaded_at']) : [])
                            ),
            'selectedDojoId' => Inertia::defer(fn () => $isAllDojos ? null : $selectedDojoId),
            'selectedDojo'   => Inertia::defer(fn () => $selectedDojoId ? Dojo::find($selectedDojoId, ['id', 'name', 'ppa_file_path', 'ppa_file_name', 'ppa_file_size', 'ppa_uploaded_at']) : null),
            'isAllDojos'     => Inertia::defer(fn () => $isAllDojos),
            'isSuperAdmin'   => Inertia::defer(fn () => $user?->isSuperAdmin() ?? false),
            'senseis'        => Inertia::defer(fn () => $senseis),
            'clubPerformanceStats' => Inertia::defer(fn () => $performanceStats),
        ]);
    }

    public function uploadPPA(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'dojo_id' => $user?->isSuperAdmin() ? 'required|exists:dojos,id' : 'nullable',
            'ppa_file' => 'required|file|mimes:pdf,xlsx,xls|max:5120', // 5MB max
        ]);

        $dojoId = $user?->isSuperAdmin() ? $validated['dojo_id'] : $user->dojo_id;

        if (!$dojoId) {
            return redirect()->back()->withErrors(['ppa_file' => 'Dojo tidak ditemukan.']);
        }

        $dojo = Dojo::findOrFail($dojoId);

        if ($request->hasFile('ppa_file')) {
            // Delete old file if exists
            if ($dojo->ppa_file_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($dojo->ppa_file_path);
            }

            $file = $request->file('ppa_file');
            $path = $file->store('ppa_files', 'public');
            $dojo->update([
                'ppa_file_path' => $path,
                'ppa_file_name' => $file->getClientOriginalName(),
                'ppa_file_size' => $file->getSize(),
                'ppa_uploaded_at' => now(),
            ]);
        }

        return redirect()->back()->with('success', 'PPA berhasil diunggah.');
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'day' => 'required|string',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'coach_name' => 'required|string|max:255',
            'type' => 'required|string',
            'description' => 'nullable|string',
            'agenda_items' => 'nullable|array',
            'agenda_items.*.start_time' => 'required_with:agenda_items|date_format:H:i',
            'agenda_items.*.end_time' => 'required_with:agenda_items|date_format:H:i',
            'agenda_items.*.title' => 'required_with:agenda_items|string|max:255',
            'agenda_items.*.description' => 'nullable|string|max:500',
            'dojo_id' => $user?->isSuperAdmin() ? 'required|exists:dojos,id' : 'nullable',
            'force_overlap' => 'nullable|boolean',
        ]);

        $forceOverlap = $validated['force_overlap'] ?? false;
        unset($validated['force_overlap']);

        $validated['agenda_items'] = $this->sanitizeAgendaItems($validated['agenda_items'] ?? []);
        $this->validateAgendaItemsWithinProgram($validated['agenda_items'], $validated['start_time'], $validated['end_time']);

        if (! $user?->isSuperAdmin()) {
            if (! $user?->dojo_id) {
                throw ValidationException::withMessages([
                    'day' => 'Dojo belum tersedia. Silakan hubungi super admin.',
                ]);
            }
            $validated['dojo_id'] = $user->dojo_id;
        }

        $this->ensureNoOverlappingSchedule($validated, null, $forceOverlap);

        TrainingProgram::create($validated);

        return redirect()->back()->with('success', 'Program latihan berhasil ditambahkan.');
    }

    public function update(Request $request, TrainingProgram $trainingProgram)
    {
        $user = auth()->user();

        if (! $user?->isSuperAdmin() && (int) $trainingProgram->dojo_id !== (int) $user?->dojo_id) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'day' => 'required|string',
            'start_time' => 'required',
            'end_time' => 'required|after:start_time',
            'coach_name' => 'required|string|max:255',
            'type' => 'required|string',
            'description' => 'nullable|string',
            'agenda_items' => 'nullable|array',
            'agenda_items.*.start_time' => 'required_with:agenda_items|date_format:H:i',
            'agenda_items.*.end_time' => 'required_with:agenda_items|date_format:H:i',
            'agenda_items.*.title' => 'required_with:agenda_items|string|max:255',
            'agenda_items.*.description' => 'nullable|string|max:500',
            'force_overlap' => 'nullable|boolean',
        ]);

        $forceOverlap = $validated['force_overlap'] ?? false;
        unset($validated['force_overlap']);

        $validated['agenda_items'] = $this->sanitizeAgendaItems($validated['agenda_items'] ?? []);
        $this->validateAgendaItemsWithinProgram($validated['agenda_items'], $validated['start_time'], $validated['end_time']);
        $validated['dojo_id'] = $trainingProgram->dojo_id;
        $this->ensureNoOverlappingSchedule($validated, $trainingProgram->id, $forceOverlap);

        $trainingProgram->update($validated);

        return redirect()->back()->with('success', 'Program latihan berhasil diperbarui.');
    }

    public function destroy(TrainingProgram $trainingProgram)
    {
        $user = auth()->user();

        if (! $user?->isSuperAdmin() && (int) $trainingProgram->dojo_id !== (int) $user?->dojo_id) {
            abort(403);
        }

        $trainingProgram->delete();

        return redirect()->back()->with('success', 'Program latihan berhasil dihapus.');
    }

    private function ensureNoOverlappingSchedule(array $payload, ?int $ignoreId = null, bool $forceOverlap = false): void
    {
        $conflicts = TrainingProgram::query()
            ->where('dojo_id', $payload['dojo_id'])
            ->where('day', $payload['day'])
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where('start_time', '<', $payload['end_time'])
            ->where('end_time', '>', $payload['start_time'])
            ->get();

        if ($conflicts->isEmpty()) {
            return;
        }

        $sameSenseiConflict = $conflicts->contains(fn ($p) => strtolower(trim($p->coach_name)) === strtolower(trim($payload['coach_name'])));

        if ($sameSenseiConflict) {
            throw ValidationException::withMessages([
                'start_time' => 'Jadwal bentrok. Sensei yang sama tidak bisa dijadwalkan mengajar pada dua jam yang beririsan.',
            ]);
        }

        if (! $forceOverlap) {
            throw ValidationException::withMessages([
                'confirm_overlap' => 'Sistem mendeteksi jadwal beririsan dengan kegiatan/Sensei lain. Apakah Anda yakin ingin memaksakan jadwal ini masuk?',
            ]);
        }
    }

    private function sanitizeAgendaItems(array $agendaItems): array
    {
        return collect($agendaItems)
            ->map(function ($item) {
                return [
                    'start_time' => $item['start_time'] ?? null,
                    'end_time' => $item['end_time'] ?? null,
                    'title' => trim((string) ($item['title'] ?? '')),
                    'description' => trim((string) ($item['description'] ?? '')) ?: null,
                ];
            })
            ->filter(fn ($item) => $item['start_time'] && $item['end_time'] && $item['title'] !== '')
            ->sortBy('start_time')
            ->values()
            ->all();
    }

    private function validateAgendaItemsWithinProgram(array $agendaItems, string $programStart, string $programEnd): void
    {
        $lastEnd = null;
        foreach ($agendaItems as $index => $item) {
            if ($item['end_time'] <= $item['start_time']) {
                throw ValidationException::withMessages([
                    "agenda_items.{$index}.end_time" => 'Jam selesai detail agenda harus setelah jam mulai.',
                ]);
            }

            if ($item['start_time'] < $programStart || $item['end_time'] > $programEnd) {
                throw ValidationException::withMessages([
                    "agenda_items.{$index}.start_time" => 'Jam detail agenda harus berada di dalam rentang jadwal utama.',
                ]);
            }

            if ($lastEnd && $item['start_time'] < $lastEnd) {
                throw ValidationException::withMessages([
                    "agenda_items.{$index}.start_time" => 'Detail agenda tidak boleh bentrok waktunya.',
                ]);
            }

            $lastEnd = $item['end_time'];
        }
    }

    private function resolveNextDate(string $day, Carbon $now): Carbon
    {
        $targetIsoDay = match ($day) {
            'Senin' => 1,
            'Selasa' => 2,
            'Rabu' => 3,
            'Kamis' => 4,
            'Jumat' => 5,
            'Sabtu' => 6,
            'Minggu' => 7,
            default => (int) $now->isoWeekday(),
        };

        $date = $now->copy()->startOfDay()->setISODate((int) $now->format('o'), (int) $now->isoWeek(), $targetIsoDay);
        if ($date->lt($now->copy()->startOfDay())) {
            $date->addWeek();
        }

        return $date;
    }
}
