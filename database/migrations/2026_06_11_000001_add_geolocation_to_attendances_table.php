<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (! Schema::hasColumn('attendances', 'check_in_lat')) {
                $table->decimal('check_in_lat', 10, 7)->nullable()->after('check_in_at');
            }
            if (! Schema::hasColumn('attendances', 'check_in_lng')) {
                $table->decimal('check_in_lng', 10, 7)->nullable()->after('check_in_lat');
            }
            if (! Schema::hasColumn('attendances', 'check_out_lat')) {
                $table->decimal('check_out_lat', 10, 7)->nullable()->after('check_out_at');
            }
            if (! Schema::hasColumn('attendances', 'check_out_lng')) {
                $table->decimal('check_out_lng', 10, 7)->nullable()->after('check_out_lat');
            }
        });
    }

    public function down(): void
    { 
        Schema::table('attendances', function (Blueprint $table) {
            $drop = [];
            foreach (['check_in_lat', 'check_in_lng', 'check_out_lat', 'check_out_lng'] as $col) {
                if (Schema::hasColumn('attendances', $col)) {
                    $drop[] = $col;
                }
            }
            if ($drop) {
                $table->dropColumn($drop);
            }
        });
    }
};
