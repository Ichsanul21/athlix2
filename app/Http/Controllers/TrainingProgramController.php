<?php

namespace App\Http\Controllers;

use App\Models\TrainingProgram;
use Inertia\Inertia;
use Illuminate\Http\Request;

class TrainingProgramController extends Controller
{
    public function index()
    {
        $days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        $programs = TrainingProgram::all()->groupBy('day');
        
        $structuredPrograms = [];
        foreach($days as $day) {
            $structuredPrograms[$day] = $programs->get($day, collect())->map(function($p) {
                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'day' => $p->day,
                    'start_time' => substr($p->start_time, 0, 5),
                    'end_time' => substr($p->end_time, 0, 5),
                    'time' => substr($p->start_time, 0, 5) . ' - ' . substr($p->end_time, 0, 5),
                    'coach' => $p->coach_name,
                    'type' => $p->type,
                    'desc' => $p->description,
                ];
            });
        }

        return Inertia::render('TrainingPrograms/Index', [
            'weeklySchedule' => $structuredPrograms
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'day' => 'required|string',
            'start_time' => 'required',
            'end_time' => 'required',
            'coach_name' => 'required|string|max:255',
            'type' => 'required|string',
            'description' => 'nullable|string',
        ]);

        // Default to first dojo for now as we don't have dojo selection for training yet
        $validated['dojo_id'] = \App\Models\Dojo::first()->id;

        TrainingProgram::create($validated);

        return redirect()->back()->with('success', 'Program latihan berhasil ditambahkan.');
    }

    public function update(Request $request, TrainingProgram $trainingProgram)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'day' => 'required|string',
            'start_time' => 'required',
            'end_time' => 'required',
            'coach_name' => 'required|string|max:255',
            'type' => 'required|string',
            'description' => 'nullable|string',
        ]);

        $trainingProgram->update($validated);

        return redirect()->back()->with('success', 'Program latihan berhasil diperbarui.');
    }

    public function destroy(TrainingProgram $trainingProgram)
    {
        $trainingProgram->delete();

        return redirect()->back()->with('success', 'Program latihan berhasil dihapus.');
    }
}
