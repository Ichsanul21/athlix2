<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            $table->string('ppa_file_path')->nullable()->after('branding');
            $table->string('ppa_file_name')->nullable()->after('ppa_file_path');
            $table->bigInteger('ppa_file_size')->nullable()->after('ppa_file_name');
            $table->timestamp('ppa_uploaded_at')->nullable()->after('ppa_file_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            $table->dropColumn(['ppa_file_path', 'ppa_file_name', 'ppa_file_size', 'ppa_uploaded_at']);
        });
    }
};
