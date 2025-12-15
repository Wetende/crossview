<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateRankingsJob;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\GradeLevel;
use App\Models\Payment;
use App\Models\RankingSchedule;
use App\Models\Subject;
use App\Models\User;
use App\Services\RankingService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

final class DashboardController extends Controller
{
    public function overview(Request $request): View
    {

        $period = $request->get('period', 30);
        $startDate = Carbon::now()->subDays($period);

        $stats = [
            'total_students' => User::role('student')->count(),
            'total_instructors' => User::role('teacher')->count(),
            'total_courses' => Course::count(),
            'total_earnings' => Payment::where('status', 'completed')
                                      ->where('payable_type', 'App\\Models\\CoursePurchase')
                                      ->sum('amount') ?: 0.00
        ];


        $recentUsers = User::latest()->limit(5)->get();
        $recentCourses = Course::with('user')->latest()->limit(5)->get();


        $recentEnrollments = Enrollment::with(['user', 'course'])
            ->latest()
            ->limit(5)
            ->get();


        $totalCourses = Course::count() ?: 1;
        $publishedCourses = Course::status('published')->count();
        $draftCourses = Course::status('draft')->count();
        $featuredCourses = Course::featured()->count();

        $courseStats = [
            'published' => $publishedCourses,
            'draft' => $draftCourses,
            'featured' => $featuredCourses,
            'published_percent' => ($publishedCourses / $totalCourses) * 100,
            'draft_percent' => ($draftCourses / $totalCourses) * 100,
            'featured_percent' => ($featuredCourses / $totalCourses) * 100,
        ];


        $chartData = $this->generateChartData($period);

        return view('admin.overview', compact(
            'stats',
            'recentUsers',
            'recentCourses',
            'recentEnrollments',
            'courseStats',
            'chartData'
        ));
    }

    public function courseManagement(): View
    {

        return view('admin.courses.index');
    }

    public function settings(): View
    {
        $user = Auth::user();
        $teacherProfile = $user->teacherProfile;

        return view('admin.settings.index', compact('user', 'teacherProfile'));
    }

    public function reports(Request $request): View
    {
        $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));


        $startDateCarbon = Carbon::parse($startDate);
        $endDateCarbon = Carbon::parse($endDate);


        $newRegistrations = User::whereBetween('created_at', [$startDateCarbon, $endDateCarbon])->count();



        $totalActiveUsers = User::where('updated_at', '>=', Carbon::now()->subHours(24))->count();


        $coursesSold = Payment::where('payable_type', 'App\\Models\\CoursePurchase')
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDateCarbon, $endDateCarbon])
            ->count();


        $topCourses = Course::withCount('purchases')
            ->orderByDesc('purchases_count')
            ->with(['user'])
            ->limit(5)
            ->get();


        $courseCategories = DB::table('courses')
            ->join('categories', 'courses.category_id', '=', 'categories.id')
            ->select('categories.name', DB::raw('count(*) as count'))
            ->groupBy('categories.name')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        return view('admin.reports.index', compact(
            'startDate',
            'endDate',
            'newRegistrations',
            'totalActiveUsers',
            'coursesSold',
            'topCourses',
            'courseCategories'
        ));
    }

    /**
     * Show the form for manually generating performance rankings.
     */
    public function showPerformanceGenerationForm(): View
    {
        $schedules = RankingSchedule::orderBy('name')->get();
        $subjects = Subject::where('has_performance_tracking', true)->orderBy('name')->get();
        $gradeLevels = GradeLevel::orderBy('name')->get();

        return view('admin.performance.generate', compact('schedules', 'subjects', 'gradeLevels'));
    }

    /**
     * Trigger a performance generation job based on form input.
     */
    public function triggerPerformanceGeneration(Request $request, RankingService $rankingService): RedirectResponse
    {
        $validator = $request->validate([
            'generation_type' => 'required|in:schedule,custom,all',
            'schedule_id' => 'required_if:generation_type,schedule|nullable|exists:ranking_schedules,id',
            'subject_ids' => 'required_if:generation_type,custom|array|nullable',
            'subject_ids.*' => 'exists:subjects,id',
            'grade_level_ids' => 'required_if:generation_type,custom|array|nullable',
            'grade_level_ids.*' => 'exists:grade_levels,id',
        ]);

        $message = '';

        switch ($request->generation_type) {
            case 'schedule':

                if ($schedule = RankingSchedule::find($request->schedule_id)) {
                    GenerateRankingsJob::dispatch($schedule);
                    $message = "Generation job dispatched for schedule: {$schedule->name}";
                }
                break;

            case 'custom':

                $customSchedule = RankingSchedule::create([
                    'name' => 'Custom Schedule (' . now()->format('Y-m-d H:i') . ')',
                    'frequency' => 'daily',
                    'created_by' => Auth::id(),
                    'is_active' => true,
                    'subjects' => $request->subject_ids ?? [],
                    'grade_levels' => $request->grade_level_ids ?? [],
                ]);

                GenerateRankingsJob::dispatch($customSchedule);
                $message = "Custom generation job dispatched for selected subjects and grade levels";
                break;

            case 'all':

                GenerateRankingsJob::dispatch();
                $message = "Generation job dispatched for all active schedules";
                break;
        }

        return redirect()->route('admin.performance.generate.form')
            ->with('success', $message);
    }

    /**
     * Generate chart data for the dashboard
     */
    private function generateChartData(int $days): array
    {

        $labels = [];
        $enrollments = [];
        $revenue = [];


        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $labels[] = $date->format('M d');


            $dayEnrollments = Enrollment::whereDate('created_at', $date->format('Y-m-d'))->count();
            $enrollments[] = $dayEnrollments;


            $dayRevenue = Payment::where('status', 'completed')
                ->where('payable_type', 'App\\Models\\CoursePurchase')
                ->whereDate('created_at', $date->format('Y-m-d'))
                ->sum('amount');
            $revenue[] = $dayRevenue ?: 0;
        }

        return [
            'labels' => $labels,
            'enrollments' => $enrollments,
            'revenue' => $revenue
        ];
    }

    /**
     * Update admin settings including profile information.
     */
    public function updateSettings(Request $request): RedirectResponse
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
            'bio.min' => 'Your bio should be at least 50 characters to provide students with meaningful information.',
            'qualifications.min' => 'Please provide at least a brief description of your qualifications.',
            'name.required' => 'Your full name is required.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email address is already in use.',
        ]);


        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'] ?? null,
        ]);


        $teacherProfile = $user->teacherProfile;
        if (!$teacherProfile) {
            $teacherProfile = new \App\Models\TeacherProfile();
            $teacherProfile->user_id = $user->id;
        }


        $teacherProfile->bio = $validated['bio'] ?? $teacherProfile->bio;
        $teacherProfile->qualifications = $validated['qualifications'] ?? $teacherProfile->qualifications;
        $teacherProfile->school_affiliation = $validated['school_affiliation'] ?? $teacherProfile->school_affiliation;
        $teacherProfile->position = $validated['position'] ?? $teacherProfile->position;
        $teacherProfile->hourly_rate = $validated['hourly_rate'] ?? $teacherProfile->hourly_rate;
        $teacherProfile->available_for_tutoring = $request->has('available_for_tutoring');


        $teacherProfile->save();

        return redirect()->route('admin.settings.index')
            ->with('success', 'Admin profile updated successfully! You can now create courses with complete information.');
    }

    /**
     * Update admin password.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return redirect()->back()
                ->withErrors(['current_password' => 'The current password is incorrect.']);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->route('admin.settings.index')
            ->with('success', 'Password updated successfully.');
    }
}
