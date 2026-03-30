<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dojo_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('dojo_name');
            $table->string('country')->default('ID');
            $table->string('province_code')->nullable();
            $table->string('province_name')->nullable();
            $table->string('regency_code')->nullable();
            $table->string('regency_name')->nullable();
            $table->string('district_code')->nullable();
            $table->string('district_name')->nullable();
            $table->string('village_code')->nullable();
            $table->string('village_name')->nullable();
            $table->text('address_detail')->nullable();
            $table->string('timezone')->default('Asia/Makassar');
            $table->string('saas_plan_name')->default('Basic');
            $table->string('pic_name');
            $table->string('pic_email');
            $table->string('pic_phone');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dojo_registrations');
    }
};
