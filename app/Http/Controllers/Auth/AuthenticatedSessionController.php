<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): View
    {
        return view('auth.login');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();


        if ($request->session()->has('redirect')) {
            $redirectUrl = $request->session()->get('redirect');
            $request->session()->forget('redirect');
            return redirect($redirectUrl);
        }

        $user = Auth::user();

        if ($user) {
            if ($user->isTeacher()) {
                return redirect()->route('teacher.overview');
            }

            if ($user->isAdmin()) {
                return redirect()->route('admin.overview');
            }

            if ($user->isStudent()) {
                return redirect()->route('student.overview');
            }

            if ($user->isParent()) {
                return redirect()->route('parent.overview');
            }
        }

        throw new \LogicException('Authenticated user does not have a recognized role.');
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
