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
        Schema::create('athletes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dojo_id')->constrained('dojos');
            $table->foreignId('current_belt_id')->nullable()->constrained('belts');
            $table->string('athlete_code')->unique();
            $table->string('full_name');
            $table->string('phone_number')->nullable();
            $table->date('dob');
            $table->enum('gender', ['M', 'F']);
            $table->decimal('latest_weight', 5, 2)->nullable();
            $table->enum('specialization', ['kata', 'kumite', 'both'])->default('both');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('athletes');
    }
};
