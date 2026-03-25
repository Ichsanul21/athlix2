<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'athlete_id')) {
                $table->foreignId('athlete_id')->nullable()->after('dojo_id')->constrained('athletes')->nullOnDelete();
            }
        });

        \DB::table('users')->whereNull('role')->update(['role' => 'murid']);
        \DB::table('users')->where('role', 'athlete')->update(['role' => 'murid']);
        \DB::table('users')->where('role', 'admin')->update(['role' => 'sensei']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'athlete_id')) {
                $table->dropConstrainedForeignId('athlete_id');
            }
        });

        \DB::table('users')->where('role', 'murid')->update(['role' => 'athlete']);
        \DB::table('users')->where('role', 'sensei')->update(['role' => 'admin']);
    }
};
