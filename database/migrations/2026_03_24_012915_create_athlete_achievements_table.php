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
        Schema::create('athlete_achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('athlete_id')->constrained()->cascadeOnDelete();
            $table->string('competition_name');
            $table->string('competition_level'); // kabupaten, provinsi, nasional, internasional, dll
            $table->string('competition_type'); // kata, kumite, team, dll
            $table->string('category')->nullable();
            $table->string('result_title')->nullable(); // juara 1, finalis, etc.
            $table->date('competition_date');
            $table->string('location')->nullable();
            $table->string('organizer')->nullable();
            $table->string('certificate_path')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('athlete_achievements');
    }
};
