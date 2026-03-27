<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use App\Models\User;
use App\Services\System\SystemSettingService;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminId = User::query()
            ->where('role', 'super_admin')
            ->value('id');

        $settings = [
            SystemSettingService::KEY_BILLING_INVOICE_DAY => '1',
            SystemSettingService::KEY_BILLING_INVOICE_TIME => '00:10',
            SystemSettingService::KEY_BILLING_SCHEDULE_TIMEZONE => 'Asia/Makassar',
            SystemSettingService::KEY_SAAS_ENFORCEMENT_TIME => '00:30',
            SystemSettingService::KEY_SAAS_SCHEDULE_TIMEZONE => 'Asia/Makassar',
            SystemSettingService::KEY_ALLOW_PUBLIC_REGISTRATION => '0',
            SystemSettingService::KEY_WHATSAPP_ENABLED => '1',
            SystemSettingService::KEY_WHATSAPP_PROVIDER => 'fonnte',
            SystemSettingService::KEY_WHATSAPP_BASE_URL => 'https://api.fonnte.com/send',
            SystemSettingService::KEY_WHATSAPP_TOKEN => 'seed-whatsapp-token',
            SystemSettingService::KEY_WHATSAPP_AUTH_HEADER => 'Authorization',
            SystemSettingService::KEY_WHATSAPP_TIMEOUT => '10',
            SystemSettingService::KEY_WHATSAPP_COUNTRY_CODE => '62',
        ];

        foreach ($settings as $key => $value) {
            SystemSetting::query()->updateOrCreate(
                ['key' => $key],
                [
                    'value' => $value,
                    'updated_by' => $superAdminId,
                ]
            );
        }
    }
}
