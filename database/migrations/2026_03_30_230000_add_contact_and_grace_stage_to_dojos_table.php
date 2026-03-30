<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            // Contact/PIC fields for the dojo
            if (! Schema::hasColumn('dojos', 'contact_name')) {
                $table->string('contact_name')->nullable()->after('name');
            }
            if (! Schema::hasColumn('dojos', 'contact_email')) {
                $table->string('contact_email')->nullable()->after('contact_name');
            }
            if (! Schema::hasColumn('dojos', 'contact_phone')) {
                $table->string('contact_phone')->nullable()->after('contact_email');
            }

            // Grace period stage 1 (warning/restricted) — ends at week 1
            // Existing grace_period_ends_at = stage 2 (full block) — ends at week 2
            if (! Schema::hasColumn('dojos', 'grace_period_stage1_ends_at')) {
                $table->date('grace_period_stage1_ends_at')->nullable()->after('subscription_expires_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            foreach (['contact_name', 'contact_email', 'contact_phone', 'grace_period_stage1_ends_at'] as $column) {
                if (Schema::hasColumn('dojos', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
