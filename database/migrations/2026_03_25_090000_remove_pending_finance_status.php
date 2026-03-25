<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('finance_records')
            ->where('status', 'pending')
            ->update(['status' => 'unpaid']);

        $driver = Schema::getConnection()->getDriverName();
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE finance_records MODIFY COLUMN status ENUM('paid','unpaid') NOT NULL DEFAULT 'unpaid'");
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE finance_records MODIFY COLUMN status ENUM('paid','unpaid','pending') NOT NULL DEFAULT 'unpaid'");
        }
    }
};
