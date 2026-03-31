<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportSubCategory extends Model
{
    protected $fillable = [
        'report_category_id',
        'name',
        'sort_order',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ReportCategory::class, 'report_category_id');
    }

    public function tests(): HasMany
    {
        return $this->hasMany(ReportTest::class)->orderBy('sort_order');
    }
}
