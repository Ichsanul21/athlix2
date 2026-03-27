<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (! Schema::hasColumn('attendances', 'absence_document_path')) {
                $table->string('absence_document_path')->nullable()->after('absence_reason');
            }

            if (! Schema::hasColumn('attendances', 'absence_document_mime')) {
                $table->string('absence_document_mime', 100)->nullable()->after('absence_document_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $columnsToDrop = [];

            if (Schema::hasColumn('attendances', 'absence_document_path')) {
                $columnsToDrop[] = 'absence_document_path';
            }

            if (Schema::hasColumn('attendances', 'absence_document_mime')) {
                $columnsToDrop[] = 'absence_document_mime';
            }

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};

