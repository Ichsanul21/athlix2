<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('exams');
    }

    public function down(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->foreignId('belt_id')->constrained('belts')->cascadeOnDelete();
            $table->foreignId('from_belt_id')->nullable()->constrained('belts')->nullOnDelete();
            $table->date('exam_date');
            $table->enum('status', ['pending', 'passed', 'failed'])->default('pending');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }
};
