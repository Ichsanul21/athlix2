<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (! Schema::hasColumn('attendances', 'post_training_mood_rating')) {
                $table->unsignedTinyInteger('post_training_mood_rating')->nullable()->after('athlete_mood');
            }

            if (! Schema::hasColumn('attendances', 'post_training_load_rating')) {
                $table->unsignedTinyInteger('post_training_load_rating')->nullable()->after('post_training_mood_rating');
            }

            if (! Schema::hasColumn('attendances', 'post_training_submitted_at')) {
                $table->timestamp('post_training_submitted_at')->nullable()->after('post_training_load_rating');
            }
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $columnsToDrop = [];

            if (Schema::hasColumn('attendances', 'post_training_mood_rating')) {
                $columnsToDrop[] = 'post_training_mood_rating';
            }

            if (Schema::hasColumn('attendances', 'post_training_load_rating')) {
                $columnsToDrop[] = 'post_training_load_rating';
            }

            if (Schema::hasColumn('attendances', 'post_training_submitted_at')) {
                $columnsToDrop[] = 'post_training_submitted_at';
            }

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};

