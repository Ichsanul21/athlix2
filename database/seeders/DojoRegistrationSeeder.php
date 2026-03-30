<?php

namespace Database\Seeders;

use App\Models\DojoRegistration;
use Illuminate\Database\Seeder;

class DojoRegistrationSeeder extends Seeder
{
    public function run(): void
    {
        DojoRegistration::create([
            'dojo_name' => 'Garuda Karate Club',
            'country' => 'ID',
            'province_code' => '31',
            'province_name' => 'DKI JAKARTA',
            'regency_code' => '31.71',
            'regency_name' => 'KOTA JAKARTA PUSAT',
            'district_code' => '31.71.01',
            'district_name' => 'GAMBIR',
            'village_code' => '31.71.01.1001',
            'village_name' => 'GAMBIR',
            'address_detail' => 'Jl. Veteran No. 17, Gedung Olahraga VIP',
            'timezone' => 'Asia/Jakarta',
            'saas_plan_name' => 'Pro',
            'pic_name' => 'Budi Santoso',
            'pic_email' => 'budi.santoso@garudakarate.com',
            'pic_phone' => '6281234567890',
            'status' => 'pending',
            'created_at' => now()->subDays(2),
        ]);

        DojoRegistration::create([
            'dojo_name' => 'Harimau Taekwondo',
            'country' => 'ID',
            'province_code' => '32',
            'province_name' => 'JAWA BARAT',
            'regency_code' => '32.73',
            'regency_name' => 'KOTA BANDUNG',
            'district_code' => '32.73.01',
            'district_name' => 'SUKASARI',
            'village_code' => '32.73.01.1001',
            'village_name' => 'SARIJADI',
            'address_detail' => 'Jl. Sarimanis No. 12',
            'timezone' => 'Asia/Jakarta',
            'saas_plan_name' => 'Basic',
            'pic_name' => 'Ahmad Riki',
            'pic_email' => 'ahmad.harimau@gmail.com',
            'pic_phone' => '6285611223344',
            'status' => 'pending',
            'created_at' => now()->subDays(1),
        ]);
    }
}
