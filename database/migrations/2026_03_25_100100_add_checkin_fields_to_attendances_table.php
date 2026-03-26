<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (! Schema::hasColumn('attendances', 'check_in_feedback')) {
                $table->text('check_in_feedback')->nullable()->after('check_out_at');
            }

            if (! Schema::hasColumn('attendances', 'check_in_mood')) {
                $table->string('check_in_mood', 30)->nullable()->after('check_in_feedback');
            }

            if (! Schema::hasColumn('attendances', 'absence_reason')) {
                $table->text('absence_reason')->nullable()->after('sensei_mood_assessment');
            }
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $dropColumns = [];

            if (Schema::hasColumn('attendances', 'check_in_feedback')) {
                $dropColumns[] = 'check_in_feedback';
            }
            if (Schema::hasColumn('attendances', 'check_in_mood')) {
                $dropColumns[] = 'check_in_mood';
            }
            if (Schema::hasColumn('attendances', 'absence_reason')) {
                $dropColumns[] = 'absence_reason';
            }

            if (! empty($dropColumns)) {
                $table->dropColumn($dropColumns);
            }
        });
    }
};

