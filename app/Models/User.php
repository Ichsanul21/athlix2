<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Dojo;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone_number',
        'profile_photo_path',
        'password',
        'role',
        'dojo_id',
        'athlete_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
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

    public function isDojoAdmin(): bool
    {
        return $this->role === 'dojo_admin';
    }

    public function isMurid(): bool
    {
        return $this->role === 'murid';
    }
}
