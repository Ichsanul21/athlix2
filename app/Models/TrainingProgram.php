<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingProgram extends Model
{
    protected $guarded = [];

    public function dojo()
    {
        return $this->belongsTo(Dojo::class);
    }
}
