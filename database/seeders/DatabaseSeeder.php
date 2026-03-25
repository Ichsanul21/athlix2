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
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    private const DEFAULT_PASSWORD = 'password123';

    public function run(): void
    {
        Carbon::setLocale('id');

        [$articleThumbPath, $galleryImagePath, $certificatePath, $profilePhotoPath] = $this->seedPlaceholderAssets();

        $dojos = $this->seedDojos();
        $belts = $this->seedBelts();
        [$superAdmin, $landingAdmin] = $this->seedAdminUsers($dojos, $profilePhotoPath);
        $dojoAdmins = $this->seedDojoAdmins($dojos, $profilePhotoPath);
        $senseis = $this->seedSenseis($dojos, $profilePhotoPath);
        $athletes = $this->seedAthletes($dojos, $belts);
        $this->seedAthleteUsers($athletes, $profilePhotoPath);
        $this->seedSenseiAssignments($senseis, $athletes, $dojoAdmins, $superAdmin);
        $programs = $this->seedTrainingPrograms($dojos, $senseis);
        $latestMetrics = $this->seedPhysicalMetrics($athletes);
        $financeRecords = $this->seedFinanceRecords($athletes, $latestMetrics);
        $this->seedFinanceAdjustments($financeRecords, $athletes, collect([$superAdmin, $landingAdmin])->merge($dojoAdmins)->merge($senseis));
        $this->seedAttendances($athletes, $programs);
        $this->seedAchievements($athletes, $certificatePath);
        $this->seedLandingContent($articleThumbPath, $galleryImagePath);
    }

    private function seedPlaceholderAssets(): array
    {
        $articleThumbPath = 'seed/article-placeholder.svg';
        $galleryImagePath = 'seed/gallery-placeholder.svg';
        $certificatePath = 'seed/certificate-placeholder.svg';
        $profilePhotoPath = 'seed/profile-placeholder.svg';

        Storage::disk('public')->put($articleThumbPath, $this->buildPlaceholderSvg('ATHLIX ARTICLE', '#B91C1C', '#F8FAFC'));
        Storage::disk('public')->put($galleryImagePath, $this->buildPlaceholderSvg('ATHLIX GALLERY', '#0F766E', '#F8FAFC'));
        Storage::disk('public')->put($certificatePath, $this->buildPlaceholderSvg('ATHLIX CERTIFICATE', '#111827', '#F8FAFC'));
        Storage::disk('public')->put($profilePhotoPath, $this->buildPlaceholderSvg('ATHLIX PROFILE', '#1F2937', '#F8FAFC'));

        return [$articleThumbPath, $galleryImagePath, $certificatePath, $profilePhotoPath];
    }

    private function seedDojos(): Collection
    {
        $dojoBlueprints = [
            ['name' => 'ATHLIX Makassar Pusat', 'timezone' => 'Asia/Makassar'],
            ['name' => 'ATHLIX Gowa Sungguminasa', 'timezone' => 'Asia/Makassar'],
            ['name' => 'ATHLIX Maros Mandai', 'timezone' => 'Asia/Makassar'],
            ['name' => 'ATHLIX Takalar Pattallassang', 'timezone' => 'Asia/Makassar'],
            ['name' => 'ATHLIX Pangkep Labakkang', 'timezone' => 'Asia/Makassar'],
        ];

        return collect($dojoBlueprints)->map(function (array $dojo) {
            return Dojo::create([
                'name' => $dojo['name'],
                'timezone' => $dojo['timezone'],
                'attendance_secret' => Str::upper(Str::random(16)),
                'is_active' => true,
            ]);
        });
    }

    private function seedBelts(): Collection
    {
        $beltBlueprints = [
            ['name' => 'Sabuk Putih', 'color_hex' => '#F9FAFB', 'order_level' => 1],
            ['name' => 'Sabuk Kuning', 'color_hex' => '#FACC15', 'order_level' => 2],
            ['name' => 'Sabuk Hijau', 'color_hex' => '#22C55E', 'order_level' => 3],
            ['name' => 'Sabuk Biru', 'color_hex' => '#2563EB', 'order_level' => 4],
            ['name' => 'Sabuk Coklat', 'color_hex' => '#92400E', 'order_level' => 5],
            ['name' => 'Sabuk Hitam', 'color_hex' => '#111827', 'order_level' => 6],
        ];

        return collect($beltBlueprints)->map(fn (array $belt) => Belt::create($belt));
    }

    private function seedAdminUsers(Collection $dojos, string $profilePhotoPath): array
    {
        $superAdmin = User::create([
            'name' => 'Super Admin ATHLIX',
            'email' => 'superadmin@athlix.test',
            'phone_number' => '6281111111101',
            'profile_photo_path' => $profilePhotoPath,
            'password' => Hash::make(self::DEFAULT_PASSWORD),
            'role' => 'super_admin',
            'dojo_id' => $dojos->first()->id,
            'email_verified_at' => now(),
        ]);

        $landingAdmin = User::create([
            'name' => 'Admin Landing ATHLIX',
            'email' => 'landingadmin@athlix.test',
            'phone_number' => '6281111111102',
            'profile_photo_path' => $profilePhotoPath,
            'password' => Hash::make(self::DEFAULT_PASSWORD),
            'role' => 'landing_admin',
            'dojo_id' => $dojos->first()->id,
            'email_verified_at' => now(),
        ]);

        return [$superAdmin, $landingAdmin];
    }

    private function seedSenseis(Collection $dojos, string $profilePhotoPath): Collection
    {
        $senseiBlueprints = [
            ['name' => 'Sensei Raka Pratama', 'email' => 'sensei.raka@athlix.test', 'phone' => '6282111000001'],
            ['name' => 'Sensei Ayu Maharani', 'email' => 'sensei.ayu@athlix.test', 'phone' => '6282111000002'],
            ['name' => 'Sensei Fajar Hidayat', 'email' => 'sensei.fajar@athlix.test', 'phone' => '6282111000003'],
            ['name' => 'Sensei Nabila Putri', 'email' => 'sensei.nabila@athlix.test', 'phone' => '6282111000004'],
            ['name' => 'Sensei Dimas Akbar', 'email' => 'sensei.dimas@athlix.test', 'phone' => '6282111000005'],
        ];

        return $dojos->values()->map(function (Dojo $dojo, int $index) use ($profilePhotoPath, $senseiBlueprints) {
            $sensei = $senseiBlueprints[$index];

            return User::create([
                'name' => $sensei['name'],
                'email' => $sensei['email'],
                'phone_number' => $sensei['phone'],
                'profile_photo_path' => $profilePhotoPath,
                'password' => Hash::make(self::DEFAULT_PASSWORD),
                'role' => 'sensei',
                'dojo_id' => $dojo->id,
                'email_verified_at' => now(),
            ]);
        });
    }

    private function seedDojoAdmins(Collection $dojos, string $profilePhotoPath): Collection
    {
        return $dojos->values()->map(function (Dojo $dojo, int $index) use ($profilePhotoPath) {
            return User::create([
                'name' => 'Admin Dojo ' . $dojo->name,
                'email' => 'dojo.admin' . ($index + 1) . '@athlix.test',
                'phone_number' => '62811111112' . str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                'profile_photo_path' => $profilePhotoPath,
                'password' => Hash::make(self::DEFAULT_PASSWORD),
                'role' => 'dojo_admin',
                'dojo_id' => $dojo->id,
                'email_verified_at' => now(),
            ]);
        });
    }

    private function seedSenseiAssignments(Collection $senseis, Collection $athletes, Collection $dojoAdmins, User $fallbackAssigner): void
    {
        $senseiByDojo = $senseis->keyBy('dojo_id');
        $adminByDojo = $dojoAdmins->keyBy('dojo_id');

        foreach ($athletes as $athlete) {
            $sensei = $senseiByDojo->get($athlete->dojo_id);
            if (! $sensei) {
                continue;
            }

            $assignerId = $adminByDojo->get($athlete->dojo_id)?->id ?? $fallbackAssigner->id;
            $sensei->senseiAthletes()->syncWithoutDetaching([
                $athlete->id => [
                    'dojo_id' => $athlete->dojo_id,
                    'assigned_by' => $assignerId,
                ],
            ]);
        }
    }

    private function seedAthletes(Collection $dojos, Collection $belts): Collection
    {
        $beltByOrder = $belts->keyBy('order_level');
        $dojoPrefixes = ['MKS', 'GOW', 'MRS', 'TKL', 'PKP'];
        $birthPlaces = ['Makassar', 'Gowa', 'Maros', 'Takalar', 'Pangkep', 'Barru', 'Bone', 'Jeneponto', 'Parepare', 'Bulukumba'];
        $blueprints = $this->athleteBlueprints();

        return collect($blueprints)->values()->map(function (array $blueprint, int $index) use ($dojos, $beltByOrder, $dojoPrefixes, $birthPlaces) {
            $dojo = $dojos[intdiv($index, 10)];
            $serialInDojo = ($index % 10) + 1;
            $age = $this->resolveAthleteAge($index);
            $anthropometry = $this->resolveAnthropometry($age, $blueprint['gender'], $index);
            $beltOrder = $this->resolveBeltOrder($index);
            $birthDate = $this->buildBirthDate($age, $index);

            return Athlete::create([
                'dojo_id' => $dojo->id,
                'current_belt_id' => $beltByOrder[$beltOrder]->id,
                'athlete_code' => 'ATH' . $dojoPrefixes[intdiv($index, 10)] . str_pad((string) $serialInDojo, 3, '0', STR_PAD_LEFT),
                'full_name' => $blueprint['name'],
                'birth_place' => $birthPlaces[$index % count($birthPlaces)],
                'phone_number' => '62813' . str_pad((string) (7800000 + ($index * 17)), 7, '0', STR_PAD_LEFT),
                'dob' => $birthDate->format('Y-m-d'),
                'gender' => $blueprint['gender'],
                'latest_weight' => $anthropometry['weight'],
                'latest_height' => $anthropometry['height'],
                'specialization' => $this->resolveSpecialization($index),
                'class_note' => $this->resolveClassNote($age, $anthropometry['weight']),
            ]);
        });
    }

    private function seedAthleteUsers(Collection $athletes, string $profilePhotoPath): Collection
    {
        return $athletes->values()->map(function (Athlete $athlete, int $index) use ($profilePhotoPath) {
            $emailSlug = Str::slug($athlete->full_name, '.');

            return User::create([
                'name' => $athlete->full_name,
                'email' => $emailSlug . '.' . str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) . '@athlix.test',
                'phone_number' => $athlete->phone_number,
                'profile_photo_path' => $profilePhotoPath,
                'password' => Hash::make(self::DEFAULT_PASSWORD),
                'role' => 'murid',
                'dojo_id' => $athlete->dojo_id,
                'athlete_id' => $athlete->id,
                'email_verified_at' => now(),
            ]);
        });
    }

    private function seedTrainingPrograms(Collection $dojos, Collection $senseis): Collection
    {
        $sessionTemplates = [
            [
                'title' => 'Kelas Teknik Dasar',
                'day' => 'Senin',
                'start_time' => '16:00',
                'type' => 'teknik',
                'segments' => [
                    ['title' => 'Briefing Target Sesi', 'duration' => 10, 'description' => 'Pembagian kelompok dan penguatan target teknik hari ini.'],
                    ['title' => 'Dynamic Stretching', 'duration' => 20, 'description' => 'Aktivasi pinggul, bahu, dan core sebelum masuk drill utama.'],
                    ['title' => 'Kihon dan Footwork', 'duration' => 35, 'description' => 'Penguatan kuda-kuda, kombinasi pukulan, dan arah langkah.'],
                    ['title' => 'Drill Pasangan', 'duration' => 35, 'description' => 'Latihan timing, jarak serang, dan respon terhadap tekanan lawan.'],
                    ['title' => 'Pendinginan', 'duration' => 20, 'description' => 'Recovery ringan dan evaluasi singkat bersama sensei.'],
                ],
            ],
            [
                'title' => 'Kondisi Fisik dan Footwork',
                'day' => 'Rabu',
                'start_time' => '16:15',
                'type' => 'fisik',
                'segments' => [
                    ['title' => 'Monitoring Kehadiran', 'duration' => 10, 'description' => 'Cek kondisi atlet dan pembagian target intensitas.'],
                    ['title' => 'Pemanasan Mobilitas', 'duration' => 15, 'description' => 'Persiapan ankle, lutut, dan pinggul agar aman saat circuit.'],
                    ['title' => 'Circuit Strength', 'duration' => 30, 'description' => 'Push-up, squat jump, core drill, dan medicine ball rotation.'],
                    ['title' => 'Ladder dan Shuttle Run', 'duration' => 30, 'description' => 'Peningkatan ledakan langkah dan perubahan arah.'],
                    ['title' => 'Cooldown dan Catatan', 'duration' => 15, 'description' => 'Pendinginan aktif dan catatan performa individual.'],
                ],
            ],
            [
                'title' => 'Kelas Prestasi Kata',
                'day' => 'Jumat',
                'start_time' => '16:00',
                'type' => 'kata',
                'segments' => [
                    ['title' => 'Review Pola Gerak', 'duration' => 10, 'description' => 'Penyamaan fokus, ritme, dan presentasi awal.'],
                    ['title' => 'Stretching dan Balance', 'duration' => 20, 'description' => 'Penguatan stabilitas pinggul dan poros gerak.'],
                    ['title' => 'Bunkai dan Detail Kata', 'duration' => 40, 'description' => 'Penajaman timing, ekspresi tenaga, dan transisi gerak.'],
                    ['title' => 'Simulasi Tampil', 'duration' => 30, 'description' => 'Atlet tampil bergantian seperti format pertandingan.'],
                    ['title' => 'Evaluasi Video', 'duration' => 20, 'description' => 'Pembacaan koreksi postur, fokus mata, dan tempo.'],
                ],
            ],
            [
                'title' => 'Kelas Prestasi Kumite',
                'day' => 'Minggu',
                'start_time' => '07:00',
                'type' => 'kumite',
                'segments' => [
                    ['title' => 'Check-in dan Tactical Brief', 'duration' => 10, 'description' => 'Brief lawan simulasi, zona serang, dan target ronde.'],
                    ['title' => 'Warm Up Reaksi', 'duration' => 20, 'description' => 'Movement drill, reaction light, dan aktivasi kaki.'],
                    ['title' => 'Drill Kombinasi', 'duration' => 35, 'description' => 'Masuk-keluar jarak, counter attack, dan closing angle.'],
                    ['title' => 'Sparring Situasional', 'duration' => 40, 'description' => 'Ronde poin tertinggal, golden point, dan kontrol tempo.'],
                    ['title' => 'Recovery dan Debrief', 'duration' => 15, 'description' => 'Peregangan, feedback taktik, dan reminder mandiri.'],
                ],
            ],
        ];

        return $dojos->values()->flatMap(function (Dojo $dojo, int $dojoIndex) use ($senseis, $sessionTemplates) {
            $sensei = $senseis[$dojoIndex];

            return collect($sessionTemplates)->map(function (array $session, int $sessionIndex) use ($dojo, $sensei, $dojoIndex) {
                $start = Carbon::createFromFormat('H:i', $session['start_time'])->addMinutes($dojoIndex * 5);
                $agendaItems = $this->buildAgendaItems($start, $session['segments']);
                $end = Carbon::createFromFormat('H:i', $agendaItems[count($agendaItems) - 1]['end_time']);

                return TrainingProgram::create([
                    'dojo_id' => $dojo->id,
                    'title' => $session['title'],
                    'description' => $this->resolveProgramDescription($dojo->name, $session['type'], $sessionIndex),
                    'agenda_items' => $agendaItems,
                    'start_time' => $start->format('H:i:s'),
                    'end_time' => $end->format('H:i:s'),
                    'coach_name' => $sensei->name,
                    'type' => $session['type'],
                    'day' => $session['day'],
                ]);
            });
        })->values();
    }

    private function seedPhysicalMetrics(Collection $athletes): array
    {
        $latestMetrics = [];

        foreach ($athletes->values() as $index => $athlete) {
            $age = Carbon::parse($athlete->dob)->age;
            $height = (float) $athlete->latest_height;
            $weight = (float) $athlete->latest_weight;
            $measurementDates = [
                Carbon::now()->subMonths(4)->startOfMonth()->addDays(($index % 7) + 2),
                Carbon::now()->subMonths(2)->startOfMonth()->addDays(($index % 9) + 4),
                Carbon::now()->subDays(($index % 8) + 5),
            ];

            foreach ($measurementDates as $measurementIndex => $recordedAt) {
                $heightAdjustment = $age <= 15 ? (0.4 * (2 - $measurementIndex)) : 0.0;
                $weightAdjustment = match ($measurementIndex) {
                    0 => -1.4 + (($index % 4) * 0.2),
                    1 => -0.6 + (($index % 3) * 0.2),
                    default => 0.0,
                };

                $recordHeight = round($height - $heightAdjustment, 1);
                $recordWeight = round($weight + $weightAdjustment, 1);
                $bmi = $this->calculateBmi($recordHeight, $recordWeight);

                PhysicalMetric::create([
                    'athlete_id' => $athlete->id,
                    'height' => $recordHeight,
                    'weight' => $recordWeight,
                    'bmi' => $bmi,
                    'systolic' => 104 + ($age >= 18 ? 6 : 0) + ($index % 9),
                    'diastolic' => 66 + ($index % 7),
                    'heart_rate' => null,
                    'recorded_at' => $recordedAt->format('Y-m-d'),
                ]);

                if ($measurementIndex === 2) {
                    $latestMetrics[$athlete->id] = [
                        'height' => $recordHeight,
                        'weight' => $recordWeight,
                        'bmi' => $bmi,
                    ];
                }
            }
        }

        return $latestMetrics;
    }

    private function seedFinanceRecords(Collection $athletes, array $latestMetrics): Collection
    {
        $previousMonth = Carbon::now()->copy()->subMonthNoOverflow();
        $currentMonth = Carbon::now()->copy();

        return $athletes->values()->flatMap(function (Athlete $athlete, int $index) use ($latestMetrics, $previousMonth, $currentMonth) {
            $age = Carbon::parse($athlete->dob)->age;
            $bmi = $latestMetrics[$athlete->id]['bmi'] ?? 0.0;
            $isPrima = $bmi >= 18.5 && $bmi <= 24.9;
            $baseAmount = $this->resolveMonthlyFee($age, $athlete->specialization, $isPrima);
            $records = [];

            $previousStatus = $index % 11 === 0 ? 'unpaid' : 'paid';
            $previousDueDate = $previousMonth->copy()->endOfMonth();
            $records[] = FinanceRecord::create([
                'athlete_id' => $athlete->id,
                'amount' => $baseAmount,
                'description' => 'Iuran Pembinaan ' . $previousMonth->translatedFormat('F Y') . ' (' . ($isPrima ? 'Prima' : 'Tidak Prima') . ')',
                'status' => $previousStatus,
                'due_date' => $previousDueDate->format('Y-m-d'),
                'paid_at' => $previousStatus === 'paid'
                    ? $previousDueDate->copy()->subDays(($index % 6) + 1)->setTime(14, 0)->format('Y-m-d H:i:s')
                    : null,
            ]);

            $currentBucket = ($index * 7) % 10;
            $currentStatus = $currentBucket <= 2 ? 'paid' : 'unpaid';
            $currentDueDate = $currentMonth->copy()->endOfMonth();
            $records[] = FinanceRecord::create([
                'athlete_id' => $athlete->id,
                'amount' => $baseAmount + (($index % 4 === 0) ? 15000 : 0),
                'description' => 'Iuran Pembinaan ' . $currentMonth->translatedFormat('F Y') . ' (' . ($isPrima ? 'Prima' : 'Tidak Prima') . ')',
                'status' => $currentStatus,
                'due_date' => $currentDueDate->format('Y-m-d'),
                'paid_at' => $currentStatus === 'paid'
                    ? $currentMonth->copy()->startOfMonth()->addDays(($index % 10) + 2)->setTime(11, 30)->format('Y-m-d H:i:s')
                    : null,
            ]);

            return $records;
        })->values();
    }

    private function seedFinanceAdjustments(Collection $financeRecords, Collection $athletes, Collection $adjusters): void
    {
        $currentMonthLabel = Carbon::now()->translatedFormat('F Y');
        $eligibleRecords = $financeRecords
            ->filter(fn (FinanceRecord $record) => str_contains($record->description, $currentMonthLabel))
            ->values();
        $senseiAdjusters = $adjusters->where('role', 'sensei')->keyBy('dojo_id');
        $fallbackAdjuster = $adjusters->first();
        $reasons = [
            'Cross-subsidi internal untuk atlet yang masih sekolah dan aktif hadir.',
            'Apresiasi prestasi kejuaraan daerah pada bulan berjalan.',
            'Penyesuaian nominal karena saudara kandung berlatih dalam satu dojo.',
            'Subsidi komunitas dojo untuk atlet persiapan kejuaraan.',
            'Keringanan sementara berdasarkan evaluasi ekonomi keluarga.',
        ];

        foreach ($eligibleRecords as $index => $record) {
            if ($index % 5 !== 0) {
                continue;
            }

            $athlete = $athletes->firstWhere('id', $record->athlete_id);
            $sameDojoAthletes = $athletes
                ->where('dojo_id', $athlete->dojo_id)
                ->where('id', '!=', $athlete->id)
                ->values();
            $sourceAthlete = $sameDojoAthletes[$index % $sameDojoAthletes->count()];
            $discount = 25000 + (($index % 3) * 25000);
            $newAmount = max(125000, (float) $record->amount - $discount);
            $adjuster = $senseiAdjusters[$athlete->dojo_id] ?? $fallbackAdjuster;

            FinanceAdjustment::create([
                'finance_record_id' => $record->id,
                'athlete_id' => $record->athlete_id,
                'source_athlete_id' => $sourceAthlete->id,
                'old_amount' => $record->amount,
                'new_amount' => $newAmount,
                'delta_amount' => $newAmount - (float) $record->amount,
                'reason' => $reasons[$index % count($reasons)],
                'adjusted_by' => $adjuster?->id,
            ]);

            $record->update(['amount' => $newAmount]);
        }
    }

    private function seedAttendances(Collection $athletes, Collection $programs): void
    {
        $athleteFeedbacks = [
            'Latihan inti terasa berat, tapi saya lebih enak saat kombinasi maju-mundur.',
            'Stamina masih aman, cuma transisi guard ke counter masih telat.',
            'Kata hari ini lebih stabil, tinggal berani main ekspresi tenaga.',
            'Kaki kiri sudah lebih cepat masuk, tapi saya masih kurang tenang saat sparring.',
            'Pemanasan membantu, setelah itu badan terasa lebih siap ikut drill utama.',
        ];
        $senseiFeedbacks = [
            'Respon koreksi cepat dan fokus latihan stabil sampai akhir sesi.',
            'Teknik dasar sudah rapi, berikutnya perlu naikkan disiplin footwork.',
            'Atlet terlihat siap bertanding, tinggal jaga konsistensi jarak.',
            'Perkembangan bagus di timing serang, namun guard masih turun saat lelah.',
            'Mental latihan cukup baik, perlu tambah repetisi pada sisi non-dominan.',
        ];
        $moods = ['semangat', 'normal', 'lelah', 'drop'];

        foreach ($athletes->values() as $athleteIndex => $athlete) {
            $dojoPrograms = $programs->where('dojo_id', $athlete->dojo_id)->values();
            $attendanceTarget = match (true) {
                $athleteIndex < 15 => 88,
                $athleteIndex < 35 => 76,
                default => 64,
            };

            foreach (range(1, 21) as $daysAgo) {
                $date = Carbon::today()->subDays($daysAgo);
                $dayName = $this->indoDayName($date);

                foreach ($dojoPrograms->where('day', $dayName)->values() as $program) {
                    $roll = (($athlete->id * 17) + ($program->id * 5) + ($date->day * 3)) % 100;
                    $status = match (true) {
                        $roll < $attendanceTarget => 'present',
                        $roll < ($attendanceTarget + 8) => 'excused',
                        $roll < ($attendanceTarget + 14) => 'sick',
                        default => 'absent',
                    };

                    $checkInAt = null;
                    $checkOutAt = null;
                    $athleteFeedback = null;
                    $athleteMood = null;
                    $senseiFeedback = null;
                    $senseiMood = null;

                    if ($status === 'present') {
                        $sessionStart = Carbon::parse($date->toDateString() . ' ' . $program->start_time);
                        $sessionEnd = Carbon::parse($date->toDateString() . ' ' . $program->end_time);
                        $checkInAt = $sessionStart->copy()->subMinutes(12 - ($roll % 6));

                        if ($daysAgo > 1 || $roll % 7 !== 0) {
                            $checkOutAt = $sessionEnd->copy()->addMinutes($roll % 9);
                            $athleteFeedback = $athleteFeedbacks[$roll % count($athleteFeedbacks)];
                            $athleteMood = $moods[$roll % count($moods)];

                            if ($roll % 3 === 0) {
                                $senseiFeedback = $senseiFeedbacks[$roll % count($senseiFeedbacks)];
                                $senseiMood = $moods[($roll + 1) % count($moods)];
                            }
                        }
                    }

                    Attendance::create([
                        'athlete_id' => $athlete->id,
                        'status' => $status,
                        'recorded_at' => $date->copy()->setTime(0, 0, 0)->format('Y-m-d H:i:s'),
                        'check_in_at' => $checkInAt?->format('Y-m-d H:i:s'),
                        'check_out_at' => $checkOutAt?->format('Y-m-d H:i:s'),
                        'athlete_feedback' => $athleteFeedback,
                        'athlete_mood' => $athleteMood,
                        'sensei_feedback' => $senseiFeedback,
                        'sensei_mood_assessment' => $senseiMood,
                    ]);
                }
            }
        }
    }

    private function seedAchievements(Collection $athletes, string $certificatePath): void
    {
        $competitionPool = [
            ['name' => 'Kejurda FORKI Sulawesi Selatan', 'level' => 'Provinsi', 'type' => 'Kumite Perorangan', 'location' => 'Makassar', 'organizer' => 'FORKI Sulawesi Selatan'],
            ['name' => 'Makassar Open Karate Championship', 'level' => 'Kota', 'type' => 'Kata Perorangan', 'location' => 'Makassar', 'organizer' => 'Dispora Kota Makassar'],
            ['name' => 'Piala Bupati Maros Karate Open', 'level' => 'Kabupaten', 'type' => 'Kumite Perorangan', 'location' => 'Maros', 'organizer' => 'FORKI Maros'],
            ['name' => 'Sirkuit Karate Pelajar Sulsel Seri 1', 'level' => 'Regional', 'type' => 'Kata Beregu', 'location' => 'Gowa', 'organizer' => 'Asosiasi Dojo Pelajar Sulsel'],
            ['name' => 'Kejurnas Karate Junior', 'level' => 'Nasional', 'type' => 'Kumite Beregu', 'location' => 'Jakarta', 'organizer' => 'PB FORKI'],
            ['name' => 'Piala Walikota Cup', 'level' => 'Kota', 'type' => 'Kumite Perorangan', 'location' => 'Parepare', 'organizer' => 'Pemerintah Kota Parepare'],
        ];
        $results = ['Juara 1', 'Juara 2', 'Juara 3', 'Finalis', 'Best Spirit'];
        $eligibleAthletes = $athletes->values()->filter(function (Athlete $athlete, int $index) {
            return $index % 3 === 0 || $index >= 42;
        })->values();

        foreach ($eligibleAthletes as $index => $athlete) {
            $competition = $competitionPool[$index % count($competitionPool)];
            $competitionDate = Carbon::now()->subMonths(($index % 18) + 2)->subDays($index % 20);

            AthleteAchievement::create([
                'athlete_id' => $athlete->id,
                'competition_name' => $competition['name'],
                'competition_level' => $competition['level'],
                'competition_type' => $competition['type'],
                'category' => $athlete->class_note,
                'result_title' => $results[$index % count($results)],
                'competition_date' => $competitionDate->format('Y-m-d'),
                'location' => $competition['location'],
                'organizer' => $competition['organizer'],
                'certificate_path' => $certificatePath,
                'notes' => 'Atlet tampil konsisten sejak babak awal dan menunjukkan progres teknik yang stabil.',
            ]);

            if ($index < 5) {
                $secondCompetition = $competitionPool[($index + 2) % count($competitionPool)];

                AthleteAchievement::create([
                    'athlete_id' => $athlete->id,
                    'competition_name' => $secondCompetition['name'],
                    'competition_level' => $secondCompetition['level'],
                    'competition_type' => $secondCompetition['type'],
                    'category' => $athlete->class_note,
                    'result_title' => $results[($index + 1) % count($results)],
                    'competition_date' => $competitionDate->copy()->subMonths(8)->format('Y-m-d'),
                    'location' => $secondCompetition['location'],
                    'organizer' => $secondCompetition['organizer'],
                    'certificate_path' => $certificatePath,
                    'notes' => 'Masuk agenda prestasi dojo dan menjadi salah satu tolok ukur pembinaan semester lalu.',
                ]);
            }
        }
    }

    private function seedLandingContent(string $articleThumbPath, string $galleryImagePath): void
    {
        $articles = [
            [
                'title' => 'Cara ATHLIX Menyusun Jalur Pembinaan dari Pemula sampai Prestasi',
                'excerpt' => 'Setiap atlet dibina lewat ritme latihan, evaluasi fisik, dan target kompetisi yang bertahap.',
                'content' => "ATHLIX tidak menempatkan semua murid pada pola latihan yang sama. Atlet usia dini, pemula, dan kelas prestasi dibedakan dari volume latihan, fokus teknik, serta target penguatan fisik.\n\nDi level dasar, pembinaan diarahkan ke disiplin, koordinasi, dan keberanian tampil. Saat atlet mulai stabil, barulah materi mengarah ke spesialisasi kata atau kumite, plus pembiasaan hadir konsisten dalam latihan mingguan.\n\nPendekatan ini membuat sensei lebih mudah memberi target yang realistis, sementara orang tua juga bisa melihat perkembangan anak lewat data yang lebih jelas.",
            ],
            [
                'title' => 'Kenapa Kehadiran Latihan Menjadi Data Penting di Dojo',
                'excerpt' => 'Kehadiran bukan sekadar administrasi, tetapi indikator ritme, disiplin, dan kesiapan atlet menghadapi target.',
                'content' => "Dalam pembinaan karate, ritme latihan memengaruhi teknik, fisik, dan mental bertanding. Atlet yang hadir stabil cenderung lebih cepat menangkap koreksi dan lebih siap mengikuti simulasi pertandingan.\n\nKarena itu data absensi di ATHLIX dibuat bukan hanya untuk check-in, tetapi juga membaca pola check-out, feedback latihan, dan catatan sensei setelah sesi selesai.\n\nDengan data yang rapi, dojo bisa mengambil keputusan lebih cepat saat menentukan atlet yang siap masuk agenda try out atau kejuaraan.",
            ],
            [
                'title' => 'Peran Orang Tua dalam Menjaga Konsistensi Atlet Muda',
                'excerpt' => 'Konsistensi latihan anak sangat dipengaruhi rutinitas rumah, waktu istirahat, dan dukungan komunikasi dengan dojo.',
                'content' => "Banyak atlet muda berhenti berkembang bukan karena kurang bakat, melainkan karena ritme hariannya tidak terjaga. Waktu tidur, asupan makan, dan kesiapan berangkat latihan sangat memengaruhi performa saat di dojo.\n\nATHLIX mendorong komunikasi yang lebih sederhana antara sensei dan orang tua agar target latihan, agenda kejuaraan, dan kondisi anak bisa dipantau bersama.\n\nKolaborasi ini membantu anak merasa aman, disiplin, dan lebih siap menjaga semangat latihannya dalam jangka panjang.",
            ],
            [
                'title' => 'Membaca Data Fisik Atlet untuk Menyusun Beban Latihan',
                'excerpt' => 'Data tinggi, berat, dan indeks massa tubuh membantu dojo menjaga pembinaan tetap aman dan efektif.',
                'content' => "Program latihan yang baik tidak dibangun dari intuisi semata. Data fisik dasar seperti tinggi badan, berat badan, dan perubahan komposisi tubuh memberi gambaran apakah seorang atlet siap menerima peningkatan beban.\n\nDi ATHLIX, data fisik dipakai sebagai bahan diskusi sensei sebelum menentukan apakah atlet tetap di jalur reguler, perlu penguatan, atau justru perlu penyesuaian intensitas.\n\nPendekatan ini penting agar pembinaan prestasi tetap berjalan tanpa mengorbankan kesehatan atlet.",
            ],
            [
                'title' => 'Cross-Subsidi di Dojo: Menjaga Atlet Berprestasi Tetap Bertumbuh',
                'excerpt' => 'Skema penyesuaian nominal membantu dojo tetap manusiawi tanpa menghilangkan transparansi administrasi.',
                'content' => "Dalam dunia pembinaan, ada kalanya atlet paling rajin justru sedang mengalami kendala biaya. ATHLIX menyiapkan pencatatan penyesuaian nominal agar keputusan subsidi tetap transparan dan bisa dipertanggungjawabkan.\n\nSemua penyesuaian tercatat bersama alasan, pihak yang menyetujui, dan kaitannya dengan tagihan atlet terkait. Ini membuat sensei bisa membantu dengan tetap menjaga akuntabilitas keuangan dojo.\n\nSkema seperti ini berguna untuk menjaga semangat atlet yang sedang berada di fase penting pembinaan atau persiapan bertanding.",
            ],
        ];

        foreach ($articles as $index => $article) {
            LandingArticle::create([
                'title' => $article['title'],
                'slug' => Str::slug($article['title']),
                'excerpt' => $article['excerpt'],
                'content' => $article['content'],
                'thumbnail_path' => $articleThumbPath,
                'is_published' => true,
                'sort_order' => $index + 1,
            ]);
        }

        $galleries = [
            ['title' => 'Sesi Jumat Prestasi Makassar Pusat', 'caption' => 'Simulasi tampil kata dan evaluasi video untuk kelompok prestasi dojo pusat.'],
            ['title' => 'Kelas Anak Gowa Sungguminasa', 'caption' => 'Latihan koordinasi dasar, disiplin baris, dan keberanian tampil di depan kelompok.'],
            ['title' => 'Weekend Sparring Maros Mandai', 'caption' => 'Sesi sparring terarah untuk membiasakan decision making di bawah tekanan.'],
            ['title' => 'Pemantauan Fisik Takalar', 'caption' => 'Pendataan tinggi, berat, dan kondisi umum atlet menjelang try out internal.'],
            ['title' => 'Try Out Gabungan Pangkep', 'caption' => 'Pertemuan antar dojo untuk menguji kesiapan teknik dan mental bertanding.'],
        ];

        foreach ($galleries as $index => $gallery) {
            LandingGallery::create([
                'title' => $gallery['title'],
                'caption' => $gallery['caption'],
                'image_path' => $galleryImagePath,
                'sort_order' => $index + 1,
            ]);
        }

        $priceLists = [
            [
                'title' => 'Program Reguler Murid',
                'description' => 'Akses latihan rutin mingguan untuk murid aktif dengan fokus fondasi teknik dan disiplin latihan.',
                'price' => 225000,
                'currency' => 'IDR',
                'is_featured' => true,
                'sort_order' => 1,
            ],
            [
                'title' => 'Program Pembinaan Prestasi',
                'description' => 'Porsi latihan tambahan untuk atlet yang masuk radar kejuaraan dan butuh evaluasi lebih rapat.',
                'price' => 325000,
                'currency' => 'IDR',
                'is_featured' => true,
                'sort_order' => 2,
            ],
            [
                'title' => 'Sesi Privat / Intensif',
                'description' => 'Latihan privat untuk persiapan try out, koreksi personal, atau target pertandingan tertentu.',
                'price' => 500000,
                'currency' => 'IDR',
                'is_featured' => false,
                'sort_order' => 3,
            ],
        ];

        foreach ($priceLists as $priceList) {
            LandingPriceList::create($priceList);
        }
    }

    private function athleteBlueprints(): array
    {
        $maleNames = [
            'Muhammad Raka Saputra',
            'Ahmad Fadli Ramadhan',
            'Bagas Mahendra Putra',
            'Daffa Alghifari Pratama',
            'Rizky Fatur Rahman',
            'Naufal Dzaky Hidayat',
            'Ilham Syahputra Wijaya',
            'Rayhan Akbar Pranata',
            'Fikri Azzam Ramdhan',
            'Aditya Nugraha Putra',
            'Aqil Prasetyo Rahman',
            'Farrel Zidan Maulana',
            'Rafi Arya Kurniawan',
            'Mikail Fadlan Anugrah',
            'Dimas Alfarizi Saputra',
            'Yusuf Danendra Akbar',
            'Fahri Miftahul Huda',
            'Rasyid Firman Syah',
            'Arkan Ghifari Nugroho',
            'Rifky Maulana Jaya',
            'Ikram Faris Ramadhan',
            'Aldo Pratama Siregar',
            'Nanda Surya Adiputra',
            'Rivan Althaf Hidayat',
            'Rendra Galih Saputro',
        ];
        $femaleNames = [
            'Nur Aisyah Ramadhani',
            'Salsabila Putri Maharani',
            'Anindya Citra Lestari',
            'Zahra Khairunnisa Putri',
            'Alya Safitri Rahma',
            'Syifa Nabila Azzahra',
            'Keisya Maharani Putri',
            'Naura Adelia Syafitri',
            'Aurel Cahyani Prameswari',
            'Nadira Putri Lestari',
            'Kirana Ayu Maharani',
            'Rania Nasywa Hidayati',
            'Nabila Azzahra Putri',
            'Talita Nur Fauziah',
            'Shafira Azka Maharani',
            'Aqila Dwi Lestari',
            'Putri Sakinah Ramadhani',
            'Calista Naurah Hidayah',
            'Amira Khansa Putri',
            'Sabrina Fathiya Nur',
            'Azzahra Maulida Putri',
            'Ghina Larasati Ramadhan',
            'Nayla Putri Anjani',
            'Caca Meidina Utami',
            'Raisa Kirana Syafira',
        ];

        $blueprints = [];
        foreach ($maleNames as $index => $name) {
            $blueprints[] = ['name' => $name, 'gender' => 'M'];
            $blueprints[] = ['name' => $femaleNames[$index], 'gender' => 'F'];
        }

        return $blueprints;
    }

    private function resolveAthleteAge(int $index): int
    {
        return match (true) {
            $index < 10 => 10 + ($index % 3),
            $index < 20 => 13 + ($index % 3),
            $index < 35 => 16 + ($index % 4),
            $index < 45 => 20 + ($index % 3),
            default => 23 + ($index % 4),
        };
    }

    private function resolveAnthropometry(int $age, string $gender, int $index): array
    {
        $height = match (true) {
            $age <= 12 => 138 + ($index % 12),
            $age <= 15 => 150 + ($index % 14),
            $age <= 19 => 160 + ($index % 15),
            default => 164 + ($index % 14),
        };
        $weight = match (true) {
            $age <= 12 => 34 + (($index * 2) % 10),
            $age <= 15 => 43 + (($index * 3) % 13),
            $age <= 19 => 52 + (($index * 2) % 16),
            default => 58 + (($index * 3) % 18),
        };

        if ($gender === 'F') {
            $height -= 4;
            $weight -= 3;
        }

        if ($index % 9 === 0) {
            $weight -= 4;
        }

        if ($index % 11 === 0) {
            $weight += 5;
        }

        return [
            'height' => round((float) $height, 1),
            'weight' => round((float) $weight, 1),
        ];
    }

    private function resolveBeltOrder(int $index): int
    {
        return match (true) {
            $index < 8 => ($index % 3 === 0) ? 1 : 2,
            $index < 20 => ($index % 2 === 0) ? 2 : 3,
            $index < 35 => 3 + ($index % 2),
            $index < 45 => 4 + ($index % 2),
            default => ($index % 4 === 0) ? 6 : 5,
        };
    }

    private function resolveSpecialization(int $index): string
    {
        return match ($index % 5) {
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
            $age <= 15 => 'Kelas Pemula',
            $age <= 17 => 'Kelas Kadet',
            $age <= 20 => 'Kelas Junior',
            default => 'Kelas Senior',
        };

        if ($age > 20 && $weight > 75) {
            return $division . ' +75kg';
        }

        return $division . ' -' . ((int) ceil($weight / 5) * 5) . 'kg';
    }

    private function buildBirthDate(int $age, int $index): Carbon
    {
        $year = Carbon::now()->year - $age;
        $month = ($index % 12) + 1;
        $day = (($index * 3) % 27) + 1;
        $birthDate = Carbon::create($year, $month, $day);

        if ($birthDate->isFuture()) {
            $birthDate->subYear();
        }

        return $birthDate;
    }

    private function buildAgendaItems(Carbon $startTime, array $segments): array
    {
        $cursor = $startTime->copy();
        $items = [];

        foreach ($segments as $segment) {
            $end = $cursor->copy()->addMinutes($segment['duration']);
            $items[] = [
                'title' => $segment['title'],
                'start_time' => $cursor->format('H:i'),
                'end_time' => $end->format('H:i'),
                'description' => $segment['description'],
            ];
            $cursor = $end;
        }

        return $items;
    }

    private function resolveProgramDescription(string $dojoName, string $type, int $sessionIndex): string
    {
        $focus = match ($type) {
            'fisik' => 'penguatan fisik, koordinasi langkah, dan kesiapan tubuh untuk sesi intensif',
            'kata' => 'ketajaman detail gerak, ritme tampil, dan kualitas presentasi kata',
            'kumite' => 'pembacaan jarak, timing serang, serta adaptasi taktik bertanding',
            default => 'fondasi teknik, disiplin gerak, dan kualitas eksekusi dasar',
        };

        return $dojoName . ' menjalankan sesi ' . ($sessionIndex + 1) . ' mingguan dengan fokus pada ' . $focus . '.';
    }

    private function calculateBmi(float $height, float $weight): float
    {
        $heightInMeters = $height / 100;

        return round($weight / ($heightInMeters * $heightInMeters), 2);
    }

    private function resolveMonthlyFee(int $age, string $specialization, bool $isPrima): int
    {
        $amount = match (true) {
            $age <= 12 => 175000,
            $age <= 17 => 225000,
            default => 250000,
        };

        if ($specialization === 'both') {
            $amount += 15000;
        }

        if (! $isPrima) {
            $amount += 20000;
        }

        return $amount;
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

    private function buildPlaceholderSvg(string $label, string $background, string $foreground): string
    {
        return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 628" width="1200" height="628">
  <rect width="1200" height="628" fill="{$background}" />
  <g fill="{$foreground}" font-family="Arial, sans-serif">
    <text x="80" y="220" font-size="72" font-weight="700">{$label}</text>
    <text x="80" y="290" font-size="36" opacity="0.9">ATHLIX Seed Asset</text>
    <text x="80" y="360" font-size="28" opacity="0.75">Digunakan untuk simulasi data lokal dan production demo</text>
  </g>
</svg>
SVG;
    }
}
