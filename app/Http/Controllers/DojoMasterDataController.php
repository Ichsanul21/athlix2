<?php

namespace App\Http\Controllers;

use App\Models\Level;
use App\Models\Specialization;
use App\Models\Dojo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DojoMasterDataController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $requestedDojoId = request('dojo_id');
        $dojoId = $this->resolveDojoId($user, $requestedDojoId ? (int) $requestedDojoId : null);

        if (!$dojoId && !$user->isSuperAdmin()) abort(403);

        return Inertia::render('DojoAdmin/MasterData', [
            'levels' => $dojoId ? Level::where('dojo_id', $dojoId)->orderBy('order_level')->get() : [],
            'specializations' => $dojoId ? Specialization::where('dojo_id', $dojoId)->orderBy('name')->get() : [],
            'dojos' => $user->isSuperAdmin() ? Dojo::orderBy('name')->get(['id', 'name']) : [],
            'selectedDojoId' => $dojoId,
        ]);
    }

    public function storeLevel(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'order_level' => 'required|integer',
            'color_hex' => 'nullable|string|max:7',
            'dojo_id' => $user->isSuperAdmin() ? 'required|exists:dojos,id' : 'nullable',
        ]);

        $validated['dojo_id'] = $user->isSuperAdmin() ? $validated['dojo_id'] : $user->dojo_id;
        Level::create($validated);

        return back()->with('success', 'Level berhasil ditambahkan.');
    }

    public function updateLevel(Request $request, Level $level)
    {
        $user = auth()->user();
        if (!$user->isSuperAdmin() && $level->dojo_id !== $user->dojo_id) abort(403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'order_level' => 'required|integer',
            'color_hex' => 'nullable|string|max:7',
        ]);

        $level->update($validated);

        return back()->with('success', 'Level berhasil diperbarui.');
    }

    public function destroyLevel(Level $level)
    {
        $user = auth()->user();
        if (!$user->isSuperAdmin() && $level->dojo_id !== $user->dojo_id) abort(403);

        $level->delete();

        return back()->with('success', 'Level berhasil dihapus.');
    }

    public function storeSpecialization(Request $request)
    {
        $user = auth()->user();
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'dojo_id' => $user->isSuperAdmin() ? 'required|exists:dojos,id' : 'nullable',
        ]);

        $validated['dojo_id'] = $user->isSuperAdmin() ? $validated['dojo_id'] : $user->dojo_id;
        Specialization::create($validated);

        return back()->with('success', 'Spesialisasi berhasil ditambahkan.');
    }

    public function updateSpecialization(Request $request, Specialization $specialization)
    {
        $user = auth()->user();
        if (!$user->isSuperAdmin() && $specialization->dojo_id !== $user->dojo_id) abort(403);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $specialization->update($validated);

        return back()->with('success', 'Spesialisasi berhasil diperbarui.');
    }

    public function destroySpecialization(Specialization $specialization)
    {
        $user = auth()->user();
        if (!$user->isSuperAdmin() && $specialization->dojo_id !== $user->dojo_id) abort(403);

        $specialization->delete();

        return back()->with('success', 'Spesialisasi berhasil dihapus.');
    }
}
