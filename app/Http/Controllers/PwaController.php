<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\TrainingProgram;
use App\Models\FinanceRecord;
use App\Models\Athlete;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class PwaController extends Controller
{
    public function home()
    {
        $athlete = Athlete::with(['belt', 'dojo'])->first();
        
        $dayMap = [
            'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu'
        ];
        $todayIndo = $dayMap[Carbon::now()->englishDayOfWeek] ?? 'Senin';

        $upcomingExam = \App\Models\Exam::with('belt')
            ->where('athlete_id', $athlete->id)
            ->where('status', 'pending')
            ->orderBy('exam_date', 'asc')
            ->first();

        return Inertia::render('PwaHome/Index', [
            'athlete' => $athlete,
            'sessionsToday' => TrainingProgram::where('day', $todayIndo)->count(),
            'upcomingExam' => $upcomingExam ? [
                'date' => Carbon::parse($upcomingExam->exam_date)->translatedFormat('d F Y'),
                'target_belt' => $upcomingExam->belt->name
            ] : null,
        ]);
    }

    public function scan()
    {
        $athlete = Athlete::first(); // Assuming 1 athlete per user in prototype
        return Inertia::render('Scan/Index', ['athlete' => $athlete]);
    }

    public function schedule()
    {
        $today = Carbon::now()->isoFormat('dddd'); // e.g. "Monday" -> in Indonesian "Senin"
        // Mapping simple for demo
        $dayMap = [
            'Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu'
        ];
        $todayIndo = $dayMap[Carbon::now()->englishDayOfWeek] ?? 'Senin';

        return Inertia::render('Schedule/Index', [
            'todayPrograms' => TrainingProgram::where('day', $todayIndo)->get(),
            'allPrograms' => TrainingProgram::orderBy('start_time')->get()
        ]);
    }

    public function billing()
    {
        // For demo, we just show the user's athletes (if they are a parent/user)
        // Since we only have 1 user in seed, we'll just show some unpaid records
        return Inertia::render('Billing/Index', [
            'records' => FinanceRecord::with('athlete')->where('status', 'unpaid')->latest()->get()
        ]);
    }

    public function profile()
    {
        // Showing first athlete as "User Profile" for the PWA demo
        $athlete = Athlete::with(['belt', 'physicalMetrics', 'exams.belt', 'exams.fromBelt'])->first();
        return Inertia::render('UserRecord/Index', [
            'athlete' => $athlete
        ]);
    }

    public function personalInfo()
    {
        $athlete = Athlete::with(['belt', 'dojo'])->first();
        return Inertia::render('UserRecord/PersonalInfo', ['athlete' => $athlete]);
    }

    public function gradingHistory()
    {
        $athlete = Athlete::with(['belt', 'exams.belt', 'exams.fromBelt', 'dojo'])->first();
        return Inertia::render('UserRecord/GradingHistory', ['athlete' => $athlete]);
    }

    public function settings()
    {
        return Inertia::render('UserRecord/Settings');
    }
}
