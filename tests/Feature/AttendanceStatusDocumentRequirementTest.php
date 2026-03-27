<?php

namespace Tests\Feature;

use App\Models\Athlete;
use App\Models\Dojo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AttendanceStatusDocumentRequirementTest extends TestCase
{
    use RefreshDatabase;

    public function test_sick_status_requires_document(): void
    {
        [$user, $athlete] = $this->seedAthleteUser('ATH-SICK-001');

        $response = $this->actingAs($user)
            ->from('/scan')
            ->post(route('attendance.mark-status'), [
                'athlete_code' => $athlete->athlete_code,
                'status' => 'sick',
                'absence_reason' => 'Demam tinggi',
            ]);

        $response->assertRedirect('/scan');
        $response->assertSessionHasErrors('absence_document');
    }

    public function test_excused_status_requires_document(): void
    {
        [$user, $athlete] = $this->seedAthleteUser('ATH-EXC-001');

        $response = $this->actingAs($user)
            ->from('/scan')
            ->post(route('attendance.mark-status'), [
                'athlete_code' => $athlete->athlete_code,
                'status' => 'excused',
                'absence_reason' => 'Ada urusan keluarga',
            ]);

        $response->assertRedirect('/scan');
        $response->assertSessionHasErrors('absence_document');
    }

    public function test_sick_and_excused_status_store_with_uploaded_document(): void
    {
        Storage::fake('public');
        [$user, $athlete] = $this->seedAthleteUser('ATH-DOC-001');

        $this->actingAs($user)
            ->from('/scan')
            ->post(route('attendance.mark-status'), [
                'athlete_code' => $athlete->athlete_code,
                'status' => 'sick',
                'absence_reason' => 'Flu',
                'absence_document' => UploadedFile::fake()->create('sakit.pdf', 120, 'application/pdf'),
            ])
            ->assertRedirect('/scan')
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('attendances', [
            'athlete_id' => $athlete->id,
            'status' => 'sick',
        ]);

        $this->actingAs($user)
            ->from('/scan')
            ->post(route('attendance.mark-status'), [
                'athlete_code' => $athlete->athlete_code,
                'status' => 'excused',
                'absence_reason' => 'Acara keluarga',
                'absence_document' => UploadedFile::fake()->image('izin.jpg'),
            ])
            ->assertRedirect('/scan')
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('attendances', [
            'athlete_id' => $athlete->id,
            'status' => 'excused',
        ]);
    }

    private function seedAthleteUser(string $athleteCode): array
    {
        $dojo = Dojo::factory()->create();

        $athlete = Athlete::query()->create([
            'dojo_id' => $dojo->id,
            'current_belt_id' => null,
            'athlete_code' => $athleteCode,
            'full_name' => 'Atlet Test ' . $athleteCode,
            'phone_number' => '0812' . str_pad((string) (abs(crc32($athleteCode)) % 100000000), 8, '0', STR_PAD_LEFT),
            'dob' => now()->subYears(15)->toDateString(),
            'gender' => 'M',
            'latest_weight' => 55.0,
            'specialization' => 'both',
        ]);

        $user = User::factory()->create([
            'dojo_id' => $dojo->id,
            'role' => 'murid',
            'athlete_id' => $athlete->id,
        ]);

        return [$user, $athlete];
    }
}
