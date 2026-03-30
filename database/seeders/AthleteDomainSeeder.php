<?php

namespace Database\Seeders;

use App\Models\Athlete;
use App\Models\AthleteAchievement;
use App\Models\AthleteGuardian;
use App\Models\AthleteReport;
use App\Models\Belt;
use App\Models\Dojo;
use App\Models\PhysicalMetric;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AthleteDomainSeeder extends Seeder
{
    public function run(): void
    {
        $dojos = Dojo::query()->orderBy('id')->get();
        $belts = Belt::query()->orderBy('order_level')->get()->keyBy('order_level');

        $dojos->each(function (Dojo $dojo, int $dojoIndex) use ($belts) {
            $this->seedDojoAthletes($dojo, $dojoIndex, $belts);
        });
    }

    private function seedDojoAthletes(Dojo $dojo, int $dojoIndex, $belts): void
    {
        $dojoPrefix = ['MKS', 'GOW', 'MRS', 'TKL', 'PKP'][$dojoIndex] ?? ('D' . str_pad((string) $dojo->id, 2, '0', STR_PAD_LEFT));
        $sensei = User::query()->where('dojo_id', $dojo->id)->where('role', 'sensei')->first();
        $assistant = User::query()->where('dojo_id', $dojo->id)->where('role', 'assistant')->first();
        $dojoAdmin = User::query()->where('dojo_id', $dojo->id)->where('role', 'dojo_admin')->first();
        $headCoach = User::query()->where('dojo_id', $dojo->id)->where('role', 'head_coach')->first();

        $athletes = collect();
        for ($i = 1; $i <= 8; $i++) {
            $globalIndex = ($dojoIndex * 8) + $i;
            $gender = $globalIndex % 2 === 0 ? 'F' : 'M';
            $age = 10 + (($globalIndex + 1) % 16);
            $dob = Carbon::now()->subYears($age)->setMonth((($globalIndex + 2) % 12) + 1)->setDay((($globalIndex * 3) % 27) + 1);
            $height = $this->resolveHeight($age, $gender, $globalIndex);
            $weight = $this->resolveWeight($age, $gender, $globalIndex);
            $beltOrder = min(6, max(1, (int) (1 + (($globalIndex + $dojoIndex) % 6))));
            $athleteCode = sprintf('ATH%s%03d', $dojoPrefix, $i);
            $phoneNumber = '08' . str_pad((string) (770000000 + $globalIndex), 9, '0', STR_PAD_LEFT);

            $docs = $this->resolveIdentityDocuments($globalIndex);

            $fullName = $this->resolveAthleteName($globalIndex, $gender);
            $emailSlug = $this->nameToEmailSlug($fullName, $globalIndex);

            $athlete = Athlete::query()->create([
                'dojo_id'          => $dojo->id,
                'current_belt_id'  => $belts[$beltOrder]?->id,
                'athlete_code'     => $athleteCode,
                'full_name'        => $fullName,
                'birth_place'      => $this->resolveBirthPlace($globalIndex),
                'phone_number'     => $phoneNumber,
                'photo_path'       => SeedAssetsSeeder::ATHLETE_PHOTO,
                'doc_kk_path'      => $docs['doc_kk_path'],
                'doc_akte_path'    => $docs['doc_akte_path'],
                'doc_ktp_path'     => $docs['doc_ktp_path'],
                'dob'              => $dob->toDateString(),
                'gender'           => $gender,
                'latest_weight'    => $weight,
                'latest_height'    => $height,
                'specialization'   => $this->resolveSpecialization($globalIndex),
                'class_note'       => $this->resolveClassNote($age, $weight),
            ]);

            User::query()->create([
                'name'               => $athlete->full_name,
                'email'              => "{$emailSlug}@athlix.test",
                'phone_number'       => $phoneNumber,
                'profile_photo_path' => SeedAssetsSeeder::PROFILE_PHOTO,
                'password'           => Hash::make(DatabaseSeeder::DEMO_PASSWORD),
                'role'               => 'murid',
                'dojo_id'            => $dojo->id,
                'athlete_id'         => $athlete->id,
                'email_verified_at'  => now(),
            ]);

            $this->seedAthleteReports($athlete, $sensei?->id ?? $headCoach?->id);
            $this->seedAthleteMetrics($athlete, (float) $height, (float) $weight);
            $this->seedAthleteAchievements($athlete, $globalIndex);
            $this->seedSenseiAssignments($athlete, $sensei?->id, $assistant?->id, $dojoAdmin?->id ?? $headCoach?->id);

            $athletes->push($athlete);
        }

        $this->seedParentGuardianLinks($dojo, $athletes, $dojoIndex);
    }

    private function seedAthleteReports(Athlete $athlete, ?int $evaluatorId): void
    {
        foreach ([30, 3] as $offset) {
            $base = (($athlete->id * 7) + $offset) % 35;
            $condition = 55 + $base;
            $scores = [
                'stamina' => max(40, min(100, $condition - 2)),
                'balance' => max(40, min(100, $condition - 3)),
                'speed' => max(40, min(100, $condition - 1)),
                'strength' => max(40, min(100, $condition - 4)),
                'agility' => max(40, min(100, $condition - 2)),
            ];

            AthleteReport::query()->create([
                'athlete_id' => $athlete->id,
                'evaluator_id' => $evaluatorId,
                'condition_percentage' => max(0, min(100, $condition)),
                'stamina' => $scores['stamina'],
                'balance' => $scores['balance'],
                'speed' => $scores['speed'],
                'strength' => $scores['strength'],
                'agility' => $scores['agility'],
                'notes' => 'Evaluasi rapor seed: fokus disiplin, footwork, dan konsistensi teknik.',
                'recorded_at' => now()->subDays($offset)->toDateString(),
            ]);
        }
    }

    private function seedAthleteMetrics(Athlete $athlete, float $height, float $weight): void
    {
        $dates = [90, 45, 7];
        foreach ($dates as $index => $days) {
            $weightShift = ($index === 0 ? -1.2 : ($index === 1 ? -0.4 : 0.0));
            $heightShift = ($index === 0 ? -0.3 : 0.0);
            $recordHeight = round($height + $heightShift, 1);
            $recordWeight = round($weight + $weightShift, 1);
            $bmi = round($recordWeight / pow($recordHeight / 100, 2), 2);

            PhysicalMetric::query()->create([
                'athlete_id' => $athlete->id,
                'height' => $recordHeight,
                'weight' => $recordWeight,
                'bmi' => $bmi,
                'systolic' => 106 + (($athlete->id + $index) % 8),
                'diastolic' => 68 + (($athlete->id + $index) % 6),
                'heart_rate' => null,
                'recorded_at' => now()->subDays($days)->toDateString(),
            ]);
        }
    }

    private function seedAthleteAchievements(Athlete $athlete, int $globalIndex): void
    {
        if ($globalIndex % 2 !== 0) {
            return;
        }

        AthleteAchievement::query()->create([
            'athlete_id' => $athlete->id,
            'competition_name' => 'Kejurda FORKI Sulsel',
            'competition_level' => 'Provinsi',
            'competition_type' => 'Kumite Perorangan',
            'category' => $athlete->class_note,
            'result_title' => $globalIndex % 4 === 0 ? 'Juara 1' : 'Juara 3',
            'competition_date' => now()->subMonths(4 + ($globalIndex % 5))->toDateString(),
            'location' => $athlete->birth_place ?? 'Makassar',
            'organizer' => 'FORKI Sulawesi Selatan',
            'certificate_path' => SeedAssetsSeeder::CERTIFICATE,
            'notes' => 'Catatan prestasi seed untuk simulasi histori piagam penghargaan.',
        ]);
    }

    private function seedSenseiAssignments(Athlete $athlete, ?int $senseiId, ?int $assistantId, ?int $assignedBy): void
    {
        $rows = [];
        if ($senseiId) {
            $rows[] = [
                'sensei_id' => $senseiId,
                'athlete_id' => $athlete->id,
                'dojo_id' => $athlete->dojo_id,
                'assigned_by' => $assignedBy,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        if ($assistantId && $athlete->id % 2 === 0) {
            $rows[] = [
                'sensei_id' => $assistantId,
                'athlete_id' => $athlete->id,
                'dojo_id' => $athlete->dojo_id,
                'assigned_by' => $assignedBy,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach ($rows as $row) {
            DB::table('sensei_athlete')->insert($row);
        }
    }

    private function seedParentGuardianLinks(Dojo $dojo, $athletes, int $dojoIndex): void
    {
        $parentData = [
            [   // Dojo 0 – Makassar Pusat
                ['name' => 'Andi Pratama',    'email' => 'andi.pratama@athlix.test'],
                ['name' => 'Dian Ayu Lestari','email' => 'dian.ayu@athlix.test'],
                ['name' => 'Rizal Fajar',     'email' => 'rizal.fajar@athlix.test'],
                ['name' => 'Maya Sari Dewi',  'email' => 'maya.sari@athlix.test'],
            ],
            [   // Dojo 1 – Gowa
                ['name' => 'Yusuf Ramadhan',  'email' => 'yusuf.ramadhan@athlix.test'],
                ['name' => 'Nina Kartika',    'email' => 'nina.kartika@athlix.test'],
                ['name' => 'Rahmat Hidayat',  'email' => 'rahmat.hidayat@athlix.test'],
                ['name' => 'Siska Amelia',    'email' => 'siska.amelia@athlix.test'],
            ],
            [   // Dojo 2 – Maros
                ['name' => 'Arman Nugraha',   'email' => 'arman.nugraha@athlix.test'],
                ['name' => 'Lina Puspita',    'email' => 'lina.puspita@athlix.test'],
                ['name' => 'Bima Saputra',    'email' => 'bima.saputra@athlix.test'],
                ['name' => 'Rina Oktaviani',  'email' => 'rina.oktaviani@athlix.test'],
            ],
            [   // Dojo 3 – Takalar
                ['name' => 'Galih Prabowo',   'email' => 'galih.prabowo@athlix.test'],
                ['name' => 'Tia Maharani',    'email' => 'tia.maharani@athlix.test'],
                ['name' => 'Ferry Maulana',   'email' => 'ferry.maulana@athlix.test'],
                ['name' => 'Wulan Permata',   'email' => 'wulan.permata@athlix.test'],
            ],
            [   // Dojo 4 – Pangkep
                ['name' => 'Iqbal Maulana',   'email' => 'iqbal.maulana@athlix.test'],
                ['name' => 'Putri Anindya',   'email' => 'putri.anindya@athlix.test'],
                ['name' => 'Dimas Alfarizi',  'email' => 'dimas.alfarizi@athlix.test'],
                ['name' => 'Citra Lestari',   'email' => 'citra.lestari@athlix.test'],
            ],
        ];

        $pairs = $athletes->chunk(2)->values();
        $dojoParents = $parentData[$dojoIndex] ?? $parentData[0];

        foreach ($pairs as $pairIndex => $pairAthletes) {
            $info = $dojoParents[$pairIndex] ?? ['name' => 'Wali Murid', 'email' => "wali.{$dojo->id}.{$pairIndex}@athlix.test"];

            $parent = User::query()->create([
                'name'               => $info['name'],
                'email'              => $info['email'],
                'phone_number'       => '08' . str_pad((string) (880000000 + ($dojoIndex * 100) + $pairIndex), 9, '0', STR_PAD_LEFT),
                'profile_photo_path' => SeedAssetsSeeder::PROFILE_PHOTO,
                'password'           => Hash::make(DatabaseSeeder::DEMO_PASSWORD),
                'role'               => 'parent',
                'dojo_id'            => $dojo->id,
                'email_verified_at'  => now(),
            ]);

            foreach ($pairAthletes as $index => $athlete) {
                AthleteGuardian::query()->create([
                    'tenant_id'         => $dojo->id,
                    'athlete_id'        => $athlete->id,
                    'guardian_user_id'  => $parent->id,
                    'relation_type'     => 'parent',
                    'is_primary'        => $index === 0,
                    'emergency_contact' => true,
                ]);
            }
        }
    }

    private function nameToEmailSlug(string $fullName, int $index): string
    {
        $parts = explode(' ', Str::lower($fullName));
        // firstname.lastname format, e.g. "muhammad.raka" — use first 2 words
        $slug = implode('.', array_slice($parts, 0, 2));
        // ensure global uniqueness by appending index if needed
        return $slug . ($index > 0 ? $index : '');
    }

    private function resolveAthleteName(int $index, string $gender): string
    {
        $maleFirstNames = [
            'Muhammad Raka',
            'Ahmad Fadli',
            'Bagas Mahendra',
            'Daffa Alghifari',
            'Rizky Fatur',
            'Naufal Dzaky',
            'Ilham Syahputra',
            'Rayhan Akbar',
            'Fikri Azzam',
            'Aditya Nugraha',
        ];
        $femaleFirstNames = [
            'Nur Aisyah',
            'Salsabila Putri',
            'Anindya Citra',
            'Zahra Khairunnisa',
            'Alya Safitri',
            'Syifa Nabila',
            'Keisya Maharani',
            'Naura Adelia',
            'Aurel Cahyani',
            'Nadira Putri',
        ];
        $lastNames = [
            'Saputra',
            'Ramadhani',
            'Wijaya',
            'Pranata',
            'Hidayat',
            'Prameswari',
            'Lestari',
            'Rahman',
            'Nugraha',
            'Permana',
            'Santoso',
            'Maulana',
        ];

        $pool = $gender === 'F' ? $femaleFirstNames : $maleFirstNames;
        $firstName = $pool[$index % count($pool)];
        $lastName = $lastNames[intdiv($index, count($pool)) % count($lastNames)];

        return "{$firstName} {$lastName}";
    }

    private function resolveBirthPlace(int $index): string
    {
        $places = ['Makassar', 'Gowa', 'Maros', 'Takalar', 'Pangkep', 'Barru', 'Bone', 'Parepare'];

        return $places[$index % count($places)];
    }

    private function resolveHeight(int $age, string $gender, int $index): float
    {
        $base = match (true) {
            $age <= 12 => 140 + ($index % 10),
            $age <= 16 => 152 + ($index % 12),
            default => 162 + ($index % 10),
        };

        if ($gender === 'F') {
            $base -= 4;
        }

        return round((float) $base, 1);
    }

    private function resolveWeight(int $age, string $gender, int $index): float
    {
        $base = match (true) {
            $age <= 12 => 35 + (($index * 2) % 10),
            $age <= 16 => 46 + (($index * 3) % 11),
            default => 56 + (($index * 2) % 14),
        };

        if ($gender === 'F') {
            $base -= 3;
        }

        return round((float) $base, 1);
    }

    /**
     * @return array{doc_kk_path:?string,doc_akte_path:?string,doc_ktp_path:?string}
     */
    private function resolveIdentityDocuments(int $index): array
    {
        $mod = $index % 3;

        return match ($mod) {
            0 => [
                'doc_kk_path' => SeedAssetsSeeder::IDENTITY_DOCUMENT,
                'doc_akte_path' => null,
                'doc_ktp_path' => null,
            ],
            1 => [
                'doc_kk_path' => null,
                'doc_akte_path' => SeedAssetsSeeder::IDENTITY_DOCUMENT,
                'doc_ktp_path' => null,
            ],
            default => [
                'doc_kk_path' => null,
                'doc_akte_path' => null,
                'doc_ktp_path' => SeedAssetsSeeder::IDENTITY_DOCUMENT,
            ],
        };
    }

    private function resolveSpecialization(int $index): string
    {
        return match ($index % 3) {
            0 => 'kata',
            1 => 'kumite',
            default => 'both',
        };
    }

    private function resolveClassNote(int $age, float $weight): string
    {
        $division = match (true) {
            $age <= 11 => 'Kelas Usia Dini',
            $age <= 13 => 'Kelas Pra Pemula',
            $age <= 16 => 'Kelas Pemula',
            $age <= 19 => 'Kelas Kadet',
            $age <= 22 => 'Kelas Junior',
            default => 'Kelas Senior',
        };

        return $division . ' -' . ((int) ceil($weight / 5) * 5) . 'kg';
    }
}
