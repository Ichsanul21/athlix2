<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'dojo_id',
        'name',
        'unit',
        'min_threshold',
        'max_threshold',
    ];

    public function dojo(): BelongsTo
    {
        return $this->belongsTo(Dojo::class);
    }

    /**
     * Calculate a 1-100 score based on a raw value against the thresholds.
     */
    public function calculateScore(float $rawValue): int
    {
        if ($this->min_threshold == $this->max_threshold) {
            return $rawValue >= $this->max_threshold ? 100 : 0;
        }

        if ($this->max_threshold > $this->min_threshold) {
            // "Higher is better" (e.g. repetitions)
            // min_threshold -> 0 score, max_threshold -> 100 score
            if ($rawValue <= $this->min_threshold) {
                return 0;
            }
            if ($rawValue >= $this->max_threshold) {
                return 100;
            }
            $score = (($rawValue - $this->min_threshold) / ($this->max_threshold - $this->min_threshold)) * 100;
        } else {
            // "Lower is better" (e.g. speed/duration where less time is better)
            // max_threshold is actually the "worst" limit. Let's assume max_threshold = 20, min_threshold = 10.
            // Wait, if max_threshold < min_threshold. e.g. min_threshold = 15, max_threshold = 5.
            // min=15 -> 0, max=5 -> 100.
            if ($rawValue >= $this->min_threshold) {
                return 0;
            }
            if ($rawValue <= $this->max_threshold) {
                return 100;
            }
            // scale from min_threshold (0) to max_threshold (100)
            $score = (($this->min_threshold - $rawValue) / ($this->min_threshold - $this->max_threshold)) * 100;
        }

        return (int) round($score);
    }
}
