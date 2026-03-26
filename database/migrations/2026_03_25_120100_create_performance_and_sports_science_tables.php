<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grading_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->foreignId('assessor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('belt_target_id')->nullable()->constrained('belts')->nullOnDelete();
            $table->dateTime('assessed_at');
            $table->unsignedTinyInteger('kihon_score');
            $table->unsignedTinyInteger('kata_score');
            $table->unsignedTinyInteger('kumite_score');
            $table->unsignedTinyInteger('final_score');
            $table->enum('recommendation', ['pass', 'remedial', 'hold'])->default('hold');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'athlete_id', 'assessed_at'], 'grading_assess_tenant_athlete_assessed_idx');
            $table->index(['tenant_id', 'recommendation'], 'grading_assess_tenant_reco_idx');
        });

        Schema::create('coach_session_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->nullable()->constrained('athletes')->nullOnDelete();
            $table->foreignId('sensei_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('training_program_id')->nullable()->constrained('training_programs')->nullOnDelete();
            $table->date('session_date');
            $table->enum('note_type', ['performance', 'behavior', 'technical', 'injury_alert'])->default('performance');
            $table->string('title', 255);
            $table->text('note');
            $table->enum('visibility', ['coach_only', 'athlete_visible', 'parent_visible'])->default('coach_only');
            $table->timestamps();

            $table->index(['tenant_id', 'session_date'], 'coach_notes_tenant_session_idx');
            $table->index(['tenant_id', 'athlete_id', 'session_date'], 'coach_notes_tenant_athlete_session_idx');
        });

        Schema::create('medical_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->foreignId('medical_staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('incident_date');
            $table->string('injury_area', 255)->nullable();
            $table->string('diagnosis', 255)->nullable();
            $table->text('rehab_protocol')->nullable();
            $table->enum('clearance_status', ['fit_to_fight', 'modified_training', 'rest'])->default('rest');
            $table->date('review_date')->nullable();
            $table->boolean('is_alert_sent')->default(false);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'athlete_id', 'incident_date'], 'medical_logs_tenant_athlete_incident_idx');
            $table->index(['tenant_id', 'clearance_status'], 'medical_logs_tenant_clearance_idx');
        });

        Schema::create('strength_conditioning_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('recorded_on');
            $table->decimal('one_rm_squat', 7, 2)->nullable();
            $table->decimal('one_rm_bench_press', 7, 2)->nullable();
            $table->decimal('vo2max', 6, 2)->nullable();
            $table->decimal('agility_t_test', 6, 2)->nullable();
            $table->decimal('countermovement_jump_cm', 6, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'athlete_id', 'recorded_on'], 'sc_metrics_tenant_athlete_recorded_idx');
            $table->index(['tenant_id', 'recorded_on'], 'sc_metrics_tenant_recorded_idx');
        });

        Schema::create('athlete_health_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->boolean('menstrual_tracking_enabled')->default(false);
            $table->timestamps();

            $table->unique(['tenant_id', 'athlete_id'], 'athlete_health_pref_tenant_athlete_uq');
        });

        Schema::create('menstrual_cycle_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->date('recorded_on');
            $table->enum('phase', ['menstrual', 'follicular', 'ovulation', 'luteal', 'unknown'])->default('unknown');
            $table->json('symptoms')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'athlete_id', 'recorded_on'], 'menstrual_cycle_tenant_athlete_recorded_idx');
            $table->unique(['tenant_id', 'athlete_id', 'recorded_on'], 'menstrual_cycle_unique_daily');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menstrual_cycle_logs');
        Schema::dropIfExists('athlete_health_preferences');
        Schema::dropIfExists('strength_conditioning_metrics');
        Schema::dropIfExists('medical_logs');
        Schema::dropIfExists('coach_session_notes');
        Schema::dropIfExists('grading_assessments');
    }
};
