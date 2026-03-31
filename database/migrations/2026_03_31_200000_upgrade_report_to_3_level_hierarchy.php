<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Upgrade report system to 3-level hierarchy:
     * report_categories (Power, Strength, …)
     *   └─ report_sub_categories (Tangan, Kaki, Perut, …)
     *       └─ report_tests (Push Up, Pull Up, …) ← has thresholds
     *
     * Moves threshold data from report_categories into report_tests.
     */
    public function up(): void
    {
        // 1) Create sub-categories table
        Schema::create('report_sub_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_category_id')->constrained('report_categories')->cascadeOnDelete();
            $table->string('name');             // e.g. "Tangan", "Kaki", "Perut"
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // 2) Repurpose the empty report_tests table
        Schema::dropIfExists('report_tests');
        Schema::create('report_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_sub_category_id')->constrained('report_sub_categories')->cascadeOnDelete();
            $table->string('name');             // e.g. "Push Up", "Sprint 100m"
            $table->string('unit')->default('repetition'); // 'duration' | 'repetition'
            $table->float('min_threshold')->default(0);
            $table->float('max_threshold')->default(100);
            $table->unsignedInteger('max_duration_seconds')->nullable(); // time limit for repetition tests
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // 3) Clean up report_categories: remove threshold columns (moved to tests)
        //    Keep: id, dojo_id, name, timestamps
        Schema::table('report_categories', function (Blueprint $table) {
            if (Schema::hasColumn('report_categories', 'unit')) {
                $table->dropColumn(['unit', 'min_threshold', 'max_threshold']);
            }
        });

        // 4) Add sort_order to report_categories
        if (! Schema::hasColumn('report_categories', 'sort_order')) {
            Schema::table('report_categories', function (Blueprint $table) {
                $table->unsignedInteger('sort_order')->default(0)->after('name');
            });
        }

        // 5) Seed default sub-categories & tests for each existing category
        $this->seedDefaultHierarchy();
    }

    /**
     * For every existing report_category row, create a single
     * "General" sub-category with one test of the same name.
     */
    private function seedDefaultHierarchy(): void
    {
        $categories = DB::table('report_categories')->get();

        // Determine defaults based on category name
        $defaults = [
            'Power' => [
                ['sub' => 'Upper Body', 'tests' => [
                    ['name' => 'Standing Long Jump', 'unit' => 'repetition', 'min' => 0, 'max' => 100],
                    ['name' => 'Medicine Ball Throw', 'unit' => 'repetition', 'min' => 0, 'max' => 100],
                ]],
                ['sub' => 'Lower Body', 'tests' => [
                    ['name' => 'Box Jump', 'unit' => 'repetition', 'min' => 0, 'max' => 50],
                ]],
            ],
            'Strength' => [
                ['sub' => 'Upper Body', 'tests' => [
                    ['name' => 'Push Up', 'unit' => 'repetition', 'min' => 0, 'max' => 100, 'max_dur' => 60],
                    ['name' => 'Pull Up', 'unit' => 'repetition', 'min' => 0, 'max' => 30],
                ]],
                ['sub' => 'Lower Body', 'tests' => [
                    ['name' => 'Squat', 'unit' => 'repetition', 'min' => 0, 'max' => 100, 'max_dur' => 60],
                ]],
            ],
            'Endurance' => [
                ['sub' => 'Cardio', 'tests' => [
                    ['name' => 'Lari 12 Menit', 'unit' => 'repetition', 'min' => 0, 'max' => 3000],
                ]],
            ],
            'Speed' => [
                ['sub' => 'Sprint', 'tests' => [
                    ['name' => 'Sprint 30m', 'unit' => 'duration', 'min' => 10, 'max' => 3],
                ]],
            ],
            'Agility' => [
                ['sub' => 'Shuttle', 'tests' => [
                    ['name' => 'Shuttle Run', 'unit' => 'duration', 'min' => 20, 'max' => 8],
                    ['name' => 'T-Test', 'unit' => 'duration', 'min' => 15, 'max' => 8],
                ]],
            ],
            'Core' => [
                ['sub' => 'Perut', 'tests' => [
                    ['name' => 'Sit Up', 'unit' => 'repetition', 'min' => 0, 'max' => 100, 'max_dur' => 60],
                    ['name' => 'Plank Hold', 'unit' => 'duration', 'min' => 0, 'max' => 180],
                ]],
            ],
            'Flexibility' => [
                ['sub' => 'General', 'tests' => [
                    ['name' => 'Sit and Reach', 'unit' => 'repetition', 'min' => 0, 'max' => 50],
                ]],
            ],
        ];

        foreach ($categories as $cat) {
            $subData = $defaults[$cat->name] ?? [
                ['sub' => 'General', 'tests' => [
                    ['name' => $cat->name . ' Test', 'unit' => 'repetition', 'min' => 0, 'max' => 100],
                ]],
            ];

            foreach ($subData as $si => $subItem) {
                $subId = DB::table('report_sub_categories')->insertGetId([
                    'report_category_id' => $cat->id,
                    'name' => $subItem['sub'],
                    'sort_order' => $si,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                foreach ($subItem['tests'] as $ti => $test) {
                    DB::table('report_tests')->insert([
                        'report_sub_category_id' => $subId,
                        'name' => $test['name'],
                        'unit' => $test['unit'],
                        'min_threshold' => $test['min'],
                        'max_threshold' => $test['max'],
                        'max_duration_seconds' => $test['max_dur'] ?? null,
                        'sort_order' => $ti,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('report_tests');
        Schema::dropIfExists('report_sub_categories');

        // Re-add threshold columns to report_categories
        if (! Schema::hasColumn('report_categories', 'unit')) {
            Schema::table('report_categories', function (Blueprint $table) {
                $table->string('unit')->default('repetition')->after('name');
                $table->float('min_threshold')->default(0)->after('unit');
                $table->float('max_threshold')->default(100)->after('min_threshold');
            });
        }

        if (Schema::hasColumn('report_categories', 'sort_order')) {
            Schema::table('report_categories', function (Blueprint $table) {
                $table->dropColumn('sort_order');
            });
        }
    }
};
