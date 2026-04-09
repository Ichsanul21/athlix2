<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TestLabel extends Model
{
    protected $fillable = ['dojo_id', 'name'];

    public function categories(): HasMany
    {
        return $this->hasMany(ReportCategory::class)->orderBy('sort_order');
    }
}
