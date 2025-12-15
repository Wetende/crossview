<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

final class ImpersonateUser
{
    /**
     * Handle an incoming request.
     *
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        
        if ($request->is('stop-impersonating') && Session::has('admin_id')) {

            $adminId = Session::get('admin_id');

            
            Auth::logout();

            
            Auth::loginUsingId($adminId);

            
            Session::forget('admin_id');
            Session::forget('impersonating');

            return redirect()->route('admin.users.index')->with('success', 'Returned to admin account.');
        }

        
        if (Session::has('impersonating') && Session::get('impersonating')) {
            view()->share('impersonating', true);
        }

        return $next($request);
    }
}
