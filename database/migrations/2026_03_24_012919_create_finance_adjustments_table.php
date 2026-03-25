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
        Schema::create('finance_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('finance_record_id')->constrained('finance_records')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained()->cascadeOnDelete();
            $table->foreignId('source_athlete_id')->nullable()->constrained('athletes')->nullOnDelete();
            $table->decimal('old_amount', 15, 2);
            $table->decimal('new_amount', 15, 2);
            $table->decimal('delta_amount', 15, 2);
            $table->string('reason')->nullable();
            $table->foreignId('adjusted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('finance_adjustments');
    }
};
