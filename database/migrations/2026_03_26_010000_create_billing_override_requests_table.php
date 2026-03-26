<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_override_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->enum('override_mode', ['fixed', 'discount_amount', 'discount_percent']);
            $table->decimal('override_value', 15, 2);
            $table->string('reason')->nullable();
            $table->date('valid_from')->nullable();
            $table->date('valid_to')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('review_note', 255)->nullable();
            $table->foreignId('applied_override_id')->nullable()->constrained('athlete_billing_overrides')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'athlete_id']);
            $table->index(['tenant_id', 'requested_by']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_override_requests');
    }
};
