<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('athlete_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dojo_id')->nullable()->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->nullable()->constrained('athletes')->cascadeOnDelete();
            $table->foreignId('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('message');
            $table->boolean('is_popup')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('athlete_notification_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')->constrained('athlete_notifications')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->timestamp('read_at')->useCurrent();
            $table->timestamps();
            $table->unique(['notification_id', 'athlete_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('athlete_notification_reads');
        Schema::dropIfExists('athlete_notifications');
    }
};

