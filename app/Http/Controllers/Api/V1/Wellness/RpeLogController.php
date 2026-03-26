<?php

namespace App\Http\Controllers\Api\V1\Wellness;

use App\Http\Controllers\Api\V1\Wellness\Concerns\ResolvesAthleteContext;
use App\Http\Controllers\Controller;
use App\Models\WellnessRpeLog;
use App\Models\WellnessWorkloadSnapshot;
use App\Services\Wellness\WorkloadService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RpeLogController extends Controller
{
    use ResolvesAthleteContext;

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'athlete_id' => 'nullable|integer|exists:athletes,id',
            'from' => 'nullable|date',
            'to' => 'nullable|date|after_or_equal:from',
            'limit' => 'nullable|integer|min:1|max:120',
        ]);

        $user = $request->user();
        $athlete = $this->resolveAthleteForRequest($user, isset($validated['athlete_id']) ? (int) $validated['athlete_id'] : null);
        $tenantId = $this->resolveTenantId($user, $athlete);

        $query = WellnessRpeLog::query()
            ->where('tenant_id', $tenantId)
            ->where('athlete_id', $athlete->id)
            ->orderByDesc('session_date')
            ->orderByDesc('id');

        if (! empty($validated['from'])) {
            $query->whereDate('session_date', '>=', $validated['from']);
        }
        if (! empty($validated['to'])) {
            $query->whereDate('session_date', '<=', $validated['to']);
        }

        $limit = (int) ($validated['limit'] ?? 40);

        return response()->json([
            'athlete' => [
                'id' => $athlete->id,
                'name' => $athlete->full_name,
            ],
            'items' => $query->limit($limit)->get(),
        ]);
    }

    public function store(Request $request, WorkloadService $workloadService): JsonResponse
    {
        $validated = $request->validate([
            'athlete_id' => 'nullable|integer|exists:athletes,id',
            'training_program_id' => 'nullable|integer|exists:training_programs,id',
            'session_date' => 'required|date',
            'duration_minutes' => 'required|integer|min:1|max:600',
            'rpe_score' => 'required|integer|min:1|max:10',
            'notes' => 'nullable|string|max:2000',
            'sync_status' => 'nullable|in:pending,synced,failed',
        ]);

        $user = $request->user();
        $athlete = $this->resolveAthleteForRequest($user, isset($validated['athlete_id']) ? (int) $validated['athlete_id'] : null);
        $tenantId = $this->resolveTenantId($user, $athlete);

        $sessionLoad = $workloadService->calculateSessionLoad(
            (int) $validated['duration_minutes'],
            (int) $validated['rpe_score']
        );

        $log = WellnessRpeLog::query()->create([
            'tenant_id' => $tenantId,
            'athlete_id' => $athlete->id,
            'training_program_id' => $validated['training_program_id'] ?? null,
            'submitted_by' => $user->id,
            'session_date' => $validated['session_date'],
            'duration_minutes' => (int) $validated['duration_minutes'],
            'rpe_score' => (int) $validated['rpe_score'],
            'session_load' => $sessionLoad,
            'notes' => $validated['notes'] ?? null,
            'sync_status' => $validated['sync_status'] ?? 'pending',
            'synced_at' => ($validated['sync_status'] ?? 'pending') === 'synced' ? now() : null,
        ]);

        $snapshot = $workloadService->buildSnapshot($tenantId, $athlete->id, Carbon::parse($validated['session_date']));

        return response()->json([
            'message' => 'RPE log saved.',
            'item' => $log,
            'workload_snapshot' => $snapshot,
        ], 201);
    }

    public function latestSnapshot(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'athlete_id' => 'nullable|integer|exists:athletes,id',
        ]);

        $user = $request->user();
        $athlete = $this->resolveAthleteForRequest($user, isset($validated['athlete_id']) ? (int) $validated['athlete_id'] : null);
        $tenantId = $this->resolveTenantId($user, $athlete);

        $snapshot = WellnessWorkloadSnapshot::query()
            ->where('tenant_id', $tenantId)
            ->where('athlete_id', $athlete->id)
            ->latest('snapshot_date')
            ->latest('id')
            ->first();

        return response()->json([
            'athlete' => [
                'id' => $athlete->id,
                'name' => $athlete->full_name,
            ],
            'item' => $snapshot,
        ]);
    }
}
