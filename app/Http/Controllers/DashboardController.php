<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\Attendance;
use App\Models\Dojo;
use App\Models\FinanceRecord;
use App\Models\TrainingProgram;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $dojo = Dojo::first();
        $totalAthletes = Athlete::count();
        $unpaidCount = FinanceRecord::where('status', 'unpaid')->count();

        $dayMap = [
            'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu',
        ];
        $todayIndo = $dayMap[now()->englishDayOfWeek] ?? 'Senin';
        $todayTrainingCount = TrainingProgram::where('day', $todayIndo)->count();

        $atletPantauan = Athlete::whereHas('physicalMetrics', function ($query) {
            $query->where('bmi', '>', 25);
        })->count();

        $stats = [
            ['title' => 'Total Atlet Aktif', 'value' => (string) $totalAthletes, 'icon' => 'users'],
            ['title' => 'Sesi Latihan', 'value' => (string) $todayTrainingCount, 'icon' => 'dumbbell'],
            ['title' => 'Atlet Pantauan', 'value' => (string) $atletPantauan, 'icon' => 'activity'],
            ['title' => 'Tunggakan SPP', 'value' => (string) $unpaidCount, 'icon' => 'credit-card'],
        ];

        $now = Carbon::now();
        $scheduledPrograms = TrainingProgram::query()
            ->orderBy('day')
            ->orderBy('start_time')
            ->get()
            ->map(function ($program) use ($now) {
                ['start' => $nextStart, 'end' => $nextEnd] = $this->resolveNextProgramWindow(
                    $program->day,
                    $program->start_time,
                    $program->end_time,
                    $now
                );

                return [
                    'id' => $program->id,
                    'title' => $program->title,
                    'time' => substr($program->start_time, 0, 5) . ' - ' . substr($program->end_time, 0, 5),
                    'desc' => trim(($program->coach_name ?? '-') . ' | ' . ucfirst($program->type), ' |'),
                    'status' => $nextStart->isToday() ? 'Latihan hari ini' : 'Latihan terdekat',
                    'day' => $program->day,
                    'coach' => $program->coach_name,
                    'type' => $program->type,
                    'detail' => $program->description ?: 'Belum ada deskripsi program.',
                    'next_date' => $nextStart->translatedFormat('l, d M Y'),
                    'starts_at' => $nextStart->toIso8601String(),
                    'ends_at' => $nextEnd->toIso8601String(),
                ];
            })
            ->sortBy('starts_at')
            ->values();

        $nearestDate = $scheduledPrograms->first()['next_date'] ?? null;
        $nearestPrograms = $scheduledPrograms
            ->filter(fn ($program) => $program['next_date'] === $nearestDate)
            ->values();

        $nextTrainingReminder = $nearestPrograms->first()
            ? 'Reminder latihan terdekat: ' . $nearestPrograms->first()['next_date']
            : 'Belum ada program latihan terjadwal.';

        $todayAttendances = Attendance::query()
            ->with('athlete')
            ->whereDate('recorded_at', now()->toDateString())
            ->orderByDesc('recorded_at')
            ->get();

        $attendanceSummary = [
            'present' => $todayAttendances->where('status', 'present')->count(),
            'total_athletes' => $totalAthletes,
            'percentage' => $totalAthletes > 0
                ? round(($todayAttendances->where('status', 'present')->count() / $totalAthletes) * 100)
                : 0,
        ];

        $recentAttendances = $todayAttendances
            ->take(8)
            ->map(function ($attendance) {
                return [
                    'athlete_name' => $attendance->athlete?->full_name ?? '-',
                    'time' => Carbon::parse($attendance->recorded_at)->format('H:i'),
                    'status' => $attendance->status,
                ];
            })
            ->values();

        return Inertia::render('Dashboard', [
            'stats' => Inertia::defer(fn () => $stats),
            'trainingPrograms' => Inertia::defer(fn () => $nearestPrograms),
            'nextTrainingReminder' => Inertia::defer(fn () => $nextTrainingReminder),
            'attendanceSummary' => Inertia::defer(fn () => $attendanceSummary),
            'recentAttendances' => Inertia::defer(fn () => $recentAttendances),
            'dojoName' => Inertia::defer(fn () => $dojo->name ?? 'Dojo Utama'),
        ]);
    }

    private function resolveNextProgramWindow(string $day, string $startTime, string $endTime, Carbon $now): array
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

        $baseDate = $now->copy()->startOfDay()->setISODate(
            (int) $now->format('o'),
            (int) $now->isoWeek(),
            $targetIsoDay
        );

        $start = $baseDate->copy()->setTimeFromTimeString($startTime);
        $end = $baseDate->copy()->setTimeFromTimeString($endTime);
        if ($end->lte($start)) {
            $end->addDay();
        }

        if ($end->lt($now)) {
            $start->addWeek();
            $end->addWeek();
        }

        return ['start' => $start, 'end' => $end];
    }
}
