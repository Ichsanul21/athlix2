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
            $table->string('province_code')->nullable()->after('class_note');
            $table->string('province_name')->nullable()->after('province_code');
            $table->string('regency_code')->nullable()->after('province_name');
            $table->string('regency_name')->nullable()->after('regency_code');
            $table->string('district_code')->nullable()->after('regency_name');
            $table->string('district_name')->nullable()->after('district_code');
            $table->string('village_code')->nullable()->after('district_name');
            $table->string('village_name')->nullable()->after('village_code');
            $table->text('address_detail')->nullable()->after('village_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('athletes', function (Blueprint $table) {
            $table->dropColumn([
                'province_code',
                'province_name',
                'regency_code',
                'regency_name',
                'district_code',
                'district_name',
                'village_code',
                'village_name',
                'address_detail',
            ]);
        });
    }
};
