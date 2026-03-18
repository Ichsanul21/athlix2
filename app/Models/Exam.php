<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    protected $guarded = [];

    public function athlete()
    {
        return $this->belongsTo(Athlete::class);
    }

    public function belt()
    {
        return $this->belongsTo(Belt::class);
    }

    public function fromBelt()
    {
        return $this->belongsTo(Belt::class, 'from_belt_id');
    }
}
