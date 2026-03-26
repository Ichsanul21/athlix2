<?php

namespace App\Services\Wellness;

class ReadinessScoreService
{
    public function calculate(
        ?float $hrvScore,
        ?float $sleepHours,
        ?int $stressLevel,
        ?int $muscleSoreness,
        ?int $restingHr = null
    ): int {
        $components = [];
        $weight = 0.0;

        if ($sleepHours !== null) {
            $components[] = $this->normalizeSleep($sleepHours) * 0.35;
            $weight += 0.35;
        }

        if ($stressLevel !== null) {
            $components[] = $this->normalizeInverseScale($stressLevel) * 0.25;
            $weight += 0.25;
        }

        if ($muscleSoreness !== null) {
            $components[] = $this->normalizeInverseScale($muscleSoreness) * 0.20;
            $weight += 0.20;
        }

        if ($hrvScore !== null) {
            $components[] = $this->normalizeHrv($hrvScore) * 0.20;
            $weight += 0.20;
        }

        if ($restingHr !== null) {
            $components[] = $this->normalizeRestingHr($restingHr) * 0.10;
            $weight += 0.10;
        }

        if ($weight <= 0) {
            return 0;
        }

        $weightedScore = array_sum($components) / $weight;

        return (int) round(max(0, min(100, $weightedScore)));
    }

    private function normalizeSleep(float $hours): float
    {
        $score = ($hours / 8.0) * 100;

        return max(0, min(100, $score));
    }

    private function normalizeHrv(float $hrv): float
    {
        // 20-120 ms mapped to 0-100.
        $score = (($hrv - 20) / 100) * 100;

        return max(0, min(100, $score));
    }

    private function normalizeInverseScale(int $value): float
    {
        // Input 1-10 where larger means worse.
        $score = ((10 - $value) / 9) * 100;

        return max(0, min(100, $score));
    }

    private function normalizeRestingHr(int $restingHr): float
    {
        // Best around 55 bpm, linearly decreasing toward 35/95.
        $distance = abs($restingHr - 55);
        $score = 100 - ($distance * 2.5);

        return max(0, min(100, $score));
    }
}
