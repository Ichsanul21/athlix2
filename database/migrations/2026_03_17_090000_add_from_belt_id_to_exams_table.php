<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            if (!Schema::hasColumn('exams', 'from_belt_id')) {
                $table->foreignId('from_belt_id')
                    ->nullable()
                    ->after('belt_id')
                    ->constrained('belts')
                    ->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            if (Schema::hasColumn('exams', 'from_belt_id')) {
                $table->dropConstrainedForeignId('from_belt_id');
            }
        });
    }
};
