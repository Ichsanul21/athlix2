<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StrengthConditioningMetric extends Model
{
    use BelongsToTenant;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'recorded_on' => 'date',
            'one_rm_squat' => 'float',
            'one_rm_bench_press' => 'float',
            'vo2max' => 'float',
            'agility_t_test' => 'float',
            'countermovement_jump_cm' => 'float',
        ];
    }

    public function athlete(): BelongsTo
    {
        return $this->belongsTo(Athlete::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
