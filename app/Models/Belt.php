<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Belt extends Model
{
    /** @use HasFactory<\Database\Factories\BeltFactory> */
    use HasFactory;

    protected $guarded = [];

    public function athletes()
    {
        return $this->hasMany(Athlete::class, 'current_belt_id');
    }

    public function exams()
    {
        return $this->hasMany(Exam::class);
    }
}
