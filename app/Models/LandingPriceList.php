<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingPriceList extends Model
{
    protected $guarded = [];

    protected $casts = [
        'price' => 'decimal:2',
        'original_price' => 'decimal:2',
        'is_featured' => 'boolean',
        'is_custom' => 'boolean',
        'sort_order' => 'integer',
    ];
}
