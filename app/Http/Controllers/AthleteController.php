<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\AthleteAchievement;
use App\Models\AthleteReport;
use App\Models\Belt;
use App\Models\Dojo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AthleteController extends Controller
{
    public function index()
    {
        $search = trim((string) request('search', ''));
        $user = auth()->user();

        $athleteQuery = Athlete::with([
                'belt',
                'physicalMetrics' => fn ($query) => $query->latest('recorded_at'),
                'latestReport',
            ]);

        $athleteQuery = $this->scopeAthletesForUser($athleteQuery, $user)
            ->withCount([
                'attendances as attendance_total',
                'attendances as attendance_present' => fn ($query) => $query->where('status', 'present'),
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $nested
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('athlete_code', 'like', "%{$search}%")
                        ->orWhere('class_note', 'like', "%{$search}%");
                });
            })
            ->orderBy('full_name');

        $athletes = $athleteQuery->get()
            ->map(function ($athlete) {
                $athlete->age = \Carbon\Carbon::parse($athlete->dob)->age;
                $latestMetric = $athlete->physicalMetrics->first();
                if (!$athlete->latest_height && $latestMetric?->height) {
                    $athlete->latest_height = $latestMetric->height;
                }
                if (!$athlete->latest_weight && $latestMetric?->weight) {
                    $athlete->latest_weight = $latestMetric->weight;
                }
                if (!$athlete->class_note) {
                    $athlete->class_note = 'Umum';
                }
                $attendanceTotal = (int) ($athlete->attendance_total ?? 0);
                $attendancePresent = (int) ($athlete->attendance_present ?? 0);
                $attendanceRate = $attendanceTotal > 0
                    ? (int) round(($attendancePresent / $attendanceTotal) * 100)
                    : 0;
                $computedConditionScore = $this->resolveConditionScore($latestMetric?->bmi, $attendanceRate);
                $athlete->physical_condition_percentage = (int) ($athlete->latestReport?->condition_percentage ?? $computedConditionScore);
                $bmiScore = $this->resolveBmiScore($latestMetric?->bmi);
                $defaultAbilityScores = [
                    max(0, min(100, $attendanceRate)),
                    max(0, min(100, $bmiScore)),
                    max(0, min(100, (int) round(($attendanceRate + $bmiScore) / 2))),
                    max(0, min(100, (int) round(($attendanceRate * 0.4) + ($bmiScore * 0.6)))),
                    max(0, min(100, (int) round(($attendanceRate * 0.5) + ($bmiScore * 0.5)))),
                ];
                $reportScores = collect([
                    $athlete->latestReport?->stamina,
                    $athlete->latestReport?->balance,
                    $athlete->latestReport?->speed,
                    $athlete->latestReport?->strength,
                    $athlete->latestReport?->agility,
                ])->filter(fn ($value) => $value !== null)->all();
                $athlete->ability_status = $this->resolveAbilityStatus(! empty($reportScores) ? $reportScores : $defaultAbilityScores);
                $athlete->category = match ($athlete->specialization) {
                    'kata' => 'Kata',
                    'kumite' => 'Kumite',
                    default => 'Kata & Kumite',
                };
                return $athlete;
            });

        return Inertia::render('Athletes/Index', [
            'athletes' => Inertia::defer(fn () => $athletes),
            'filters' => Inertia::defer(fn () => ['search' => $search]),
        ]);
    }

    public function create()
    {
        $user = auth()->user();

        return Inertia::render('Athletes/Create', [
            'belts' => Inertia::defer(fn () => Belt::all()),
            'suggestedAthleteCode' => $this->generateAthleteCode(),
            'dojos' => Inertia::defer(fn () => $user?->isSuperAdmin() ? Dojo::orderBy('name')->get(['id', 'name']) : []),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'athlete_code' => 'nullable|string|max:20|alpha_num|unique:athletes,athlete_code',
            'current_belt_id' => 'required|exists:belts,id',
            'dob' => 'required|date',
            'birth_place' => 'nullable|string|max:255',
            'gender' => 'required|in:M,F',
            'specialization' => 'required|in:kata,kumite,both',
            'latest_height' => 'nullable|numeric|min:50|max:260',
            'latest_weight' => 'nullable|numeric',
            'class_note' => 'nullable|string|max:255',
            'dojo_id' => $user?->isSuperAdmin() ? 'required|exists:dojos,id' : 'nullable',
        ]);

        $validated['athlete_code'] = strtoupper($validated['athlete_code'] ?? $this->generateAthleteCode());
        if (! $user?->isSuperAdmin()) {
            if (! $user?->dojo_id) {
                return back()->with('error', 'Dojo belum terhubung ke akun ini.');
            }
            $validated['dojo_id'] = $user->dojo_id;
        }
        $validated['class_note'] = $validated['class_note'] ?: 'Umum';

        $athlete = Athlete::create($validated);

        if ($user?->isSensei()) {
            $user->senseiAthletes()->syncWithoutDetaching([
                $athlete->id => [
                    'dojo_id' => $athlete->dojo_id,
                    'assigned_by' => $user->id,
                ],
            ]);
        }

        return redirect()->route('athletes.index')->with('success', 'Athlete created successfully.');
    }

    public function show(Athlete $athlete)
    {
        $this->ensureAthleteAccessible($athlete, auth()->user());

        $athlete->load([
            'belt',
            'dojo',
            'achievements',
            'attendances',
            'physicalMetrics' => fn ($query) => $query->latest('recorded_at'),
            'latestReport',
        ]);
        $athlete->age = \Carbon\Carbon::parse($athlete->dob)->age;
        $latestMetric = $athlete->physicalMetrics->first();
        if (!$athlete->latest_height && $latestMetric?->height) {
            $athlete->latest_height = $latestMetric->height;
        }
        if (!$athlete->latest_weight && $latestMetric?->weight) {
            $athlete->latest_weight = $latestMetric->weight;
        }
        if (!$athlete->class_note) {
            $athlete->class_note = 'Umum';
        }

        $achievementHistory = $athlete->achievements
            ->sortByDesc('competition_date')
            ->values()
            ->map(function ($achievement) {
                return [
                    'id' => $achievement->id,
                    'competition_name' => $achievement->competition_name,
                    'competition_level' => $achievement->competition_level,
                    'competition_type' => $achievement->competition_type,
                    'category' => $achievement->category,
                    'result_title' => $achievement->result_title,
                    'competition_date' => \Carbon\Carbon::parse($achievement->competition_date)->translatedFormat('d M Y'),
                    'location' => $achievement->location,
                    'organizer' => $achievement->organizer,
                    'notes' => $achievement->notes,
                    'certificate_url' => $achievement->certificate_path ? Storage::url($achievement->certificate_path) : null,
                ];
            });

        $attendanceTotal = $athlete->attendances->count();
        $attendancePresent = $athlete->attendances->where('status', 'present')->count();
        $attendanceRate = $attendanceTotal > 0 ? round(($attendancePresent / $attendanceTotal) * 100) : 0;

        $bmi = $latestMetric?->bmi;
        $bmiScore = $this->resolveBmiScore($bmi);
        $conditionScore = $this->resolveConditionScore($bmi, $attendanceRate);
        $latestReport = $athlete->latestReport;

        $categories = [
            ['label' => 'Stamina', 'score' => (int) ($latestReport?->stamina ?? max(0, min(100, $attendanceRate)))],
            ['label' => 'Keseimbangan', 'score' => (int) ($latestReport?->balance ?? max(0, min(100, $bmiScore)))],
            ['label' => 'Kecepatan', 'score' => (int) ($latestReport?->speed ?? max(0, min(100, (int) round(($attendanceRate + $bmiScore) / 2))))],
            ['label' => 'Kekuatan', 'score' => (int) ($latestReport?->strength ?? max(0, min(100, (int) round(($attendanceRate * 0.4) + ($bmiScore * 0.6)))) )],
            ['label' => 'Kelincahan', 'score' => (int) ($latestReport?->agility ?? max(0, min(100, (int) round(($attendanceRate * 0.5) + ($bmiScore * 0.5)))) )],
        ];

        $performance = [
            'condition' => [
                ['label' => 'Kondisi Fisik', 'value' => (int) ($latestReport?->condition_percentage ?? $conditionScore)],
                ['label' => 'Gap', 'value' => 100 - (int) ($latestReport?->condition_percentage ?? $conditionScore)],
            ],
            'categories' => $categories,
            'ability_status' => $this->resolveAbilityStatus(collect($categories)->pluck('score')->all()),
        ];

        return Inertia::render('Athletes/Show', [
            'athlete' => Inertia::defer(fn () => $athlete),
            'performance' => Inertia::defer(fn () => $performance),
            'achievementHistory' => Inertia::defer(fn () => $achievementHistory),
            'latestReport' => Inertia::defer(fn () => $latestReport ? [
                'id' => $latestReport->id,
                'condition_percentage' => (int) $latestReport->condition_percentage,
                'stamina' => (int) $latestReport->stamina,
                'balance' => (int) $latestReport->balance,
                'speed' => (int) $latestReport->speed,
                'strength' => (int) $latestReport->strength,
                'agility' => (int) $latestReport->agility,
                'notes' => $latestReport->notes,
                'recorded_at' => optional($latestReport->recorded_at)->toDateString() ?? now()->toDateString(),
            ] : null),
        ]);
    }

    public function storeReport(Request $request, Athlete $athlete)
    {
        $this->ensureAthleteAccessible($athlete, auth()->user());

        if (! auth()->user()?->isSuperAdmin() && ! auth()->user()?->isSensei()) {
            abort(403);
        }

        $validated = $request->validate([
            'condition_percentage' => 'required|integer|min:0|max:100',
            'stamina' => 'required|integer|min:0|max:100',
            'balance' => 'required|integer|min:0|max:100',
            'speed' => 'required|integer|min:0|max:100',
            'strength' => 'required|integer|min:0|max:100',
            'agility' => 'required|integer|min:0|max:100',
            'notes' => 'nullable|string|max:2000',
            'recorded_at' => 'required|date',
        ]);

        AthleteReport::create([
            ...$validated,
            'athlete_id' => $athlete->id,
            'evaluator_id' => auth()->id(),
        ]);

        return back()->with('success', 'Rapor kemampuan atlet berhasil disimpan.');
    }

    public function storeAchievement(Request $request, Athlete $athlete)
    {
        $this->ensureAthleteAccessible($athlete, auth()->user());

        $validated = $request->validate([
            'competition_name' => 'required|string|max:255',
            'competition_level' => 'required|string|max:255',
            'competition_type' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'result_title' => 'nullable|string|max:255',
            'competition_date' => 'required|date',
            'location' => 'nullable|string|max:255',
            'organizer' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:2000',
            'certificate' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        if ($request->hasFile('certificate')) {
            $validated['certificate_path'] = $request->file('certificate')->store('achievement-certificates', 'public');
        }

        unset($validated['certificate']);
        $athlete->achievements()->create($validated);

        return back()->with('success', 'Prestasi atlet berhasil ditambahkan.');
    }

    public function destroyAchievement(Athlete $athlete, AthleteAchievement $achievement)
    {
        $this->ensureAthleteAccessible($athlete, auth()->user());

        if ($achievement->athlete_id !== $athlete->id) {
            abort(404);
        }

        if ($achievement->certificate_path && Storage::disk('public')->exists($achievement->certificate_path)) {
            Storage::disk('public')->delete($achievement->certificate_path);
        }

        $achievement->delete();

        return back()->with('success', 'Data prestasi berhasil dihapus.');
    }

    private function generateAthleteCode(): string
    {
        $sequence = (int) Athlete::max('id') + 1;
        $code = 'ATH' . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);

        while (Athlete::where('athlete_code', $code)->exists()) {
            $sequence++;
            $code = 'ATH' . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
        }

        return $code;
    }

    private function resolveHealthStatus(?float $bmi): string
    {
        if (!$bmi) {
            return 'Pemulihan';
        }

        if ($bmi >= 18.5 && $bmi <= 24.9) {
            return 'Prima';
        }

        if ($bmi > 24.9) {
            return 'Kelelahan';
        }

        return 'Pemulihan';
    }

    private function resolveBmiScore(?float $bmi): int
    {
        if (! $bmi) {
            return 0;
        }

        if ($bmi >= 18.5 && $bmi <= 24.9) {
            return 92;
        }

        if ($bmi < 18.5) {
            return (int) max(55, 82 - (18.5 - $bmi) * 6);
        }

        return (int) max(50, 82 - ($bmi - 24.9) * 4);
    }

    private function resolveConditionScore(?float $bmi, int $attendanceRate): int
    {
        $bmiScore = $this->resolveBmiScore($bmi);
        $conditionScore = (int) round((($bmiScore * 0.6) + ($attendanceRate * 0.4)));

        return max(0, min(100, $conditionScore));
    }

    private function resolveAbilityStatus(array $scores): string
    {
        if (empty($scores)) {
            return 'Belum Dinilai';
        }

        $average = (int) round(collect($scores)->avg());

        if ($average >= 85) {
            return 'Sangat Baik';
        }

        if ($average >= 70) {
            return 'Baik';
        }

        if ($average >= 55) {
            return 'Cukup';
        }

        return 'Perlu Pembinaan';
    }
}
