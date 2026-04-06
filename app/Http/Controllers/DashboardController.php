<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\Attendance;
use App\Models\Dojo;
use App\Models\DojoRegistration;
use App\Models\DojoSubscriptionRequest;
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

        $pendingRegistrationsCount = $user?->isSuperAdmin() ? DojoRegistration::where('status', 'pending')->count() : 0;
        $pendingSubscriptionRequestsCount = $user?->isSuperAdmin() ? DojoSubscriptionRequest::where('status', 'pending')->count() : 0;

        return Inertia::render('Dashboard', [
            'stats'               => Inertia::defer(fn () => $stats),
            'trainingPrograms'    => Inertia::defer(fn () => $trainingPrograms),
            'nextTrainingReminder'=> Inertia::defer(fn () => $nextTrainingReminder),
            'attendanceSummary'   => Inertia::defer(fn () => $attendanceSummary),
            'recentAttendances'   => Inertia::defer(fn () => $recentAttendances),
            'pendingRegistrationsCount' => $pendingRegistrationsCount,
            'pendingSubscriptionRequestsCount' => $pendingSubscriptionRequestsCount,
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
