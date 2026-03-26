<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        if ($user->isSuperAdmin() || $user->isLandingAdmin()) {
            return $next($request);
        }

        if (! $user->dojo_id) {
            return $next($request);
        }

        $dojo = $user->dojo()->first();
        if (! $dojo || $dojo->canAccessSaas()) {
            return $next($request);
        }

        $message = $dojo->accessStatusLabel() === 'Expired'
            ? 'Akses dojo ditutup karena masa berlangganan SaaS telah berakhir.'
            : 'Akses dojo sedang nonaktif atau diblokir oleh platform.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'tenant_status' => $dojo->accessStatusLabel(),
            ], 423);
        }

        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return redirect()->route('login')->withErrors([
            'email' => $message,
        ]);
    }
}
