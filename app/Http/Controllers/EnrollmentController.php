<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

final class EnrollmentController extends Controller
{
    /**
     * Enroll the authenticated user in a course via their active subscription.
     *
     */
    public function enrollViaSubscription(Request $request, Course $course): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();


        if (!$course->is_published) {
            Log::warning("Attempt to enroll in unpublished course {$course->id} by user {$user->id}");
            return redirect()->route('courses.show', $course->slug)
                ->with('error', 'This ' . get_lms_term('study material') . ' is not currently available for enrollment.');
        }

        if (is_null($course->required_subscription_tier_id)) {
            Log::warning("Attempt to enroll via subscription in course {$course->id} (no required tier) by user {$user->id}");
            return redirect()->route('courses.show', $course->slug)
                ->with('error', 'This ' . get_lms_term('study material') . ' is not available for subscription-based enrollment.');
        }

        $existingEnrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->exists();

        if ($existingEnrollment) {
            return redirect()->route('courses.show', $course->slug)
                ->with('info', 'You are already enrolled in this ' . get_lms_term('study material') . '.');
        }






        $userActiveSubscription = $user->activeSubscription()->first();

        if (!$userActiveSubscription || !$userActiveSubscription->subscriptionTier) {
            Log::info("User {$user->id} attempted enrollment in {$course->id} without an active/valid subscription tier.");
            return redirect()->route('courses.show', $course->slug)
                ->with('error', 'You do not have an active subscription or your subscription tier is invalid.');
        }

        $userTier = $userActiveSubscription->subscriptionTier;
        $courseRequiredTier = $course->requiredSubscriptionTier;

        if (!$courseRequiredTier) {
            Log::error("Course {$course->id} has required_subscription_tier_id but failed to load requiredSubscriptionTier relationship.");
            return redirect()->route('courses.show', $course->slug)
                ->with('error', 'Could not verify ' . get_lms_term('study material') . ' subscription requirements. Please try again later.');
        }


        if ($userTier->level < $courseRequiredTier->level) {
            Log::info("User {$user->id} (tier: {$userTier->name}/{$userTier->level}) attempt to enroll in {$course->id} (requires tier: {$courseRequiredTier->name}/{$courseRequiredTier->level}) - insufficient tier.");
            return redirect()->route('courses.show', $course->slug)
                ->with('error', 'Your current subscription tier does not grant access to this ' . get_lms_term('study material') . '. Please upgrade your subscription.');
        }


        try {
            Enrollment::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'enrolled_at' => now(),
                'access_type' => 'subscription',
                'status' => 'active',
                'course_purchase_id' => null,
            ]);

            Log::info("User {$user->id} successfully enrolled in " . get_lms_term('study material') . " {$course->id} via subscription (tier: {$userTier->name}).");


            return redirect()->route('courses.show', $course->slug)
                ->with('success', 'You have successfully enrolled in the ' . get_lms_term('study material') . '!');

        } catch (\Exception $e) {
            Log::error("Error creating enrollment for user {$user->id} in course {$course->id}: " . $e->getMessage());
            return redirect()->route('courses.show', $course->slug)
                ->with('error', 'An unexpected error occurred during enrollment. Please try again.');
        }
    }

    /**
     * Enroll the authenticated user in a free course.
     *
     */
    public function enrollInFreeCourse(Request $request, Course $course): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();


        if (!$course->is_published) {
            Log::warning("Attempt to enroll in unpublished course {$course->id} by user {$user->id}");
            return redirect()->route('courses.show', $course->slug)
                ->with('error', 'This ' . get_lms_term('study material') . ' is not currently available for enrollment.');
        }

        if (!$course->isFree()) {
            Log::warning("Attempt to enroll in non-free course {$course->id} via free enrollment by user {$user->id}");
            return redirect()->route('courses.show', $course->slug)
                ->with('error', 'This ' . get_lms_term('study material') . ' requires payment or a subscription.');
        }

        $existingEnrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->exists();

        if ($existingEnrollment) {
            return redirect()->route('courses.show', $course->slug)
                ->with('info', 'You are already enrolled in this ' . get_lms_term('study material') . '.');
        }


        try {
            Enrollment::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'enrolled_at' => now(),
                'access_type' => 'free',
                'status' => 'active',
                'course_purchase_id' => null,
            ]);

            Log::info("User {$user->id} successfully enrolled in free " . get_lms_term('study material') . " {$course->id}.");

            return redirect()->route('courses.show', $course->slug)
                ->with('success', 'You have successfully enrolled in the ' . get_lms_term('study material') . '!');

        } catch (\Exception $e) {
            Log::error("Error enrolling user {$user->id} in free course {$course->id}: " . $e->getMessage());
            return redirect()->route('courses.show', $course->slug)
                ->with('error', 'An unexpected error occurred during enrollment. Please try again.');
        }
    }
}
