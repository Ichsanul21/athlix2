<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            if (! Schema::hasColumn('dojos', 'country')) {
                $table->string('country', 3)->default('ID')->after('name');
            }
            if (! Schema::hasColumn('dojos', 'province_code')) {
                $table->string('province_code', 10)->nullable()->after('country');
            }
            if (! Schema::hasColumn('dojos', 'province_name')) {
                $table->string('province_name', 100)->nullable()->after('province_code');
            }
            if (! Schema::hasColumn('dojos', 'regency_code')) {
                $table->string('regency_code', 10)->nullable()->after('province_name');
            }
            if (! Schema::hasColumn('dojos', 'regency_name')) {
                $table->string('regency_name', 100)->nullable()->after('regency_code');
            }
            if (! Schema::hasColumn('dojos', 'district_code')) {
                $table->string('district_code', 15)->nullable()->after('regency_name');
            }
            if (! Schema::hasColumn('dojos', 'district_name')) {
                $table->string('district_name', 100)->nullable()->after('district_code');
            }
            if (! Schema::hasColumn('dojos', 'village_code')) {
                $table->string('village_code', 20)->nullable()->after('district_name');
            }
            if (! Schema::hasColumn('dojos', 'village_name')) {
                $table->string('village_name', 100)->nullable()->after('village_code');
            }
            if (! Schema::hasColumn('dojos', 'address_detail')) {
                $table->text('address_detail')->nullable()->after('village_name');
            }
            if (! Schema::hasColumn('dojos', 'monthly_saas_fee')) {
                $table->decimal('monthly_saas_fee', 15, 2)->default(300000)->after('saas_plan_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            foreach ([
                'country',
                'province_code',
                'province_name',
                'regency_code',
                'regency_name',
                'district_code',
                'district_name',
                'village_code',
                'village_name',
                'address_detail',
                'monthly_saas_fee',
            ] as $column) {
                if (Schema::hasColumn('dojos', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
