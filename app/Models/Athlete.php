<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Athlete extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function belt(): BelongsTo
    {
        return $this->belongsTo(Belt::class, 'current_belt_id');
    }

    public function dojo(): BelongsTo
    {
        return $this->belongsTo(Dojo::class);
    }

    public function physicalMetrics()
    {
        return $this->hasMany(PhysicalMetric::class);
    }

    public function financeRecords()
    {
        return $this->hasMany(FinanceRecord::class);
    }

    public function achievements()
    {
        return $this->hasMany(AthleteAchievement::class);
    }

    public function financeAdjustments()
    {
        return $this->hasMany(FinanceAdjustment::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}
