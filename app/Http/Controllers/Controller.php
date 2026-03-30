<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

abstract class Controller
{
    protected function resolveDojoId(?User $user, ?int $requestedDojoId = null): ?int
    {
        // Jika ada filter dojo yang di-pass secara explicit, gunakan itu
        if ($requestedDojoId) {
            return $requestedDojoId;
        }

        // Super Admin tanpa filter eksplisit → null = tampilkan semua dojo
        if ($user?->isSuperAdmin()) {
            return null;
        }

        // Role lain → gunakan dojo_id mereka sendiri
        return $user?->dojo_id;
    }

    protected function scopeAthletesForUser(Builder $query, ?User $user): Builder
    {
        if (! $user) {
            return $query->whereRaw('1=0');
        }

        if ($user->isSuperAdmin()) {
            return $query;
        }

        if ($user->isSensei()) {
            $athleteIds = $user->senseiAthletes()->pluck('athletes.id');
            return $query->whereIn('id', $athleteIds);
        }

        if ($user->isParent()) {
            $athleteIds = $user->guardianAthletes()->pluck('athletes.id');
            return $query->whereIn('id', $athleteIds);
        }

        if ($user->isMurid() && $user->athlete_id) {
            return $query->whereKey($user->athlete_id);
        }

        if ($user->dojo_id) {
            return $query->where('dojo_id', $user->dojo_id);
        }

        return $query->whereRaw('1=0');
    }

    protected function ensureAthleteAccessible(Athlete $athlete, ?User $user): void
    {
        if (! $user) {
            abort(403);
        }

        if ($user->isSuperAdmin()) {
            return;
        }

        if ($user->isSensei()) {
            $allowed = $user->senseiAthletes()->whereKey($athlete->id)->exists();
            if (! $allowed) {
                abort(403);
            }
            return;
        }

        if ($user->isParent()) {
            $allowed = $user->guardianAthletes()->whereKey($athlete->id)->exists();
            if (! $allowed) {
                abort(403);
            }
            return;
        }

        if ($user->isMurid()) {
            if ((int) $user->athlete_id !== (int) $athlete->id) {
                abort(403);
            }
            return;
        }

        if ($user->dojo_id && (int) $user->dojo_id === (int) $athlete->dojo_id) {
            return;
        }

        abort(403);
    }
}
