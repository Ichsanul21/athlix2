<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\Attendance;
use App\Models\Belt;
use Inertia\Inertia;
use Illuminate\Http\Request;
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
            'growthData' => $growthData,
            'attendanceData' => $attendanceData,
            'beltDistribution' => $beltDistribution,
        ]);
    }
}
