<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\AthleteAchievement;
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
            ]);

        $athleteQuery = $this->scopeAthletesForUser($athleteQuery, $user)
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
                $athlete->health_status = $this->resolveHealthStatus($latestMetric?->bmi);
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
        $bmiScore = 0;
        if ($bmi) {
            if ($bmi >= 18.5 && $bmi <= 24.9) {
                $bmiScore = 92;
            } elseif ($bmi < 18.5) {
                $bmiScore = max(55, 82 - (18.5 - $bmi) * 6);
            } else {
                $bmiScore = max(50, 82 - ($bmi - 24.9) * 4);
            }
        }

        $conditionScore = (int) round((($bmiScore * 0.6) + ($attendanceRate * 0.4)));
        $conditionScore = max(0, min(100, $conditionScore));

        $performance = [
            'condition' => [
                ['label' => 'Kondisi Ideal', 'value' => $conditionScore],
                ['label' => 'Perlu Perbaikan', 'value' => 100 - $conditionScore],
            ],
            'categories' => [
                ['label' => 'Stamina', 'score' => max(0, min(100, $attendanceRate))],
                ['label' => 'Keseimbangan', 'score' => max(0, min(100, $bmiScore))],
                ['label' => 'Kecepatan', 'score' => max(0, min(100, (int) round(($attendanceRate + $bmiScore) / 2)))],
                ['label' => 'Kekuatan', 'score' => max(0, min(100, (int) round(($attendanceRate * 0.4) + ($bmiScore * 0.6))))],
                ['label' => 'Kelincahan', 'score' => max(0, min(100, (int) round(($attendanceRate * 0.5) + ($bmiScore * 0.5))))],
            ],
        ];

        return Inertia::render('Athletes/Show', [
            'athlete' => Inertia::defer(fn () => $athlete),
            'performance' => Inertia::defer(fn () => $performance),
            'achievementHistory' => Inertia::defer(fn () => $achievementHistory),
        ]);
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
}
