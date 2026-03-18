<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Dojo;
use App\Models\Belt;
use App\Models\Athlete;
use App\Models\Attendance;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        \App\Models\PhysicalMetric::unguard();
        \App\Models\TrainingProgram::unguard();
        \App\Models\FinanceRecord::unguard();
        \App\Models\Exam::unguard();

        $dojo = Dojo::create([
            'name' => 'Dojo Utama ATHLIX',
            'timezone' => 'Asia/Jakarta',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Sensei Bima',
            'email' => 'admin@athlix.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'dojo_id' => $dojo->id,
        ]);

        $belt1 = Belt::create(['name' => 'Sabuk Putih', 'color_hex' => '#FFFFFF', 'order_level' => 1]);
        $belt2 = Belt::create(['name' => 'Sabuk Kuning', 'color_hex' => '#FFD700', 'order_level' => 2]);
        $belt3 = Belt::create(['name' => 'Sabuk Hitam', 'color_hex' => '#000000', 'order_level' => 10]);

        $names = ['Bintang Pratama', 'Syifa Julia S', 'Dimas Aditya', 'Alya Rahmawati', 'Rafi Ahmad', 'Siti Aminah', 'Budiman Lingga', 'Dewi Lestari', 'Eko Prasetyo', 'Farhan Jaya'];

        // Training Programs
        \App\Models\TrainingProgram::create([
            'dojo_id' => $dojo->id,
            'title' => 'Fisik & Conditioning Inti',
            'description' => 'Latihan kekuatan otot dan daya tahan jantung.',
            'start_time' => '06:00:00',
            'end_time' => '08:00:00',
            'coach_name' => 'Senpai Anton',
            'type' => 'fisik',
            'day' => 'Senin'
        ]);

        \App\Models\TrainingProgram::create([
            'dojo_id' => $dojo->id,
            'title' => 'Teknik Kumite & Sparring',
            'description' => 'Fokus pada kecepatan serangan dan pertahanan.',
            'start_time' => '16:00:00',
            'end_time' => '18:30:00',
            'coach_name' => 'Sensei Bima',
            'type' => 'kumite',
            'day' => 'Selasa'
        ]);

        for($i = 0; $i < count($names); $i++) {
            $athlete = Athlete::create([
                'dojo_id' => $dojo->id,
                'current_belt_id' => $i > 5 ? $belt3->id : ($i > 2 ? $belt2->id : $belt1->id),
                'athlete_code' => 'ATH-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'full_name' => $names[$i],
                'phone_number' => '62812' . rand(10000000, 99999999),
                'dob' => now()->subYears(rand(12, 22))->format('Y-m-d'),
                'gender' => $i % 3 == 0 ? 'F' : 'M',
                'latest_weight' => rand(45, 75) + 0.5,
                'specialization' => $i % 2 == 0 ? 'kata' : 'kumite',
            ]);

            // Attendances
            for($j = 0; $j < 5; $j++) {
                Attendance::create([
                    'athlete_id' => $athlete->id,
                    'status' => rand(0, 10) > 2 ? 'present' : 'absent',
                    'recorded_at' => now()->subDays($j),
                ]);
            }

            // Physical Metrics
            for($j = 0; $j < 3; $j++) {
                \App\Models\PhysicalMetric::create([
                    'athlete_id' => $athlete->id,
                    'height' => 160 + rand(0, 20),
                    'weight' => 50 + rand(0, 20),
                    'bmi' => 20 + rand(0, 5),
                    'systolic' => 110 + rand(0, 20),
                    'diastolic' => 70 + rand(0, 15),
                    'heart_rate' => 60 + rand(0, 20),
                    'recorded_at' => now()->subMonths($j),
                ]);
            }

            // Finance Records
            \App\Models\FinanceRecord::create([
                'athlete_id' => $athlete->id,
                'amount' => 150000,
                'description' => 'Iuran SPP Bulan Maret',
                'status' => $i % 4 == 0 ? 'unpaid' : 'paid',
                'due_date' => now()->endOfMonth(),
                'paid_at' => $i % 4 == 0 ? null : now()->subDays(rand(1, 10)),
            ]);

            // Exams
            if ($i % 3 == 0) {
                \App\Models\Exam::create([
                    'athlete_id' => $athlete->id,
                    'belt_id' => $belt2->id,
                    'from_belt_id' => $athlete->current_belt_id,
                    'exam_date' => now()->subMonths(2),
                    'status' => 'passed',
                    'location' => 'Dojo Pusat',
                ]);
            }
        }
    }
}
