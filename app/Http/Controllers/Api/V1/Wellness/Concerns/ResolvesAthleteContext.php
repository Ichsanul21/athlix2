<?php

namespace App\Http\Controllers\Api\V1\Wellness\Concerns;

use App\Models\Athlete;
use App\Models\User;

trait ResolvesAthleteContext
{
    protected function resolveAthleteForRequest(User $user, ?int $requestedAthleteId = null): Athlete
    {
        if ($user->isMurid() && $user->athlete_id) {
            return Athlete::query()
                ->where('dojo_id', $user->dojo_id)
                ->whereKey($user->athlete_id)
                ->firstOrFail();
        }

        if ($user->isParent()) {
            $query = $user->guardianAthletes();
            if ($requestedAthleteId) {
                $query->whereKey($requestedAthleteId);
            }

            return $query->firstOrFail();
        }

        $query = Athlete::query();
        if ($user->dojo_id) {
            $query->where('dojo_id', $user->dojo_id);
        }

        if ($requestedAthleteId) {
            $query->whereKey($requestedAthleteId);
        } else {
            $query->orderBy('id');
        }

        return $query->firstOrFail();
    }

    protected function resolveTenantId(User $user, Athlete $athlete): int
    {
        if ($user->isSuperAdmin() && $athlete->dojo_id) {
            return (int) $athlete->dojo_id;
        }

        return (int) ($user->dojo_id ?? $athlete->dojo_id);
    }
}
