<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Level extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $table = 'levels';

    public function dojo()
    {
        return $this->belongsTo(Dojo::class);
    }

    public function athletes()
    {
        return $this->hasMany(Athlete::class, 'level_id');
    }
}
