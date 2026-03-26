<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Dojo extends Model
{
    /** @use HasFactory<\Database\Factories\DojoFactory> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_saas_blocked' => 'boolean',
            'subscription_started_at' => 'date',
            'subscription_expires_at' => 'date',
            'grace_period_ends_at' => 'date',
            'blocked_at' => 'datetime',
            'last_notice_h7_sent_at' => 'date',
            'last_notice_h1_sent_at' => 'date',
            'last_notice_expired_sent_at' => 'date',
        ];
    }

    public function athletes()
    {
        return $this->hasMany(Athlete::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function senseis()
    {
        return $this->hasMany(User::class)->where('role', 'sensei');
    }

    public function dojoAdmins()
    {
        return $this->hasMany(User::class)->where('role', 'dojo_admin');
    }

    public function trainingPrograms()
    {
        return $this->hasMany(TrainingProgram::class);
    }

    public function billingDefaults()
    {
        return $this->hasMany(BillingDefault::class, 'tenant_id');
    }

    public function invoiceRuns()
    {
        return $this->hasMany(InvoiceRun::class, 'tenant_id');
    }

    public function tenantSetting()
    {
        return $this->hasOne(TenantSetting::class, 'tenant_id');
    }

    public function hasActiveSubscription(?Carbon $now = null): bool
    {
        $now = $now ?? now();

        if (! $this->subscription_expires_at) {
            return true;
        }

        if ($now->toDateString() <= $this->subscription_expires_at->toDateString()) {
            return true;
        }

        return $this->grace_period_ends_at
            ? $now->toDateString() <= $this->grace_period_ends_at->toDateString()
            : false;
    }

    public function canAccessSaas(?Carbon $now = null): bool
    {
        return (bool) $this->is_active
            && ! (bool) $this->is_saas_blocked
            && $this->hasActiveSubscription($now);
    }

    public function accessStatusLabel(?Carbon $now = null): string
    {
        $now = $now ?? now();

        if (! $this->is_active) {
            return 'Nonaktif';
        }

        if ($this->is_saas_blocked) {
            return 'Diblokir Manual';
        }

        if ($this->subscription_expires_at && $now->toDateString() > $this->subscription_expires_at->toDateString()) {
            if ($this->grace_period_ends_at && $now->toDateString() <= $this->grace_period_ends_at->toDateString()) {
                return 'Masa Grace';
            }

            return 'Expired';
        }

        return 'Aktif';
    }
}
