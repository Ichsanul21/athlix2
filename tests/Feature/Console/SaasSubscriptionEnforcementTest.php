<?php

namespace Tests\Feature\Console;

use App\Models\Dojo;
use App\Models\User;
use App\Services\Saas\SaasSubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SaasSubscriptionEnforcementTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_auto_blocks_dojo_when_grace_period_has_ended(): void
    {
        Mail::fake();

        $dojo = Dojo::factory()->create([
            'subscription_started_at' => now()->subMonths(2)->startOfMonth()->toDateString(),
            'subscription_expires_at' => now()->subDays(8)->toDateString(),
            'grace_period_ends_at' => now()->subDays(1)->toDateString(),
            'is_saas_blocked' => false,
            'saas_block_reason' => null,
            'blocked_at' => null,
        ]);

        User::factory()->create([
            'role' => 'dojo_admin',
            'dojo_id' => $dojo->id,
            'email' => 'dojo-admin@example.test',
        ]);

        $this->artisan('saas:enforce-subscriptions')
            ->assertExitCode(0);

        $dojo->refresh();

        $this->assertTrue($dojo->is_saas_blocked);
        $this->assertSame(SaasSubscriptionService::AUTO_BLOCK_REASON, $dojo->saas_block_reason);
        $this->assertNotNull($dojo->blocked_at);
        $this->assertNotNull($dojo->last_notice_expired_sent_at);
    }

    public function test_it_sends_h7_reminder_once_per_day(): void
    {
        Mail::fake();

        $dojo = Dojo::factory()->create([
            'subscription_expires_at' => now()->addDays(7)->toDateString(),
            'grace_period_ends_at' => now()->addDays(10)->toDateString(),
            'last_notice_h7_sent_at' => null,
            'is_saas_blocked' => false,
        ]);

        User::factory()->create([
            'role' => 'dojo_admin',
            'dojo_id' => $dojo->id,
            'email' => 'dojo-admin-h7@example.test',
        ]);

        $this->artisan('saas:enforce-subscriptions')
            ->assertExitCode(0);

        $dojo->refresh();
        $this->assertSame(now()->toDateString(), $dojo->last_notice_h7_sent_at?->toDateString());
        $this->assertNull($dojo->last_notice_h1_sent_at);

        // Same day run should not duplicate reminder.
        $this->artisan('saas:enforce-subscriptions')
            ->assertExitCode(0);

        $dojo->refresh();
        $this->assertSame(now()->toDateString(), $dojo->last_notice_h7_sent_at?->toDateString());
    }
}
