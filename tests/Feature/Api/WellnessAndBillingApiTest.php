<?php

namespace Tests\Feature\Api;

use App\Models\Athlete;
use App\Models\Belt;
use App\Models\BillingDefault;
use App\Models\Dojo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WellnessAndBillingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_murid_can_store_readiness_and_rpe_logs_and_read_dashboard(): void
    {
        [$dojo, $athlete] = $this->seedAthleteFixture();
        $user = User::query()->create([
            'dojo_id' => $dojo->id,
            'athlete_id' => $athlete->id,
            'name' => 'Murid One',
            'email' => 'murid1@example.test',
            'password' => bcrypt('password'),
            'role' => 'murid',
            'email_verified_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $readinessResponse = $this->postJson('/api/v1/wellness/readiness', [
            'sleep_hours' => 7.2,
            'stress_level' => 4,
            'muscle_soreness' => 3,
            'hrv_score' => 58,
            'sync_status' => 'synced',
        ]);

        $readinessResponse->assertStatus(201)
            ->assertJsonPath('item.athlete_id', $athlete->id);
        $this->assertGreaterThanOrEqual(0, (int) $readinessResponse->json('item.readiness_percentage'));
        $this->assertLessThanOrEqual(100, (int) $readinessResponse->json('item.readiness_percentage'));

        $rpeResponse = $this->postJson('/api/v1/wellness/rpe-logs', [
            'session_date' => now()->toDateString(),
            'duration_minutes' => 90,
            'rpe_score' => 7,
            'sync_status' => 'synced',
        ]);

        $rpeResponse->assertStatus(201)
            ->assertJsonPath('item.athlete_id', $athlete->id);
        $this->assertEquals(630.0, (float) $rpeResponse->json('item.session_load'));
        $this->assertNotNull($rpeResponse->json('workload_snapshot.acute_load'));

        $dashboardResponse = $this->getJson('/api/v1/wellness/dashboard');
        $dashboardResponse->assertOk()
            ->assertJsonPath('athlete.id', $athlete->id)
            ->assertJsonStructure([
                'readiness' => ['latest', 'trend_7d'],
                'workload',
                'attendance' => ['streak'],
                'skill_radar',
            ]);
    }

    public function test_dojo_admin_can_generate_dynamic_billing_run(): void
    {
        [$dojo, $athlete] = $this->seedAthleteFixture();
        $admin = User::query()->create([
            'dojo_id' => $dojo->id,
            'name' => 'Dojo Admin',
            'email' => 'dojo-admin@example.test',
            'password' => bcrypt('password'),
            'role' => 'dojo_admin',
            'email_verified_at' => now(),
        ]);

        BillingDefault::query()->create([
            'tenant_id' => $dojo->id,
            'belt_id' => $athlete->current_belt_id,
            'monthly_fee' => 175000,
            'effective_from' => now()->startOfMonth()->toDateString(),
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/billing/dynamic/generate', [
            'period' => now()->format('Y-m'),
        ]);

        $response->assertOk()
            ->assertJsonPath('run.tenant_id', $dojo->id)
            ->assertJsonPath('run.status', 'completed');

        $this->assertDatabaseHas('billing_invoices', [
            'tenant_id' => $dojo->id,
            'athlete_id' => $athlete->id,
        ]);
        $this->assertDatabaseHas('finance_records', [
            'athlete_id' => $athlete->id,
        ]);

        $defaultsResponse = $this->getJson('/api/v1/billing/dynamic/defaults?tenant_id=' . $dojo->id);
        $defaultsResponse->assertOk()
            ->assertJsonPath('items.0.tenant_id', $dojo->id);

        $this->postJson('/api/v1/billing/dynamic/overrides', [
            'tenant_id' => $dojo->id,
            'athlete_id' => $athlete->id,
            'override_mode' => 'discount_amount',
            'override_value' => 10000,
            'reason' => 'Subsidi internal',
        ])->assertStatus(201);

        $overridesResponse = $this->getJson('/api/v1/billing/dynamic/overrides?tenant_id=' . $dojo->id);
        $overridesResponse->assertOk()
            ->assertJsonPath('items.0.tenant_id', $dojo->id)
            ->assertJsonPath('items.0.athlete_id', $athlete->id);
    }

    public function test_web_session_can_access_stateful_api_routes(): void
    {
        [$dojo, $athlete] = $this->seedAthleteFixture();
        $user = User::query()->create([
            'dojo_id' => $dojo->id,
            'athlete_id' => $athlete->id,
            'name' => 'Session User',
            'email' => 'session-user@example.test',
            'password' => bcrypt('password'),
            'role' => 'murid',
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user)->postJson('/api/v1/wellness/readiness', [
            'sleep_hours' => 7,
            'stress_level' => 4,
            'muscle_soreness' => 3,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('item.athlete_id', $athlete->id);
    }

    private function seedAthleteFixture(): array
    {
        $dojo = Dojo::query()->create([
            'name' => 'Dojo Test',
            'timezone' => 'Asia/Makassar',
            'is_active' => true,
        ]);

        $belt = Belt::query()->create([
            'name' => 'Putih',
            'color_hex' => '#FFFFFF',
            'order_level' => 1,
        ]);

        $athlete = Athlete::query()->create([
            'dojo_id' => $dojo->id,
            'current_belt_id' => $belt->id,
            'athlete_code' => 'ATH1001',
            'full_name' => 'Atlet Test',
            'dob' => '2010-01-01',
            'gender' => 'M',
            'specialization' => 'both',
            'class_note' => 'Umum',
        ]);

        return [$dojo, $athlete];
    }
}
