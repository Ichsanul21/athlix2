<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingPriceList extends Model
{
    protected $guarded = [];

    protected $casts = [
        'price' => 'decimal:2',
        'is_featured' => 'boolean',
        'sort_order' => 'integer',
    ];
}
