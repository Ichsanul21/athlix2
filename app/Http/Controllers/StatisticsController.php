<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\Attendance;
use App\Models\Belt;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StatisticsController extends Controller
{
    public function index()
    {
        // 1. Athlete Growth (Last 6 Months)
        $growthData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $count = Athlete::where('created_at', '<=', $month->endOfMonth())->count();
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
        $beltDistribution = Belt::withCount('athletes')->get()->map(function($belt) {
            return [
                'name' => $belt->name,
                'value' => $belt->athletes_count,
            ];
        });

        return Inertia::render('Statistics/Index', [
            'growthData' => Inertia::defer(fn () => $growthData),
            'attendanceData' => Inertia::defer(fn () => $attendanceData),
            'beltDistribution' => Inertia::defer(fn () => $beltDistribution),
            'athletes' => Inertia::defer(fn () => Athlete::select('id', 'full_name')->orderBy('full_name')->get()),
        ]);
    }

    public function ppaPreview(Request $request)
    {
        $validated = $request->validate([
            'scope' => 'required|in:dojo,athlete',
            'format' => 'required|in:pdf,excel',
            'athlete_id' => 'nullable|exists:athletes,id',
        ]);

        $query = Athlete::query()->with(['belt', 'dojo', 'physicalMetrics' => fn ($metricQuery) => $metricQuery->latest('recorded_at')]);
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
}
