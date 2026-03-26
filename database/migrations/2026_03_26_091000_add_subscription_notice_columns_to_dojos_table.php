<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            if (! Schema::hasColumn('dojos', 'last_notice_h7_sent_at')) {
                $table->date('last_notice_h7_sent_at')->nullable()->after('blocked_at');
            }

            if (! Schema::hasColumn('dojos', 'last_notice_h1_sent_at')) {
                $table->date('last_notice_h1_sent_at')->nullable()->after('last_notice_h7_sent_at');
            }

            if (! Schema::hasColumn('dojos', 'last_notice_expired_sent_at')) {
                $table->date('last_notice_expired_sent_at')->nullable()->after('last_notice_h1_sent_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            foreach ([
                'last_notice_expired_sent_at',
                'last_notice_h1_sent_at',
                'last_notice_h7_sent_at',
            ] as $column) {
                if (Schema::hasColumn('dojos', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
