<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (! Schema::hasColumn('attendances', 'check_in_at')) {
                $table->timestamp('check_in_at')->nullable()->after('recorded_at');
            }
            if (! Schema::hasColumn('attendances', 'check_out_at')) {
                $table->timestamp('check_out_at')->nullable()->after('check_in_at');
            }
            if (! Schema::hasColumn('attendances', 'athlete_feedback')) {
                $table->text('athlete_feedback')->nullable()->after('check_out_at');
            }
            if (! Schema::hasColumn('attendances', 'athlete_mood')) {
                $table->string('athlete_mood', 30)->nullable()->after('athlete_feedback');
            }
            if (! Schema::hasColumn('attendances', 'sensei_feedback')) {
                $table->text('sensei_feedback')->nullable()->after('athlete_mood');
            }
            if (! Schema::hasColumn('attendances', 'sensei_mood_assessment')) {
                $table->string('sensei_mood_assessment', 30)->nullable()->after('sensei_feedback');
            }
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn([
                'check_in_at',
                'check_out_at',
                'athlete_feedback',
                'athlete_mood',
                'sensei_feedback',
                'sensei_mood_assessment',
            ]);
        });
    }
};
