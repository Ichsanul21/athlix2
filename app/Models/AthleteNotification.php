<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AthleteNotification extends Model
{
    protected $guarded = [];

    protected $casts = [
        'is_popup' => 'boolean',
        'is_active' => 'boolean',
        'published_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function dojo()
    {
        return $this->belongsTo(Dojo::class);
    }

    public function athlete()
    {
        return $this->belongsTo(Athlete::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function reads()
    {
        return $this->hasMany(AthleteNotificationRead::class, 'notification_id');
    }
}

