<?php

namespace Database\Seeders;

use App\Models\Athlete;
use App\Models\AthleteHealthPreference;
use App\Models\Belt;
use App\Models\CoachSessionNote;
use App\Models\GradingAssessment;
use App\Models\MedicalLog;
use App\Models\MenstrualCycleLog;
use App\Models\StrengthConditioningMetric;
use App\Models\TrainingProgram;
use App\Models\User;
use Illuminate\Database\Seeder;

class SportsScienceDomainSeeder extends Seeder
{
    public function run(): void
    {
        $athletes = Athlete::query()->orderBy('id')->get();
        $blackBeltId = Belt::query()->where('order_level', 6)->value('id');

        $assessorByDojo = User::query()
            ->whereIn('role', ['head_coach', 'sensei', 'assistant'])
            ->orderBy('id')
            ->get()
            ->groupBy('dojo_id');
        $medicalByDojo = User::query()
            ->where('role', 'medical_staff')
            ->orderBy('id')
            ->get()
            ->keyBy('dojo_id');
        $programByDojo = TrainingProgram::query()->orderBy('id')->get()->groupBy('dojo_id');

        foreach ($athletes as $index => $athlete) {
            $tenantId = (int) $athlete->dojo_id;
            $assessor = $assessorByDojo->get($tenantId, collect())->first();
            $trainingProgramId = $programByDojo->get($tenantId, collect())->first()?->id;

            $finalScore = 62 + (($athlete->id * 5) % 35);
            $recommendation = match (true) {
                $finalScore >= 80 => 'pass',
                $finalScore >= 65 => 'remedial',
                default => 'hold',
            };

            GradingAssessment::query()->create([
                'tenant_id' => $tenantId,
                'athlete_id' => $athlete->id,
                'assessor_id' => $assessor?->id,
                'belt_target_id' => $blackBeltId,
                'assessed_at' => now()->subDays(14),
                'kihon_score' => max(50, min(100, $finalScore - 2)),
                'kata_score' => max(50, min(100, $finalScore - 1)),
                'kumite_score' => max(50, min(100, $finalScore - 3)),
                'final_score' => $finalScore,
                'recommendation' => $recommendation,
                'notes' => 'Seed grading assessment.',
            ]);

            CoachSessionNote::query()->create([
                'tenant_id' => $tenantId,
                'athlete_id' => $athlete->id,
                'sensei_id' => $assessor?->id,
                'training_program_id' => $trainingProgramId,
                'session_date' => now()->subDays(2)->toDateString(),
                'note_type' => 'performance',
                'title' => 'Evaluasi Latihan Harian',
                'note' => 'Seed note: kualitas footwork meningkat, perlu konsistensi timing counter.',
                'visibility' => 'athlete_visible',
            ]);

            if ($index % 4 === 0) {
                MedicalLog::query()->create([
                    'tenant_id' => $tenantId,
                    'athlete_id' => $athlete->id,
                    'medical_staff_id' => $medicalByDojo->get($tenantId)?->id,
                    'incident_date' => now()->subDays(10)->toDateString(),
                    'injury_area' => 'Ankle',
                    'diagnosis' => 'Mild sprain',
                    'rehab_protocol' => 'Mobility drill + compress + taping.',
                    'clearance_status' => $index % 8 === 0 ? 'modified_training' : 'fit_to_fight',
                    'review_date' => now()->addDays(5)->toDateString(),
                    'is_alert_sent' => true,
                    'note' => 'Seed medical log.',
                ]);
            }

            StrengthConditioningMetric::query()->create([
                'tenant_id' => $tenantId,
                'athlete_id' => $athlete->id,
                'recorded_by' => $assessor?->id,
                'recorded_on' => now()->subDays(6)->toDateString(),
                'one_rm_squat' => 45 + (($athlete->id * 2) % 40),
                'one_rm_bench_press' => 30 + (($athlete->id * 2) % 30),
                'vo2max' => 38 + (($athlete->id + $index) % 18),
                'agility_t_test' => 10 + (($athlete->id + $index) % 4) * 0.35,
                'countermovement_jump_cm' => 24 + (($athlete->id + $index) % 10),
                'notes' => 'Seed S&C metrics.',
            ]);

            $trackingEnabled = $athlete->gender === 'F' && ($athlete->id % 2 === 0);
            AthleteHealthPreference::query()->create([
                'tenant_id' => $tenantId,
                'athlete_id' => $athlete->id,
                'menstrual_tracking_enabled' => $trackingEnabled,
            ]);

            if ($trackingEnabled) {
                $phases = ['menstrual', 'follicular', 'ovulation'];
                foreach ($phases as $phaseIndex => $phase) {
                    MenstrualCycleLog::query()->create([
                        'tenant_id' => $tenantId,
                        'athlete_id' => $athlete->id,
                        'recorded_on' => now()->subDays($phaseIndex + 1)->toDateString(),
                        'phase' => $phase,
                        'symptoms' => json_encode(['cramp' => $phaseIndex === 0, 'fatigue' => $phaseIndex <= 1]),
                        'notes' => 'Seed menstrual cycle log.',
                    ]);
                }
            }
        }
    }
}
