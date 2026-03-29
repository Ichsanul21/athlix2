<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class LandingArticle extends Model
{
    public const STATUS_DRAFT = 'draft';
    public const STATUS_REVIEW = 'review';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED = 'archived';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_REVIEW,
        self::STATUS_PUBLISHED,
        self::STATUS_ARCHIVED,
    ];

    public const META_ROBOTS_OPTIONS = [
        'index,follow',
        'noindex,follow',
        'index,nofollow',
        'noindex,nofollow',
    ];

    protected $guarded = [];

    protected $casts = [
        'tags' => 'array',
        'is_published' => 'boolean',
        'is_featured' => 'boolean',
        'sort_order' => 'integer',
        'reading_time' => 'integer',
        'publish_at' => 'datetime',
        'preview_token_expires_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function scopeLive(Builder $query): Builder
    {
        return $query
            ->where(function (Builder $statusQuery): void {
                $statusQuery
                    ->where('status', self::STATUS_PUBLISHED)
                    ->orWhere(function (Builder $legacyQuery): void {
                        $legacyQuery
                            ->whereNull('status')
                            ->where('is_published', true);
                    });
            })
            ->where(function (Builder $publishQuery): void {
                $publishQuery
                    ->whereNull('publish_at')
                    ->orWhere('publish_at', '<=', now());
            });
    }

    public function scopeEditorial(Builder $query): Builder
    {
        return $query
            ->orderByDesc('is_featured')
            ->orderBy('sort_order')
            ->orderByDesc('publish_at')
            ->orderByDesc('updated_at');
    }

    public function revisions(): MorphMany
    {
        return $this->morphMany(LandingContentRevision::class, 'revisable')->latest('id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
