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
            'dojos' => Inertia::defer(fn () => Dojo::query()->orderBy('name')->get()),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'timezone' => 'required|string|max:64',
            'is_active' => 'required|boolean',
        ]);

        Dojo::create($validated);

        return back()->with('success', 'Dojo berhasil ditambahkan.');
    }

    public function update(Request $request, Dojo $dojo)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'timezone' => 'required|string|max:64',
            'is_active' => 'required|boolean',
        ]);

        $dojo->update($validated);

        return back()->with('success', 'Dojo berhasil diperbarui.');
    }

    public function destroy(Dojo $dojo)
    {
        $dojo->delete();

        return back()->with('success', 'Dojo berhasil dihapus.');
    }
}
