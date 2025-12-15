# Phase 4: Course Access & Enrollment - Backend Development Summary

This document summarizes the backend development work completed for Phase 4: Course Access & Enrollment, focusing on the implementation of course discovery, subscription-based enrollment, direct purchase flow, and access control middleware. Frontend (view) creation was intentionally deferred.

## Overall Goal Achieved (Backend)

The core backend logic that governs how students discover, enroll in, and access courses based on a hybrid model (subscription vs. direct purchase) has been implemented. This includes controllers, routes, database interactions, and an authorization middleware.

---

## Subphase 4.1: Public Course Discovery & Detail Pages (Backend)

**Objective**: Allow public users and authenticated users to discover published courses and view their details, including curriculum outlines and access eligibility.

### Components Created/Modified:

1.  **Controller**: `App\Http\Controllers\Public\CourseController`
    *   `index(Request $request)`: 
        *   Fetches published courses with pagination.
        *   Eager loads `teacher` (name, profile photo), `category`, `subject`, `gradeLevel`.
        *   Implements filtering by `category_id`, `subject_id`, `grade_level_id`.
        *   Implements search on `title`, `short_description`, `description`.
        *   Returns a JSON response with course data.
    *   `show(Request $request, Course $course)`:
        *   Ensures course is published.
        *   Eager loads `teacher` (with bio), `category`, `subject`, `gradeLevel`.
        *   Loads curriculum: `sections` (ordered) with their `lessons`, `quizzes`, `assignments` (ordered, with title, type, duration).
        *   Determines `accessStatus` for the authenticated user ('guest', 'enrolled', 'pending_purchase', 'can_subscribe', 'can_purchase', 'can_subscribe_or_purchase', 'can_enroll_free', 'requires_higher_tier_or_unavailable') based on enrollments, payments, and subscription status.
        *   Returns a JSON response with course details, curriculum outline, and access status.

2.  **Routes** (in `routes/web.php`):
    *   `GET /courses` -> `PublicCourseController@index` (name: `courses.index`)
    *   `GET /courses/{course:slug}` -> `PublicCourseController@show` (name: `courses.show`)

### Reflections & Future Improvements (Subphase 4.1):

*   **Scalability**:
    *   Eager loading and pagination are good for performance.
    *   Search with `LIKE` can be slow on large datasets; consider a dedicated search engine (Elasticsearch, Algolia) for larger scale.
    *   `accessStatus` logic involves multiple queries; caching parts of this could be beneficial for high-traffic course pages.
    *   Filter data (categories, subjects for dropdowns) can be cached.
*   **Maintainability**:
    *   `CourseController@show` is becoming long. The `accessStatus` logic and curriculum outline preparation could be extracted into dedicated service classes (e.g., `CourseAccessService`, `CurriculumService`) to make the controller thinner.
*   **Recommendations**:
    1.  **Refactor Access Status Logic**: Create `App\Services\CourseAccessService`.
    2.  **Refactor Curriculum Outline**: Move to a helper/service.
    3.  **Optimize Filter Data**: Implement caching for categories, subjects, etc.
    4.  **Database Indexing**: Ensure relevant columns are indexed (`is_published`, foreign keys, search fields).
    5.  **Global Scope for Published Courses**: Consider a global scope on `Course` model for `is_published = true`.
    6.  **API Resources**: For more formal API output, use Laravel API Resources.
    7.  **Testing**: Add feature and unit tests.

---

## Subphase 4.2: Subscription-Based Enrollment (Backend)

**Objective**: Allow authenticated users to enroll in courses if their active subscription tier meets the course's requirements.

### Components Created/Modified:

1.  **Controller**: `App\Http\Controllers\EnrollmentController`
    *   `enrollViaSubscription(Request $request, Course $course)`:
        *   Validates course is published and requires a subscription.
        *   Checks user is not already actively enrolled.
        *   Fetches user's active subscription (`User->activeSubscription()->first()`) and its tier level.
        *   Fetches course's required subscription tier (`Course->requiredSubscriptionTier`).
        *   Compares tier levels; denies if user's tier is insufficient.
        *   If eligible, creates an `Enrollment` record (`access_type = 'subscription'`, `status = 'active'`).
        *   Redirects to `courses.show` with success/error messages (TODO: redirect to "Course Home" in Phase 5).
        *   Includes logging for key events and errors.

2.  **Routes** (in `routes/web.php`):
    *   `POST /courses/{course:slug}/enroll/subscription` -> `EnrollmentController@enrollViaSubscription` (name: `courses.enroll.subscription`, `auth` middleware).

### Reflections & Future Improvements (Subphase 4.2):

*   **Scalability**: Queries are simple; indexing is key.
*   **Maintainability**:
    *   Method length is moderate due to validations.
    *   Relies on assumed model relationships/methods (`User::activeSubscription`, `Course::requiredSubscriptionTier`, `SubscriptionTier::level`).
*   **Recommendations**:
    1.  **Service Refactoring**: Extract validation and eligibility logic into an `EnrollmentService` or `SubscriptionEnrollmentService`.
    2.  **Custom Form Request**: Use a Form Request class for initial validation.
    3.  **Explicit Model Relationship Loading**: Use `->with(...)` or `->load(...)` for clarity on relationship data.
    4.  **Database Transactions**: Consider for more complex multi-step enrollments (though current is simple).
    5.  **Events**: Dispatch an event like `UserEnrolledViaSubscription` for decoupling.
    6.  **Route for "Course Home"**: Update redirect upon Phase 5 completion.

---

## Subphase 4.3: Direct Course Purchase Flow (Backend)

**Objective**: Allow authenticated users to initiate a (simulated) purchase for a course and handle (simulated) payment gateway webhooks to complete enrollment.

### Components Created/Modified:

1.  **Controller**: `App\Http\Controllers\CoursePurchaseController`
    *   `initiatePurchase(Request $request, Course $course)`:
        *   Validates course is published, has `price > 0`, user not already enrolled, no existing pending/completed payment for this course by the user.
        *   Uses `DB::transaction` to create `Payment` (status: `pending`, `payment_gateway: 'simulated'`, `payable_type: Course::class`) and `CoursePurchase` records.
        *   Returns JSON response confirming initiation (simulating gateway redirect).
        *   Includes helper methods (`purchaseErrorResponse`, `purchaseInfoResponse`) for consistent responses.
    *   `handleGatewayWebhook(Request $request)`:
        *   Simulates webhook handling (notes importance of real signature validation).
        *   Expects `payment_id` and `event_type` ('payment.succeeded', 'payment.failed') in payload.
        *   Uses `DB::transaction`.
        *   Handles `payment.succeeded`: Updates `Payment` to `completed`, `paid_at`; creates `Enrollment` (`access_type = 'purchase'`, `status = 'active'`).
        *   Handles `payment.failed`: Updates `Payment` to `failed`.
        *   Includes idempotency check and logging.
        *   Returns JSON response to webhook provider.

2.  **Routes** (in `routes/web.php`):
    *   `POST /courses/{course:slug}/purchase` -> `CoursePurchaseController@initiatePurchase` (name: `courses.purchase.initiate`, `auth` middleware).
    *   `POST /payments/webhook/your-gateway` -> `CoursePurchaseController@handleGatewayWebhook` (name: `payments.webhook.gateway`).

### Reflections & Future Improvements (Subphase 4.3):

*   **Scalability**: High webhook traffic might necessitate queuing jobs for processing.
*   **Maintainability**:
    *   Real webhook validation is critical and should be encapsulated.
    *   Event-driven architecture (dispatching `PaymentSucceeded`, `EnrollmentCreatedViaPurchase`, `PaymentFailed` events) is highly recommended.
    *   Core logic in webhook handling could move to a `PaymentProcessingService`.
    *   Supporting multiple gateways would require adaptation (Strategy pattern, dedicated classes).
*   **Recommendations**:
    1.  **Implement Real Webhook Signature Validation**.
    2.  **Queued Webhook Processing**.
    3.  **Dispatch Domain Events**.
    4.  **Refactor to PaymentProcessingService**.
    5.  **User Purchase History**: Develop user-facing views/controllers for purchase history in a later phase.
    6.  **Error Handling & Retries**: Enhance for specific gateway behaviors.

---

## Subphase 4.4: Access Control Middleware & Logic (Backend)

**Objective**: Create a middleware to protect course content routes, ensuring only enrolled users or privileged users (admins, course teachers) can access them.

### Components Created/Modified:

1.  **Middleware**: `App\Http\Middleware\EnsureUserIsEnrolled`
    *   `handle(Request $request, Closure $next, string $courseRouteParameter = 'course')`:
        *   Retrieves `Course` model from route parameter.
        *   Bypasses for admins (`User->hasRole('admin')`) and course teachers (`$course->user_id === Auth::id()`).
        *   Checks for an active `Enrollment` record for other authenticated users.
        *   If access denied, redirects (web) or returns 403 JSON error.
        *   Includes `accessDeniedResponse` helper for consistent responses.
        *   Logging for access granted/denied.

2.  **Middleware Registration** (Conceptual - typically in `bootstrap/app.php` for Laravel 11+):
    *   Aliased as `enrollment.check`.
    *   `$middleware->alias(['enrollment.check' => \App\Http\Middleware\EnsureUserIsEnrolled::class,]);`

### Reflections & Future Improvements (Subphase 4.4):

*   **Scalability**: Middleware logic is lightweight; database check is efficient.
*   **Maintainability**:
    *   Clear logic flow.
    *   Parameterization of course route parameter name adds flexibility.
    *   Dependency on `User->hasRole()` assumes a specific role system.
*   **Recommendations**:
    1.  **Use Laravel Policies/Gates for Bypass Logic**: Define rules in a `CoursePolicy` (e.g., `viewAdmin`, `viewTeacher`, `viewEnrolled`) and use `$user->can('viewContent', $course)` in middleware. This centralizes authorization.
    2.  **More Granular Access Control**: For drip content, prerequisites, or expirations, extend logic or use a dedicated `CourseAccessService`.
    3.  **Enhanced Role/Permission System Integration**: If using a sophisticated RBAC, check for specific permissions.
    4.  **Comprehensive Testing**: Feature test all access paths (unauthenticated, admin, teacher, enrolled, not enrolled, different request types).
    5.  **Configurable Redirect Routes**: Make default denied redirect routes configurable.
    6.  **Logging Context**: Add route name/action to logs.
    7.  **Course Publishing Status in Bypass**: Clarify access rules for unpublished content for admins/teachers if they use the same content routes for previews.

---

This summary provides an overview of the backend infrastructure established in Phase 4, laying the groundwork for student-facing course interaction and content delivery in subsequent phases. 