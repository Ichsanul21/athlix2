<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WellnessReadinessLog extends Model
{
    use BelongsToTenant;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'recorded_on' => 'date',
            'hrv_score' => 'float',
            'sleep_hours' => 'float',
            'stress_level' => 'integer',
            'muscle_soreness' => 'integer',
            'resting_hr' => 'integer',
            'readiness_percentage' => 'integer',
            'synced_at' => 'datetime',
        ];
    }

    public function athlete(): BelongsTo
    {
        return $this->belongsTo(Athlete::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}
