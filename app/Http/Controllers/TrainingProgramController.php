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
        $days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        $programs = TrainingProgram::query()
            ->orderBy('start_time')
            ->get()
            ->groupBy('day');
        
        $structuredPrograms = [];
        foreach($days as $day) {
            $structuredPrograms[$day] = $programs->get($day, collect())->map(function($p) {
                $nextDate = $this->resolveNextDate($p->day, Carbon::now());

                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'day' => $p->day,
                    'start_time' => substr($p->start_time, 0, 5),
                    'end_time' => substr($p->end_time, 0, 5),
                    'time' => substr($p->start_time, 0, 5) . ' - ' . substr($p->end_time, 0, 5),
                    'coach' => $p->coach_name,
                    'type' => $p->type,
                    'desc' => $p->description,
                    'next_date' => $nextDate->translatedFormat('d M Y'),
                    'agenda_items' => collect($p->agenda_items ?? [])
                        ->map(fn ($item) => [
                            'start_time' => $item['start_time'] ?? null,
                            'end_time' => $item['end_time'] ?? null,
                            'title' => $item['title'] ?? '',
                            'description' => $item['description'] ?? null,
                        ])
                        ->filter(fn ($item) => $item['start_time'] && $item['end_time'] && $item['title'])
                        ->values(),
                ];
            });
        }

        return Inertia::render('TrainingPrograms/Index', [
            'weeklySchedule' => Inertia::defer(fn () => $structuredPrograms),
        ]);
    }

    public function store(Request $request)
    {
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
        ]);

        $validated['agenda_items'] = $this->sanitizeAgendaItems($validated['agenda_items'] ?? []);
        $this->validateAgendaItemsWithinProgram($validated['agenda_items'], $validated['start_time'], $validated['end_time']);
        $this->ensureNoOverlappingSchedule($validated);

        // Default ke dojo pertama karena pemilihan dojo belum dibuka di form.
        $dojoId = Dojo::query()->value('id');
        if (!$dojoId) {
            throw ValidationException::withMessages([
                'day' => 'Dojo belum tersedia. Silakan buat data dojo terlebih dahulu.',
            ]);
        }
        $validated['dojo_id'] = $dojoId;

        TrainingProgram::create($validated);

        return redirect()->back()->with('success', 'Program latihan berhasil ditambahkan.');
    }

    public function update(Request $request, TrainingProgram $trainingProgram)
    {
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
        ]);

        $validated['agenda_items'] = $this->sanitizeAgendaItems($validated['agenda_items'] ?? []);
        $this->validateAgendaItemsWithinProgram($validated['agenda_items'], $validated['start_time'], $validated['end_time']);
        $this->ensureNoOverlappingSchedule($validated, $trainingProgram->id);

        $trainingProgram->update($validated);

        return redirect()->back()->with('success', 'Program latihan berhasil diperbarui.');
    }

    public function destroy(TrainingProgram $trainingProgram)
    {
        $trainingProgram->delete();

        return redirect()->back()->with('success', 'Program latihan berhasil dihapus.');
    }

    private function ensureNoOverlappingSchedule(array $payload, ?int $ignoreId = null): void
    {
        $hasConflict = TrainingProgram::query()
            ->where('day', $payload['day'])
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where('start_time', '<', $payload['end_time'])
            ->where('end_time', '>', $payload['start_time'])
            ->exists();

        if ($hasConflict) {
            throw ValidationException::withMessages([
                'start_time' => 'Jadwal bentrok. Tidak boleh ada latihan di waktu yang sama.',
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
