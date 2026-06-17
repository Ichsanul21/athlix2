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
        Schema::create('saas_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dojo_id')->constrained('dojos')->cascadeOnDelete();
            $table->string('order_id')->unique();
            $table->string('plan_name');
            $table->unsignedTinyInteger('billing_cycle_months')->default(1);
            $table->decimal('amount', 15, 2);
            $table->string('status')->default('pending'); // pending, paid, expired, failed
            $table->string('snap_token')->nullable();
            $table->string('payment_type')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('saas_orders');
    }
};
