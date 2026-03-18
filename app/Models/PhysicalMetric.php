<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhysicalMetric extends Model
{
    protected $guarded = [];

    public function athlete()
    {
        return $this->belongsTo(Athlete::class);
    }
}
