<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\AthleteAchievement;
use App\Models\AthleteGuardian;
use App\Models\AthleteReport;
use App\Models\Belt;
use App\Models\Dojo;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
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
                $athlete->photo_url = $athlete->photo_path ? Storage::url($athlete->photo_path) : null;
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
            'phone_number' => 'required|string|max:20',
            'gender' => 'required|in:M,F',
            'specialization' => 'required|in:kata,kumite,both',
            'latest_height' => 'nullable|numeric|min:50|max:260',
            'latest_weight' => 'nullable|numeric',
            'class_note' => 'nullable|string|max:255',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'doc_kk' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'doc_akte' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'doc_ktp' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'parent_name' => 'required|string|max:255',
            'parent_phone_number' => 'required|string|max:20',
            'parent_email' => 'nullable|email|max:255',
            'parent_relation_type' => 'nullable|string|max:50',
            'dojo_id' => $user?->isSuperAdmin() ? 'required|exists:dojos,id' : 'nullable',
        ]);

        if (! $request->hasFile('doc_kk') && ! $request->hasFile('doc_akte') && ! $request->hasFile('doc_ktp')) {
            throw ValidationException::withMessages([
                'doc_kk' => 'Minimal unggah satu dokumen identitas (KK/Akte/KTP).',
            ]);
        }

        $athletePhoneNumber = $this->normalizePhoneNumber((string) ($validated['phone_number'] ?? ''));
        $parentPhoneNumber = $this->normalizePhoneNumber((string) ($validated['parent_phone_number'] ?? ''));
        $parentEmail = isset($validated['parent_email']) && trim((string) $validated['parent_email']) !== ''
            ? Str::lower(trim((string) $validated['parent_email']))
            : null;

        if (! $this->isValidIndonesianPhone($athletePhoneNumber)) {
            throw ValidationException::withMessages([
                'phone_number' => 'No HP atlet harus diawali 08 dan hanya berisi angka.',
            ]);
        }

        if (! $this->isValidIndonesianPhone($parentPhoneNumber)) {
            throw ValidationException::withMessages([
                'parent_phone_number' => 'No HP orang tua harus diawali 08 dan hanya berisi angka.',
            ]);
        }

        if (Athlete::query()->where('phone_number', $athletePhoneNumber)->exists()) {
            throw ValidationException::withMessages([
                'phone_number' => 'No HP atlet sudah digunakan di database atlet.',
            ]);
        }

        if (User::query()->where('phone_number', $athletePhoneNumber)->exists()) {
            throw ValidationException::withMessages([
                'phone_number' => 'No HP atlet sudah terdaftar sebagai akun user.',
            ]);
        }

        $existingParent = User::query()
            ->where('phone_number', $parentPhoneNumber)
            ->when(
                $parentEmail,
                fn ($query) => $query->orWhereRaw('LOWER(email) = ?', [$parentEmail])
            )
            ->first();

        if ($existingParent && ! $existingParent->isParent()) {
            throw ValidationException::withMessages([
                'parent_phone_number' => 'No HP orang tua sudah digunakan oleh role akun lain.',
            ]);
        }

        if ($parentEmail) {
            $emailTakenByOtherRole = User::query()
                ->whereRaw('LOWER(email) = ?', [$parentEmail])
                ->when($existingParent, fn ($query) => $query->where('id', '!=', $existingParent->id))
                ->exists();

            if ($emailTakenByOtherRole) {
                throw ValidationException::withMessages([
                    'parent_email' => 'Email orang tua sudah digunakan akun lain.',
                ]);
            }
        }

        $validated['athlete_code'] = strtoupper($validated['athlete_code'] ?? $this->generateAthleteCode());
        $validated['phone_number'] = $athletePhoneNumber;
        if (! $user?->isSuperAdmin()) {
            if (! $user?->dojo_id) {
                return back()->with('error', 'Dojo belum terhubung ke akun ini.');
            }
            $validated['dojo_id'] = $user->dojo_id;
        }
        $validated['class_note'] = $validated['class_note'] ?: 'Umum';

        if ($request->hasFile('photo')) {
            $validated['photo_path'] = $request->file('photo')->store('athletes/photos', 'public');
        }
        if ($request->hasFile('doc_kk')) {
            $validated['doc_kk_path'] = $request->file('doc_kk')->store('athletes/documents', 'public');
        }
        if ($request->hasFile('doc_akte')) {
            $validated['doc_akte_path'] = $request->file('doc_akte')->store('athletes/documents', 'public');
        }
        if ($request->hasFile('doc_ktp')) {
            $validated['doc_ktp_path'] = $request->file('doc_ktp')->store('athletes/documents', 'public');
        }

        $parentName = trim((string) $validated['parent_name']);
        $parentRelationType = trim((string) ($validated['parent_relation_type'] ?? '')) ?: 'parent';
        unset(
            $validated['photo'],
            $validated['doc_kk'],
            $validated['doc_akte'],
            $validated['doc_ktp'],
            $validated['parent_name'],
            $validated['parent_phone_number'],
            $validated['parent_email'],
            $validated['parent_relation_type']
        );

        $athlete = Athlete::create($validated);

        $athleteLoginPassword = "password123";
        User::query()->create([
            'name' => $athlete->full_name,
            'email' => $this->generateUniqueUserEmail('athlete.' . Str::lower($athlete->athlete_code) . '@athlix.test'),
            'phone_number' => $athletePhoneNumber,
            'password' => Hash::make($athleteLoginPassword),
            'role' => 'atlet',
            'dojo_id' => $athlete->dojo_id,
            'athlete_id' => $athlete->id,
            'email_verified_at' => now(),
        ]);

        $parentWasCreated = false;
        if (! $existingParent) {
            $existingParent = User::query()->create([
                'name' => $parentName,
                'email' => $parentEmail ?: $this->generateUniqueUserEmail('parent.' . $parentPhoneNumber . '@athlix.test'),
                'phone_number' => $parentPhoneNumber,
                'password' => Hash::make($parentPhoneNumber),
                'role' => 'parent',
                'dojo_id' => $athlete->dojo_id,
                'email_verified_at' => now(),
            ]);
            $parentWasCreated = true;
        } else {
            $existingParent->update([
                'name' => $existingParent->name ?: $parentName,
                'dojo_id' => $existingParent->dojo_id ?: $athlete->dojo_id,
            ]);
        }

        AthleteGuardian::query()
            ->where('tenant_id', $athlete->dojo_id)
            ->where('athlete_id', $athlete->id)
            ->update(['is_primary' => false]);

        AthleteGuardian::query()->updateOrCreate(
            [
                'tenant_id' => $athlete->dojo_id,
                'athlete_id' => $athlete->id,
                'guardian_user_id' => $existingParent->id,
            ],
            [
                'relation_type' => $parentRelationType,
                'is_primary' => true,
                'emergency_contact' => true,
            ]
        );

        if ($user?->isSensei()) {
            $user->senseiAthletes()->syncWithoutDetaching([
                $athlete->id => [
                    'dojo_id' => $athlete->dojo_id,
                    'assigned_by' => $user->id,
                ],
            ]);
        }

        $successNotes = [
            'Athlete berhasil dibuat.',
            'Akun atlet otomatis dibuat (login no HP atlet, password: kode atlet).',
        ];

        if ($parentWasCreated) {
            $successNotes[] = 'Akun orang tua baru otomatis dibuat (login no HP orang tua, password: no HP orang tua).';
        } else {
            $successNotes[] = 'Akun orang tua yang sudah ada otomatis ditautkan ke atlet ini.';
        }

        return redirect()->route('athletes.index')->with('success', implode(' ', $successNotes));
    }

    public function show(Athlete $athlete)
    {
        $user = auth()->user();
        $this->ensureAthleteAccessible($athlete, $user);

        $athlete->load([
            'belt',
            'dojo',
            'achievements',
            'attendances',
            'guardians' => fn ($q) => $q->withPivot(['relation_type', 'is_primary', 'emergency_contact']),
            'physicalMetrics' => fn ($query) => $query->latest('recorded_at'),
            'reports' => fn ($query) => $query->latest('recorded_at')->latest('id'),
            'latestReport',
        ]);
        $athlete->primary_guardian = $athlete->guardians->firstWhere('pivot.is_primary', true);
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
        $athlete->photo_url = $athlete->photo_path ? Storage::url($athlete->photo_path) : null;
        $athlete->documents = [
            'kk' => $athlete->doc_kk_path ? Storage::url($athlete->doc_kk_path) : null,
            'akte' => $athlete->doc_akte_path ? Storage::url($athlete->doc_akte_path) : null,
            'ktp' => $athlete->doc_ktp_path ? Storage::url($athlete->doc_ktp_path) : null,
        ];

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
        $reportHistory = $athlete->reports
            ->sortByDesc('recorded_at')
            ->values()
            ->map(function (AthleteReport $report) {
                $recordedAt = optional($report->recorded_at);

                return [
                    'id' => $report->id,
                    'condition_percentage' => (int) $report->condition_percentage,
                    'stamina' => (int) $report->stamina,
                    'balance' => (int) $report->balance,
                    'speed' => (int) $report->speed,
                    'strength' => (int) $report->strength,
                    'agility' => (int) $report->agility,
                    'notes' => $report->notes,
                    'recorded_at' => $recordedAt?->toDateString(),
                    'recorded_label' => $recordedAt?->translatedFormat('d M Y') ?? '-',
                    'created_label' => optional($report->created_at)?->translatedFormat('d M Y H:i'),
                ];
            });

        $reportCategories = \App\Models\ReportCategory::where('dojo_id', $athlete->dojo_id)
            ->orWhereNull('dojo_id')
            ->with(['subCategories.tests'])
            ->orderBy('sort_order')
            ->get();

        $latestDynamicScores = is_array($latestReport?->dynamic_scores) ? $latestReport->dynamic_scores : json_decode($latestReport?->dynamic_scores ?? '{}', true) ?? [];

        // Build category-level scores from snapshot or fallback
        $categories = [];
        foreach ($reportCategories as $cat) {
            $catSnapshot = $latestDynamicScores['categories'][$cat->id] ?? null;
            $score = $catSnapshot['score'] ?? max(0, min(100, (int) round(($attendanceRate + $bmiScore) / 2)));
            $categories[] = ['label' => $cat->name, 'score' => (int) $score];
        }

        $performance = [
            'condition' => [
                ['label' => 'Kondisi Fisik', 'value' => (int) ($latestReport?->condition_percentage ?? $conditionScore)],
                ['label' => 'Gap', 'value' => 100 - (int) ($latestReport?->condition_percentage ?? $conditionScore)],
            ],
            'categories' => $categories,
            'ability_status' => $this->resolveAbilityStatus(collect($categories)->pluck('score')->all()),
            'bmi' => $bmi ? round($bmi, 1) : null,
        ];

        return Inertia::render('Athletes/Show', [
            'athlete' => Inertia::defer(fn () => $athlete),
            'performance' => Inertia::defer(fn () => $performance),
            'achievementHistory' => Inertia::defer(fn () => $achievementHistory),
            'reportHistory' => Inertia::defer(fn () => $reportHistory),
            'reportCategories' => Inertia::defer(fn () => $reportCategories),
            'belts' => \App\Models\Belt::orderBy('id')->get(['id', 'name']),
            'latestReport' => Inertia::defer(fn () => $latestReport ? [
                'id' => $latestReport->id,
                'condition_percentage' => (int) $latestReport->condition_percentage,
                'dynamic_scores' => $latestDynamicScores,
                'notes' => $latestReport->notes,
                'recorded_at' => optional($latestReport->recorded_at)?->toDateString() ?? now()->toDateString(),
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
            'test_values' => 'required|array',
            'test_values.*' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:2000',
            'recorded_at' => 'required|date',
        ]);

        // Load the full hierarchy for this dojo
        $categories = \App\Models\ReportCategory::where('dojo_id', $athlete->dojo_id)
            ->orWhereNull('dojo_id')
            ->with(['subCategories.tests'])
            ->orderBy('sort_order')
            ->get();

        // Build the full JSON snapshot with bottom-up score calculation
        $snapshot = ['categories' => [], 'sub_categories' => [], 'tests' => []];

        foreach ($categories as $cat) {
            $subScores = [];

            foreach ($cat->subCategories as $sub) {
                $testScores = [];

                foreach ($sub->tests as $test) {
                    $rawValue = (float) ($validated['test_values'][$test->id] ?? 0);
                    $scaledScore = $test->calculateScore($rawValue);

                    $snapshot['tests'][$test->id] = [
                        'test_id' => $test->id,
                        'test_name' => $test->name,
                        'sub_category_name' => $sub->name,
                        'category_name' => $cat->name,
                        'unit' => $test->unit,
                        'min_threshold' => $test->min_threshold,
                        'max_threshold' => $test->max_threshold,
                        'max_duration_seconds' => $test->max_duration_seconds,
                        'raw_value' => $rawValue,
                        'scaled_score' => $scaledScore,
                    ];

                    $testScores[] = $scaledScore;
                }

                $subAvg = count($testScores) > 0 ? (int) round(array_sum($testScores) / count($testScores)) : 0;
                $snapshot['sub_categories'][$sub->id] = [
                    'sub_category_id' => $sub->id,
                    'name' => $sub->name,
                    'category_name' => $cat->name,
                    'score' => $subAvg,
                    'test_count' => count($testScores),
                ];

                $subScores[] = $subAvg;
            }

            $catAvg = count($subScores) > 0 ? (int) round(array_sum($subScores) / count($subScores)) : 0;
            $snapshot['categories'][$cat->id] = [
                'category_id' => $cat->id,
                'name' => $cat->name,
                'score' => $catAvg,
                'sub_category_count' => count($subScores),
            ];
        }

        \App\Models\AthleteReport::create([
            'condition_percentage' => $validated['condition_percentage'],
            'notes' => $validated['notes'] ?? null,
            'recorded_at' => $validated['recorded_at'],
            'dynamic_scores' => $snapshot,
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

    public function destroyAchievement(Athlete $athlete, $achievementId)
    {
        $this->ensureAthleteAccessible($athlete, auth()->user());
        $athlete->achievements()->findOrFail($achievementId)->delete();

        return back()->with('success', 'Prestasi atlet berhasil dihapus.');
    }

    // â”€â”€ Report Hierarchy CRUD (Sensei manages categories, sub-categories, tests) â”€â”€

    public function storeReportCategory(Request $request)
    {
        $user = auth()->user();
        if (! $user?->isSuperAdmin() && ! $user?->isSensei() && ! $user?->isDojoAdmin()) abort(403);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'dojo_id' => 'required|integer|exists:dojos,id',
        ]);

        $cat = \App\Models\ReportCategory::create($validated);

        return back()->with('success', "Kategori \"{$cat->name}\" berhasil ditambahkan.");
    }

    public function updateReportCategory(Request $request, \App\Models\ReportCategory $reportCategory)
    {
        $user = auth()->user();
        if (! $user?->isSuperAdmin() && ! $user?->isSensei() && ! $user?->isDojoAdmin()) abort(403);

        $validated = $request->validate(['name' => 'required|string|max:100']);
        $reportCategory->update($validated);

        return back()->with('success', "Kategori \"{$validated['name']}\" berhasil diperbarui.");
    }

    public function destroyReportCategory(\App\Models\ReportCategory $reportCategory)
    {
        $user = auth()->user();
        if (! $user?->isSuperAdmin() && ! $user?->isSensei() && ! $user?->isDojoAdmin()) abort(403);

        $name = $reportCategory->name;
        $reportCategory->delete();

        return back()->with('success', "Kategori \"{$name}\" berhasil dihapus.");
    }

    public function storeReportSubCategory(Request $request)
    {
        $user = auth()->user();
        if (! $user?->isSuperAdmin() && ! $user?->isSensei() && ! $user?->isDojoAdmin()) abort(403);

        $validated = $request->validate([
            'report_category_id' => 'required|integer|exists:report_categories,id',
            'name' => 'required|string|max:100',
        ]);

        \App\Models\ReportSubCategory::create($validated);

        return back()->with('success', "Sub-kategori \"{$validated['name']}\" berhasil ditambahkan.");
    }

    public function updateReportSubCategory(Request $request, \App\Models\ReportSubCategory $reportSubCategory)
    {
        $user = auth()->user();
        if (! $user?->isSuperAdmin() && ! $user?->isSensei() && ! $user?->isDojoAdmin()) abort(403);

        $validated = $request->validate(['name' => 'required|string|max:100']);
        $reportSubCategory->update($validated);

        return back()->with('success', "Sub-kategori \"{$validated['name']}\" berhasil diperbarui.");
    }

    public function destroyReportSubCategory(\App\Models\ReportSubCategory $reportSubCategory)
    {
        $user = auth()->user();
        if (! $user?->isSuperAdmin() && ! $user?->isSensei() && ! $user?->isDojoAdmin()) abort(403);

        $name = $reportSubCategory->name;
        $reportSubCategory->delete();

        return back()->with('success', "Sub-kategori \"{$name}\" berhasil dihapus.");
    }

    public function storeReportTest(Request $request)
    {
        $user = auth()->user();
        if (! $user?->isSuperAdmin() && ! $user?->isSensei() && ! $user?->isDojoAdmin()) abort(403);

        $validated = $request->validate([
            'report_sub_category_id' => 'required|integer|exists:report_sub_categories,id',
            'name' => 'required|string|max:100',
            'unit' => 'required|in:duration,repetition',
            'min_threshold' => 'required|numeric|min:0',
            'max_threshold' => 'required|numeric|min:0',
            'max_duration_seconds' => 'nullable|integer|min:0',
        ]);

        \App\Models\ReportTest::create($validated);

        return back()->with('success', "Test \"{$validated['name']}\" berhasil ditambahkan.");
    }

    public function updateReportTest(Request $request, \App\Models\ReportTest $reportTest)
    {
        $user = auth()->user();
        if (! $user?->isSuperAdmin() && ! $user?->isSensei() && ! $user?->isDojoAdmin()) abort(403);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'unit' => 'required|in:duration,repetition',
            'min_threshold' => 'required|numeric|min:0',
            'max_threshold' => 'required|numeric|min:0',
            'max_duration_seconds' => 'nullable|integer|min:0',
        ]);

        $reportTest->update($validated);

        return back()->with('success', "Test \"{$validated['name']}\" berhasil diperbarui.");
    }

    public function destroyReportTest(\App\Models\ReportTest $reportTest)
    {
        $user = auth()->user();
        if (! $user?->isSuperAdmin() && ! $user?->isSensei() && ! $user?->isDojoAdmin()) abort(403);

        $name = $reportTest->name;
        $reportTest->delete();

        return back()->with('success', "Test \"{$name}\" berhasil dihapus.");
    }

    // â”€â”€ Helper methods â”€â”€

    protected function ensureAthleteAccessible(Athlete $athlete, $user): void
    {
        if ($user?->isSuperAdmin()) return;
        if ($user?->isSensei() && (int) $athlete->dojo_id === (int) $user->dojo_id) return;
        if ($user?->isDojoAdmin() && (int) $athlete->dojo_id === (int) $user->dojo_id) return;
        abort(403);
    }

    private function resolveBmiScore(?float $bmi): int
    {
        if (! $bmi) return 0;
        if ($bmi >= 18.5 && $bmi <= 24.9) return 92;
        if ($bmi < 18.5) return (int) max(55, 82 - (18.5 - $bmi) * 6);
        return (int) max(50, 82 - ($bmi - 24.9) * 4);
    }

    private function resolveConditionScore(?float $bmi, float $attendanceRate): int
    {
        $bmiScore = $this->resolveBmiScore($bmi);
        return max(0, min(100, (int) round(($bmiScore * 0.6) + ($attendanceRate * 0.4))));
    }

    private function resolveAbilityStatus(array $scores): string
    {
        if (empty($scores)) return 'Belum Dinilai';

        $average = (int) round(collect($scores)->avg());

        if ($average >= 85) return 'Sangat Baik';
        if ($average >= 70) return 'Baik';
        if ($average >= 55) return 'Cukup';
        return 'Perlu Pembinaan';
    }

    public function update(Request $request, Athlete $athlete)
    {
        $user = auth()->user();
        $this->ensureAthleteAccessible($athlete, $user);

        $validated = $request->validate([
            'full_name'              => 'required|string|max:255',
            'current_belt_id'        => 'required|exists:belts,id',
            'dob'                    => 'required|date',
            'birth_place'            => 'nullable|string|max:255',
            'phone_number'           => 'required|string|max:20',
            'gender'                 => 'required|in:M,F',
            'specialization'         => 'required|in:kata,kumite,both',
            'latest_height'          => 'nullable|numeric|min:50|max:260',
            'latest_weight'          => 'nullable|numeric',
            'class_note'             => 'nullable|string|max:255',
            'photo'                  => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
            'doc_kk'                 => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'doc_akte'               => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'doc_ktp'                => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
            'parent_name'            => 'nullable|string|max:255',
            'parent_phone_number'    => 'nullable|string|max:20',
            'parent_email'           => 'nullable|email|max:255',
            'parent_relation_type'   => 'nullable|string|max:50',
        ]);

        $athletePhone = $this->normalizePhoneNumber((string) ($validated['phone_number'] ?? ''));

        if (! $this->isValidIndonesianPhone($athletePhone)) {
            throw ValidationException::withMessages(['phone_number' => 'No HP atlet harus diawali 08 dan hanya berisi angka.']);
        }

        if (Athlete::where('phone_number', $athletePhone)->where('id', '!=', $athlete->id)->exists()) {
            throw ValidationException::withMessages(['phone_number' => 'No HP atlet sudah digunakan atlet lain.']);
        }

        $validated['phone_number'] = $athletePhone;
        $validated['class_note'] = $validated['class_note'] ?: 'Umum';

        if ($request->hasFile('photo')) {
            if ($athlete->photo_path) Storage::disk('public')->delete($athlete->photo_path);
            $validated['photo_path'] = $request->file('photo')->store('athletes/photos', 'public');
        }
        if ($request->hasFile('doc_kk')) {
            if ($athlete->doc_kk_path) Storage::disk('public')->delete($athlete->doc_kk_path);
            $validated['doc_kk_path'] = $request->file('doc_kk')->store('athletes/documents', 'public');
        }
        if ($request->hasFile('doc_akte')) {
            if ($athlete->doc_akte_path) Storage::disk('public')->delete($athlete->doc_akte_path);
            $validated['doc_akte_path'] = $request->file('doc_akte')->store('athletes/documents', 'public');
        }
        if ($request->hasFile('doc_ktp')) {
            if ($athlete->doc_ktp_path) Storage::disk('public')->delete($athlete->doc_ktp_path);
            $validated['doc_ktp_path'] = $request->file('doc_ktp')->store('athletes/documents', 'public');
        }

        $parentName = trim((string) ($validated['parent_name'] ?? ''));
        $parentRelationType = trim((string) ($validated['parent_relation_type'] ?? '')) ?: 'parent';
        $parentEmail = isset($validated['parent_email']) && trim((string) $validated['parent_email']) !== ''
            ? Str::lower(trim((string) $validated['parent_email']))
            : null;

        unset(
            $validated['photo'],
            $validated['doc_kk'],
            $validated['doc_akte'],
            $validated['doc_ktp'],
            $validated['parent_name'],
            $validated['parent_phone_number'],
            $validated['parent_email'],
            $validated['parent_relation_type']
        );

        $athlete->update($validated);

        $athleteUser = User::where('athlete_id', $athlete->id)->first();
        if ($athleteUser) {
            $athleteUser->update([
                'name'         => $athlete->full_name,
                'phone_number' => $athletePhone,
            ]);
        }

        if ($parentName) {
            $rawParentPhone = $this->normalizePhoneNumber((string) ($request->input('parent_phone_number', '') ?? ''));
            $primaryGuardian = $athlete->guardians()->wherePivot('is_primary', true)->first();

            if ($primaryGuardian) {
                $primaryGuardian->update([
                    'name' => $parentName ?: $primaryGuardian->name,
                ]);
                AthleteGuardian::where('athlete_id', $athlete->id)
                    ->where('guardian_user_id', $primaryGuardian->id)
                    ->update(['relation_type' => $parentRelationType]);
            }
        }

        return back()->with('success', 'Data atlet berhasil diperbarui.');
    }

    public function destroy(Athlete $athlete)
    {
        $user = auth()->user();
        $this->ensureAthleteAccessible($athlete, $user);

        foreach (['photo_path', 'doc_kk_path', 'doc_akte_path', 'doc_ktp_path'] as $field) {
            if ($athlete->$field) {
                Storage::disk('public')->delete($athlete->$field);
            }
        }

        User::where('athlete_id', $athlete->id)->delete();
        $athlete->delete();

        return redirect()->route('athletes.index')->with('success', 'Data atlet berhasil dihapus.');
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

    private function normalizePhoneNumber(string $phone): string
    {
        $digitsOnly = preg_replace('/[^0-9]/', '', $phone) ?? '';

        if (str_starts_with($digitsOnly, '62')) {
            return '0' . substr($digitsOnly, 2);
        }

        return $digitsOnly;
    }

    private function isValidIndonesianPhone(string $phone): bool
    {
        return (bool) preg_match('/^08[0-9]{8,13}$/', $phone);
    }

    private function generateUniqueUserEmail(string $seedEmail): string
    {
        $seedEmail = Str::lower(trim($seedEmail));
        $local = Str::before($seedEmail, '@');
        $domain = Str::after($seedEmail, '@');

        if ($local === '') $local = 'user';
        if ($domain === '' || ! str_contains($domain, '.')) $domain = 'athlix.test';

        $candidate = "{$local}@{$domain}";
        $suffix = 2;
        while (User::query()->whereRaw('LOWER(email) = ?', [Str::lower($candidate)])->exists()) {
            $candidate = "{$local}.{$suffix}@{$domain}";
            $suffix++;
        }

        return $candidate;
    }

    private function resolveHealthStatus(?float $bmi): string
    {
        if (!$bmi) return 'Pemulihan';
        if ($bmi >= 18.5 && $bmi <= 24.9) return 'Prima';
        if ($bmi > 24.9) return 'Kelelahan';
        return 'Pemulihan';
    }
}
