<?php

namespace Tests\Feature\Auth;

use App\Models\Dojo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create([
            'role' => 'sensei',
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_athletes_can_authenticate_using_phone_number_only(): void
    {
        $user = User::factory()->create([
            'role' => 'murid',
            'phone_number' => '081234567890',
        ]);

        $response = $this->post('/login', [
            'identifier' => $user->phone_number,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('pwa.home', absolute: false));
    }

    public function test_parents_can_authenticate_using_phone_number(): void
    {
        $user = User::factory()->create([
            'role' => 'parent',
            'phone_number' => '081299887766',
        ]);

        $response = $this->post('/login', [
            'identifier' => $user->phone_number,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('pwa.home', absolute: false));
    }

    public function test_athletes_cannot_authenticate_using_email(): void
    {
        $user = User::factory()->create([
            'role' => 'murid',
        ]);

        $response = $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('identifier');
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create([
            'role' => 'sensei',
        ]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }

    public function test_tenant_users_cannot_login_when_dojo_is_inactive(): void
    {
        $dojo = Dojo::factory()->create([
            'is_active' => false,
        ]);

        $user = User::factory()->create([
            'role' => 'sensei',
            'dojo_id' => $dojo->id,
        ]);

        $response = $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('email');
    }

    public function test_tenant_users_cannot_login_when_subscription_has_expired(): void
    {
        $dojo = Dojo::factory()->create([
            'subscription_started_at' => now()->subMonths(2)->startOfMonth()->toDateString(),
            'subscription_expires_at' => now()->subDays(5)->toDateString(),
            'grace_period_ends_at' => now()->subDay()->toDateString(),
        ]);

        $user = User::factory()->create([
            'role' => 'dojo_admin',
            'dojo_id' => $dojo->id,
        ]);

        $response = $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('email');
    }

    public function test_tenant_users_cannot_login_when_dojo_is_blocked(): void
    {
        $dojo = Dojo::factory()->create([
            'is_saas_blocked' => true,
            'blocked_at' => now()->subDay(),
            'saas_block_reason' => 'Manual block test',
        ]);

        $user = User::factory()->create([
            'role' => 'head_coach',
            'dojo_id' => $dojo->id,
        ]);

        $response = $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('email');
    }
}
