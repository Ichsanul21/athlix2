<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wellness_readiness_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('recorded_on');
            $table->decimal('hrv_score', 6, 2)->nullable();
            $table->decimal('sleep_hours', 4, 2)->nullable();
            $table->unsignedTinyInteger('stress_level')->nullable(); // 1-10
            $table->unsignedTinyInteger('muscle_soreness')->nullable(); // 1-10
            $table->unsignedSmallInteger('resting_hr')->nullable();
            $table->string('menstrual_phase', 40)->nullable();
            $table->text('notes')->nullable();
            $table->unsignedTinyInteger('readiness_percentage');
            $table->enum('sync_status', ['pending', 'synced', 'failed'])->default('pending');
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'athlete_id', 'recorded_on'], 'wellness_readiness_unique_daily');
            $table->index(['tenant_id', 'recorded_on']);
            $table->index(['tenant_id', 'athlete_id', 'created_at']);
        });

        Schema::create('wellness_rpe_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->foreignId('training_program_id')->nullable()->constrained('training_programs')->nullOnDelete();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('session_date');
            $table->unsignedSmallInteger('duration_minutes');
            $table->unsignedTinyInteger('rpe_score'); // 1-10
            $table->decimal('session_load', 10, 2); // duration * RPE
            $table->text('notes')->nullable();
            $table->enum('sync_status', ['pending', 'synced', 'failed'])->default('pending');
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'athlete_id', 'session_date']);
            $table->index(['tenant_id', 'session_date']);
        });

        Schema::create('wellness_workload_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->date('snapshot_date');
            $table->decimal('acute_load', 10, 2)->default(0);
            $table->decimal('chronic_load', 10, 2)->default(0);
            $table->decimal('acwr_ratio', 6, 3)->nullable();
            $table->enum('risk_band', ['low', 'moderate', 'high', 'very_high'])->default('low');
            $table->timestamp('calculated_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'athlete_id', 'snapshot_date'], 'wellness_workload_unique_daily');
            $table->index(['tenant_id', 'snapshot_date']);
            $table->index(['tenant_id', 'risk_band']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wellness_workload_snapshots');
        Schema::dropIfExists('wellness_rpe_logs');
        Schema::dropIfExists('wellness_readiness_logs');
    }
};
