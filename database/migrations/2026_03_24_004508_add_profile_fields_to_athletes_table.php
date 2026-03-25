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
        Schema::table('athletes', function (Blueprint $table) {
            $table->string('birth_place')->nullable()->after('full_name');
            $table->decimal('latest_height', 5, 2)->nullable()->after('latest_weight');
            $table->string('class_note')->nullable()->after('specialization');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('athletes', function (Blueprint $table) {
            $table->dropColumn(['birth_place', 'latest_height', 'class_note']);
        });
    }
};
