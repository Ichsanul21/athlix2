<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Inertia::defer(fn () => Route::has('password.request')),
            'status' => Inertia::defer(fn () => session('status')),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = $request->user()?->loadMissing('dojo');
        if ($user && ! $user->isSuperAdmin() && ! $user->isLandingAdmin() && $user->dojo_id) {
            $dojo = $user->dojo;
            if (! $dojo || ! $dojo->canAccessSaas()) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                $message = $dojo && $dojo->accessStatusLabel() === 'Expired'
                    ? 'Login ditolak: masa berlangganan SaaS dojo sudah berakhir.'
                    : 'Login ditolak: dojo sedang nonaktif atau diblokir.';

                throw ValidationException::withMessages([
                    'identifier' => $message,
                    'email' => $message,
                ]);
            }
        }

        $request->session()->regenerate();

        $target = match ($user?->role) {
            'atlet', 'murid', 'athlete' => route('pwa.home', absolute: false),
            'parent' => route('pwa.home', absolute: false),
            'sensei', 'head_coach', 'assistant' => route('sensei-pwa.entry', absolute: false),
            'landing_admin' => route('cms.index', absolute: false),
            'dojo_admin' => route('dojo-admin.sensei.index', absolute: false),
            default => route('dashboard', absolute: false),
        };

        return redirect()->intended($target);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
