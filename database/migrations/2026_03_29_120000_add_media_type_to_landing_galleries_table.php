<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('landing_galleries', function (Blueprint $table) {
            if (! Schema::hasColumn('landing_galleries', 'media_type')) {
                $table->string('media_type', 20)->default('image')->after('title');
            }

            if (! Schema::hasColumn('landing_galleries', 'video_url')) {
                $table->string('video_url')->nullable()->after('image_path');
            }
        });

        DB::table('landing_galleries')
            ->whereNull('media_type')
            ->update(['media_type' => 'image']);
    }

    public function down(): void
    {
        Schema::table('landing_galleries', function (Blueprint $table) {
            if (Schema::hasColumn('landing_galleries', 'video_url')) {
                $table->dropColumn('video_url');
            }

            if (Schema::hasColumn('landing_galleries', 'media_type')) {
                $table->dropColumn('media_type');
            }
        });
    }
};

