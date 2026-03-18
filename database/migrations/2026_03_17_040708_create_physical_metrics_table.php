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
        Schema::create('physical_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('athlete_id')->constrained()->onDelete('cascade');
            $table->float('height')->nullable();
            $table->float('weight')->nullable();
            $table->float('bmi')->nullable();
            $table->integer('systolic')->nullable();
            $table->integer('diastolic')->nullable();
            $table->integer('heart_rate')->nullable();
            $table->date('recorded_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('physical_metrics');
    }
};
