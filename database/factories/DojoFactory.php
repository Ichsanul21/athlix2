<?php

namespace Database\Factories;

use App\Models\Dojo;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Dojo>
 */
class DojoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = Carbon::today()->startOfMonth();

        return [
            'name' => 'Dojo ' . fake()->city(),
            'timezone' => 'Asia/Makassar',
            'is_active' => true,
            'saas_plan_name' => 'Basic',
            'billing_cycle_months' => 1,
            'subscription_started_at' => $start->toDateString(),
            'subscription_expires_at' => $start->copy()->addMonth()->subDay()->toDateString(),
            'grace_period_ends_at' => $start->copy()->addMonth()->addDays(7)->toDateString(),
            'is_saas_blocked' => false,
            'saas_block_reason' => null,
            'blocked_at' => null,
        ];
    }
}
