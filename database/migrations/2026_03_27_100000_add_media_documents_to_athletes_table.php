<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('athletes', function (Blueprint $table) {
            if (! Schema::hasColumn('athletes', 'photo_path')) {
                $table->string('photo_path')->nullable()->after('phone_number');
            }

            if (! Schema::hasColumn('athletes', 'doc_kk_path')) {
                $table->string('doc_kk_path')->nullable()->after('photo_path');
            }

            if (! Schema::hasColumn('athletes', 'doc_akte_path')) {
                $table->string('doc_akte_path')->nullable()->after('doc_kk_path');
            }

            if (! Schema::hasColumn('athletes', 'doc_ktp_path')) {
                $table->string('doc_ktp_path')->nullable()->after('doc_akte_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('athletes', function (Blueprint $table) {
            $columnsToDrop = [];

            if (Schema::hasColumn('athletes', 'photo_path')) {
                $columnsToDrop[] = 'photo_path';
            }

            if (Schema::hasColumn('athletes', 'doc_kk_path')) {
                $columnsToDrop[] = 'doc_kk_path';
            }

            if (Schema::hasColumn('athletes', 'doc_akte_path')) {
                $columnsToDrop[] = 'doc_akte_path';
            }

            if (Schema::hasColumn('athletes', 'doc_ktp_path')) {
                $columnsToDrop[] = 'doc_ktp_path';
            }

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};

