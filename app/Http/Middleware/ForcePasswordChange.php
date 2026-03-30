<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordChange
{
    /**
     * Routes that are allowed even when must_change_password = true.
     */
    private const ALLOWED_ROUTES = [
        'password.change',
        'password.change.update',
        'logout',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password) {
            // Allow API/JSON requests to pass through (PWA, AJAX)
            if ($request->expectsJson() || $request->is('api/*')) {
                return $next($request);
            }

            // Allow whitelisted routes
            if ($request->routeIs(...self::ALLOWED_ROUTES)) {
                return $next($request);
            }

            return redirect()->route('password.change')
                ->with('info', 'Silakan ganti password Anda sebelum melanjutkan.');
        }

        return $next($request);
    }
}
