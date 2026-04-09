<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('test_labels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dojo_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->timestamps();
        });

        Schema::table('report_categories', function (Blueprint $table) {
            $table->foreignId('test_label_id')->nullable()->after('dojo_id')->constrained('test_labels')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('report_categories', function (Blueprint $table) {
            $table->dropForeign(['test_label_id']);
            $table->dropColumn('test_label_id');
        });
        Schema::dropIfExists('test_labels');
    }
};
