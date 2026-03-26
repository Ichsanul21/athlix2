<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            if (! Schema::hasColumn('dojos', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('timezone');
            }
            if (! Schema::hasColumn('dojos', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }
            if (! Schema::hasColumn('dojos', 'geofence_radius_m')) {
                $table->unsignedInteger('geofence_radius_m')->default(120)->after('longitude');
            }
        });
    }

    public function down(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            $dropColumns = [];
            foreach (['latitude', 'longitude', 'geofence_radius_m'] as $column) {
                if (Schema::hasColumn('dojos', $column)) {
                    $dropColumns[] = $column;
                }
            }
            if (! empty($dropColumns)) {
                $table->dropColumn($dropColumns);
            }
        });
    }
};

