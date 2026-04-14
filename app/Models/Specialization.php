<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Specialization extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function dojo()
    {
        return $this->belongsTo(Dojo::class);
    }

    public function athletes()
    {
        return $this->hasMany(Athlete::class, 'specialization_id');
    }
}
