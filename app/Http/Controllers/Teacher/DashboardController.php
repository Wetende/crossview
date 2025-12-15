<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseReview;
use App\Models\User;
use App\Models\Enrollment;
use App\Models\CoursePurchase;
use App\Models\Payment;
use App\Models\TeacherProfile;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;
use Illuminate\Support\Collection;

final class DashboardController extends Controller
{
    /**
     * Display the teacher dashboard overview.
     */
    public function overview(Request $request): View
    {
        $user = Auth::user();


        $courses = Course::where('user_id', $user->id)->get();
        $courseIds = $courses->pluck('id')->toArray();


        $totalCourses = count($courses);
        $totalStudents = Enrollment::whereIn('course_id', $courseIds)
            ->distinct('user_id')
            ->count();

        $pendingReviews = CourseReview::whereIn('course_id', $courseIds)
            ->where('is_approved', false)
            ->count();



        $totalEarnings = 0;

        try {

            if (class_exists('\App\Models\Payment')) {
                $totalEarnings = Payment::where('status', 'completed')
                    ->where('payable_type', 'App\\Models\\Course')
                    ->whereIn('payable_id', $courseIds)
                    ->sum('amount') ?? 0;
            }


            if ($totalEarnings == 0 && class_exists('\App\Models\CoursePurchase')) {

                $totalEarnings = CoursePurchase::whereIn('course_id', $courseIds)
                    ->sum('teacher_payout') ?? 0;
            }
        } catch (\Exception $e) {


            $totalEarnings = 0;
        }


        $recentActivities = $this->getRecentActivity($user->id, $courseIds);


        $popularCourses = Course::where('user_id', $user->id)
            ->withCount('enrollments')
            ->orderBy('enrollments_count', 'desc')
            ->limit(3)
            ->get();


        $lastMonthEnrollments = Enrollment::whereIn('course_id', $courseIds)
            ->whereDate('enrolled_at', '>=', Carbon::now()->subMonth())
            ->count();

        $twoMonthsAgoEnrollments = Enrollment::whereIn('course_id', $courseIds)
            ->whereDate('enrolled_at', '>=', Carbon::now()->subMonths(2))
            ->whereDate('enrolled_at', '<', Carbon::now()->subMonth())
            ->count();

        $enrollmentGrowthPercent = 0;
        if ($twoMonthsAgoEnrollments > 0) {
            $enrollmentGrowthPercent = round((($lastMonthEnrollments - $twoMonthsAgoEnrollments) / $twoMonthsAgoEnrollments) * 100);
        }

        return view('teacher.overview', [
            'totalCourses' => $totalCourses,
            'totalStudents' => $totalStudents,
            'pendingReviews' => $pendingReviews,
            'totalEarnings' => $totalEarnings,
            'recentActivities' => $recentActivities,
            'popularCourses' => $popularCourses,
            'enrollmentGrowthPercent' => $enrollmentGrowthPercent,
        ]);
    }

    /**
     * Get recent activities for the teacher's courses.
     */
    private function getRecentActivity(int $teacherId, array $courseIds): Collection
    {
        $activities = collect();


        $enrollments = Enrollment::whereIn('course_id', $courseIds)
            ->with(['user', 'course'])
            ->orderBy('enrolled_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($enrollment) {
                return [
                    'type' => 'enrollment',
                    'date' => $enrollment->enrolled_at,
                    'data' => $enrollment
                ];
            });


        $reviews = CourseReview::whereIn('course_id', $courseIds)
            ->with(['user', 'course'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($review) {
                return [
                    'type' => 'review',
                    'date' => $review->created_at,
                    'data' => $review
                ];
            });


        $completions = Enrollment::whereIn('course_id', $courseIds)
            ->whereNotNull('completed_at')
            ->with(['user', 'course'])
            ->orderBy('completed_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($completion) {
                return [
                    'type' => 'completion',
                    'date' => $completion->completed_at,
                    'data' => $completion
                ];
            });


        $activities = $activities->concat($enrollments)
            ->concat($reviews)
            ->concat($completions)
            ->sortByDesc('date')
            ->take(5);

        return $activities;
    }

    /**
     * Display the list of courses managed by the teacher.
     */
    public function myCourses(Request $request): View
    {
        return view('teacher.courses.index');
    }

    /**
     * Show the form for creating a new course.
     */
    public function createCourseForm(Request $request): View
    {
        return view('teacher.courses.create');
    }

    /**
     * Store a newly created course in storage.
     */
    public function storeCourse(Request $request): \Illuminate\Http\RedirectResponse
    {


        return redirect()->route('teacher.courses.index')->with('success', get_lms_term('Study Material') . ' created successfully.');
    }

    /**
     * Display the list of reviews for the teacher's courses.
     */
    public function reviews(Request $request): View
    {
        $user = Auth::user();
        $courseId = $request->input('course_id');
        $rating = $request->input('rating');

        $reviewsQuery = CourseReview::whereIn('course_id', Course::where('user_id', $user->id)->pluck('id'))
            ->with(['user', 'course']);

        if ($courseId) {
            $reviewsQuery->where('course_id', $courseId);
        }

        if ($rating) {
            $reviewsQuery->where('rating', $rating);
        }

        $reviews = $reviewsQuery->orderBy('created_at', 'desc')->paginate(10);
        $courses = Course::where('user_id', $user->id)->get();

        return view('teacher.reviews.index', [
            'reviews' => $reviews,
            'courses' => $courses,
            'totalCount' => $reviewsQuery->count()
        ]);
    }

    /**
     * Display the teacher's settings page.
     */
    public function settings(Request $request): View
    {
        $user = Auth::user();
        $teacherProfile = $user->teacherProfile;
        $hasPaymentDetails = $user->paymentDetail ? true : false;
        $paymentDetail = $user->paymentDetail;


        $notificationPreferences = $user->notification_preferences ?? [
            'new_enrollment' => true,
            'assignment_submission' => true,
            'new_review' => true,
            'course_purchase' => true,
            'payment_processed' => true,
        ];

        return view('teacher.settings.profile', compact(
            'teacherProfile',
            'hasPaymentDetails',
            'paymentDetail',
            'notificationPreferences'
        ));
    }

    /**
     * Update the teacher's profile.
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();


        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone_number' => ['nullable', 'string', 'max:20'],

            'bio' => ['nullable', 'string', 'min:50', 'max:2000'],
            'qualifications' => ['nullable', 'string', 'min:10', 'max:1000'],
            'school_affiliation' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'hourly_rate' => ['nullable', 'numeric', 'min:0', 'max:1000'],
        ], [
            'bio.min' => 'Your bio should be at least 50 characters to help students know about you.',
            'qualifications.min' => 'Please provide at least a brief description of your qualifications.',
            'name.required' => 'Your full name is required.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email address is already in use.',
        ]);


        User::where('id', $user->id)->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'] ?? null,
        ]);


        $user = User::find($user->id);


        $teacherProfile = $user->teacherProfile;
        if (!$teacherProfile) {
            $teacherProfile = new TeacherProfile();
            $teacherProfile->user_id = $user->id;
        }


        $wasProfileIncomplete = !$teacherProfile->exists || !$teacherProfile->hasMinimumInfoForPublishing();


        $teacherProfile->bio = $validated['bio'] ?? $teacherProfile->bio;
        $teacherProfile->qualifications = $validated['qualifications'] ?? $teacherProfile->qualifications;
        $teacherProfile->school_affiliation = $validated['school_affiliation'] ?? $teacherProfile->school_affiliation;
        $teacherProfile->position = $validated['position'] ?? $teacherProfile->position;
        $teacherProfile->hourly_rate = $validated['hourly_rate'] ?? $teacherProfile->hourly_rate;
        $teacherProfile->available_for_tutoring = $request->has('available_for_tutoring');


        $teacherProfile->save();


        $completeness = $teacherProfile->getCompletenessPercentage();
        $hasMinimumInfo = $teacherProfile->hasMinimumInfoForPublishing();

        if ($hasMinimumInfo && $wasProfileIncomplete) {
            $message = 'Profile updated successfully! You can now create and publish ' . get_lms_term('study materials') . '.';
        } elseif ($hasMinimumInfo) {
            $message = "Profile updated successfully! Your profile is {$completeness}% complete.";
        } else {
            $missingFields = $teacherProfile->getMissingFields();
            $fieldNames = $teacherProfile->getFieldDisplayNames();
            $missingNames = array_map(fn ($field) => $fieldNames[$field] ?? $field, $missingFields);

            $message = "Profile updated. To create courses, please complete: " . implode(', ', $missingNames) .
                      " OR provide a comprehensive bio.";
        }

        return redirect()->route('teacher.settings')
            ->with('success', $message);
    }

    /**
     * Update the teacher's password.
     */
    public function updatePassword(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'current_password' => ['required', 'string', function ($attribute, $value, $fail) use ($user) {
                if (!Hash::check($value, $user->password)) {
                    $fail('The current password is incorrect.');
                }
            }],
            'password' => ['required', 'string', 'min:8', 'confirmed', 'different:current_password'],
        ]);

        User::where('id', $user->id)->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->route('teacher.settings')
            ->with('success', 'Password updated successfully.');
    }

    /**
     * Update the teacher's notification settings.
     */
    public function updateNotificationSettings(Request $request)
    {
        $user = Auth::user();


        $notificationSettings = [
            'new_enrollment' => $request->has('notifications.new_enrollment'),
            'assignment_submission' => $request->has('notifications.assignment_submission'),
            'new_review' => $request->has('notifications.new_review'),
            'course_purchase' => $request->has('notifications.course_purchase'),
            'payment_processed' => $request->has('notifications.payment_processed'),
        ];


        User::where('id', $user->id)->update([
            'notification_preferences' => $notificationSettings,
        ]);

        return redirect()->route('teacher.settings')
            ->with('success', 'Notification settings updated successfully.');
    }

    /**
     * Display the teacher's messages page.
     */
    public function messages(Request $request): View
    {
        return view('teacher.messages.index');
    }
}
