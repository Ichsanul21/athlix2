<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\Attendance;
use App\Models\Belt;
use App\Models\Dojo;
use App\Models\PhysicalMetric;
use App\Models\TrainingProgram;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class StatisticsController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $requestedDojoId = request('dojo_id') ? (int) request('dojo_id') : null;
        $selectedDojoId = $this->resolveDojoId($user, $requestedDojoId);
        $isAllDojos = $user?->isSuperAdmin() && !$selectedDojoId;

        $athleteScope = $this->scopeAthletesForUser(Athlete::query(), $user);
        if ($selectedDojoId) {
            $athleteScope->where('dojo_id', $selectedDojoId);
        }
        $athleteIdSubquery = (clone $athleteScope)->select('id');

        // 1. Athlete Growth (Last 6 Months)
        $growthData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $count = (clone $athleteScope)->where('created_at', '<=', $month->endOfMonth())->count();
            $growthData[] = [
                'month' => $month->format('M'),
                'total' => $count
            ];
        }

        // 2. Attendance Stats (Last 30 Days)
        $attendanceData = Attendance::select(
                DB::raw('DATE(recorded_at) as date'),
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present")
            )
            ->whereIn('athlete_id', $athleteIdSubquery)
            ->where('recorded_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('d M'),
                    'present' => $item->present,
                    'absent' => $item->total - $item->present,
                ];
            });

        // 3. Belt Distribution
        $athleteBelts = (clone $athleteScope)->select('current_belt_id')->get();
        $beltDistribution = Belt::all()->map(function($belt) use ($athleteBelts) {
            return [
                'name' => $belt->name,
                'value' => $athleteBelts->where('current_belt_id', $belt->id)->count(),
            ];
        });

        $programBaseQuery = TrainingProgram::query()
            ->when($selectedDojoId, fn ($query) => $query->where('dojo_id', $selectedDojoId))
            ->when(! $selectedDojoId && ! $user?->isSuperAdmin(), fn ($query) => $query->where('dojo_id', $user?->dojo_id));

        $programByDayMap = (clone $programBaseQuery)
            ->select('day', DB::raw('COUNT(*) as total'))
            ->groupBy('day')
            ->pluck('total', 'day');
        $days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        $programByDay = collect($days)->map(function ($day) use ($programByDayMap) {
            return [
                'day' => $day,
                'total' => (int) ($programByDayMap[$day] ?? 0),
            ];
        });

        $programByType = (clone $programBaseQuery)
            ->select('type', DB::raw('COUNT(*) as total'))
            ->groupBy('type')
            ->orderByDesc('total')
            ->get()
            ->map(function ($row) {
                return [
                    'type' => $row->type,
                    'total' => (int) $row->total,
                ];
            });

        $totalPrograms = (int) $programByDay->sum('total');
        $activeDays = (int) $programByDay->filter(fn ($item) => $item['total'] > 0)->count();

        $latestReportIdSubquery = DB::table('athlete_reports')
            ->whereIn('athlete_id', $athleteIdSubquery)
            ->groupBy('athlete_id')
            ->selectRaw('MAX(id)');

        $latestConditions = DB::table('athlete_reports')
            ->whereIn('id', $latestReportIdSubquery)
            ->pluck('condition_percentage');

        $conditionThreshold = [
            'target_threshold' => 70,
            'critical_threshold' => 55,
            'avg_condition' => $latestConditions->isNotEmpty() ? (int) round($latestConditions->avg()) : 0,
            'below_target_count' => (int) $latestConditions->filter(fn ($value) => (int) $value < 70)->count(),
            'critical_count' => (int) $latestConditions->filter(fn ($value) => (int) $value < 55)->count(),
            'prima_count' => (int) $latestConditions->filter(fn ($value) => (int) $value >= 80)->count(),
            'non_prima_count' => (int) $latestConditions->filter(fn ($value) => (int) $value < 80)->count(),
        ];

        $trainingProgramAnalytics = [
            'summary' => [
                'total_programs' => $totalPrograms,
                'active_days' => $activeDays,
                'avg_per_day' => $activeDays > 0 ? round($totalPrograms / $activeDays, 1) : 0,
            ],
            'by_day' => $programByDay,
            'by_type' => $programByType,
        ];

        return Inertia::render('Statistics/Index', [
            'growthData' => Inertia::defer(fn () => $growthData),
            'attendanceData' => Inertia::defer(fn () => $attendanceData),
            'beltDistribution' => Inertia::defer(fn () => $beltDistribution),
            'trainingProgramAnalytics' => Inertia::defer(fn () => $trainingProgramAnalytics),
            'conditionThreshold' => Inertia::defer(fn () => $conditionThreshold),
            'athletes' => Inertia::defer(fn () => (clone $athleteScope)->select('id', 'full_name')->orderBy('full_name')->get()),
            'dojos' => Inertia::defer(fn () => $user?->isSuperAdmin() ? Dojo::orderBy('name')->get(['id', 'name']) : []),
            'selectedDojoId' => Inertia::defer(fn () => $selectedDojoId),
        ]);
    }

    public function ppaPreview(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'scope' => 'required|in:dojo,athlete',
            'format' => 'required|in:pdf,excel',
            'athlete_id' => 'nullable|exists:athletes,id',
            'dojo_id' => $user?->isSuperAdmin() ? 'nullable|exists:dojos,id' : 'nullable',
        ]);

        $selectedDojoId = $this->resolveDojoId($user, $validated['dojo_id'] ?? null);
        $query = $this->scopeAthletesForUser(
            Athlete::query()->with(['belt', 'dojo', 'physicalMetrics' => fn ($metricQuery) => $metricQuery->latest('recorded_at')]),
            $user
        );

        if ($selectedDojoId) {
            $query->where('dojo_id', $selectedDojoId);
        }

        if ($validated['scope'] === 'athlete') {
            $query->whereKey($validated['athlete_id']);
        }

        $rows = $query->get()->map(function ($athlete) {
            $metric = $athlete->physicalMetrics->first();

            return [
                'kode_atlet' => $athlete->athlete_code,
                'nama_atlet' => $athlete->full_name,
                'dojo' => $athlete->dojo?->name ?? '-',
                'sabuk' => $athlete->belt?->name ?? '-',
                'tinggi_cm' => $metric?->height ?? $athlete->latest_height,
                'berat_kg' => $metric?->weight ?? $athlete->latest_weight,
                'imt' => $metric?->bmi ?? '-',
            ];
        });

        if ($validated['format'] === 'excel') {
            return $this->streamPpaCsv($rows, $validated['scope']);
        }

        return $this->renderPpaHtml($rows, $validated['scope']);
    }

    private function streamPpaCsv(Collection $rows, string $scope)
    {
        $filename = 'ppa-preview-' . $scope . '-' . now()->format('Ymd-His') . '.csv';
        $headers = ['Content-Type' => 'text/csv; charset=UTF-8'];

        $callback = function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Kode Atlet', 'Nama Atlet', 'Dojo', 'Sabuk', 'Tinggi (cm)', 'Berat (kg)', 'IMT']);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['kode_atlet'],
                    $row['nama_atlet'],
                    $row['dojo'],
                    $row['sabuk'],
                    $row['tinggi_cm'],
                    $row['berat_kg'],
                    $row['imt'],
                ]);
            }

            fclose($handle);
        };

        return response()->streamDownload($callback, $filename, $headers);
    }

    private function renderPpaHtml(Collection $rows, string $scope)
    {
        $title = $scope === 'dojo' ? 'Preview PPA Dojo' : 'Preview PPA Atlet';
        $generatedAt = now()->translatedFormat('d F Y H:i');

        $tableRows = $rows->map(function ($row, $index) {
            return sprintf(
                '<tr><td>%d</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                $index + 1,
                e($row['kode_atlet']),
                e($row['nama_atlet']),
                e($row['dojo']),
                e($row['sabuk']),
                e((string) $row['tinggi_cm']),
                e((string) $row['berat_kg']),
                e((string) $row['imt'])
            );
        })->implode('');

        $html = <<<HTML
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{$title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
        h1 { margin-bottom: 4px; }
        p { margin-top: 0; color: #4b5563; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
        th { background: #f3f4f6; font-weight: 700; }
    </style>
</head>
<body>
    <h1>{$title}</h1>
    <p>Generated: {$generatedAt}</p>
    <table>
        <thead>
            <tr>
                <th>No</th><th>Kode Atlet</th><th>Nama Atlet</th><th>Dojo</th><th>Sabuk</th><th>Tinggi (cm)</th><th>Berat (kg)</th><th>IMT</th>
            </tr>
        </thead>
        <tbody>{$tableRows}</tbody>
    </table>
</body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=UTF-8');
    }

    public function importPpa(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'file' => 'nullable|file|mimes:csv,txt|max:10240',
            'rows' => 'nullable|array|min:2',
            'rows.*' => 'array',
            'source_file_name' => 'nullable|string|max:255',
            'dojo_id' => $user?->isSuperAdmin() ? 'nullable|exists:dojos,id' : 'nullable',
        ]);

        if (! $request->hasFile('file') && empty($validated['rows'] ?? [])) {
            throw ValidationException::withMessages([
                'file' => 'Pilih file PPA (CSV/XLS/XLSX) terlebih dahulu.',
            ]);
        }

        $selectedDojoId = $this->resolveDojoId($user, isset($validated['dojo_id']) ? (int) $validated['dojo_id'] : null);
        $allowedAthletesQuery = $this->scopeAthletesForUser(Athlete::query(), $user);
        if ($selectedDojoId) {
            $allowedAthletesQuery->where('dojo_id', $selectedDojoId);
        }

        $allowedAthletes = $allowedAthletesQuery
            ->get(['id', 'athlete_code'])
            ->keyBy(fn ($athlete) => strtoupper(str_replace('-', '', $athlete->athlete_code)));

        $imported = 0;
        $skipped = 0;
        $today = now()->toDateString();

        if (! empty($validated['rows'] ?? [])) {
            $rows = $validated['rows'];
            $headers = $rows[0] ?? [];
            $normalizedHeaders = collect($headers)
                ->map(fn ($header) => $this->normalizeCsvHeader((string) $header))
                ->values()
                ->all();

            foreach (array_slice($rows, 1) as $row) {
                if (! is_array($row)) {
                    $skipped++;
                    continue;
                }

                if (count($row) === 1 && trim((string) ($row[0] ?? '')) === '') {
                    continue;
                }

                $mapped = [];
                foreach ($normalizedHeaders as $index => $header) {
                    $mapped[$header] = $row[$index] ?? null;
                }

                if ($this->importPpaMappedRow($mapped, $allowedAthletes, $today)) {
                    $imported++;
                } else {
                    $skipped++;
                }
            }
        } else {
            $realPath = $validated['file']->getRealPath();
            $handle = fopen($realPath, 'r');
            if (! $handle) {
                throw ValidationException::withMessages([
                    'file' => 'File CSV tidak dapat dibaca.',
                ]);
            }

            $headers = fgetcsv($handle) ?: [];
            $normalizedHeaders = collect($headers)
                ->map(fn ($header) => $this->normalizeCsvHeader((string) $header))
                ->values()
                ->all();

            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) === 1 && trim((string) $row[0]) === '') {
                    continue;
                }

                $mapped = [];
                foreach ($normalizedHeaders as $index => $header) {
                    $mapped[$header] = $row[$index] ?? null;
                }

                if ($this->importPpaMappedRow($mapped, $allowedAthletes, $today)) {
                    $imported++;
                } else {
                    $skipped++;
                }
            }

            fclose($handle);
        }

        if ($imported === 0) {
            return back()->with('warning', 'Tidak ada data PPA yang berhasil diimpor. Periksa format file dan header.');
        }

        $message = 'Import PPA berhasil: ' . $imported . ' data masuk.';
        if ($skipped > 0) {
            $message .= ' ' . $skipped . ' baris dilewati.';
        }

        return back()->with('success', $message);
    }

    private function normalizeCsvHeader(string $header): string
    {
        $header = trim(strtolower($header));
        $header = str_replace([' ', '-', '/'], '_', $header);

        return preg_replace('/[^a-z0-9_]/', '', $header) ?: '';
    }

    private function importPpaMappedRow(array $mapped, Collection $allowedAthletes, string $today): bool
    {
        $athleteCodeRaw = (string) ($mapped['kode_atlet'] ?? $mapped['athlete_code'] ?? $mapped['kode'] ?? '');
        $athleteCode = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $athleteCodeRaw));
        if ($athleteCode === '' || ! isset($allowedAthletes[$athleteCode])) {
            return false;
        }

        $athlete = $allowedAthletes[$athleteCode];
        $height = $this->toNullableFloat($mapped['tinggi_cm'] ?? $mapped['tinggi'] ?? null);
        $weight = $this->toNullableFloat($mapped['berat_kg'] ?? $mapped['berat'] ?? null);
        $bmi = $this->toNullableFloat($mapped['imt'] ?? $mapped['bmi'] ?? null);

        if ($height === null && $weight === null && $bmi === null) {
            return false;
        }

        $computedBmi = $bmi;
        if ($computedBmi === null && $height && $weight && $height > 0) {
            $meter = $height / 100;
            $computedBmi = round($weight / ($meter * $meter), 2);
        }

        $athleteUpdates = [];
        if ($height !== null) {
            $athleteUpdates['latest_height'] = $height;
        }
        if ($weight !== null) {
            $athleteUpdates['latest_weight'] = $weight;
        }
        if (! empty($athleteUpdates)) {
            Athlete::query()->whereKey($athlete->id)->update($athleteUpdates);
        }

        PhysicalMetric::create([
            'athlete_id' => $athlete->id,
            'height' => $height,
            'weight' => $weight,
            'bmi' => $computedBmi,
            'recorded_at' => $today,
        ]);

        return true;
    }

    private function toNullableFloat($value): ?float
    {
        if ($value === null) {
            return null;
        }

        $normalized = str_replace(',', '.', trim((string) $value));
        if ($normalized === '' || ! is_numeric($normalized)) {
            return null;
        }

        return (float) $normalized;
    }
}
