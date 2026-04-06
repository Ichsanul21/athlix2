<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DojoSubscriptionRequest extends Model
{
    protected $guarded = [];

    protected $casts = [
        'processed_at' => 'datetime',
    ];

    public function dojo()
    {
        return $this->belongsTo(Dojo::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
