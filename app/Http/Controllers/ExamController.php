<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    public function index()
    {
        // 1. Leaderboard Data
        $leaderboard = \App\Models\Athlete::with('belt')
            ->withCount(['exams as passed_exams' => function ($query) {
                $query->where('status', 'passed');
            }])
            ->get()
            ->map(function ($athlete) {
                // Mocking score based on belt order and passed exams
                $beltWeight = $athlete->belt ? $athlete->belt->id * 10 : 10; 
                $score = $beltWeight + ($athlete->passed_exams * 5);
                
                return [
                    'id' => $athlete->id,
                    'name' => $athlete->full_name,
                    'belt' => $athlete->belt ? $athlete->belt->name : 'Sabuk Putih',
                    'category' => $athlete->specialization === 'both' ? 'Kata & Kumite' : ucfirst($athlete->specialization),
                    'score' => $score,
                    'passed_exams' => $athlete->passed_exams,
                    'avatar_letter' => substr($athlete->full_name, 0, 1)
                ];
            })
            ->sortByDesc('score')
            ->values()
            ->map(function($item, $index) {
                $item['rank'] = $index + 1;
                return $item;
            });

        // 2. Exam History Data
        $exams = Exam::with(['athlete.belt', 'belt', 'fromBelt'])->latest()->get();
        $examHistory = $exams->map(function ($exam) {
            $fromBeltName = $exam->fromBelt ? $exam->fromBelt->name : ($exam->athlete && $exam->athlete->belt ? $exam->athlete->belt->name : '-');
            return [
                'id' => $exam->id,
                'date' => \Carbon\Carbon::parse($exam->exam_date)->format('d M Y'),
                'athlete_name' => $exam->athlete ? $exam->athlete->full_name : 'Unknown',
                'from_belt' => $fromBeltName,
                'to_belt' => $exam->belt ? $exam->belt->name : '-',
                'status' => $exam->status,
            ];
        });

        // 3. Stats Overview
        $totalExams = $exams->count();
        $completedExams = $exams->whereIn('status', ['passed', 'failed']);
        $totalCompleted = $completedExams->count();
        $passedExams = $completedExams->where('status', 'passed')->count();
        $examPassRate = $totalCompleted > 0 ? round(($passedExams / $totalCompleted) * 100) : 0;
        
        $upcomingExam = [
            'name' => 'Ujian Kenaikan Sabuk Semester Ganjil',
            'date' => \Carbon\Carbon::now()->addMonths(2)->format('d M Y')
        ];

        // 4. Pending Exams Data (for Grading Tab)
        $pendingExams = $exams->where('status', 'pending')->map(function ($exam) {
            return [
                'id' => $exam->id,
                'date' => \Carbon\Carbon::parse($exam->exam_date)->format('d M Y'),
                'athlete_name' => $exam->athlete ? $exam->athlete->full_name : 'Unknown',
                'current_belt' => $exam->athlete && $exam->athlete->belt ? $exam->athlete->belt->name : '-',
                'target_belt' => $exam->belt ? $exam->belt->name : '-',
            ];
        })->values();

        return Inertia::render('Exams/Index', [
            'leaderboard' => $leaderboard,
            'examHistory' => $examHistory->where('status', '!=', 'pending')->values(),
            'pendingExams' => $pendingExams,
            'totalExams' => $totalExams,
            'examPassRate' => $examPassRate,
            'upcomingExam' => $upcomingExam,
        ]);
    }

    public function massSchedule(Request $request)
    {
        $request->validate([
            'exam_date' => 'required|date',
            'exam_fee' => 'required|numeric'
        ]);

        $athletes = \App\Models\Athlete::with('belt')->get();
        $date = $request->exam_date;
        $fee = $request->exam_fee;

        foreach ($athletes as $athlete) {
            $currentBeltId = $athlete->current_belt_id;
            $currentBelt = $athlete->belt;
            $nextBelt = \App\Models\Belt::query()
                ->where('order_level', '>', $currentBelt ? $currentBelt->order_level : -1)
                ->orderBy('order_level')
                ->first();

            if ($nextBelt) {
                // Check if already scheduled for this date & belt
                $exists = Exam::where('athlete_id', $athlete->id)
                    ->where('belt_id', $nextBelt->id)
                    ->where('exam_date', $date)
                    ->where('status', 'pending')
                    ->exists();

                if (!$exists) {
                    Exam::create([
                        'athlete_id' => $athlete->id,
                        'belt_id' => $nextBelt->id,
                        'from_belt_id' => $currentBeltId,
                        'exam_date' => $date,
                        'status' => 'pending',
                        'location' => 'Dojo Utama',
                    ]);

                    // Generate Finance Record for Exam Fee
                    if ($fee > 0) {
                        \App\Models\FinanceRecord::create([
                            'athlete_id' => $athlete->id,
                            'description' => 'Biaya Ujian Promosi Sabuk',
                            'amount' => $fee,
                            'due_date' => $date,
                            'status' => 'unpaid',
                        ]);
                    }
                }
            }
        }

        return redirect()->back()->with('success', 'Jadwal Ujian Massal berhasil dibuat.');
    }

    public function grade(Request $request, Exam $exam)
    {
        $request->validate([
            'status' => 'required|in:passed,failed'
        ]);

        $exam->update([
            'status' => $request->status,
        ]);

        if ($request->status === 'passed') {
            // Update athlete's belt
            if ($exam->athlete) {
                $exam->athlete->update([
                    'current_belt_id' => $exam->belt_id
                ]);
            }
        }

        return redirect()->back()->with('success', 'Nilai ujian berhasil disimpan.');
    }

    public function bulkGrade(Request $request)
    {
        $validated = $request->validate([
            'grades' => 'required|array|min:1',
            'grades.*.id' => 'required|integer|exists:exams,id',
            'grades.*.status' => 'required|in:passed,failed',
        ]);

        $grades = collect($validated['grades']);

        DB::transaction(function () use ($grades) {
            $exams = Exam::with('athlete')->whereIn('id', $grades->pluck('id'))->get()->keyBy('id');

            foreach ($grades as $item) {
                $exam = $exams->get($item['id']);
                if (!$exam || $exam->status !== 'pending') {
                    continue;
                }

                if (!$exam->from_belt_id && $exam->athlete) {
                    $exam->from_belt_id = $exam->athlete->current_belt_id;
                }

                $exam->status = $item['status'];
                $exam->save();

                if ($item['status'] === 'passed' && $exam->athlete) {
                    $exam->athlete->update([
                        'current_belt_id' => $exam->belt_id
                    ]);
                }
            }
        });

        return redirect()->back()->with('success', 'Penilaian ujian berhasil disimpan.');
    }
}
