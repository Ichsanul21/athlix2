<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Rename belts to levels
        Schema::rename('belts', 'levels');

        Schema::table('levels', function (Blueprint $table) {
            $table->foreignId('dojo_id')->nullable()->after('id')->constrained('dojos')->onDelete('cascade');
        });

        // 2. Create specializations table
        Schema::create('specializations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dojo_id')->constrained('dojos')->onDelete('cascade');
            $table->string('name');
            $table->timestamps();
        });

        // 3. Update athletes table
        Schema::table('athletes', function (Blueprint $table) {
            // Drop old foreign key if exists
            $table->dropForeign(['current_belt_id']);
            $table->renameColumn('current_belt_id', 'level_id');
            
            // Add specialization_id
            $table->foreignId('specialization_id')->nullable()->after('level_id')->constrained('specializations')->onDelete('set null');
        });

        // 4. Migrate existing specialization enum to specializations table
        // We'll do this in a follow-up or here if we have dojos.
        // For each dojo, create 'Kata', 'Kumite', 'Kata & Kumite' as default specializations
        $dojos = DB::table('dojos')->get();
        foreach ($dojos as $dojo) {
            $specIdKata = DB::table('specializations')->insertGetId([
                'dojo_id' => $dojo->id,
                'name' => 'Kata',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $specIdKumite = DB::table('specializations')->insertGetId([
                'dojo_id' => $dojo->id,
                'name' => 'Kumite',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $specIdBoth = DB::table('specializations')->insertGetId([
                'dojo_id' => $dojo->id,
                'name' => 'Kata & Kumite',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Update athletes for this dojo
            DB::table('athletes')->where('dojo_id', $dojo->id)->where('specialization', 'kata')->update(['specialization_id' => $specIdKata]);
            DB::table('athletes')->where('dojo_id', $dojo->id)->where('specialization', 'kumite')->update(['specialization_id' => $specIdKumite]);
            DB::table('athletes')->where('dojo_id', $dojo->id)->where('specialization', 'both')->update(['specialization_id' => $specIdBoth]);

            // Also assign existing levels to this dojo if they are orphaned (global)
            // But wait, if there are multiple dojos, they might all want the same levels initially.
            // Let's copy existing global levels to each dojo if levels are currently shared.
        }

        // Handle existing levels: if they are currently global, we might want to copy them to each dojo
        // or just link them to the first dojo.
        // To be safe, let's just make them available to all dojos by leaving dojo_id null,
        // but the user wants "tiap club bisa menentukan levelnya sendiri".
        // So I should probably clone them for each dojo.
        $existingLevels = DB::table('levels')->whereNull('dojo_id')->get();
        if ($existingLevels->isNotEmpty() && $dojos->isNotEmpty()) {
            foreach ($dojos as $dojo) {
                foreach ($existingLevels as $level) {
                    $newLevelId = DB::table('levels')->insertGetId([
                        'dojo_id' => $dojo->id,
                        'name' => $level->name,
                        'color_hex' => $level->color_hex,
                        'order_level' => $level->order_level,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    // Update athletes that were using the old global level
                    DB::table('athletes')->where('dojo_id', $dojo->id)->where('level_id', $level->id)->update(['level_id' => $newLevelId]);
                }
            }
            // Now we can delete the global ones or leave them. Let's delete them.
            DB::table('levels')->whereNull('dojo_id')->delete();
        }

        // Finally, add foreign key back for level_id
        Schema::table('athletes', function (Blueprint $table) {
            $table->foreign('level_id')->references('id')->on('levels')->onDelete('set null');
        });

        // Drop the old specialization enum column
        Schema::table('athletes', function (Blueprint $table) {
            $table->dropColumn('specialization');
        });
    }

    public function down(): void
    {
        Schema::table('athletes', function (Blueprint $table) {
            $table->enum('specialization', ['kata', 'kumite', 'both'])->default('both');
            $table->dropForeign(['specialization_id']);
            $table->dropColumn('specialization_id');
            $table->dropForeign(['level_id']);
            $table->renameColumn('level_id', 'current_belt_id');
            $table->foreign('current_belt_id')->references('id')->on('levels');
        });

        Schema::dropIfExists('specializations');

        Schema::table('levels', function (Blueprint $table) {
            $table->dropForeign(['dojo_id']);
            $table->dropColumn('dojo_id');
        });

        Schema::rename('levels', 'belts');
    }
};
