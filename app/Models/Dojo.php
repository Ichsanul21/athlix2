<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dojo extends Model
{
    /** @use HasFactory<\Database\Factories\DojoFactory> */
    use HasFactory;

    protected $guarded = [];

    public function athletes()
    {
        return $this->hasMany(Athlete::class);
    }

    public function trainingPrograms()
    {
        return $this->hasMany(TrainingProgram::class);
    }
}
