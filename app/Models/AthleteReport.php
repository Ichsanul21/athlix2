<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AthleteReport extends Model
{
    protected $guarded = [];

    protected $casts = [
        'recorded_at' => 'date',
    ];

    public function athlete()
    {
        return $this->belongsTo(Athlete::class);
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }
}

