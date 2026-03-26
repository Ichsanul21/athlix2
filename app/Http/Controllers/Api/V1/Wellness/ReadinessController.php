<?php

namespace App\Http\Controllers\Api\V1\Wellness;

use App\Http\Controllers\Api\V1\Wellness\Concerns\ResolvesAthleteContext;
use App\Http\Controllers\Controller;
use App\Models\WellnessReadinessLog;
use App\Services\Wellness\ReadinessScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReadinessController extends Controller
{
    use ResolvesAthleteContext;

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'athlete_id' => 'nullable|integer|exists:athletes,id',
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
            'limit' => 'nullable|integer|min:1|max:90',
        ]);

        $user = $request->user();
        $athlete = $this->resolveAthleteForRequest($user, isset($validated['athlete_id']) ? (int) $validated['athlete_id'] : null);
        $tenantId = $this->resolveTenantId($user, $athlete);

        $query = WellnessReadinessLog::query()
            ->where('tenant_id', $tenantId)
            ->where('athlete_id', $athlete->id)
            ->orderByDesc('recorded_on');

        if (! empty($validated['from'])) {
            $query->whereDate('recorded_on', '>=', $validated['from']);
        }
        if (! empty($validated['to'])) {
            $query->whereDate('recorded_on', '<=', $validated['to']);
        }

        $limit = (int) ($validated['limit'] ?? 30);
        $logs = $query->limit($limit)->get();

        return response()->json([
            'athlete' => [
                'id' => $athlete->id,
                'name' => $athlete->full_name,
                'athlete_code' => $athlete->athlete_code,
            ],
            'items' => $logs,
        ]);
    }

    public function latest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'athlete_id' => 'nullable|integer|exists:athletes,id',
        ]);

        $user = $request->user();
        $athlete = $this->resolveAthleteForRequest($user, isset($validated['athlete_id']) ? (int) $validated['athlete_id'] : null);
        $tenantId = $this->resolveTenantId($user, $athlete);

        $latest = WellnessReadinessLog::query()
            ->where('tenant_id', $tenantId)
            ->where('athlete_id', $athlete->id)
            ->latest('recorded_on')
            ->latest('id')
            ->first();

        return response()->json([
            'athlete' => [
                'id' => $athlete->id,
                'name' => $athlete->full_name,
            ],
            'item' => $latest,
        ]);
    }

    public function store(Request $request, ReadinessScoreService $service): JsonResponse
    {
        $validated = $request->validate([
            'athlete_id' => 'nullable|integer|exists:athletes,id',
            'recorded_on' => 'nullable|date',
            'hrv_score' => 'nullable|numeric|min:10|max:250',
            'sleep_hours' => 'nullable|numeric|min:0|max:24',
            'stress_level' => 'nullable|integer|min:1|max:10',
            'muscle_soreness' => 'nullable|integer|min:1|max:10',
            'resting_hr' => 'nullable|integer|min:30|max:220',
            'menstrual_phase' => 'nullable|string|max:40',
            'notes' => 'nullable|string|max:2000',
            'sync_status' => 'nullable|in:pending,synced,failed',
        ]);

        $user = $request->user();
        $athlete = $this->resolveAthleteForRequest($user, isset($validated['athlete_id']) ? (int) $validated['athlete_id'] : null);
        $tenantId = $this->resolveTenantId($user, $athlete);

        $recordedOn = $validated['recorded_on'] ?? now()->toDateString();
        $readiness = $service->calculate(
            $validated['hrv_score'] ?? null,
            $validated['sleep_hours'] ?? null,
            isset($validated['stress_level']) ? (int) $validated['stress_level'] : null,
            isset($validated['muscle_soreness']) ? (int) $validated['muscle_soreness'] : null,
            isset($validated['resting_hr']) ? (int) $validated['resting_hr'] : null
        );

        $log = WellnessReadinessLog::query()->updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'athlete_id' => $athlete->id,
                'recorded_on' => $recordedOn,
            ],
            [
                'submitted_by' => $user->id,
                'hrv_score' => $validated['hrv_score'] ?? null,
                'sleep_hours' => $validated['sleep_hours'] ?? null,
                'stress_level' => $validated['stress_level'] ?? null,
                'muscle_soreness' => $validated['muscle_soreness'] ?? null,
                'resting_hr' => $validated['resting_hr'] ?? null,
                'menstrual_phase' => $validated['menstrual_phase'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'readiness_percentage' => $readiness,
                'sync_status' => $validated['sync_status'] ?? 'pending',
                'synced_at' => ($validated['sync_status'] ?? 'pending') === 'synced' ? now() : null,
            ]
        );

        return response()->json([
            'message' => 'Readiness log saved.',
            'item' => $log,
        ], 201);
    }
}
