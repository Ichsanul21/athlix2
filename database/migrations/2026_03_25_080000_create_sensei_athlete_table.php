<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sensei_athlete', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sensei_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->foreignId('dojo_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['sensei_id', 'athlete_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sensei_athlete');
    }
};
