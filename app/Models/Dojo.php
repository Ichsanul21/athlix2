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

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function senseis()
    {
        return $this->hasMany(User::class)->where('role', 'sensei');
    }

    public function dojoAdmins()
    {
        return $this->hasMany(User::class)->where('role', 'dojo_admin');
    }

    public function trainingPrograms()
    {
        return $this->hasMany(TrainingProgram::class);
    }
}
