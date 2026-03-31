<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class ReportCategory extends Model
{
    protected $fillable = [
        'dojo_id',
        'name',
        'sort_order',
    ];

    public function dojo(): BelongsTo
    {
        return $this->belongsTo(Dojo::class);
    }

    public function subCategories(): HasMany
    {
        return $this->hasMany(ReportSubCategory::class)->orderBy('sort_order');
    }

    public function tests(): HasManyThrough
    {
        return $this->hasManyThrough(ReportTest::class, ReportSubCategory::class);
    }
}
