<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            if (! Schema::hasColumn('dojos', 'saas_plan_name')) {
                $table->string('saas_plan_name')->nullable()->after('is_active');
            }

            if (! Schema::hasColumn('dojos', 'billing_cycle_months')) {
                $table->unsignedTinyInteger('billing_cycle_months')->default(1)->after('saas_plan_name');
            }

            if (! Schema::hasColumn('dojos', 'subscription_started_at')) {
                $table->date('subscription_started_at')->nullable()->after('billing_cycle_months');
            }

            if (! Schema::hasColumn('dojos', 'subscription_expires_at')) {
                $table->date('subscription_expires_at')->nullable()->after('subscription_started_at');
            }

            if (! Schema::hasColumn('dojos', 'grace_period_ends_at')) {
                $table->date('grace_period_ends_at')->nullable()->after('subscription_expires_at');
            }

            if (! Schema::hasColumn('dojos', 'is_saas_blocked')) {
                $table->boolean('is_saas_blocked')->default(false)->after('grace_period_ends_at');
            }

            if (! Schema::hasColumn('dojos', 'saas_block_reason')) {
                $table->string('saas_block_reason')->nullable()->after('is_saas_blocked');
            }

            if (! Schema::hasColumn('dojos', 'blocked_at')) {
                $table->timestamp('blocked_at')->nullable()->after('saas_block_reason');
            }
        });
    }

    public function down(): void
    {
        Schema::table('dojos', function (Blueprint $table) {
            foreach ([
                'blocked_at',
                'saas_block_reason',
                'is_saas_blocked',
                'grace_period_ends_at',
                'subscription_expires_at',
                'subscription_started_at',
                'billing_cycle_months',
                'saas_plan_name',
            ] as $column) {
                if (Schema::hasColumn('dojos', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
