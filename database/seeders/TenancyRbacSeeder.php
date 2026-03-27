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
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();

        $dojos = [
            [
                'name' => 'ATHLIX Makassar Pusat',
                'timezone' => 'Asia/Makassar',
                'is_active' => true,
                'access_state' => 'active',
                'latitude' => -5.1476652,
                'longitude' => 119.4327314,
            ],
            [
                'name' => 'ATHLIX Gowa Sungguminasa',
                'timezone' => 'Asia/Makassar',
                'is_active' => true,
                'access_state' => 'grace',
                'latitude' => -5.3191332,
                'longitude' => 119.4496747,
            ],
            [
                'name' => 'ATHLIX Maros Mandai',
                'timezone' => 'Asia/Makassar',
                'is_active' => true,
                'access_state' => 'expired',
                'latitude' => -5.0056411,
                'longitude' => 119.5753631,
            ],
            [
                'name' => 'ATHLIX Takalar Pattallassang',
                'timezone' => 'Asia/Makassar',
                'is_active' => true,
                'access_state' => 'blocked',
                'latitude' => -5.4163668,
                'longitude' => 119.4437378,
            ],
            [
                'name' => 'ATHLIX Pangkep Labakkang',
                'timezone' => 'Asia/Makassar',
                'is_active' => false,
                'access_state' => 'inactive',
                'latitude' => -4.9149798,
                'longitude' => 119.5530255,
            ],
        ];

        foreach ($dojos as $index => $dojoData) {
            $subscription = $this->resolveSubscriptionDates($dojoData['access_state'], $startOfMonth);
            $isBlocked = $dojoData['access_state'] === 'blocked';

            $dojo = Dojo::query()->create([
                'name' => $dojoData['name'],
                'timezone' => $dojoData['timezone'],
                'attendance_secret' => sprintf('ATHLIXDOJO%04dKEY', $index + 1),
                'latitude' => $dojoData['latitude'],
                'longitude' => $dojoData['longitude'],
                'geofence_radius_m' => 120 + ($index * 5),
                'is_active' => $dojoData['is_active'],
                'saas_plan_name' => 'Pro',
                'billing_cycle_months' => 1,
                'subscription_started_at' => $subscription['started_at'],
                'subscription_expires_at' => $subscription['expires_at'],
                'grace_period_ends_at' => $subscription['grace_ends_at'],
                'is_saas_blocked' => $isBlocked,
                'saas_block_reason' => $isBlocked ? 'Manual block untuk simulasi skenario penagihan SaaS.' : null,
                'blocked_at' => $isBlocked ? now()->subDays(3) : null,
            ]);

            TenantSetting::query()->create([
                'tenant_id' => $dojo->id,
                'media_disk' => 'public',
                'queue_driver' => 'database',
                'notification_channels' => json_encode(['webpush', 'email', 'whatsapp']),
                'storage_public_url' => '/storage',
            ]);
        }

        $primaryDojoId = Dojo::query()->orderBy('id')->value('id');

        User::query()->create([
            'name' => 'Super Admin ATHLIX',
            'email' => 'superadmin@athlix.test',
            'phone_number' => '6281111111101',
            'profile_photo_path' => SeedAssetsSeeder::PROFILE_PHOTO,
            'password' => Hash::make(DatabaseSeeder::DEMO_PASSWORD),
            'role' => 'super_admin',
            'dojo_id' => $primaryDojoId,
            'email_verified_at' => now(),
        ]);

        User::query()->create([
            'name' => 'Landing Admin ATHLIX',
            'email' => 'landingadmin@athlix.test',
            'phone_number' => '6281111111102',
            'profile_photo_path' => SeedAssetsSeeder::PROFILE_PHOTO,
            'password' => Hash::make(DatabaseSeeder::DEMO_PASSWORD),
            'role' => 'landing_admin',
            'dojo_id' => $primaryDojoId,
            'email_verified_at' => now(),
        ]);

        $dojosCreated = Dojo::query()->orderBy('id')->get();
        foreach ($dojosCreated as $dojo) {
            $suffix = str_pad((string) $dojo->id, 2, '0', STR_PAD_LEFT);
            $roleBlueprints = [
                ['role' => 'dojo_admin', 'name' => "Admin {$dojo->name}", 'email' => "dojo.admin{$suffix}@athlix.test", 'phone' => "628210000{$suffix}01"],
                ['role' => 'head_coach', 'name' => "Head Coach {$dojo->name}", 'email' => "head.coach{$suffix}@athlix.test", 'phone' => "628210000{$suffix}02"],
                ['role' => 'sensei', 'name' => "Sensei {$dojo->name}", 'email' => "sensei{$suffix}@athlix.test", 'phone' => "628210000{$suffix}03"],
                ['role' => 'assistant', 'name' => "Assistant {$dojo->name}", 'email' => "assistant{$suffix}@athlix.test", 'phone' => "628210000{$suffix}04"],
                ['role' => 'medical_staff', 'name' => "Medical {$dojo->name}", 'email' => "medical{$suffix}@athlix.test", 'phone' => "628210000{$suffix}05"],
            ];

            foreach ($roleBlueprints as $blueprint) {
                User::query()->create([
                    'name' => $blueprint['name'],
                    'email' => $blueprint['email'],
                    'phone_number' => $blueprint['phone'],
                    'profile_photo_path' => SeedAssetsSeeder::PROFILE_PHOTO,
                    'password' => Hash::make(DatabaseSeeder::DEMO_PASSWORD),
                    'role' => $blueprint['role'],
                    'dojo_id' => $dojo->id,
                    'email_verified_at' => now(),
                ]);
            }
        }
    }

    /**
     * @return array{started_at:string,expires_at:string,grace_ends_at:string}
     */
    private function resolveSubscriptionDates(string $state, \Illuminate\Support\Carbon $startOfMonth): array
    {
        return match ($state) {
            'grace' => [
                'started_at' => $startOfMonth->copy()->subMonth()->toDateString(),
                'expires_at' => now()->subDay()->toDateString(),
                'grace_ends_at' => now()->addDays(5)->toDateString(),
            ],
            'expired' => [
                'started_at' => $startOfMonth->copy()->subMonths(2)->toDateString(),
                'expires_at' => now()->subDays(30)->toDateString(),
                'grace_ends_at' => now()->subDays(23)->toDateString(),
            ],
            default => [
                'started_at' => $startOfMonth->toDateString(),
                'expires_at' => $startOfMonth->copy()->addMonth()->subDay()->toDateString(),
                'grace_ends_at' => $startOfMonth->copy()->addMonth()->addDays(7)->toDateString(),
            ],
        };
    }
}
