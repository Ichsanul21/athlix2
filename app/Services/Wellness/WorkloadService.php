<?php

namespace App\Services\Wellness;

use App\Models\WellnessRpeLog;
use App\Models\WellnessWorkloadSnapshot;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class WorkloadService
{
    public function calculateSessionLoad(int $durationMinutes, int $rpeScore): float
    {
        return round($durationMinutes * $rpeScore, 2);
    }

    public function buildSnapshot(int $tenantId, int $athleteId, ?Carbon $snapshotDate = null): WellnessWorkloadSnapshot
    {
        $snapshotDate = $snapshotDate?->copy() ?? now();
        $date = $snapshotDate->toDateString();

        $acuteStart = $snapshotDate->copy()->subDays(6)->toDateString();
        $chronicStart = $snapshotDate->copy()->subDays(27)->toDateString();

        $acuteLoad = (float) WellnessRpeLog::query()
            ->where('tenant_id', $tenantId)
            ->where('athlete_id', $athleteId)
            ->whereBetween('session_date', [$acuteStart, $date])
            ->sum('session_load');

        $chronicRaw = (float) WellnessRpeLog::query()
            ->where('tenant_id', $tenantId)
            ->where('athlete_id', $athleteId)
            ->whereBetween('session_date', [$chronicStart, $date])
            ->sum('session_load');

        // 28-day load converted to weekly average.
        $chronicLoad = round($chronicRaw / 4, 2);
        $acwrRatio = $chronicLoad > 0 ? round($acuteLoad / $chronicLoad, 3) : null;

        $riskBand = $this->resolveRiskBand($acwrRatio);

        return DB::transaction(function () use ($tenantId, $athleteId, $date, $acuteLoad, $chronicLoad, $acwrRatio, $riskBand) {
            return WellnessWorkloadSnapshot::query()->updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'athlete_id' => $athleteId,
                    'snapshot_date' => $date,
                ],
                [
                    'acute_load' => round($acuteLoad, 2),
                    'chronic_load' => $chronicLoad,
                    'acwr_ratio' => $acwrRatio,
                    'risk_band' => $riskBand,
                    'calculated_at' => now(),
                ]
            );
        });
    }

    public function resolveRiskBand(?float $acwrRatio): string
    {
        if ($acwrRatio === null) {
            return 'low';
        }

        if ($acwrRatio < 0.8) {
            return 'low';
        }

        if ($acwrRatio <= 1.3) {
            return 'moderate';
        }

        if ($acwrRatio <= 1.5) {
            return 'high';
        }

        return 'very_high';
    }
}
