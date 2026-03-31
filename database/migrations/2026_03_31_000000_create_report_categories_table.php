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
        Schema::create('report_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dojo_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('unit')->default('repetition'); // duration or repetition
            $table->float('min_threshold')->default(0);
            $table->float('max_threshold')->default(100);
            $table->timestamps();
        });

        // Add a new column to athlete_reports to store scores as JSON
        // Using JSON instead of athlete_report_scores for flexibility and faster performance
        Schema::table('athlete_reports', function (Blueprint $table) {
            $table->json('dynamic_scores')->nullable()->after('notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('athlete_reports', function (Blueprint $table) {
            $table->dropColumn('dynamic_scores');
        });
        Schema::dropIfExists('report_categories');
    }
};
