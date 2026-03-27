<?php

namespace Database\Seeders;

use App\Models\Athlete;
use App\Models\Attendance;
use App\Models\TrainingProgram;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AttendanceDomainSeeder extends Seeder
{
    public function run(): void
    {
        $athletes = Athlete::query()->orderBy('id')->get();
        $programsByDojo = TrainingProgram::query()
            ->orderBy('id')
            ->get()
            ->groupBy('dojo_id');

        foreach ($athletes as $athleteIndex => $athlete) {
            $dojoPrograms = $programsByDojo->get($athlete->dojo_id, collect())->groupBy('day');
            foreach (range(1, 21) as $daysAgo) {
                $date = Carbon::today()->subDays($daysAgo);
                $dayName = $this->indoDayName($date);
                $programs = $dojoPrograms->get($dayName, collect());
                if ($programs->isEmpty()) {
                    continue;
                }

                foreach ($programs as $program) {
                    $roll = (($athlete->id * 13) + ($program->id * 5) + ($date->day * 3)) % 100;
                    $status = match (true) {
                        $roll < 72 => 'present',
                        $roll < 84 => 'excused',
                        $roll < 94 => 'sick',
                        default => 'absent',
                    };

                    $sessionStart = Carbon::parse($date->toDateString() . ' ' . $program->start_time);
                    $sessionEnd = Carbon::parse($date->toDateString() . ' ' . $program->end_time);

                    $checkInAt = null;
                    $checkOutAt = null;
                    $checkInMood = null;
                    $checkInFeedback = null;
                    $athleteMood = null;
                    $athleteFeedback = null;
                    $moodRating = null;
                    $loadRating = null;
                    $submittedAt = null;
                    $senseiFeedback = null;
                    $senseiMood = null;
                    $absenceReason = null;
                    $absenceDocPath = null;
                    $absenceDocMime = null;

                    if ($status === 'present') {
                        $checkInAt = $sessionStart->copy()->subMinutes(10 - ($roll % 4));
                        if ($daysAgo > 1 || $roll % 8 !== 0) {
                            $checkOutAt = $sessionEnd->copy()->addMinutes($roll % 7);
                            $moodRating = 6 + ($roll % 5);
                            $loadRating = 5 + (($roll + 2) % 5);
                            $submittedAt = $checkOutAt->copy()->addMinutes(5);
                            $athleteMood = "Mood {$moodRating}/10";
                            $athleteFeedback = "Penilaian beban latihan {$loadRating}/10";
                            if ($roll % 3 === 0) {
                                $senseiFeedback = 'Evaluasi seed: fokus timing serang dan transisi guard.';
                                $senseiMood = ['normal', 'semangat', 'lelah'][($roll % 3)];
                            }
                        }

                        $checkInMood = ['semangat', 'normal', 'lelah', 'drop'][$roll % 4];
                        $checkInFeedback = 'Catatan check-in seed: kondisi awal terkendali.';
                    } elseif (in_array($status, ['sick', 'excused'], true)) {
                        $absenceReason = $status === 'sick'
                            ? 'Surat dokter seed: butuh recovery 1-2 hari.'
                            : 'Izin seed: kegiatan sekolah/keluarga.';
                        $absenceDocPath = SeedAssetsSeeder::ABSENCE_DOCUMENT;
                        $absenceDocMime = 'application/pdf';
                    }

                    Attendance::query()->create([
                        'athlete_id' => $athlete->id,
                        'status' => $status,
                        'recorded_at' => $date->copy()->setTime(0, 0, 0)->format('Y-m-d H:i:s'),
                        'check_in_at' => $checkInAt?->format('Y-m-d H:i:s'),
                        'check_out_at' => $checkOutAt?->format('Y-m-d H:i:s'),
                        'check_in_feedback' => $checkInFeedback,
                        'check_in_mood' => $checkInMood,
                        'athlete_feedback' => $athleteFeedback,
                        'athlete_mood' => $athleteMood,
                        'post_training_mood_rating' => $moodRating,
                        'post_training_load_rating' => $loadRating,
                        'post_training_submitted_at' => $submittedAt?->format('Y-m-d H:i:s'),
                        'sensei_feedback' => $senseiFeedback,
                        'sensei_mood_assessment' => $senseiMood,
                        'absence_reason' => $absenceReason,
                        'absence_document_path' => $absenceDocPath,
                        'absence_document_mime' => $absenceDocMime,
                    ]);
                }
            }
        }
    }

    private function indoDayName(Carbon $date): string
    {
        return match ($date->englishDayOfWeek) {
            'Monday' => 'Senin',
            'Tuesday' => 'Selasa',
            'Wednesday' => 'Rabu',
            'Thursday' => 'Kamis',
            'Friday' => 'Jumat',
            'Saturday' => 'Sabtu',
            'Sunday' => 'Minggu',
            default => 'Senin',
        };
    }
}
