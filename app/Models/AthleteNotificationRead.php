<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AthleteNotificationRead extends Model
{
    protected $guarded = [];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function notification()
    {
        return $this->belongsTo(AthleteNotification::class, 'notification_id');
    }

    public function athlete()
    {
        return $this->belongsTo(Athlete::class);
    }
}

