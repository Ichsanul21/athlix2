<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Athlete extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class, 'level_id');
    }

    public function belt(): BelongsTo
    {
        return $this->level();
    }

    public function specialization(): BelongsTo
    {
        return $this->belongsTo(Specialization::class, 'specialization_id');
    }

    public function dojo(): BelongsTo
    {
        return $this->belongsTo(Dojo::class);
    }

    public function physicalMetrics()
    {
        return $this->hasMany(PhysicalMetric::class);
    }

    public function reports()
    {
        return $this->hasMany(AthleteReport::class);
    }

    public function latestReport()
    {
        return $this->hasOne(AthleteReport::class)->latestOfMany('recorded_at');
    }

    public function notifications()
    {
        return $this->hasMany(AthleteNotification::class);
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

    public function senseis()
    {
        return $this->belongsToMany(User::class, 'sensei_athlete', 'athlete_id', 'sensei_id')
            ->withPivot(['dojo_id', 'assigned_by'])
            ->withTimestamps();
    }

    public function guardians(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'athlete_guardians', 'athlete_id', 'guardian_user_id')
            ->withPivot(['tenant_id', 'relation_type', 'is_primary', 'emergency_contact'])
            ->withTimestamps();
    }

    public function readinessLogs(): HasMany
    {
        return $this->hasMany(WellnessReadinessLog::class);
    }

    public function rpeLogs(): HasMany
    {
        return $this->hasMany(WellnessRpeLog::class);
    }

    public function workloadSnapshots(): HasMany
    {
        return $this->hasMany(WellnessWorkloadSnapshot::class);
    }

    public function gradingAssessments(): HasMany
    {
        return $this->hasMany(GradingAssessment::class);
    }

    public function medicalLogs(): HasMany
    {
        return $this->hasMany(MedicalLog::class);
    }

    public function strengthConditioningMetrics(): HasMany
    {
        return $this->hasMany(StrengthConditioningMetric::class);
    }

    public function healthPreference()
    {
        return $this->hasOne(AthleteHealthPreference::class);
    }

    public function menstrualCycleLogs(): HasMany
    {
        return $this->hasMany(MenstrualCycleLog::class);
    }
}
