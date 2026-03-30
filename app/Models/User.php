<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Dojo;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone_number',
        'profile_photo_path',
        'password',
        'role',
        'dojo_id',
        'athlete_id',
        'must_change_password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'    => 'datetime',
            'password'             => 'hashed',
            'must_change_password' => 'boolean',
        ];
    }

    public function athlete()
    {
        return $this->belongsTo(Athlete::class);
    }

    public function dojo()
    {
        return $this->belongsTo(Dojo::class);
    }

    public function senseiAthletes()
    {
        return $this->belongsToMany(Athlete::class, 'sensei_athlete', 'sensei_id', 'athlete_id')
            ->withPivot(['dojo_id', 'assigned_by'])
            ->withTimestamps();
    }

    public function sentNotifications()
    {
        return $this->hasMany(AthleteNotification::class, 'sender_id');
    }

    public function guardianAthletes(): BelongsToMany
    {
        return $this->belongsToMany(Athlete::class, 'athlete_guardians', 'guardian_user_id', 'athlete_id')
            ->withPivot(['tenant_id', 'relation_type', 'is_primary', 'emergency_contact'])
            ->withTimestamps();
    }

    public function notificationDevices(): HasMany
    {
        return $this->hasMany(NotificationDevice::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isLandingAdmin(): bool
    {
        return $this->role === 'landing_admin';
    }

    public function isSensei(): bool
    {
        return $this->role === 'sensei';
    }

    public function isHeadCoach(): bool
    {
        return $this->role === 'head_coach';
    }

    public function isAssistant(): bool
    {
        return $this->role === 'assistant';
    }

    public function isDojoAdmin(): bool
    {
        return $this->role === 'dojo_admin';
    }

    public function isParent(): bool
    {
        return $this->role === 'parent';
    }

    public function isMedicalStaff(): bool
    {
        return $this->role === 'medical_staff';
    }

    public function isMurid(): bool
    {
        return in_array($this->role, ['murid', 'athlete'], true);
    }

    public function isCoachGroup(): bool
    {
        return $this->isSuperAdmin() || $this->isDojoAdmin() || $this->isHeadCoach() || $this->isSensei() || $this->isAssistant();
    }
}
