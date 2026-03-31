<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Seed default report categories for existing dojos that don't have any yet.
     */
    public function up(): void
    {
        $defaultCategories = [
            ['name' => 'Power', 'unit' => 'repetition', 'min_threshold' => 0, 'max_threshold' => 100],
            ['name' => 'Strength', 'unit' => 'repetition', 'min_threshold' => 0, 'max_threshold' => 100],
            ['name' => 'Endurance', 'unit' => 'repetition', 'min_threshold' => 0, 'max_threshold' => 100],
            ['name' => 'Speed', 'unit' => 'duration', 'min_threshold' => 30, 'max_threshold' => 10],
            ['name' => 'Agility', 'unit' => 'duration', 'min_threshold' => 20, 'max_threshold' => 5],
            ['name' => 'Core', 'unit' => 'repetition', 'min_threshold' => 0, 'max_threshold' => 100],
            ['name' => 'Flexibility', 'unit' => 'repetition', 'min_threshold' => 0, 'max_threshold' => 100],
        ];

        // Get all dojo IDs that don't have any report categories yet
        $dojoIds = DB::table('dojos')
            ->whereNotIn('id', DB::table('report_categories')->select('dojo_id')->whereNotNull('dojo_id')->distinct())
            ->pluck('id');

        foreach ($dojoIds as $dojoId) {
            foreach ($defaultCategories as $category) {
                DB::table('report_categories')->insert(array_merge($category, [
                    'dojo_id' => $dojoId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We can't reliably reverse seeded data
    }
};
