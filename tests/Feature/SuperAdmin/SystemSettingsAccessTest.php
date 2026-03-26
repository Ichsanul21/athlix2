<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\Dojo;
use App\Models\User;
use App\Services\System\SystemSettingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemSettingsAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_open_system_settings_page(): void
    {
        $user = User::factory()->create([
            'role' => 'super_admin',
        ]);

        $this->actingAs($user)
            ->get(route('super-admin.system-settings.index'))
            ->assertOk();
    }

    public function test_non_super_admin_cannot_open_system_settings_page(): void
    {
        $dojo = Dojo::factory()->create();
        $user = User::factory()->create([
            'role' => 'dojo_admin',
            'dojo_id' => $dojo->id,
        ]);

        $this->actingAs($user)
            ->get(route('super-admin.system-settings.index'))
            ->assertRedirect(route('dashboard'));
    }

    public function test_super_admin_can_update_system_settings(): void
    {
        $user = User::factory()->create([
            'role' => 'super_admin',
        ]);

        $this->actingAs($user)
            ->from(route('super-admin.system-settings.index'))
            ->patch(route('super-admin.system-settings.update'), [
                'billing_invoice_day' => 5,
                'billing_invoice_time' => '09:15',
                'billing_schedule_timezone' => 'Asia/Makassar',
                'saas_enforcement_time' => '01:30',
                'saas_schedule_timezone' => 'Asia/Makassar',
                'allow_public_registration' => true,
                'whatsapp_enabled' => true,
                'whatsapp_provider' => 'fonnte',
                'whatsapp_base_url' => 'https://wa.example.test/send',
                'whatsapp_auth_header' => 'Authorization',
                'whatsapp_timeout' => 15,
                'whatsapp_country_code' => '62',
                'whatsapp_token' => 'token-superadmin',
            ])
            ->assertRedirect(route('super-admin.system-settings.index'));

        $service = app(SystemSettingService::class);
        $this->assertSame(5, $service->getInt(SystemSettingService::KEY_BILLING_INVOICE_DAY));
        $this->assertTrue($service->getBool(SystemSettingService::KEY_ALLOW_PUBLIC_REGISTRATION));
        $this->assertTrue($service->getBool(SystemSettingService::KEY_WHATSAPP_ENABLED));
        $this->assertSame('token-superadmin', $service->getString(SystemSettingService::KEY_WHATSAPP_TOKEN));
    }
}
