<?php

namespace App\Http\Controllers\Api\V1\Wellness;

use App\Http\Controllers\Api\V1\Wellness\Concerns\ResolvesAthleteContext;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\MedicalLog;
use App\Models\WellnessReadinessLog;
use App\Models\WellnessWorkloadSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    use ResolvesAthleteContext;

    public function show(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'athlete_id' => 'nullable|integer|exists:athletes,id',
        ]);

        $user = $request->user();
        $athlete = $this->resolveAthleteForRequest($user, isset($validated['athlete_id']) ? (int) $validated['athlete_id'] : null);
        $tenantId = $this->resolveTenantId($user, $athlete);

        $latestReadiness = WellnessReadinessLog::query()
            ->where('tenant_id', $tenantId)
            ->where('athlete_id', $athlete->id)
            ->latest('recorded_on')
            ->latest('id')
            ->first();

        $trend = WellnessReadinessLog::query()
            ->where('tenant_id', $tenantId)
            ->where('athlete_id', $athlete->id)
            ->whereDate('recorded_on', '>=', now()->subDays(6)->toDateString())
            ->orderBy('recorded_on')
            ->get(['recorded_on', 'readiness_percentage'])
            ->map(fn (WellnessReadinessLog $item) => [
                'date' => $item->recorded_on?->format('Y-m-d'),
                'readiness_percentage' => $item->readiness_percentage,
            ])
            ->values();

        $snapshot = WellnessWorkloadSnapshot::query()
            ->where('tenant_id', $tenantId)
            ->where('athlete_id', $athlete->id)
            ->latest('snapshot_date')
            ->latest('id')
            ->first();

        $latestMedicalLog = MedicalLog::query()
            ->where('tenant_id', $tenantId)
            ->where('athlete_id', $athlete->id)
            ->latest('incident_date')
            ->latest('id')
            ->first(['id', 'incident_date', 'clearance_status', 'diagnosis', 'review_date']);

        $attendanceStreak = $this->calculateAttendanceStreak($athlete->id);

        $latestReport = $athlete->latestReport()->first();
        $radar = [
            ['axis' => 'Kihon', 'value' => (int) ($latestReport?->stamina ?? 0)],
            ['axis' => 'Kata', 'value' => (int) ($latestReport?->balance ?? 0)],
            ['axis' => 'Kumite', 'value' => (int) ($latestReport?->speed ?? 0)],
        ];

        return response()->json([
            'athlete' => [
                'id' => $athlete->id,
                'name' => $athlete->full_name,
                'athlete_code' => $athlete->athlete_code,
            ],
            'readiness' => [
                'latest' => $latestReadiness,
                'trend_7d' => $trend,
            ],
            'workload' => $snapshot,
            'attendance' => [
                'streak' => $attendanceStreak,
            ],
            'skill_radar' => $radar,
            'medical_clearance' => $latestMedicalLog,
        ]);
    }

    private function calculateAttendanceStreak(int $athleteId): int
    {
        $dates = Attendance::query()
            ->where('athlete_id', $athleteId)
            ->where('status', 'present')
            ->orderByDesc('recorded_at')
            ->pluck('recorded_at')
            ->map(fn ($value) => Carbon::parse($value)->toDateString())
            ->unique()
            ->values();

        if ($dates->isEmpty()) {
            return 0;
        }

        $expected = Carbon::parse($dates->first())->startOfDay();
        $streak = 0;

        foreach ($dates as $date) {
            $current = Carbon::parse($date)->startOfDay();
            if (! $current->equalTo($expected)) {
                break;
            }

            $streak++;
            $expected->subDay();
        }

        return $streak;
    }
}
