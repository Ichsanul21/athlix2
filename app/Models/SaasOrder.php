<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaasOrder extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'billing_cycle_months' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function dojo()
    {
        return $this->belongsTo(Dojo::class);
    }
}
