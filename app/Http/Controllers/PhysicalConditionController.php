<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\PhysicalMetric;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Carbon\Carbon;

class PhysicalConditionController extends Controller
{
    public function index()
    {
        return Inertia::render('PhysicalCondition/Index', [
            'athletes' => Athlete::with(['belt', 'physicalMetrics' => function($q) {
                $q->orderBy('recorded_at', 'asc');
            }])->get()->map(function($athlete) {
                $athlete->age = Carbon::parse($athlete->dob)->age;
                // Latest is still needed for quick display
                $athlete->latest_metrics = $athlete->physicalMetrics->last();
                return $athlete;
            })
        ]);
    }
}
