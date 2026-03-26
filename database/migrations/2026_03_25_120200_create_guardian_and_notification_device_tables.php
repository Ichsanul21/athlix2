<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('athlete_guardians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('athlete_id')->constrained('athletes')->cascadeOnDelete();
            $table->foreignId('guardian_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('relation_type', 50)->default('parent');
            $table->boolean('is_primary')->default(false);
            $table->boolean('emergency_contact')->default(false);
            $table->timestamps();

            $table->unique(['tenant_id', 'athlete_id', 'guardian_user_id'], 'athlete_guardians_unique');
            $table->index(['tenant_id', 'guardian_user_id']);
        });

        Schema::create('notification_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('platform', ['webpush', 'android', 'ios'])->default('webpush');
            $table->string('device_label', 120)->nullable();
            $table->text('push_token');
            $table->string('token_hash', 64)->unique();
            $table->timestamp('last_seen_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'user_id', 'is_active']);
            $table->index(['tenant_id', 'platform']);
        });

        Schema::create('tenant_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('dojos')->cascadeOnDelete();
            $table->string('media_disk', 30)->default('public'); // future: s3
            $table->string('queue_driver', 30)->default('database'); // future: redis
            $table->json('notification_channels')->nullable(); // future: fcm, email, whatsapp
            $table->string('storage_public_url')->nullable();
            $table->timestamps();

            $table->unique('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_settings');
        Schema::dropIfExists('notification_devices');
        Schema::dropIfExists('athlete_guardians');
    }
};
