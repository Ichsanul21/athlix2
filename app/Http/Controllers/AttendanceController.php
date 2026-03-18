<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Athlete;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index()
    {
        return Inertia::render('Attendance/Index', [
            'attendances' => Attendance::with('athlete.belt')->latest()->get()
        ]);
    }

    public function scan()
    {
        return Inertia::render('Attendance/Scan');
    }

    public function store(Request $request)
    {
        $request->validate([
            'athlete_code' => 'required|string',
        ]);

        $athlete = Athlete::where('athlete_code', $request->athlete_code)->first();

        if (!$athlete) {
            return back()->with('error', 'Athlete not found.');
        }

        Attendance::create([
            'athlete_id' => $athlete->id,
            'status' => 'present',
            'recorded_at' => now(),
        ]);

        return back()->with('success', 'Attendance recorded for ' . $athlete->full_name);
    }
}
