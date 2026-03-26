<?php

namespace Tests\Feature\Console;

use App\Models\Dojo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class SaasSubscriptionEnforcementWhatsAppTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_sends_whatsapp_h7_reminder_when_enabled(): void
    {
        config([
            'system.whatsapp.enabled' => true,
            'system.whatsapp.provider' => 'fonnte',
            'system.whatsapp.base_url' => 'https://wa.example.test/send',
            'system.whatsapp.token' => 'token-123',
            'system.whatsapp.auth_header' => 'Authorization',
            'system.whatsapp.country_code' => '62',
            'system.whatsapp.timeout' => 10,
        ]);

        Http::fake([
            'https://wa.example.test/send' => Http::response(['ok' => true], 200),
        ]);

        $dojo = Dojo::factory()->create([
            'subscription_expires_at' => now()->addDays(7)->toDateString(),
            'grace_period_ends_at' => now()->addDays(10)->toDateString(),
            'last_notice_h7_sent_at' => null,
        ]);

        User::factory()->create([
            'role' => 'dojo_admin',
            'dojo_id' => $dojo->id,
            'email' => 'dojo-wa-admin@example.test',
            'phone_number' => '081234567890',
        ]);

        $this->artisan('saas:enforce-subscriptions')
            ->assertExitCode(0);

        Http::assertSent(function ($request) {
            if ($request->url() !== 'https://wa.example.test/send') {
                return false;
            }

            $data = $request->data();

            return ($request->header('Authorization')[0] ?? null) === 'token-123'
                && ($data['target'] ?? null) === '6281234567890'
                && Str::contains((string) ($data['message'] ?? ''), 'ATHLIX SaaS Reminder');
        });
    }
}
