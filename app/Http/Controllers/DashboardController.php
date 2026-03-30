<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\Attendance;
use App\Models\Dojo;
use App\Models\FinanceRecord;
use App\Models\TrainingProgram;
use App\Models\WellnessReadinessLog;
use App\Models\WellnessWorkloadSnapshot;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $requestedDojoId = request('dojo_id') ? (int) request('dojo_id') : null;
        $selectedDojoId = $this->resolveDojoId($user, $requestedDojoId);
        // Super admin dengan no filter = tampilkan semua dojo (aggregate)
        $isAllDojos = $user?->isSuperAdmin() && !$selectedDojoId;

        $dojo = $selectedDojoId ? Dojo::find($selectedDojoId) : null;

        $athleteScope = $this->scopeAthletesForUser(Athlete::query(), $user);
        if ($user?->isSuperAdmin() && $selectedDojoId) {
            $athleteScope->where('dojo_id', $selectedDojoId);
        }
        $athleteIdSubquery = (clone $athleteScope)->select('id');

        $totalAthletes = (clone $athleteScope)->count();
        $unpaidCount = FinanceRecord::query()
            ->whereIn('athlete_id', $athleteIdSubquery)
            ->where('status', '!=', 'paid')
            ->count();

        $dayMap = [
            'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu',
        ];
        $todayIndo = $dayMap[now()->englishDayOfWeek] ?? 'Senin';
        $programQuery = TrainingProgram::query()
            ->when($selectedDojoId, fn ($query) => $query->where('dojo_id', $selectedDojoId));
        $todayTrainingCount = (clone $programQuery)->where('day', $todayIndo)->count();

        $atletPantauan = (clone $athleteScope)->whereHas('physicalMetrics', function ($query) {
            $query->where('bmi', '>', 25);
        })->count();

        $stats = [
            ['title' => 'Total Atlet Aktif', 'value' => (string) $totalAthletes, 'icon' => 'users'],
            ['title' => 'Sesi Latihan', 'value' => (string) $todayTrainingCount, 'icon' => 'dumbbell'],
            ['title' => 'Atlet Pantauan', 'value' => (string) $atletPantauan, 'icon' => 'activity'],
            ['title' => 'Tunggakan SPP', 'value' => (string) $unpaidCount, 'icon' => 'credit-card'],
        ];

        $todayIndo = $dayMap[now()->englishDayOfWeek] ?? 'Senin';
        $tomorrowIndo = $dayMap[now()->addDay()->englishDayOfWeek] ?? 'Selasa';

        $allPrograms = $programQuery->orderBy('start_time')->get();

        $formatProgram = function ($program, $isToday) {
            return [
                'id' => $program->id,
                'title' => $program->title,
                'time' => substr($program->start_time, 0, 5) . ' - ' . substr($program->end_time, 0, 5),
                'desc' => trim(($program->coach_name ?? '-') . ' | ' . ucfirst($program->type), ' |'),
                'status' => $isToday ? 'Hari Ini' : 'Besok',
                'day' => $program->day,
                'coach' => $program->coach_name,
                'type' => $program->type,
                'detail' => $program->description ?: 'Belum ada deskripsi program.',
                'next_date' => $isToday ? now()->translatedFormat('l, d M Y') : now()->addDay()->translatedFormat('l, d M Y'),
            ];
        };

        $todayProgramsList = $allPrograms->filter(fn ($p) => $p->day === $todayIndo)->map(fn ($p) => $formatProgram($p, true))->values();
        $tomorrowProgramsList = $allPrograms->filter(fn ($p) => $p->day === $tomorrowIndo)->map(fn ($p) => $formatProgram($p, false))->values();

        // Gabung jika ingin, atau tampilkan langsung
        $trainingPrograms = $todayProgramsList->concat($tomorrowProgramsList);

        $nextTrainingReminder = $tomorrowProgramsList->isNotEmpty()
            ? 'Reminder latihan besok (' . now()->addDay()->translatedFormat('d M') . '): ' . $tomorrowProgramsList->count() . ' sesi'
            : ($todayProgramsList->isNotEmpty() ? 'Hari ini ada ' . $todayProgramsList->count() . ' sesi latihan.' : 'Belum ada jadwal latihan terdekat.');

        $todayAttendances = Attendance::query()
            ->with('athlete')
            ->whereIn('athlete_id', $athleteIdSubquery)
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

        $latestReadinessByAthlete = collect();
        $latestWorkloadByAthlete = collect();

        if ($selectedDojoId) {
            $latestReadinessByAthlete = WellnessReadinessLog::query()
                ->where('tenant_id', $selectedDojoId)
                ->with('athlete:id,full_name,athlete_code')
                ->orderByDesc('recorded_on')
                ->orderByDesc('id')
                ->get()
                ->unique('athlete_id')
                ->values();

            $latestWorkloadByAthlete = WellnessWorkloadSnapshot::query()
                ->where('tenant_id', $selectedDojoId)
                ->with('athlete:id,full_name,athlete_code')
                ->orderByDesc('snapshot_date')
                ->orderByDesc('id')
                ->get()
                ->unique('athlete_id')
                ->values();
        }

        $lowReadinessCount = $latestReadinessByAthlete
            ->filter(fn ($item) => (int) $item->readiness_percentage < 60)
            ->count();
        $highWorkloadCount = $latestWorkloadByAthlete
            ->filter(fn ($item) => in_array($item->risk_band, ['high', 'very_high'], true))
            ->count();
        $veryHighWorkloadCount = $latestWorkloadByAthlete
            ->filter(fn ($item) => $item->risk_band === 'very_high')
            ->count();

        $readinessAvg = $latestReadinessByAthlete->isNotEmpty()
            ? (int) round($latestReadinessByAthlete->avg('readiness_percentage'))
            : 0;

        $wellnessSummary = [
            'tracked_athletes' => max($latestReadinessByAthlete->count(), $latestWorkloadByAthlete->count()),
            'average_readiness' => $readinessAvg,
            'low_readiness_count' => $lowReadinessCount,
            'high_workload_count' => $highWorkloadCount,
            'very_high_workload_count' => $veryHighWorkloadCount,
            'last_readiness_date' => optional($latestReadinessByAthlete->first()?->recorded_on)->toDateString(),
            'last_workload_date' => optional($latestWorkloadByAthlete->first()?->snapshot_date)->toDateString(),
        ];

        $wellnessTrend = collect();
        if ($selectedDojoId) {
            $wellnessTrend = collect(range(6, 0))
                ->map(function (int $daysAgo) use ($selectedDojoId) {
                    $date = now()->subDays($daysAgo)->toDateString();
                    $avgReadiness = WellnessReadinessLog::query()
                        ->where('tenant_id', $selectedDojoId)
                        ->whereDate('recorded_on', $date)
                        ->avg('readiness_percentage');

                    $highRiskCount = WellnessWorkloadSnapshot::query()
                        ->where('tenant_id', $selectedDojoId)
                        ->whereDate('snapshot_date', $date)
                        ->whereIn('risk_band', ['high', 'very_high'])
                        ->count();

                    return [
                        'date' => $date,
                        'label' => Carbon::parse($date)->format('d M'),
                        'average_readiness' => $avgReadiness ? (int) round($avgReadiness) : 0,
                        'high_risk_count' => $highRiskCount,
                    ];
                })
                ->values();
        }

        $readinessAlerts = $latestReadinessByAthlete
            ->filter(fn ($item) => (int) $item->readiness_percentage < 60)
            ->map(function ($item) {
                return [
                    'athlete_name' => $item->athlete?->full_name ?? '-',
                    'athlete_code' => $item->athlete?->athlete_code ?? '-',
                    'type' => 'readiness',
                    'label' => 'Readiness Rendah',
                    'value' => (int) $item->readiness_percentage . '%',
                    'priority' => (int) $item->readiness_percentage < 45 ? 2 : 1,
                    'date' => optional($item->recorded_on)->toDateString(),
                ];
            });

        $workloadAlerts = $latestWorkloadByAthlete
            ->filter(fn ($item) => in_array($item->risk_band, ['high', 'very_high'], true))
            ->map(function ($item) {
                return [
                    'athlete_name' => $item->athlete?->full_name ?? '-',
                    'athlete_code' => $item->athlete?->athlete_code ?? '-',
                    'type' => 'workload',
                    'label' => strtoupper($item->risk_band) . ' ACWR',
                    'value' => $item->acwr_ratio !== null ? number_format((float) $item->acwr_ratio, 2) : '-',
                    'priority' => $item->risk_band === 'very_high' ? 3 : 2,
                    'date' => optional($item->snapshot_date)->toDateString(),
                ];
            });

        $wellnessAlerts = $readinessAlerts
            ->merge($workloadAlerts)
            ->sortByDesc('priority')
            ->take(8)
            ->values();

        return Inertia::render('Dashboard', [
            'stats'               => Inertia::defer(fn () => $stats),
            'trainingPrograms'    => Inertia::defer(fn () => $trainingPrograms),
            'nextTrainingReminder'=> Inertia::defer(fn () => $nextTrainingReminder),
            'attendanceSummary'   => Inertia::defer(fn () => $attendanceSummary),
            'recentAttendances'   => Inertia::defer(fn () => $recentAttendances),
            'wellnessSummary'     => Inertia::defer(fn () => $wellnessSummary),
            'wellnessAlerts'      => Inertia::defer(fn () => $wellnessAlerts),
            'wellnessTrend'       => Inertia::defer(fn () => $wellnessTrend),
            'dojoName'            => Inertia::defer(fn () => $isAllDojos ? 'Semua Dojo' : ($dojo?->name ?? 'Dojo Utama')),
            'dojos'               => Inertia::defer(fn () => $user?->isSuperAdmin() ? Dojo::orderBy('name')->get(['id', 'name']) : []),
            'selectedDojoId'      => Inertia::defer(fn () => $isAllDojos ? null : $selectedDojoId),
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
