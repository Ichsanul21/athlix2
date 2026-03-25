<?php

namespace Tests\Feature;

use App\Models\Athlete;
use App\Models\Dojo;
use App\Models\FinanceRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceBlockingTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkin_is_blocked_when_athlete_has_unpaid_invoice(): void
    {
        $dojo = Dojo::create([
            'name' => 'Dojo Test',
            'timezone' => 'Asia/Jakarta',
            'attendance_secret' => 'ABCDEFGHIJKLMNOP',
            'is_active' => true,
        ]);

        $sensei = User::factory()->create([
            'role' => 'sensei',
            'dojo_id' => $dojo->id,
            'email_verified_at' => now(),
        ]);

        $athlete = Athlete::create([
            'dojo_id' => $dojo->id,
            'athlete_code' => 'ATH9001',
            'full_name' => 'Atlet Tunggakan',
            'phone_number' => '628123450000',
            'dob' => now()->subYears(15)->format('Y-m-d'),
            'gender' => 'M',
            'specialization' => 'kumite',
        ]);

        FinanceRecord::create([
            'athlete_id' => $athlete->id,
            'amount' => 150000,
            'description' => 'Iuran Bulanan Test',
            'status' => 'unpaid',
            'due_date' => now()->addDays(5)->format('Y-m-d'),
        ]);

        $response = $this
            ->actingAs($sensei)
            ->from(route('attendance.index'))
            ->post(route('attendance.store'), [
                'athlete_code' => $athlete->athlete_code,
            ]);

        $response
            ->assertRedirect(route('attendance.index'))
            ->assertSessionHasErrors('athlete_code');
    }
}

