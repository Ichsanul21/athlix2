<?php

namespace App\Http\Controllers;

use App\Models\Dojo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DojoController extends Controller
{
    public function index()
    {
        return Inertia::render('SuperAdmin/Dojos', [
            'dojos' => Inertia::defer(fn () => Dojo::query()
                ->withCount(['users', 'athletes'])
                ->orderBy('name')
                ->get()
                ->map(function (Dojo $dojo) {
                    return [
                        ...$dojo->toArray(),
                        'access_status' => $dojo->accessStatusLabel(),
                    ];
                })),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'timezone' => 'required|string|max:64',
            'is_active' => 'required|boolean',
            'saas_plan_name' => 'nullable|string|max:100',
            'billing_cycle_months' => 'required|integer|min:1|max:24',
            'subscription_started_at' => 'nullable|date',
            'subscription_expires_at' => 'nullable|date|after_or_equal:subscription_started_at',
            'grace_period_ends_at' => 'nullable|date|after_or_equal:subscription_expires_at',
            'is_saas_blocked' => 'required|boolean',
            'saas_block_reason' => 'nullable|string|max:255',
        ]);

        if (! $validated['is_saas_blocked']) {
            $validated['saas_block_reason'] = null;
            $validated['blocked_at'] = null;
        } else {
            $validated['blocked_at'] = now();
        }

        Dojo::create($validated);

        return back()->with('success', 'Dojo berhasil ditambahkan.');
    }

    public function update(Request $request, Dojo $dojo)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'timezone' => 'required|string|max:64',
            'is_active' => 'required|boolean',
            'saas_plan_name' => 'nullable|string|max:100',
            'billing_cycle_months' => 'required|integer|min:1|max:24',
            'subscription_started_at' => 'nullable|date',
            'subscription_expires_at' => 'nullable|date|after_or_equal:subscription_started_at',
            'grace_period_ends_at' => 'nullable|date|after_or_equal:subscription_expires_at',
            'is_saas_blocked' => 'required|boolean',
            'saas_block_reason' => 'nullable|string|max:255',
        ]);

        if (! $validated['is_saas_blocked']) {
            $validated['saas_block_reason'] = null;
            $validated['blocked_at'] = null;
        } else {
            $validated['blocked_at'] = $dojo->blocked_at ?: now();
        }

        $dojo->update($validated);

        return back()->with('success', 'Dojo berhasil diperbarui.');
    }

    public function destroy(Dojo $dojo)
    {
        $dojo->delete();

        return back()->with('success', 'Dojo berhasil dihapus.');
    }
}
