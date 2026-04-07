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
        Schema::table('landing_price_lists', function (Blueprint $table) {
            if (!Schema::hasColumn('landing_price_lists', 'is_custom')) {
                $table->boolean('is_custom')->default(false)->after('is_featured');
            }
            if (!Schema::hasColumn('landing_price_lists', 'custom_label')) {
                $table->string('custom_label')->nullable()->after('is_custom');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('landing_price_lists', function (Blueprint $table) {
            if (Schema::hasColumn('landing_price_lists', 'is_custom')) {
                $table->dropColumn('is_custom');
            }
            if (Schema::hasColumn('landing_price_lists', 'custom_label')) {
                $table->dropColumn('custom_label');
            }
        });
    }
};
