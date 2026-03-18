<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\Belt;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AthleteController extends Controller
{
    public function index()
    {
        $athletes = Athlete::with('belt')->get()->map(function($athlete) {
            $athlete->age = \Carbon\Carbon::parse($athlete->dob)->age;
            $athlete->health_status = collect(['Prima', 'Pemulihan', 'Kelelahan', 'Cedera'])->random();
            $athlete->category = $athlete->specialization === 'kata' ? 'Kata Perorangan Putra' : 'Kumite -67kg Putra';
            return $athlete;
        });

        return Inertia::render('Athletes/Index', [
            'athletes' => $athletes
        ]);
    }

    public function create()
    {
        return Inertia::render('Athletes/Create', [
            'belts' => Belt::all()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'athlete_code' => 'required|string|unique:athletes,athlete_code',
            'current_belt_id' => 'required|exists:belts,id',
            'dob' => 'required|date',
            'gender' => 'required|in:M,F',
            'specialization' => 'required|in:kata,kumite,both',
            'latest_weight' => 'nullable|numeric',
        ]);

        $validated['dojo_id'] = auth()->user()->dojo_id;

        Athlete::create($validated);

        return redirect()->route('athletes.index')->with('success', 'Athlete created successfully.');
    }

    public function show(Athlete $athlete)
    {
        $athlete->load(['belt', 'dojo']);
        $athlete->age = \Carbon\Carbon::parse($athlete->dob)->age;
        
        // Mock Performance Data for Charts
        $performance = [
            'condition' => [
                ['name' => 'Condition Athlet', 'value' => 79, 'fill' => '#DC2626'],
                ['name' => 'Kekurangan Athlet', 'value' => 21, 'fill' => '#404040'],
            ],
            'categories' => [
                ['subject' => 'POWER', 'A' => 80, 'fullMark' => 100],
                ['subject' => 'STRENGTH', 'A' => 88, 'fullMark' => 100],
                ['subject' => 'ENDURANCE', 'A' => 95, 'fullMark' => 100],
                ['subject' => 'SPEED', 'A' => 60, 'fullMark' => 100],
                ['subject' => 'AGILITY', 'A' => 75, 'fullMark' => 100],
                ['subject' => 'CORE', 'A' => 85, 'fullMark' => 100],
                ['subject' => 'FLEXIBILITY', 'A' => 70, 'fullMark' => 100],
            ],
            'detailed' => [
                ['name' => 'FLEXIBILITY', 'presentase' => 70, 'target' => 30],
                ['name' => 'CORE', 'presentase' => 70, 'target' => 30],
                ['name' => 'AGILITY', 'presentase' => 60, 'target' => 40],
                ['name' => 'SPEED', 'presentase' => 50, 'target' => 50],
                ['name' => 'ENDURANCE + SPEED', 'presentase' => 60, 'target' => 40],
                ['name' => 'ENDURANCE (Mid)', 'presentase' => 100, 'target' => 0],
                ['name' => 'POWER (Lw)', 'presentase' => 80, 'target' => 20],
            ]
        ];

        return Inertia::render('Athletes/Show', [
            'athlete' => $athlete,
            'performance' => $performance
        ]);
    }
}
