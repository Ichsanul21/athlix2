<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('billing_defaults', 'belt_id')) {
            Schema::table('billing_defaults', function (Blueprint $table) {
                $table->renameColumn('belt_id', 'level_id');
            });
        }

        if (Schema::hasColumn('grading_assessments', 'belt_target_id')) {
            Schema::table('grading_assessments', function (Blueprint $table) {
                $table->renameColumn('belt_target_id', 'level_target_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('billing_defaults', 'level_id')) {
            Schema::table('billing_defaults', function (Blueprint $table) {
                $table->renameColumn('level_id', 'belt_id');
            });
        }

        if (Schema::hasColumn('grading_assessments', 'level_target_id')) {
            Schema::table('grading_assessments', function (Blueprint $table) {
                $table->renameColumn('level_target_id', 'belt_target_id');
            });
        }
    }
};
