<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\Dojo;
use Inertia\Inertia;
use Carbon\Carbon;

class PhysicalConditionController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $requestedDojoId = request('dojo_id') ? (int) request('dojo_id') : null;
        $selectedDojoId = $this->resolveDojoId($user, $requestedDojoId);
        $isAllDojos = $user?->isSuperAdmin() && !$selectedDojoId;

        $athleteQuery = $this->scopeAthletesForUser(Athlete::query(), $user);
        if ($selectedDojoId) {
            $athleteQuery->where('dojo_id', $selectedDojoId);
        }

        return Inertia::render('PhysicalCondition/Index', [
            'athletes' => Inertia::defer(fn () => $athleteQuery
                ->with(['belt', 'physicalMetrics' => function($q) {
                    $q->orderBy('recorded_at', 'asc');
                }])
                ->get()
                ->map(function($athlete) {
                    $athlete->age = Carbon::parse($athlete->dob)->age;
                    // Latest is still needed for quick display
                    $athlete->latest_metrics = $athlete->physicalMetrics->last();
                    $athlete->bmi_detail = $this->resolveBmiDetail($athlete->latest_metrics?->bmi);
                    return $athlete;
                })),
            'dojos'          => Inertia::defer(fn () => $user?->isSuperAdmin() ? Dojo::orderBy('name')->get(['id', 'name']) : []),
            'selectedDojoId' => Inertia::defer(fn () => $isAllDojos ? null : $selectedDojoId),
            'isAllDojos'     => Inertia::defer(fn () => $isAllDojos),
        ]);
    }

    private function resolveBmiDetail(?float $bmi): array
    {
        if (!$bmi) {
            return [
                'label' => 'Belum Ada Data',
                'note' => 'Tambahkan data tinggi dan berat untuk menghitung IMT.',
            ];
        }

        if ($bmi < 18.5) {
            return [
                'label' => 'Kurus',
                'note' => 'Fokus peningkatan asupan kalori dan latihan beban progresif.',
            ];
        }

        if ($bmi <= 24.9) {
            return [
                'label' => 'Ideal',
                'note' => 'Pertahankan pola latihan dan nutrisi yang konsisten.',
            ];
        }

        if ($bmi <= 29.9) {
            return [
                'label' => 'Berlebih',
                'note' => 'Tambahkan latihan kardio dan kontrol pola makan harian.',
            ];
        }

        return [
            'label' => 'Obesitas',
            'note' => 'Perlu pendampingan intensif pelatih dan evaluasi medis berkala.',
        ];
    }
}
