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
            $table->string('ppa_file_path')->nullable();
            $table->string('ppa_file_name')->nullable();
            $table->unsignedBigInteger('ppa_file_size')->nullable(); // in bytes
            $table->timestamp('ppa_uploaded_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('athletes', function (Blueprint $table) {
            $table->dropColumn([
                'ppa_file_path',
                'ppa_file_name',
                'ppa_file_size',
                'ppa_uploaded_at'
            ]);
        });
    }
};
