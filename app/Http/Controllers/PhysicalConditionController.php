<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\Dojo;
use Inertia\Inertia;
use Carbon\Carbon;

class PhysicalConditionController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $requestedDojoId = request('dojo_id') ? (int) request('dojo_id') : null;
        $selectedDojoId = $this->resolveDojoId($user, $requestedDojoId);
        $isAllDojos = $user?->isSuperAdmin() && !$selectedDojoId;

        $month = request('month', Carbon::now()->month);
        $year = request('year', Carbon::now()->year);

        $athleteQuery = $this->scopeAthletesForUser(Athlete::query(), $user);
        if ($selectedDojoId) {
            $athleteQuery->where('dojo_id', $selectedDojoId);
        }

        $allAthletes = $athleteQuery
            ->with(['level', 'physicalMetrics' => function($q) {
                $q->orderBy('recorded_at', 'asc');
            }])
            ->get();

        $selectedAthleteId = request('athlete_id') ?: ($allAthletes->first()?->id ?? null);
        $selectedAthlete = $allAthletes->find($selectedAthleteId);

        $attendanceStats = null;
        $physicalConditionHistory = [];

        if ($selectedAthlete) {
            $selectedAthlete->age = Carbon::parse($selectedAthlete->dob)->age;
            $latestMetric = $selectedAthlete->physicalMetrics->last();

            if (!$latestMetric) {
                $height = (float) ($selectedAthlete->latest_height ?? 0);
                $weight = (float) ($selectedAthlete->latest_weight ?? 0);
                $bmi = null;

                if ($height > 0 && $weight > 0) {
                    $heightInMeters = $height / 100;
                    $bmi = round($weight / ($heightInMeters * $heightInMeters), 1);
                }

                $latestMetric = (object) [
                    'height' => $height ?: null,
                    'weight' => $weight ?: null,
                    'bmi' => $bmi,
                    'recorded_at' => $selectedAthlete->created_at,
                ];
            }

            $selectedAthlete->latest_metrics = $latestMetric;
            $selectedAthlete->bmi_detail = $this->resolveBmiDetail($latestMetric->bmi);

            // Attendance Stats for the specified month
            $attendances = \App\Models\Attendance::where('athlete_id', $selectedAthlete->id)
                ->whereMonth('recorded_at', $month)
                ->whereYear('recorded_at', $year)
                ->get();

            if ($attendances->isNotEmpty()) {
                $attendanceStats = [
                    'mood_before' => round($attendances->avg(function($a) {
                        // Extract number from "Mood 8/10" or similar in check_in_mood
                        if (preg_match('/([0-9.]+)/', $a->check_in_mood, $matches)) {
                            return (float) $matches[1];
                        }
                        return (float) ($a->pre_training_mood_rating ?? 0);
                    }), 1),
                    'mood_after' => round($attendances->avg(fn($a) => (float)($a->post_training_mood_rating ?? 0)), 1),
                    'fatigue' => round($attendances->avg(fn($a) => (float)($a->post_training_load_rating ?? 0)), 1),
                    'count' => $attendances->count(),
                ];
            }

            // Physical Metrics Trend (Weight & BMI) - Grouped by Month
            $metricsHistory = $selectedAthlete->physicalMetrics
                ->groupBy(function($m) {
                    return Carbon::parse($m->recorded_at)->format('Y-m');
                })
                ->map(function($group, $key) {
                    return [
                        'month_key' => $key,
                        'month_name' => Carbon::parse($key . '-01')->translatedFormat('M Y'),
                        'average_weight' => round($group->avg(fn($m) => (float)($m->weight ?? 0)), 1),
                        'average_bmi' => round($group->avg(fn($m) => (float)($m->bmi ?? 0)), 1),
                        'entries' => $group->map(fn($m) => [
                            'date' => Carbon::parse($m->recorded_at)->format('d/m'),
                            'weight' => $m->weight,
                            'bmi' => $m->bmi
                        ])
                    ];
                })
                ->values();

            $reports = \App\Models\AthleteReport::where('athlete_id', $selectedAthlete->id)
                ->orderBy('recorded_at', 'asc')
                ->get();
            
            $reportsGrouped = $reports->groupBy(function($date) {
                    return Carbon::parse($date->recorded_at)->format('Y-m');
                });

            foreach ($reportsGrouped as $key => $groupedReports) {
                $physicalConditionHistory[] = [
                    'month_key' => $key,
                    'month_name' => Carbon::parse($key . '-01')->translatedFormat('M Y'),
                    'average_condition' => round($groupedReports->avg(fn($r) => (float)($r->condition_percentage ?? 0)), 1),
                    // For tooltip dates
                    'entries' => $groupedReports->map(fn($r) => [
                        'date' => Carbon::parse($r->recorded_at)->format('d/m'),
                        'value' => $r->condition_percentage
                    ])
                ];
            }
        }

        return Inertia::render('PhysicalCondition/Index', [
            'athletes' => Inertia::defer(fn () => $allAthletes->map(function($a) use ($selectedAthleteId) {
                if ($a->id === $selectedAthleteId) {
                    return $a;
                }
                $a->age = Carbon::parse($a->dob)->age;
                return $a;
            })),
            'selectedAthlete' => $selectedAthlete,
            'attendanceStats' => $attendanceStats,
            'physicalConditionHistory' => $physicalConditionHistory,
            'metricsHistory' => $metricsHistory ?? [],
            'dojos'          => Inertia::defer(fn () => $user?->isSuperAdmin() ? Dojo::orderBy('name')->get(['id', 'name']) : []),
            'selectedDojoId' => Inertia::defer(fn () => $isAllDojos ? null : $selectedDojoId),
            'isAllDojos'     => Inertia::defer(fn () => $isAllDojos),
            'filters' => [
                'month' => (int) $month,
                'year' => (int) $year,
                'athlete_id' => $selectedAthleteId,
            ]
        ]);
    }

    private function resolveBmiDetail(?float $bmi): array
    {
        if (!$bmi) {
            return [
                'label' => 'Belum Ada Data',
                'note' => 'Tambahkan data tinggi dan berat untuk menghitung IMT.',
            ];
        }

        if ($bmi < 18.5) {
            return [
                'label' => 'Kurus',
                'note' => 'Fokus peningkatan asupan kalori dan latihan beban progresif.',
            ];
        }

        if ($bmi <= 24.9) {
            return [
                'label' => 'Ideal',
                'note' => 'Pertahankan pola latihan dan nutrisi yang konsisten.',
            ];
        }

        if ($bmi <= 29.9) {
            return [
                'label' => 'Berlebih',
                'note' => 'Tambahkan latihan kardio dan kontrol pola makan harian.',
            ];
        }

        return [
            'label' => 'Obesitas',
            'note' => 'Perlu pendampingan intensif pelatih dan evaluasi medis berkala.',
        ];
    }
}
