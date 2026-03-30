<?php

namespace Database\Seeders;

use App\Models\Dojo;
use App\Models\TenantSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TenancyRbacSeeder extends Seeder
{
    public function run(): void
    {
        $startedAt = now()->toDateString();
        $expiresAt = now()->addYear()->toDateString();
        $graceEndsAt = now()->addYear()->addDays(7)->toDateString();

        $dojos = [
            [
                'name' => 'ATHLIX Makassar Pusat',
                'timezone' => 'Asia/Makassar',
                'latitude' => -5.1476652,
                'longitude' => 119.4327314,
            ],
            [
                'name' => 'ATHLIX Gowa Sungguminasa',
                'timezone' => 'Asia/Makassar',
                'latitude' => -5.3191332,
                'longitude' => 119.4496747,
            ],
            [
                'name' => 'ATHLIX Maros Mandai',
                'timezone' => 'Asia/Makassar',
                'latitude' => -5.0056411,
                'longitude' => 119.5753631,
            ],
            [
                'name' => 'ATHLIX Takalar Pattallassang',
                'timezone' => 'Asia/Makassar',
                'latitude' => -5.4163668,
                'longitude' => 119.4437378,
            ],
            [
                'name' => 'ATHLIX Pangkep Labakkang',
                'timezone' => 'Asia/Makassar',
                'latitude' => -4.9149798,
                'longitude' => 119.5530255,
            ],
        ];

        foreach ($dojos as $index => $dojoData) {
            $dojo = Dojo::query()->create([
                'name'                    => $dojoData['name'],
                'timezone'                => $dojoData['timezone'],
                'attendance_secret'       => sprintf('ATHLIXDOJO%04dKEY', $index + 1),
                'latitude'                => $dojoData['latitude'],
                'longitude'               => $dojoData['longitude'],
                'geofence_radius_m'       => 120 + ($index * 5),
                'is_active'               => true,
                'saas_plan_name'          => 'Pro',
                'billing_cycle_months'    => 1,
                'subscription_started_at' => $startedAt,
                'subscription_expires_at' => $expiresAt,
                'grace_period_ends_at'    => $graceEndsAt,
                'is_saas_blocked'         => false,
                'saas_block_reason'       => null,
                'blocked_at'              => null,
            ]);

            TenantSetting::query()->create([
                'tenant_id'             => $dojo->id,
                'media_disk'            => 'public',
                'queue_driver'          => 'database',
                'notification_channels' => json_encode(['webpush', 'email', 'whatsapp']),
                'storage_public_url'    => '/storage',
            ]);
        }

        $primaryDojoId = Dojo::query()->orderBy('id')->value('id');

        User::query()->create([
            'name'               => 'Ahmad Zulkifli',
            'email'              => 'superadmin@athlix.test',
            'phone_number'       => null,
            'profile_photo_path' => SeedAssetsSeeder::PROFILE_PHOTO,
            'password'           => Hash::make(DatabaseSeeder::DEMO_PASSWORD),
            'role'               => 'super_admin',
            'dojo_id'            => $primaryDojoId,
            'email_verified_at'  => now(),
        ]);

        User::query()->create([
            'name'               => 'Diana Rahayu',
            'email'              => 'landingadmin@athlix.test',
            'phone_number'       => null,
            'profile_photo_path' => SeedAssetsSeeder::PROFILE_PHOTO,
            'password'           => Hash::make(DatabaseSeeder::DEMO_PASSWORD),
            'role'               => 'landing_admin',
            'dojo_id'            => $primaryDojoId,
            'email_verified_at'  => now(),
        ]);

        // Per-dojo staff — tiap dojo punya nama dan email orang asli unik
        $staffProfiles = [
            // Dojo 0 – Makassar Pusat
            [
                ['role' => 'dojo_admin',    'name' => 'Hendra Gunawan',     'email' => 'hendra.gunawan@athlix.test',   'phone' => '081211110001'],
                ['role' => 'head_coach',    'name' => 'Bambang Sukirno',    'email' => 'bambang.sukirno@athlix.test',  'phone' => '081211110002'],
                ['role' => 'sensei',        'name' => 'Eko Wahyudi',        'email' => 'eko.wahyudi@athlix.test',      'phone' => '081211110003'],
                ['role' => 'assistant',     'name' => 'Fitri Handayani',    'email' => 'fitri.handayani@athlix.test',  'phone' => '081211110004'],
                ['role' => 'medical_staff', 'name' => 'dr. Irwan Santoso',  'email' => 'irwan.santoso@athlix.test',    'phone' => '081211110005'],
            ],
            // Dojo 1 – Gowa Sungguminasa
            [
                ['role' => 'dojo_admin',    'name' => 'Rudi Hermawan',      'email' => 'rudi.hermawan@athlix.test',    'phone' => '081222220001'],
                ['role' => 'head_coach',    'name' => 'Agus Setiawan',      'email' => 'agus.setiawan@athlix.test',    'phone' => '081222220002'],
                ['role' => 'sensei',        'name' => 'Yusron Habibi',      'email' => 'yusron.habibi@athlix.test',    'phone' => '081222220003'],
                ['role' => 'assistant',     'name' => 'Sari Dewi Kartika',  'email' => 'sari.kartika@athlix.test',     'phone' => '081222220004'],
                ['role' => 'medical_staff', 'name' => 'dr. Nanda Pratiwi',  'email' => 'nanda.pratiwi@athlix.test',   'phone' => '081222220005'],
            ],
            // Dojo 2 – Maros Mandai
            [
                ['role' => 'dojo_admin',    'name' => 'Fauzan Arief',       'email' => 'fauzan.arief@athlix.test',     'phone' => '081233330001'],
                ['role' => 'head_coach',    'name' => 'Sukardi Wibowo',     'email' => 'sukardi.wibowo@athlix.test',   'phone' => '081233330002'],
                ['role' => 'sensei',        'name' => 'Lutfi Maulana',      'email' => 'lutfi.maulana@athlix.test',    'phone' => '081233330003'],
                ['role' => 'assistant',     'name' => 'Lia Anggraini',      'email' => 'lia.anggraini@athlix.test',    'phone' => '081233330004'],
                ['role' => 'medical_staff', 'name' => 'dr. Anton Basuki',   'email' => 'anton.basuki@athlix.test',     'phone' => '081233330005'],
            ],
            // Dojo 3 – Takalar Pattallassang
            [
                ['role' => 'dojo_admin',    'name' => 'Wahyu Kurniawan',    'email' => 'wahyu.kurniawan@athlix.test',  'phone' => '081244440001'],
                ['role' => 'head_coach',    'name' => 'Joko Prasetyo',      'email' => 'joko.prasetyo@athlix.test',    'phone' => '081244440002'],
                ['role' => 'sensei',        'name' => 'Ridwan Fathoni',     'email' => 'ridwan.fathoni@athlix.test',   'phone' => '081244440003'],
                ['role' => 'assistant',     'name' => 'Ayu Permatasari',    'email' => 'ayu.permatasari@athlix.test',  'phone' => '081244440004'],
                ['role' => 'medical_staff', 'name' => 'dr. Dwi Lestari',    'email' => 'dwi.lestari@athlix.test',      'phone' => '081244440005'],
            ],
            // Dojo 4 – Pangkep Labakkang
            [
                ['role' => 'dojo_admin',    'name' => 'Syamsul Bahri',      'email' => 'syamsul.bahri@athlix.test',    'phone' => '081255550001'],
                ['role' => 'head_coach',    'name' => 'Ismail Tanjung',     'email' => 'ismail.tanjung@athlix.test',   'phone' => '081255550002'],
                ['role' => 'sensei',        'name' => 'Harun Alrasyid',     'email' => 'harun.alrasyid@athlix.test',   'phone' => '081255550003'],
                ['role' => 'assistant',     'name' => 'Rahmawati Basri',    'email' => 'rahmawati.basri@athlix.test',  'phone' => '081255550004'],
                ['role' => 'medical_staff', 'name' => 'dr. Fadhil Mursid',  'email' => 'fadhil.mursid@athlix.test',   'phone' => '081255550005'],
            ],
        ];

        $dojosCreated = Dojo::query()->orderBy('id')->get();
        foreach ($dojosCreated as $dojoIndex => $dojo) {
            $profiles = $staffProfiles[$dojoIndex] ?? $staffProfiles[0];
            foreach ($profiles as $blueprint) {
                User::query()->create([
                    'name'               => $blueprint['name'],
                    'email'              => $blueprint['email'],
                    'phone_number'       => $blueprint['phone'],
                    'profile_photo_path' => SeedAssetsSeeder::PROFILE_PHOTO,
                    'password'           => Hash::make(DatabaseSeeder::DEMO_PASSWORD),
                    'role'               => $blueprint['role'],
                    'dojo_id'            => $dojo->id,
                    'email_verified_at'  => now(),
                ]);
            }
        }
    }
}
