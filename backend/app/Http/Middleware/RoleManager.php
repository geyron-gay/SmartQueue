<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleManager
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
   public function handle(Request $request, Closure $next, $role)
{
    // 1. Check if user is even logged in
    if (!Auth::check()) {
        return response()->json(['message' => 'Please login first'], 401);
    }

    // 2. Check if their role matches the requirement
    $userRole = Auth::user()->role;

    if ($userRole === $role) {
        return $next($request);
    }

    // 3. If they are the wrong role, block them
    return response()->json(['message' => 'Unauthorized. You do not have the ' . $role . ' role.'], 403);
}
}
