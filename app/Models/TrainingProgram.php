<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingProgram extends Model
{
    protected $guarded = [];
    protected $casts = [
        'agenda_items' => 'array',
    ];

    public function dojo()
    {
        return $this->belongsTo(Dojo::class);
    }
}
