<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

final class EnsureUserIsEnrolled
{
    /**
     * Handle an incoming request.
     *
     * @param \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response) $next
     * @param string                                                                           $courseRouteParameter The name of the route parameter that holds the course identifier (e.g., 'course' for {course:slug})
     */
    public function handle(Request $request, Closure $next, string $courseRouteParameter = 'course'): Response
    {
        /** @var Course|null $course */
        $course = $request->route($courseRouteParameter);

        
        if (!$course instanceof Course) {
            Log::error("EnsureUserIsEnrolled: Course model not found or invalid for route parameter '{$courseRouteParameter}'.", [
                'route' => $request->route() ? $request->route()->getName() : 'N/A',
                'parameters' => $request->route() ? $request->route()->parameters() : []
            ]);
            
            
            return $this->accessDeniedResponse($request, null, 'Course context not found.');
        }

        /** @var User|null $user */
        $user = Auth::user();

        
        
        if (!$user) {
            
            return redirect()->guest(route('login'));
        }

        
        
        if ($user->hasRole('admin')) {
            Log::debug("EnsureUserIsEnrolled: Admin user {$user->id} granted access to course {$course->id}.");
            return $next($request);
        }

        
        if ($course->user_id === $user->id) {
            Log::debug("EnsureUserIsEnrolled: Teacher user {$user->id} granted access to own course {$course->id}.");
            return $next($request);
        }

        
        $isEnrolled = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active') 
            ->exists();

        if ($isEnrolled) {
            Log::debug("EnsureUserIsEnrolled: Enrolled user {$user->id} granted access to course {$course->id}.");
            return $next($request);
        }

        
        Log::warning("EnsureUserIsEnrolled: Access denied for user {$user->id} to course {$course->id}. Not enrolled or privileged.");
        return $this->accessDeniedResponse($request, $course, 'You do not have access to this course.');
    }

    /**
     * Helper to generate access denied response.
     * Can redirect back with error or return 403 for API requests.
     */
    private function accessDeniedResponse(Request $request, ?Course $course, string $message): Response
    {
        if ($request->expectsJson()) {
            return response()->json(['message' => $message], 403);
        }

        $redirectRouteName = 'home'; 
        $redirectParameters = [];

        if ($course) {
            $redirectRouteName = 'courses.show';
            $redirectParameters = [$course->slug];
        } elseif (!\Illuminate\Support\Facades\Route::has('home')) { 
            
            
            return redirect('/')->with('error', $message);
        }

        return redirect()->route($redirectRouteName, $redirectParameters)->with('error', $message);
    }
}
