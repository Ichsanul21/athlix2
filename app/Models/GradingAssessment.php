<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradingAssessment extends Model
{
    use BelongsToTenant;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'assessed_at' => 'datetime',
            'kihon_score' => 'integer',
            'kata_score' => 'integer',
            'kumite_score' => 'integer',
            'final_score' => 'integer',
        ];
    }

    public function athlete(): BelongsTo
    {
        return $this->belongsTo(Athlete::class);
    }

    public function assessor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assessor_id');
    }

    public function targetLevel(): BelongsTo
    {
        return $this->belongsTo(Level::class, 'level_target_id');
    }

    public function targetBelt(): BelongsTo
    {
        return $this->targetLevel();
    }
}
