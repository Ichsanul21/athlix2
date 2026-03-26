<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\FinanceRecord;
use App\Models\TrainingProgram;
use Carbon\Carbon;
use Inertia\Inertia;

class PwaController extends Controller
{
    private const ADMIN_FEE = 5000;

    private function resolveAthleteForUser()
    {
        $user = auth()->user();

        if ($user?->athlete_id) {
            return Athlete::with([
                'belt',
                'dojo',
                'attendances',
                'financeRecords',
                'physicalMetrics' => fn ($query) => $query->latest('recorded_at'),
                'achievements' => fn ($query) => $query->latest('competition_date'),
                'latestReport',
            ])->find($user->athlete_id);
        }

        return null;
    }

    public function home()
    {
        $athlete = $this->resolveAthleteForUser();

        if (!$athlete) {
            return Inertia::render('PwaHome/Index', [
                'athlete' => Inertia::defer(fn () => null),
                'todaySession' => Inertia::defer(fn () => null),
                'stats' => Inertia::defer(fn () => null),
                'upcomingPayment' => Inertia::defer(fn () => null),
                'tips' => Inertia::defer(fn () => null),
                'agendaThreeDays' => Inertia::defer(fn () => []),
                'performanceSummary' => Inertia::defer(fn () => null),
                'latestAttendanceFeedback' => Inertia::defer(fn () => null),
            ]);
        }

        $todayIndo = $this->indoDayName(Carbon::now());
        $dojoId = $athlete->dojo_id ?? auth()->user()?->dojo_id;
        $todayPrograms = TrainingProgram::query()
            ->when($dojoId, fn ($query) => $query->where('dojo_id', $dojoId))
            ->where('day', $todayIndo)
            ->orderBy('start_time')
            ->get();

        $attendanceTotal = $athlete->attendances->count();
        $attendancePresent = $athlete->attendances->where('status', 'present')->count();
        $attendanceRate = $attendanceTotal > 0 ? round(($attendancePresent / $attendanceTotal) * 100) . '%' : '0%';

        $unpaidRecords = $athlete->financeRecords
            ->filter(fn ($record) => $record->status !== 'paid')
            ->sortBy('due_date')
            ->values();
        $upcomingPayment = $unpaidRecords->first();
        $outstanding = $unpaidRecords->sum(fn ($record) => (float) $record->amount + self::ADMIN_FEE);

        $stats = [
            'attendance' => $attendanceRate,
            'belt' => $athlete->belt?->name ?? 'Putih',
            'outstanding' => 'Rp ' . number_format($outstanding, 0, ',', '.'),
            'total_sessions' => (string) $todayPrograms->count(),
        ];

        $agendaThreeDays = $this->agendaThreeDays($dojoId);
        $performanceSummary = $this->buildPerformanceSummary($athlete);
        $latestAttendanceFeedback = $athlete->attendances
            ->where('status', 'present')
            ->sortByDesc('recorded_at')
            ->first(function ($attendance) {
                return filled($attendance->sensei_feedback)
                    || filled($attendance->sensei_mood_assessment);
            });

        if (! $latestAttendanceFeedback) {
            $latestAttendanceFeedback = $athlete->attendances
                ->where('status', 'present')
                ->sortByDesc('recorded_at')
                ->first(function ($attendance) {
                    return filled($attendance->check_in_feedback)
                        || filled($attendance->athlete_feedback);
                });
        }

        return Inertia::render('PwaHome/Index', [
            'athlete' => Inertia::defer(fn () => $athlete),
            'todaySession' => Inertia::defer(fn () => $todayPrograms->first() ? [
                'title' => $todayPrograms->first()->title,
                'time' => substr($todayPrograms->first()->start_time, 0, 5) . ' - ' . substr($todayPrograms->first()->end_time, 0, 5),
                'coach' => $todayPrograms->first()->coach_name,
            ] : null),
            'stats' => Inertia::defer(fn () => $stats),
            'upcomingPayment' => Inertia::defer(fn () => $upcomingPayment ? [
                'due_date' => Carbon::parse($upcomingPayment->due_date)->translatedFormat('d M Y'),
                'formatted_amount' => 'Rp ' . number_format((float) $upcomingPayment->amount + self::ADMIN_FEE, 0, ',', '.'),
                'amount' => (float) $upcomingPayment->amount + self::ADMIN_FEE,
            ] : null),
            'tips' => Inertia::defer(fn () => 'Jaga ritme latihan: pemanasan 10 menit, teknik utama 30 menit, pendinginan 10 menit.'),
            'agendaThreeDays' => Inertia::defer(fn () => $agendaThreeDays),
            'performanceSummary' => Inertia::defer(fn () => $performanceSummary),
            'latestAttendanceFeedback' => Inertia::defer(fn () => $latestAttendanceFeedback ? [
                'date' => Carbon::parse($latestAttendanceFeedback->recorded_at)->translatedFormat('d M Y'),
                'sensei_feedback' => $latestAttendanceFeedback->sensei_feedback,
                'sensei_mood_assessment' => $latestAttendanceFeedback->sensei_mood_assessment,
                'check_in_feedback' => $latestAttendanceFeedback->check_in_feedback,
                'check_in_mood' => $latestAttendanceFeedback->check_in_mood,
                'athlete_feedback' => $latestAttendanceFeedback->athlete_feedback,
                'athlete_mood' => $latestAttendanceFeedback->athlete_mood,
            ] : null),
        ]);
    }

    public function scan()
    {
        return Inertia::render('Scan/Index', [
            'athlete' => Inertia::defer(fn () => $this->resolveAthleteForUser()),
        ]);
    }

    public function schedule()
    {
        $today = Carbon::now();
        $todayIndo = $this->indoDayName($today);
        $athlete = $this->resolveAthleteForUser();
        $dojoId = $athlete?->dojo_id ?? auth()->user()?->dojo_id;

        $allPrograms = TrainingProgram::query()
            ->when($dojoId, fn ($query) => $query->where('dojo_id', $dojoId))
            ->orderBy('start_time')
            ->get();

        $todaySessions = $allPrograms
            ->where('day', $todayIndo)
            ->map(fn ($program) => [
                'id' => $program->id,
                'title' => $program->title,
                'time' => substr($program->start_time, 0, 5) . ' - ' . substr($program->end_time, 0, 5),
                'coach' => $program->coach_name,
                'type' => $program->type,
                'agenda_items' => collect($program->agenda_items ?? [])->map(fn ($item) => [
                    'title' => $item['title'] ?? 'Agenda',
                    'start_time' => $item['start_time'] ?? null,
                    'end_time' => $item['end_time'] ?? null,
                    'description' => $item['description'] ?? null,
                ])->values(),
            ])->values();

        $upcomingSessions = $allPrograms
            ->map(function ($program) use ($today) {
                $nextDate = $this->resolveNextDate($program->day, $today);
                return [
                    'title' => $program->title,
                    'day' => $program->day,
                    'time' => substr($program->start_time, 0, 5) . ' - ' . substr($program->end_time, 0, 5),
                    'coach' => $program->coach_name,
                    'type' => $program->type,
                    'date' => $nextDate->toDateString(),
                ];
            })
            ->filter(fn ($program) => $program['date'] !== $today->toDateString())
            ->sortBy('date')
            ->take(5)
            ->values()
            ->map(function ($program) {
                $program['day'] = Carbon::parse($program['date'])->translatedFormat('l');
                return $program;
            });

        $allAgenda = $allPrograms
            ->map(function ($program) use ($today) {
                $nextDate = $this->resolveNextDate($program->day, $today);

                return [
                    'id' => $program->id,
                    'title' => $program->title,
                    'day' => $program->day,
                    'date' => $nextDate->toDateString(),
                    'date_label' => $nextDate->translatedFormat('D, d M Y'),
                    'start_time' => substr($program->start_time, 0, 5),
                    'end_time' => substr($program->end_time, 0, 5),
                    'time' => substr($program->start_time, 0, 5) . ' - ' . substr($program->end_time, 0, 5),
                    'coach' => $program->coach_name,
                    'type' => $program->type,
                    'agenda_items' => collect($program->agenda_items ?? [])->map(fn ($item) => [
                        'title' => $item['title'] ?? 'Agenda',
                        'start_time' => $item['start_time'] ?? null,
                        'end_time' => $item['end_time'] ?? null,
                        'description' => $item['description'] ?? null,
                    ])->values(),
                ];
            })
            ->sortBy([
                ['date', 'asc'],
                ['start_time', 'asc'],
            ])
            ->values();

        return Inertia::render('Schedule/Index', [
            'todaySessions' => Inertia::defer(fn () => $todaySessions),
            'upcomingSessions' => Inertia::defer(fn () => $upcomingSessions),
            'allAgenda' => Inertia::defer(fn () => $allAgenda),
        ]);
    }

    public function billing()
    {
        $athlete = $this->resolveAthleteForUser();

        if (!$athlete) {
            return Inertia::render('Billing/Index', [
                'billing' => Inertia::defer(fn () => [
                    'outstanding' => 0,
                    'due_date' => null,
                    'invoices' => [],
                ]),
            ]);
        }

        $invoices = FinanceRecord::query()
            ->where('athlete_id', $athlete->id)
            ->latest()
            ->get()
            ->map(function ($record) {
                $status = $record->status === 'paid' ? 'paid' : 'unpaid';
                return [
                    'id' => $record->id,
                    'description' => $record->description,
                    'date' => Carbon::parse($record->due_date)->translatedFormat('d M Y'),
                    'due_date_raw' => Carbon::parse($record->due_date)->toDateString(),
                    'amount' => (float) $record->amount + self::ADMIN_FEE,
                    'status' => $status,
                    'admin_fee' => self::ADMIN_FEE,
                ];
            });

        $unpaid = $invoices->where('status', 'unpaid');
        $nextDue = $unpaid->sortBy('due_date_raw')->first();

        return Inertia::render('Billing/Index', [
            'billing' => Inertia::defer(fn () => [
                'outstanding' => $unpaid->sum('amount'),
                'due_date' => $nextDue['date'] ?? null,
                'invoices' => $invoices->map(function ($invoice) {
                    unset($invoice['due_date_raw']);
                    return $invoice;
                })->values(),
            ]),
        ]);
    }

    public function profile()
    {
        return Inertia::render('UserRecord/Index', [
            'athlete' => Inertia::defer(fn () => $this->resolveAthleteForUser()),
        ]);
    }

    public function condition()
    {
        $athlete = $this->resolveAthleteForUser();
        $summary = $athlete ? $this->buildPerformanceSummary($athlete) : null;
        $trend = collect($athlete?->physicalMetrics ?? [])
            ->sortBy('recorded_at')
            ->map(function ($metric) {
                return [
                    'date' => Carbon::parse($metric->recorded_at)->translatedFormat('d M'),
                    'weight' => $metric->weight,
                    'bmi' => $metric->bmi,
                ];
            })
            ->values();

        return Inertia::render('PhysicalCondition/PwaIndex', [
            'athlete' => Inertia::defer(fn () => $athlete),
            'performanceSummary' => Inertia::defer(fn () => $summary),
            'trend' => Inertia::defer(fn () => $trend),
        ]);
    }

    public function personalInfo()
    {
        $athlete = $this->resolveAthleteForUser();

        if ($athlete && $athlete->dob) {
            $dob = Carbon::parse($athlete->dob);
            $athlete->birth_date = $dob->translatedFormat('d F Y');
            $athlete->age_detail = $dob->diff(Carbon::now())->format('%y tahun %m bulan %d hari');
        }

        return Inertia::render('UserRecord/PersonalInfo', [
            'athlete' => Inertia::defer(fn () => $athlete),
        ]);
    }

    public function achievementHistory()
    {
        $athlete = $this->resolveAthleteForUser();

        return Inertia::render('UserRecord/AchievementHistory', [
            'athlete' => Inertia::defer(fn () => $athlete),
        ]);
    }

    public function settings()
    {
        return Inertia::render('UserRecord/Settings');
    }

    private function agendaThreeDays(?int $dojoId = null)
    {
        $today = Carbon::today();

        return TrainingProgram::query()
            ->when($dojoId, fn ($query) => $query->where('dojo_id', $dojoId))
            ->get()
            ->flatMap(function ($program) use ($today) {
                $items = [];
                for ($i = 0; $i < 3; $i++) {
                    $date = $today->copy()->addDays($i);
                    if ($this->indoDayName($date) === $program->day) {
                        $items[] = [
                            'id' => $program->id,
                            'title' => $program->title,
                            'day' => $program->day,
                            'date_raw' => $date->toDateString(),
                            'date' => $date->translatedFormat('D, d M'),
                            'time' => substr($program->start_time, 0, 5) . ' - ' . substr($program->end_time, 0, 5),
                            'coach' => $program->coach_name,
                            'agenda_items' => collect($program->agenda_items ?? [])->map(fn ($item) => [
                                'title' => $item['title'] ?? 'Agenda',
                                'start_time' => $item['start_time'] ?? null,
                                'end_time' => $item['end_time'] ?? null,
                                'description' => $item['description'] ?? null,
                            ])->values(),
                        ];
                    }
                }
                return $items;
            })
            ->sortBy([
                ['date_raw', 'asc'],
                ['time', 'asc'],
            ])
            ->take(3)
            ->values();
    }

    private function indoDayName(Carbon $date): string
    {
        return match ($date->englishDayOfWeek) {
            'Monday' => 'Senin',
            'Tuesday' => 'Selasa',
            'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis',
            'Friday' => 'Jumat',
            'Saturday' => 'Sabtu',
            'Sunday' => 'Minggu',
            default => 'Senin',
        };
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

    private function buildPerformanceSummary(Athlete $athlete): array
    {
        $latestMetric = $athlete->physicalMetrics->first();
        $attendanceTotal = $athlete->attendances->count();
        $attendancePresent = $athlete->attendances->where('status', 'present')->count();
        $attendanceRate = $attendanceTotal > 0 ? (int) round(($attendancePresent / $attendanceTotal) * 100) : 0;

        $bmi = $latestMetric?->bmi;
        $bmiScore = 0;
        if ($bmi) {
            if ($bmi >= 18.5 && $bmi <= 24.9) {
                $bmiScore = 92;
            } elseif ($bmi < 18.5) {
                $bmiScore = (int) max(55, 82 - (18.5 - $bmi) * 6);
            } else {
                $bmiScore = (int) max(50, 82 - ($bmi - 24.9) * 4);
            }
        }

        $conditionScore = (int) round((($bmiScore * 0.6) + ($attendanceRate * 0.4)));
        $conditionScore = max(0, min(100, $conditionScore));
        $latestReport = $athlete->latestReport;

        $categories = [
            ['label' => 'Stamina', 'score' => (int) ($latestReport?->stamina ?? max(0, min(100, $attendanceRate)))],
            ['label' => 'Keseimbangan', 'score' => (int) ($latestReport?->balance ?? max(0, min(100, $bmiScore)))],
            ['label' => 'Kecepatan', 'score' => (int) ($latestReport?->speed ?? max(0, min(100, (int) round(($attendanceRate + $bmiScore) / 2))))],
            ['label' => 'Kekuatan', 'score' => (int) ($latestReport?->strength ?? max(0, min(100, (int) round(($attendanceRate * 0.4) + ($bmiScore * 0.6)))) )],
            ['label' => 'Kelincahan', 'score' => (int) ($latestReport?->agility ?? max(0, min(100, (int) round(($attendanceRate * 0.5) + ($bmiScore * 0.5)))) )],
        ];
        $average = count($categories) > 0
            ? (int) round(collect($categories)->avg('score'))
            : 0;

        $abilityStatus = match (true) {
            $average >= 85 => 'Sangat Baik',
            $average >= 70 => 'Baik',
            $average >= 55 => 'Cukup',
            default => 'Perlu Pembinaan',
        };

        return [
            'condition_percentage' => (int) ($latestReport?->condition_percentage ?? $conditionScore),
            'ability_status' => $abilityStatus,
            'categories' => $categories,
            'latest_report_note' => $latestReport?->notes,
            'latest_report_date' => optional($latestReport?->recorded_at)->translatedFormat('d M Y'),
        ];
    }

}
