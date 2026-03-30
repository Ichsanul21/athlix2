<?php

namespace Database\Seeders;

use App\Models\Athlete;
use App\Models\AthleteNotification;
use App\Models\AthleteNotificationRead;
use App\Models\NotificationDevice;
use App\Models\User;
use Illuminate\Database\Seeder;

class NotificationDomainSeeder extends Seeder
{
    public function run(): void
    {
        $athletesByDojo = Athlete::query()->orderBy('id')->get()->groupBy('dojo_id');
        $sendersByDojo = User::query()
            ->whereIn('role', ['sensei', 'head_coach', 'assistant'])
            ->orderBy('id')
            ->get()
            ->groupBy('dojo_id');

        foreach ($athletesByDojo as $dojoId => $athletes) {
            $senderId = $sendersByDojo->get($dojoId, collect())->first()?->id;

            $broadcast = AthleteNotification::query()->create([
                'dojo_id' => $dojoId,
                'athlete_id' => null,
                'sender_id' => $senderId,
                'title' => 'Update Latihan Mingguan',
                'message' => 'Jangan lupa isi kondisi fisik harian dan hadir tepat waktu di sesi pekan ini.',
                'is_popup' => true,
                'is_active' => true,
                'published_at' => now()->subHours(12),
                'expires_at' => now()->addDays(5),
            ]);

            $targetAthlete = $athletes->first();
            if ($targetAthlete) {
                AthleteNotification::query()->create([
                    'dojo_id' => $dojoId,
                    'athlete_id' => $targetAthlete->id,
                    'sender_id' => $senderId,
                    'title' => 'Notifikasi Khusus Atlet',
                    'message' => 'Kamu masuk list evaluasi teknik pekan ini. Siapkan video drill mandiri.',
                    'is_popup' => true,
                    'is_active' => true,
                    'published_at' => now()->subHours(8),
                    'expires_at' => now()->addDays(4),
                ]);
            }

            $athletes->take(3)->values()->each(function (Athlete $athlete, int $idx) use ($broadcast) {
                if ($idx % 2 !== 0) {
                    return;
                }

                AthleteNotificationRead::query()->create([
                    'notification_id' => $broadcast->id,
                    'athlete_id' => $athlete->id,
                    'read_at' => now()->subHours(2),
                ]);
            });
        }

        $usersForDevice = User::query()
            ->whereIn('role', ['atlet', 'parent'])
            ->orderBy('id')
            ->limit(20)
            ->get();

        foreach ($usersForDevice as $index => $user) {
            $pushToken = 'seed-webpush-token-' . $user->id . '-' . $index;
            NotificationDevice::query()->create([
                'tenant_id' => $user->dojo_id,
                'user_id' => $user->id,
                'platform' => 'webpush',
                'device_label' => 'Seed Device #' . ($index + 1),
                'push_token' => $pushToken,
                'token_hash' => hash('sha256', $pushToken),
                'last_seen_at' => now()->subMinutes($index * 5),
                'is_active' => true,
            ]);
        }
    }
}
