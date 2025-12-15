# Middleware: EnsureUserIsEnrolled

## 1. Purpose

The `EnsureUserIsEnrolled` middleware is designed to protect routes that serve course-specific content (like lessons, quizzes, assignments, or a course dashboard). It verifies whether the currently authenticated user has the right to access the content of a specific course based on their enrollment status or privileged roles (administrator or course teacher).

## 2. How it Works

The middleware executes the following logic in its `handle` method:

1.  **Retrieve Course Context**: It first attempts to resolve a `Course` model instance from the incoming request's route parameters. The specific route parameter name used to bind the course (e.g., `{course:slug}`) can be configured when applying the middleware (defaults to `'course'`). If a valid `Course` model cannot be resolved, access is denied, as the context for an enrollment check is missing.

2.  **User Authentication**: It checks if a user is authenticated. If not, it redirects the user to the login page. (This step assumes that Laravel's standard `auth` middleware is typically applied to the route group *before* this middleware).

3.  **Admin Bypass**: If the authenticated user has the role of `'admin'` (checked via an assumed `User->hasRole('admin')` method), they are granted immediate access to the course content, bypassing any enrollment checks.

4.  **Teacher Bypass**: If the authenticated user's ID matches the `user_id` on the `Course` model (i.e., they are the teacher or owner of the course), they are also granted immediate access, bypassing enrollment checks. This allows teachers to manage and view their own course content.

5.  **Active Enrollment Check**: If the user is neither an admin nor the course teacher, the middleware queries the `enrollments` table to check for an existing record where:
    *   `user_id` matches the authenticated user's ID.
    *   `course_id` matches the ID of the course being accessed.
    *   `status` is `'active'`.
    Only an active enrollment grants access.

6.  **Grant or Deny Access**:
    *   If any of the bypass conditions are met OR an active enrollment is found, the middleware allows the request to proceed to the next handler (e.g., the controller action) by returning `$next($request)`.
    *   If none of the access conditions are met, access is denied. The middleware calls a helper method (`accessDeniedResponse`) which:
        *   If the request expects a JSON response (e.g., an API request), it returns a JSON object with an error message and a `403 Forbidden` HTTP status code.
        *   Otherwise (for web requests), it redirects the user. If a `Course` context was available, it redirects to that course's detail page (`courses.show`) with an error flash message. If no course context was available, it attempts to redirect to a named route `'home'` or, as a final fallback, to the root path (`/`) with an error flash message.

## 3. Registration

To make this middleware usable, it needs to be registered in the `app/Http/Kernel.php` file within the `$routeMiddleware` array. This allows it to be referenced by a short alias in route definitions.

```php
// In app/Http/Kernel.php

protected $routeMiddleware = [
    // ... other middleware
    'enrollment.check' => \App\Http\Middleware\EnsureUserIsEnrolled::class,
];
```

## 4. Usage

This middleware is intended to be applied to routes that provide access to restricted course content. It should typically be used in conjunction with the `auth` middleware to ensure only authenticated users proceed to the enrollment check.

**Example (Conceptual for Phase 5 Routes):**

```php
// In routes/web.php or a relevant route file

Route::middleware(['auth', 'enrollment.check'])->group(function () {
    Route::get('/courses/{course:slug}/learn', [StudentCourseController::class, 'learn'])->name('courses.learn');
    Route::get('/courses/{course:slug}/lessons/{lesson:slug}', [StudentLessonController::class, 'show'])->name('courses.lessons.show');
    // Add other routes for quizzes, assignments, etc.
});
```

When defining routes that use implicit route model binding for the course (e.g., `{course:slug}`), the middleware will automatically pick up the `Course` instance. If a different route parameter name is used for the course, it can be passed to the middleware: `'enrollment.check:course_identifier'`.

## 5. Dependencies

*   **Models**: `App\Models\Course`, `App\Models\Enrollment`, `App\Models\User`.
*   **User Model**: Assumes the `User` model has a `hasRole(string $roleName): bool` method for checking administrator privileges.
*   **Course Model**: Assumes the `Course` model has a `user_id` attribute representing the ID of the teacher/owner and a `slug` for route model binding.
*   **Enrollment Model**: Assumes `user_id`, `course_id`, and `status` (enum: 'active', etc.) attributes.
*   **Facades**: `Illuminate\Support\Facades\Auth`, `Illuminate\Support\Facades\Log`, `Illuminate\Support\Facades\Route`.
*   **Named Routes**: Relies on the existence of a `'login'` route for unauthenticated redirects, a `'courses.show'` route for access denied redirects (when course context is available), and attempts to use a `'home'` route as a general fallback.

## 6. Configuration

The primary configuration is the optional route parameter name for the course, which defaults to `'course'`. If your route defines the course model with a different parameter name, for example, `Route::get('/path/{my_course_instance}/content', ...)` then you would apply the middleware as `->middleware('enrollment.check:my_course_instance')`.

## 7. Detailed Recommendations for Future Improvements

1.  **Leverage Laravel Policies/Gates for Bypass Logic**:
    *   Instead of directly checking roles (`$user->hasRole('admin')`) or ownership (`$course->user_id === $user->id`) within the middleware, define these rules within a Laravel Policy (e.g., `CoursePolicy`).
    *   Create methods in `CoursePolicy` like `viewAdmin(User $user, Course $course)` or `viewTeacher(User $user, Course $course)`, and `viewEnrolled(User $user, Course $course)`.
    *   The middleware can then simplify its checks to something like: `if ($user->can('viewContent', $course)) { return $next($request); }` where `viewContent` would internally check these various conditions in the policy.
    *   This centralizes authorization logic related to courses, makes it more reusable, and aligns better with Laravel's authorization best practices.

2.  **More Granular Access Control & Reasons**:
    *   The current middleware provides a binary enrolled/not-enrolled check (with bypasses). For more complex scenarios, such as drip content (lessons unlocked over time), prerequisite completion, or access expiration (for time-limited purchases/enrollments), this middleware would need to be extended or supplemented.
    *   Consider a dedicated `CourseAccessService` that the middleware could call. This service could return not just a boolean but an object or enum indicating the specific reason for access denial if applicable, allowing for more tailored user feedback.

3.  **Enhanced Role/Permission System Integration**:
    *   If a more sophisticated role-based access control (RBAC) system is used (e.g., one with permissions beyond simple roles), integrate the bypass logic more deeply with that system. For instance, check for a specific permission like `'bypass course enrollment check'` instead of a hardcoded `'admin'` role.

4.  **Comprehensive Testing**: 
    *   Develop a robust suite of feature tests for the middleware covering all access paths:
        *   Unauthenticated users.
        *   Non-existent or invalid course route parameters.
        *   Admin users accessing any course.
        *   Teachers accessing their own courses.
        *   Teachers attempting to access other teachers' courses (should be denied unless also admin or enrolled).
        *   Regular users with active enrollments.
        *   Regular users with inactive/expired enrollments (should be denied).
        *   Regular users with no enrollments.
        *   Test both web (redirect) and JSON (403 response) scenarios.

5.  **Configuration for Redirect Routes**: 
    *   Instead of hardcoding fallback route names like `'home'` or `/`, consider making the default access denied redirect route configurable, perhaps via a configuration file, if more flexibility is needed across different application sections.

6.  **Logging Context**: 
    *   Enhance logging by including more context, such as the route name or action being accessed, to aid in debugging access issues.

7.  **Consideration for Course Publishing Status**: 
    *   The middleware currently assumes the course content routes would only be for published courses. If teachers or admins need to preview unpublished course content through the same routes, the bypass logic should explicitly allow this, while still preventing general enrolled users from accessing unpublished content.

By implementing these improvements, the `EnsureUserIsEnrolled` middleware can become even more robust, maintainable, and aligned with best practices for authorization in a Laravel application. 