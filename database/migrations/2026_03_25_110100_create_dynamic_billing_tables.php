<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_defaults', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('belt_id')->nullable()->constrained('belts')->nullOnDelete();
            $table->string('class_note')->nullable();
            $table->decimal('monthly_fee', 15, 2);
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'class_note']);
            $table->index(['tenant_id', 'belt_id']);
        });

        Schema::create('athlete_billing_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->enum('override_mode', ['fixed', 'discount_amount', 'discount_percent']);
            $table->decimal('override_value', 15, 2);
            $table->string('reason')->nullable();
            $table->date('valid_from')->nullable();
            $table->date('valid_to')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'athlete_id']);
            $table->index(['tenant_id', 'valid_from', 'valid_to']);
        });

        Schema::create('invoice_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->string('period_key', 20); // e.g. 2026-03
            $table->date('period_start');
            $table->date('period_end');
            $table->date('scheduled_due_date');
            $table->enum('status', ['queued', 'processing', 'completed', 'failed'])->default('queued');
            $table->foreignId('initiated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('run_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'period_key']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('billing_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->foreignId('invoice_run_id')->nullable()->constrained('invoice_runs')->nullOnDelete();
            $table->string('invoice_no', 100);
            $table->date('period_start');
            $table->date('period_end');
            $table->date('due_date');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('total_due', 15, 2)->default(0);
            $table->enum('status', ['draft', 'unpaid', 'partial', 'paid', 'overdue', 'void'])->default('unpaid');
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'invoice_no']);
            $table->index(['tenant_id', 'athlete_id']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'due_date']);
        });

        Schema::create('billing_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('billing_invoices')->cascadeOnDelete();
            $table->string('item_type')->default('membership_fee');
            $table->string('description');
            $table->decimal('qty', 10, 2)->default(1);
            $table->decimal('unit_amount', 15, 2)->default(0);
            $table->decimal('amount', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('billing_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained('billing_invoices')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->enum('method', ['cash', 'bank_transfer', 'qris', 'gateway', 'other'])->default('cash');
            $table->string('reference_no')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'failed', 'void'])->default('confirmed');
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'invoice_id']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_payments');
        Schema::dropIfExists('billing_invoice_items');
        Schema::dropIfExists('billing_invoices');
        Schema::dropIfExists('invoice_runs');
        Schema::dropIfExists('athlete_billing_overrides');
        Schema::dropIfExists('billing_defaults');
    }
};

