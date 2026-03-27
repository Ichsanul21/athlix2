<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public const DEMO_PASSWORD = 'password123';

    public function run(): void
    {
        $this->call([
            SeedAssetsSeeder::class,
            BeltSeeder::class,
            TenancyRbacSeeder::class,
            SystemSettingSeeder::class,
            AthleteDomainSeeder::class,
            TrainingDomainSeeder::class,
            AttendanceDomainSeeder::class,
            BillingDomainSeeder::class,
            WellnessDomainSeeder::class,
            SportsScienceDomainSeeder::class,
            NotificationDomainSeeder::class,
            LandingContentSeeder::class,
        ]);
    }
}
