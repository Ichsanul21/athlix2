<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Rename role value: murid → atlet (dan legacy 'athlete' juga)
        DB::table('users')->where('role', 'murid')->update(['role' => 'atlet']);
        DB::table('users')->where('role', 'athlete')->update(['role' => 'atlet']);
    }

    public function down(): void
    {
        DB::table('users')->where('role', 'atlet')->update(['role' => 'murid']);
    }
};
