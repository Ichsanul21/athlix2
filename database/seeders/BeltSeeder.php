<?php

namespace Database\Seeders;

use App\Models\Belt;
use Illuminate\Database\Seeder;

class BeltSeeder extends Seeder
{
    public function run(): void
    {
        $belts = [
            ['order_level' => 1, 'name' => 'Sabuk Putih', 'color_hex' => '#F9FAFB'],
            ['order_level' => 2, 'name' => 'Sabuk Kuning', 'color_hex' => '#FACC15'],
            ['order_level' => 3, 'name' => 'Sabuk Hijau', 'color_hex' => '#22C55E'],
            ['order_level' => 4, 'name' => 'Sabuk Biru', 'color_hex' => '#2563EB'],
            ['order_level' => 5, 'name' => 'Sabuk Coklat', 'color_hex' => '#92400E'],
            ['order_level' => 6, 'name' => 'Sabuk Hitam', 'color_hex' => '#111827'],
        ];

        foreach ($belts as $belt) {
            Belt::query()->updateOrCreate(
                ['order_level' => $belt['order_level']],
                $belt
            );
        }
    }
}
