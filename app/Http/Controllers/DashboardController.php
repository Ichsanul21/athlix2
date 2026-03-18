<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\Dojo;
use App\Models\TrainingProgram;
use App\Models\FinanceRecord;
use Inertia\Inertia;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $dojo = Dojo::first();
        $totalAthletes = Athlete::count();
        
        // Real stats from DB
        $unpaidCount = FinanceRecord::where('status', 'unpaid')->count();
        
        $dayMap = [
            'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu'
        ];
        $todayIndo = $dayMap[now()->englishDayOfWeek] ?? 'Senin';
        $todayTrainingCount = TrainingProgram::where('day', $todayIndo)->count();
        
        // Atlet Pantauan = those with high BMI or very low heart rate as a mock logic
        $atletPantauan = Athlete::whereHas('physicalMetrics', function($q) {
            $q->where('bmi', '>', 25)->orWhere('heart_rate', '<', 60);
        })->count();

        $stats = [
            ['title' => 'Total Atlet Aktif', 'value' => (string)$totalAthletes, 'icon' => 'users'],
            ['title' => 'Sesi Latihan', 'value' => (string)$todayTrainingCount, 'icon' => 'dumbbell'],
            ['title' => 'Atlet Pantauan', 'value' => (string)$atletPantauan, 'icon' => 'activity'],
            ['title' => 'Tunggakan SPP', 'value' => (string)$unpaidCount, 'icon' => 'credit-card'],
        ];

        $trainingPrograms = TrainingProgram::where('day', $todayIndo)->orderBy('start_time')->get()->map(function($p) {
            return [
                'title' => $p->title,
                'time' => substr($p->start_time, 0, 5) . ' - ' . substr($p->end_time, 0, 5),
                'desc' => $p->coach_name . ' • ' . ucfirst($p->type),
                'status' => 'Mulai Segera',
            ];
        });

        // Top Performers from Exams
        $topPerformers = Athlete::withCount('exams')
            ->orderBy('exams_count', 'desc')
            ->take(4)
            ->get()
            ->map(function($a) {
                return [
                    'name' => $a->full_name,
                    'category' => $a->specialization === 'both' ? 'Kata & Kumite' : ucfirst($a->specialization),
                    'score' => 85 + $a->exams_count // Mocking score based on exams
                ];
            });

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'trainingPrograms' => $trainingPrograms,
            'topPerformers' => $topPerformers,
            'dojoName' => $dojo->name ?? 'Dojo Utama',
        ]);
    }
}
