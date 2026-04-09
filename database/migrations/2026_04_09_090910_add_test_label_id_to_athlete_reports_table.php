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
        Schema::table('athlete_reports', function (Blueprint $table) {
            $table->foreignId('test_label_id')->nullable()->after('athlete_id')->constrained('test_labels')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('athlete_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('test_label_id');
        });
    }
};
