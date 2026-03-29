<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class LandingContentRevision extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'changed_fields' => 'array',
        'snapshot_before' => 'array',
        'snapshot_after' => 'array',
        'created_at' => 'datetime',
    ];

    public function revisable(): MorphTo
    {
        return $this->morphTo();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
