<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            $table->string('logo_path')->nullable();
            $table->string('accent_color')->nullable()->default('#dc2626'); // Red 600 default
        });
    }

    public function down(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            $table->dropColumn(['logo_path', 'accent_color']);
        });
    }
};
