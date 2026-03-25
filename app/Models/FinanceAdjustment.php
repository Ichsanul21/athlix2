<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinanceAdjustment extends Model
{
    protected $guarded = [];

    public function financeRecord()
    {
        return $this->belongsTo(FinanceRecord::class);
    }

    public function athlete()
    {
        return $this->belongsTo(Athlete::class);
    }

    public function sourceAthlete()
    {
        return $this->belongsTo(Athlete::class, 'source_athlete_id');
    }
}
