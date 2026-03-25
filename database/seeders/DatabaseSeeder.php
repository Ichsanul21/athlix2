<?php

namespace Database\Seeders;

use App\Models\Athlete;
use App\Models\AthleteAchievement;
use App\Models\Attendance;
use App\Models\Belt;
use App\Models\Dojo;
use App\Models\FinanceAdjustment;
use App\Models\FinanceRecord;
use App\Models\LandingArticle;
use App\Models\LandingGallery;
use App\Models\LandingPriceList;
use App\Models\PhysicalMetric;
use App\Models\TrainingProgram;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Faker\Factory as FakerFactory;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Use explicit Faker factory because the global helper may not be loaded in some runtime contexts (e.g. production artisan without test helpers).
        $faker = FakerFactory::create('id_ID');
        $faker->seed(20260325);

        $timezones = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'];
        $days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        $trainingTypes = ['fisik', 'teknik', 'kata', 'kumite'];
        $competitionLevels = ['Kabupaten', 'Kota', 'Provinsi', 'Regional', 'Nasional', 'Internasional'];
        $competitionTypes = ['Kata Perorangan', 'Kata Beregu', 'Kumite Perorangan', 'Kumite Beregu'];
        $moods = ['semangat', 'normal', 'lelah', 'drop'];
        $classNotes = [
            'Kelas Usia Dini -27kg',
            'Kelas Pra Pemula -35kg',
            'Kelas Pemula -40kg',
            'Kelas Kadet -45kg',
            'Kelas Junior -55kg',
            'Kelas Senior Open',
        ];

        $articleThumbPath = 'seed/article-placeholder.svg';
        $galleryImagePath = 'seed/gallery-placeholder.svg';
        $certificatePath = 'seed/certificate-placeholder.svg';
        $profilePhotoPath = 'seed/profile-placeholder.svg';

        Storage::disk('public')->put($articleThumbPath, $this->buildPlaceholderSvg('ATHLIX ARTICLE', '#E61E32', '#FFFFFF'));
        Storage::disk('public')->put($galleryImagePath, $this->buildPlaceholderSvg('ATHLIX GALLERY', '#1D4ED8', '#FFFFFF'));
        Storage::disk('public')->put($certificatePath, $this->buildPlaceholderSvg('ATHLIX CERTIFICATE', '#111827', '#F9FAFB'));
        Storage::disk('public')->put($profilePhotoPath, $this->buildPlaceholderSvg('ATHLIX PROFILE', '#374151', '#F9FAFB'));

        $dojos = collect();
        for ($i = 1; $i <= 50; $i++) {
            $dojos->push(Dojo::create([
                'name' => 'Dojo ATHLIX ' . str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                'timezone' => $timezones[($i - 1) % count($timezones)],
                'attendance_secret' => Str::upper(Str::random(16)),
                'is_active' => true,
            ]));
        }

        $baseBelts = [
            ['name' => 'Sabuk Putih', 'hex' => '#FFFFFF'],
            ['name' => 'Sabuk Kuning', 'hex' => '#FACC15'],
            ['name' => 'Sabuk Hijau', 'hex' => '#22C55E'],
            ['name' => 'Sabuk Biru', 'hex' => '#2563EB'],
            ['name' => 'Sabuk Coklat', 'hex' => '#B45309'],
            ['name' => 'Sabuk Hitam', 'hex' => '#111111'],
        ];

        $belts = collect();
        for ($i = 1; $i <= 50; $i++) {
            $beltTemplate = $baseBelts[($i - 1) % count($baseBelts)];
            $suffix = $i > count($baseBelts) ? ' Level ' . $i : '';
            $belts->push(Belt::create([
                'name' => $beltTemplate['name'] . $suffix,
                'color_hex' => $beltTemplate['hex'],
                'order_level' => $i,
            ]));
        }

        $athletes = collect();
        $latestBmiByAthlete = [];

        for ($i = 1; $i <= 50; $i++) {
            $dojo = $dojos[($i - 1) % $dojos->count()];
            $height = $faker->numberBetween(148, 188);
            $weight = $faker->randomFloat(1, 42, 92);
            $bmi = round($weight / (($height / 100) * ($height / 100)), 2);

            $athlete = Athlete::create([
                'dojo_id' => $dojo->id,
                'current_belt_id' => $belts->random()->id,
                'athlete_code' => 'ATH' . str_pad((string) $i, 4, '0', STR_PAD_LEFT),
                'full_name' => $faker->name(),
                'birth_place' => $faker->city(),
                'phone_number' => '628' . $faker->numerify('##########'),
                'dob' => $faker->dateTimeBetween('-26 years', '-10 years')->format('Y-m-d'),
                'gender' => $faker->randomElement(['M', 'F']),
                'latest_weight' => $weight,
                'latest_height' => $height,
                'specialization' => $faker->randomElement(['kata', 'kumite', 'both']),
                'class_note' => $classNotes[($i - 1) % count($classNotes)],
            ]);

            $athletes->push($athlete);
            $latestBmiByAthlete[$athlete->id] = $bmi;
        }

        $users = collect();
        $users->push(User::create([
            'name' => 'Super Admin ATHLIX',
            'email' => 'superadmin@athlix.test',
            'phone_number' => '6281111111101',
            'profile_photo_path' => $profilePhotoPath,
            'password' => Hash::make('password123'),
            'role' => 'super_admin',
            'dojo_id' => $dojos->first()->id,
            'email_verified_at' => now(),
        ]));

        $users->push(User::create([
            'name' => 'Admin Landing ATHLIX',
            'email' => 'landingadmin@athlix.test',
            'phone_number' => '6281111111102',
            'profile_photo_path' => $profilePhotoPath,
            'password' => Hash::make('password123'),
            'role' => 'landing_admin',
            'dojo_id' => $dojos->first()->id,
            'email_verified_at' => now(),
        ]));

        for ($i = 1; $i <= 8; $i++) {
            $dojo = $dojos[$i - 1];
            $users->push(User::create([
                'name' => 'Sensei ' . $faker->firstName(),
                'email' => 'sensei' . str_pad((string) $i, 2, '0', STR_PAD_LEFT) . '@athlix.test',
                'phone_number' => '62822' . str_pad((string) $i, 8, '0', STR_PAD_LEFT),
                'profile_photo_path' => $profilePhotoPath,
                'password' => Hash::make('password123'),
                'role' => 'sensei',
                'dojo_id' => $dojo->id,
                'email_verified_at' => now(),
            ]));
        }

        $athletes->take(40)->values()->each(function (Athlete $athlete, int $index) use ($users, $profilePhotoPath): void {
            $users->push(User::create([
                'name' => $athlete->full_name,
                'email' => 'murid' . str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT) . '@athlix.test',
                'phone_number' => $athlete->phone_number,
                'profile_photo_path' => $profilePhotoPath,
                'password' => Hash::make('password123'),
                'role' => 'murid',
                'dojo_id' => $athlete->dojo_id,
                'athlete_id' => $athlete->id,
                'email_verified_at' => now(),
            ]));
        });

        for ($i = 1; $i <= 50; $i++) {
            $dojo = $dojos[($i - 1) % $dojos->count()];
            $start = Carbon::createFromTime(5 + (($i - 1) % 10), ($i * 7) % 60, 0);
            $end = $start->copy()->addMinutes(120);
            $briefEnd = $start->copy()->addMinutes(15);
            $stretchEnd = $briefEnd->copy()->addMinutes(25);
            $coreEnd = $stretchEnd->copy()->addMinutes(65);

            TrainingProgram::create([
                'dojo_id' => $dojo->id,
                'title' => 'Program Latihan ' . str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                'description' => 'Program terstruktur untuk peningkatan teknik, fisik, dan mental bertanding.',
                'agenda_items' => [
                    [
                        'title' => 'Briefing',
                        'start_time' => $start->format('H:i'),
                        'end_time' => $briefEnd->format('H:i'),
                        'description' => 'Review target sesi dan fokus latihan.',
                    ],
                    [
                        'title' => 'Stretching Dinamis',
                        'start_time' => $briefEnd->format('H:i'),
                        'end_time' => $stretchEnd->format('H:i'),
                        'description' => 'Aktivasi sendi, mobilitas pinggul, dan core stability.',
                    ],
                    [
                        'title' => 'Latihan Inti',
                        'start_time' => $stretchEnd->format('H:i'),
                        'end_time' => $coreEnd->format('H:i'),
                        'description' => 'Drill teknik, kombinasi serangan-bertahan, dan simulasi pertandingan.',
                    ],
                    [
                        'title' => 'Pendinginan',
                        'start_time' => $coreEnd->format('H:i'),
                        'end_time' => $end->format('H:i'),
                        'description' => 'Pemulihan, evaluasi singkat, dan rencana perbaikan.',
                    ],
                ],
                'start_time' => $start->format('H:i:s'),
                'end_time' => $end->format('H:i:s'),
                'coach_name' => 'Sensei ' . $faker->firstName(),
                'type' => $trainingTypes[($i - 1) % count($trainingTypes)],
                'day' => $days[($i - 1) % count($days)],
            ]);
        }

        $athletes->each(function (Athlete $athlete) use ($faker, &$latestBmiByAthlete): void {
            $height = $athlete->latest_height ?: $faker->numberBetween(150, 185);
            $weight = $athlete->latest_weight ?: $faker->randomFloat(1, 44, 90);
            $bmi = round($weight / (($height / 100) * ($height / 100)), 2);

            PhysicalMetric::create([
                'athlete_id' => $athlete->id,
                'height' => $height,
                'weight' => $weight,
                'bmi' => $bmi,
                'systolic' => $faker->numberBetween(105, 135),
                'diastolic' => $faker->numberBetween(65, 90),
                'heart_rate' => $faker->numberBetween(56, 96),
                'recorded_at' => $faker->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            ]);

            $latestBmiByAthlete[$athlete->id] = $bmi;
        });

        $financeRecords = collect();
        $monthLabel = now()->translatedFormat('F Y');

        $athletes->values()->each(function (Athlete $athlete, int $index) use ($faker, &$latestBmiByAthlete, $monthLabel, &$financeRecords): void {
            $isPrima = ($latestBmiByAthlete[$athlete->id] ?? 0) >= 18.5 && ($latestBmiByAthlete[$athlete->id] ?? 0) <= 24.9;
            $conditionLabel = $isPrima ? 'Prima' : 'Tidak Prima';
            $baseAmount = $isPrima ? 150000 : 175000;
            $amount = max(75000, $baseAmount + $faker->numberBetween(-15000, 20000));

            if ($index < 15) {
                $status = 'unpaid';
                $dueDate = Carbon::now()->subDays($faker->numberBetween(3, 45));
                $paidAt = null;
            } elseif ($index < 30) {
                $status = 'paid';
                $dueDate = Carbon::now()->subDays($faker->numberBetween(5, 35));
                $paidAt = $dueDate->copy()->subDays($faker->numberBetween(0, 4));
            } elseif ($index < 40) {
                $status = 'unpaid';
                $dueDate = Carbon::now()->addDays($faker->numberBetween(3, 25));
                $paidAt = null;
            } else {
                $status = 'pending';
                $dueDate = Carbon::now()->addDays($faker->numberBetween(1, 30));
                $paidAt = null;
            }

            $financeRecords->push(FinanceRecord::create([
                'athlete_id' => $athlete->id,
                'amount' => $amount,
                'description' => 'Iuran Bulanan (' . $conditionLabel . ') - ' . $monthLabel,
                'status' => $status,
                'due_date' => $dueDate->format('Y-m-d'),
                'paid_at' => $paidAt?->format('Y-m-d H:i:s'),
            ]));
        });

        $adjusterIds = $users
            ->filter(fn (User $user) => in_array($user->role, ['super_admin', 'sensei'], true))
            ->pluck('id')
            ->values();

        $reasons = [
            'Cross-subsidi internal dojo',
            'Bantuan biaya prestasi',
            'Diskon keluarga atlet',
            'Dukungan sponsor komunitas',
            'Penyesuaian kondisi ekonomi',
        ];

        for ($i = 1; $i <= 50; $i++) {
            /** @var FinanceRecord $record */
            $record = $financeRecords->random();
            $oldAmount = (float) $record->amount;
            $delta = (float) $faker->numberBetween(-30000, 25000);
            $newAmount = (float) max(50000, $oldAmount + $delta);

            /** @var Athlete $sourceAthlete */
            $sourceAthlete = $athletes->where('id', '!=', $record->athlete_id)->random();

            FinanceAdjustment::create([
                'finance_record_id' => $record->id,
                'athlete_id' => $record->athlete_id,
                'source_athlete_id' => $sourceAthlete?->id,
                'old_amount' => $oldAmount,
                'new_amount' => $newAmount,
                'delta_amount' => $newAmount - $oldAmount,
                'reason' => $reasons[($i - 1) % count($reasons)],
                'adjusted_by' => $adjusterIds->random(),
            ]);

            $record->update(['amount' => $newAmount]);
        }

        for ($i = 1; $i <= 50; $i++) {
            $athlete = $athletes[$i - 1];
            $date = Carbon::today()->subDays(($i - 1) % 10);
            $status = $faker->randomElement(['present', 'present', 'present', 'absent', 'sick', 'excused']);

            $checkIn = null;
            $checkOut = null;
            $athleteFeedback = null;
            $athleteMood = null;
            $senseiFeedback = null;
            $senseiMood = null;

            if ($status === 'present') {
                $checkIn = $date->copy()->setTime($faker->numberBetween(5, 8), $faker->numberBetween(0, 59), 0);

                if ($faker->boolean(70)) {
                    $checkOut = $checkIn->copy()->addMinutes($faker->numberBetween(90, 170));
                    $athleteFeedback = $faker->sentence(10);
                    $athleteMood = $moods[($i - 1) % count($moods)];

                    if ($faker->boolean(55)) {
                        $senseiFeedback = $faker->sentence(12);
                        $senseiMood = $faker->randomElement(['normal', 'semangat', 'lelah', 'kurang-fokus']);
                    }
                }
            }

            Attendance::create([
                'athlete_id' => $athlete->id,
                'status' => $status,
                'recorded_at' => $date->copy()->setTime(0, 0, 0)->format('Y-m-d H:i:s'),
                'check_in_at' => $checkIn?->format('Y-m-d H:i:s'),
                'check_out_at' => $checkOut?->format('Y-m-d H:i:s'),
                'athlete_feedback' => $athleteFeedback,
                'athlete_mood' => $athleteMood,
                'sensei_feedback' => $senseiFeedback,
                'sensei_mood_assessment' => $senseiMood,
            ]);
        }

        for ($i = 1; $i <= 50; $i++) {
            $athlete = $athletes[$i - 1];

            AthleteAchievement::create([
                'athlete_id' => $athlete->id,
                'competition_name' => 'Kejuaraan ATHLIX Cup ' . $i,
                'competition_level' => $competitionLevels[($i - 1) % count($competitionLevels)],
                'competition_type' => $competitionTypes[($i - 1) % count($competitionTypes)],
                'category' => 'Under ' . (45 + (($i - 1) % 9) * 5) . 'kg',
                'result_title' => $faker->randomElement(['Juara 1', 'Juara 2', 'Juara 3', 'Finalis', 'Best Spirit']),
                'competition_date' => $faker->dateTimeBetween('-4 years', 'now')->format('Y-m-d'),
                'location' => $faker->city(),
                'organizer' => 'Federasi Karate ' . $faker->city(),
                'certificate_path' => $certificatePath,
                'notes' => $faker->sentence(12),
            ]);
        }

        for ($i = 1; $i <= 50; $i++) {
            $title = 'Artikel ATHLIX ' . str_pad((string) $i, 2, '0', STR_PAD_LEFT);
            LandingArticle::create([
                'title' => $title,
                'slug' => Str::slug($title) . '-' . $i,
                'excerpt' => $faker->sentence(20),
                'content' => collect($faker->paragraphs(4))->implode("\n\n"),
                'thumbnail_path' => $articleThumbPath,
                'is_published' => $i <= 45,
                'sort_order' => $i,
            ]);
        }

        for ($i = 1; $i <= 50; $i++) {
            LandingGallery::create([
                'title' => 'Galeri Kegiatan #' . $i,
                'caption' => $faker->sentence(14),
                'image_path' => $galleryImagePath,
                'sort_order' => $i,
            ]);
        }

        for ($i = 1; $i <= 50; $i++) {
            LandingPriceList::create([
                'title' => 'Paket Latihan ' . $i,
                'description' => $faker->sentence(16),
                'price' => 120000 + ($i * 15000),
                'currency' => 'IDR',
                'is_featured' => $i <= 8,
                'sort_order' => $i,
            ]);
        }
    }

    private function buildPlaceholderSvg(string $label, string $background, string $foreground): string
    {
        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 628" width="1200" height="628">
  <rect width="1200" height="628" fill="{$background}" />
  <g fill="{$foreground}" font-family="Arial, sans-serif">
    <text x="80" y="220" font-size="72" font-weight="700">{$label}</text>
    <text x="80" y="290" font-size="36" opacity="0.9">Seeded by ATHLIX Development</text>
    <text x="80" y="360" font-size="28" opacity="0.75">Placeholder media for local development data</text>
  </g>
</svg>
SVG;
    }
}
