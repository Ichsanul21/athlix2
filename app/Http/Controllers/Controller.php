<?php

namespace App\Http\Controllers;

use App\Models\Athlete;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

abstract class Controller
{
    protected function resolveDojoId(?User $user, ?int $requestedDojoId = null): ?int
    {
        // Super Admin boleh filter lintas dojo
        if ($user?->isSuperAdmin()) {
            return $requestedDojoId ?: null; // null = semua dojo
        }

        // Semua role lain: SELALU di-lock ke dojo mereka sendiri
        // Parameter dojo_id dari URL diabaikan demi keamanan
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

    protected function calculateDojoPerformanceStats(?int $dojoId): array
    {
        if (!$dojoId) {
            return [];
        }

        $categories = \App\Models\ReportCategory::where('dojo_id', $dojoId)
            ->orderBy('sort_order', 'asc')
            ->get();

        if ($categories->isEmpty()) {
            return [];
        }

        $athleteIds = \App\Models\Athlete::where('dojo_id', $dojoId)->pluck('id');
        if ($athleteIds->isEmpty()) {
            return [];
        }

        // Get latest report for each athlete in this dojo
        $latestReports = \App\Models\AthleteReport::whereIn('athlete_id', $athleteIds)
            ->whereIn('id', function($query) use ($athleteIds) {
                $query->selectRaw('MAX(id)')
                    ->from('athlete_reports')
                    ->whereIn('athlete_id', $athleteIds)
                    ->groupBy('athlete_id');
            })
            ->get();

        if ($latestReports->isEmpty()) {
            return $categories->map(fn($cat) => [
                'label' => $cat->name,
                'min' => 0,
                'max' => 0,
                'avg' => 0,
            ])->toArray();
        }

        $stats = [];
        foreach ($categories as $cat) {
            $scores = [];
            foreach ($latestReports as $report) {
                $snapshot = $report->dynamic_scores;
                $score = $snapshot['categories'][$cat->id]['score'] ?? null;
                if ($score !== null) {
                    $scores[] = (float) $score;
                }
            }

            if (!empty($scores)) {
                $stats[] = [
                    'label' => $cat->name,
                    'min'   => (float) min($scores),
                    'max'   => (float) max($scores),
                    'avg'   => (float) round(array_sum($scores) / count($scores), 1),
                ];
            } else {
                $stats[] = [
                    'label' => $cat->name,
                    'min'   => 0,
                    'max'   => 0,
                    'avg'   => 0,
                ];
            }
        }

        return $stats;
    }
}
