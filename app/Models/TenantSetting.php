<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantSetting extends Model
{
    use BelongsToTenant;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'notification_channels' => 'array',
        ];
    }

    public function dojo(): BelongsTo
    {
        return $this->belongsTo(Dojo::class, 'tenant_id');
    }
}
