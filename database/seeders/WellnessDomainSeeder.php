<?php

namespace Database\Seeders;

use App\Models\Athlete;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\WellnessReadinessLog;
use App\Models\WellnessRpeLog;
use App\Models\WellnessWorkloadSnapshot;
use Illuminate\Database\Seeder;

class WellnessDomainSeeder extends Seeder
{
    public function run(): void
    {
        $athletes = Athlete::query()->orderBy('id')->get();
        $trainingProgramsByDojo = TrainingProgram::query()->orderBy('id')->get()->groupBy('dojo_id');
        $submittersByDojo = User::query()
            ->whereIn('role', ['sensei', 'head_coach', 'assistant'])
            ->orderBy('id')
            ->get()
            ->groupBy('dojo_id');

        foreach ($athletes as $index => $athlete) {
            $tenantId = (int) $athlete->dojo_id;
            $submitterId = $submittersByDojo->get($tenantId, collect())->first()?->id;
            $programId = $trainingProgramsByDojo->get($tenantId, collect())->first()?->id;

            foreach (range(0, 6) as $dayOffset) {
                $date = now()->subDays($dayOffset)->toDateString();
                $readiness = max(45, min(100, 62 + (($athlete->id * 3 + $dayOffset * 5) % 35)));

                WellnessReadinessLog::query()->create([
                    'tenant_id' => $tenantId,
                    'athlete_id' => $athlete->id,
                    'submitted_by' => $submitterId,
                    'recorded_on' => $date,
                    'hrv_score' => 48 + (($index + $dayOffset) % 16),
                    'sleep_hours' => 6 + (($index + $dayOffset) % 4) * 0.5,
                    'stress_level' => 3 + (($index + $dayOffset) % 6),
                    'muscle_soreness' => 2 + (($index + $dayOffset) % 6),
                    'resting_hr' => 56 + (($index + $dayOffset) % 14),
                    'menstrual_phase' => null,
                    'notes' => 'Wellness readiness seed entry.',
                    'readiness_percentage' => $readiness,
                    'sync_status' => 'synced',
                    'synced_at' => now()->subDays($dayOffset),
                ]);
            }

            foreach (range(0, 9) as $sessionIndex) {
                $sessionDate = now()->subDays($sessionIndex + 1)->toDateString();
                $duration = 45 + (($athlete->id + $sessionIndex) % 60);
                $rpe = 5 + (($athlete->id + $sessionIndex) % 5);
                $sessionLoad = $duration * $rpe;

                WellnessRpeLog::query()->create([
                    'tenant_id' => $tenantId,
                    'athlete_id' => $athlete->id,
                    'training_program_id' => $programId,
                    'submitted_by' => $submitterId,
                    'session_date' => $sessionDate,
                    'duration_minutes' => $duration,
                    'rpe_score' => $rpe,
                    'session_load' => $sessionLoad,
                    'notes' => 'RPE seed entry.',
                    'sync_status' => 'synced',
                    'synced_at' => now()->subDays($sessionIndex),
                ]);
            }

            foreach (range(0, 6) as $dayOffset) {
                $snapshotDate = now()->subDays($dayOffset)->toDateString();
                $acuteLoad = 350 + (($athlete->id * 11 + $dayOffset * 13) % 260);
                $chronicLoad = max(1, 420 + (($athlete->id * 7 + $dayOffset * 5) % 280));
                $acwr = round($acuteLoad / $chronicLoad, 3);
                $riskBand = match (true) {
                    $acwr < 0.8 => 'moderate',
                    $acwr <= 1.3 => 'low',
                    $acwr <= 1.5 => 'high',
                    default => 'very_high',
                };

                WellnessWorkloadSnapshot::query()->create([
                    'tenant_id' => $tenantId,
                    'athlete_id' => $athlete->id,
                    'snapshot_date' => $snapshotDate,
                    'acute_load' => $acuteLoad,
                    'chronic_load' => $chronicLoad,
                    'acwr_ratio' => $acwr,
                    'risk_band' => $riskBand,
                    'calculated_at' => now()->subDays($dayOffset),
                ]);
            }
        }
    }
}
