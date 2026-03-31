<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportTest extends Model
{
    protected $fillable = [
        'report_sub_category_id',
        'name',
        'unit',
        'min_threshold',
        'max_threshold',
        'max_duration_seconds',
        'sort_order',
    ];

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(ReportSubCategory::class, 'report_sub_category_id');
    }

    /**
     * Calculate a 1-100 score based on a raw value against the thresholds.
     * Handles both "higher is better" (repetition) and "lower is better" (duration/speed).
     */
    public function calculateScore(float $rawValue): int
    {
        if ($this->min_threshold == $this->max_threshold) {
            return $rawValue >= $this->max_threshold ? 100 : 0;
        }

        if ($this->max_threshold > $this->min_threshold) {
            // "Higher is better" (e.g. repetitions: 0→100 pushups → score 0→100)
            if ($rawValue <= $this->min_threshold) return 0;
            if ($rawValue >= $this->max_threshold) return 100;
            $score = (($rawValue - $this->min_threshold) / ($this->max_threshold - $this->min_threshold)) * 100;
        } else {
            // "Lower is better" (e.g. speed: 10s (bad) → 3s (good))
            if ($rawValue >= $this->min_threshold) return 0;
            if ($rawValue <= $this->max_threshold) return 100;
            $score = (($this->min_threshold - $rawValue) / ($this->min_threshold - $this->max_threshold)) * 100;
        }

        return (int) round(max(0, min(100, $score)));
    }
}
