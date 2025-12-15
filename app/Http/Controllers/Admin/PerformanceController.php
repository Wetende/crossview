<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GradeLevel;
use App\Models\PerformanceLevel;
use App\Models\PerformanceMetric;
use App\Models\RankingSchedule;
use App\Models\Subject;
use App\Models\SubjectPerformanceMetric;
use App\Services\PerformanceCalculationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\View\View;

final class PerformanceController extends Controller
{
    /**
     * Display performance dashboard.
     */
    public function dashboard(): View
    {

        $totalMetrics = PerformanceMetric::count();
        $totalSubjectsWithPerformance = Subject::where('has_performance_tracking', true)->count();
        $totalRankingSchedules = RankingSchedule::count();


        $recentCalculations = DB::table('performance_calculation_logs')
            ->select('performance_calculation_logs.*', 'users.name as student_name', 'subjects.name as subject_name')
            ->join('users', 'performance_calculation_logs.user_id', '=', 'users.id')
            ->join('subjects', 'performance_calculation_logs.subject_id', '=', 'subjects.id')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();


        $activeSchedules = RankingSchedule::where('is_active', true)
            ->orderBy('frequency')
            ->get();

        return view('admin.performance.dashboard', compact(
            'totalMetrics',
            'totalSubjectsWithPerformance',
            'totalRankingSchedules',
            'recentCalculations',
            'activeSchedules'
        ));
    }

    /**
     * Display performance metrics list.
     */
    public function listMetrics(): View
    {
        $metrics = PerformanceMetric::orderBy('name')->paginate(20);

        return view('admin.performance.metrics.index', compact('metrics'));
    }

    /**
     * Show form to create a new performance metric.
     */
    public function createMetric(): View
    {
        return view('admin.performance.metrics.create');
    }

    /**
     * Store a new performance metric.
     */
    public function storeMetric(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:performance_metrics',
            'description' => 'nullable|string',
            'type' => 'required|string|in:knowledge,skill,understanding,application',
        ]);

        $metric = new PerformanceMetric();
        $metric->name = $validated['name'];
        $metric->slug = Str::slug($validated['name']);
        $metric->description = $validated['description'];
        $metric->type = $validated['type'];
        $metric->save();

        return redirect()->route('admin.performance.metrics.index')
            ->with('success', 'Performance metric created successfully.');
    }

    /**
     * Show form to edit a performance metric.
     */
    public function editMetric(PerformanceMetric $metric): View
    {
        return view('admin.performance.metrics.edit', compact('metric'));
    }

    /**
     * Update a performance metric.
     */
    public function updateMetric(Request $request, PerformanceMetric $metric): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:performance_metrics,name,' . $metric->id,
            'description' => 'nullable|string',
            'type' => 'required|string|in:knowledge,skill,understanding,application',
        ]);

        $metric->name = $validated['name'];
        $metric->slug = Str::slug($validated['name']);
        $metric->description = $validated['description'];
        $metric->type = $validated['type'];
        $metric->save();

        return redirect()->route('admin.performance.metrics.index')
            ->with('success', 'Performance metric updated successfully.');
    }

    /**
     * Delete a performance metric.
     */
    public function destroyMetric(PerformanceMetric $metric): RedirectResponse
    {

        $inUse = SubjectPerformanceMetric::where('performance_metric_id', $metric->id)->exists();

        if ($inUse) {
            return redirect()->route('admin.performance.metrics.index')
                ->with('error', 'Cannot delete metric as it is currently used by one or more subjects.');
        }

        $metric->delete();

        return redirect()->route('admin.performance.metrics.index')
            ->with('success', 'Performance metric deleted successfully.');
    }

    /**
     * Display subject performance configuration.
     */
    public function listSubjects(): View
    {
        $subjects = Subject::withCount(['performanceMetrics'])
            ->orderBy('name')
            ->paginate(20);

        return view('admin.performance.subjects.index', compact('subjects'));
    }

    /**
     * Show subject performance metric configuration form.
     */
    public function configureSubject(Subject $subject): View
    {
        $metrics = PerformanceMetric::orderBy('name')->get();
        $configuredMetrics = $subject->performanceMetrics()
            ->orderBy('pivot_weight', 'desc')
            ->get();

        $configuredMetricIds = $configuredMetrics->pluck('id')->toArray();
        $availableMetrics = $metrics->whereNotIn('id', $configuredMetricIds);

        return view('admin.performance.subjects.configure', compact(
            'subject',
            'configuredMetrics',
            'availableMetrics'
        ));
    }

    /**
     * Update subject performance metric configuration.
     */
    public function updateSubjectConfiguration(Request $request, Subject $subject): RedirectResponse
    {

        $validated = $request->validate([
            'has_performance_tracking' => 'boolean',
            'metric_ids' => 'array|nullable',
            'metric_ids.*' => 'exists:performance_metrics,id',
            'weights' => 'array|nullable',
            'weights.*' => 'numeric|min:0|max:100',
        ]);


        $subject->has_performance_tracking = $request->has('has_performance_tracking');
        $subject->save();


        $metricIds = $validated['metric_ids'] ?? [];
        $weights = $validated['weights'] ?? [];

        $syncData = [];
        foreach ($metricIds as $index => $metricId) {
            $syncData[$metricId] = [
                'weight' => $weights[$index] ?? 1.0,
                'is_active' => true,
            ];
        }

        $subject->performanceMetrics()->sync($syncData);

        return redirect()->route('admin.performance.subjects.configure', $subject)
            ->with('success', 'Subject performance configuration updated successfully.');
    }

    /**
     * Display ranking schedules.
     */
    public function listSchedules(): View
    {
        $schedules = RankingSchedule::orderBy('name')
            ->paginate(20);

        return view('admin.performance.schedules.index', compact('schedules'));
    }

    /**
     * Show form to create a new ranking schedule.
     */
    public function createSchedule(): View
    {
        $subjects = Subject::where('has_performance_tracking', true)
            ->orderBy('name')
            ->get();

        $gradeLevels = GradeLevel::orderBy('name')->get();

        return view('admin.performance.schedules.create', compact(
            'subjects',
            'gradeLevels'
        ));
    }

    /**
     * Store a new ranking schedule.
     */
    public function storeSchedule(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'frequency' => 'required|string|in:daily,weekly,monthly',
            'is_active' => 'boolean',
            'subject_ids' => 'array|nullable',
            'subject_ids.*' => 'exists:subjects,id',
            'grade_level_ids' => 'array|nullable',
            'grade_level_ids.*' => 'exists:grade_levels,id',
        ]);

        $schedule = new RankingSchedule();
        $schedule->name = $validated['name'];
        $schedule->frequency = $validated['frequency'];
        $schedule->is_active = $request->has('is_active');
        $schedule->run_at_time = '00:00';
        $schedule->created_by = Auth::id();
        $schedule->subjects = $validated['subject_ids'] ?? [];
        $schedule->grade_levels = $validated['grade_level_ids'] ?? [];
        $schedule->save();

        return redirect()->route('admin.performance.schedules.index')
            ->with('success', 'Ranking schedule created successfully.');
    }

    /**
     * Show form to edit a ranking schedule.
     */
    public function editSchedule(RankingSchedule $schedule): View
    {
        $subjects = Subject::where('has_performance_tracking', true)
            ->orderBy('name')
            ->get();

        $gradeLevels = GradeLevel::orderBy('name')->get();

        return view('admin.performance.schedules.edit', compact(
            'schedule',
            'subjects',
            'gradeLevels'
        ));
    }

    /**
     * Update a ranking schedule.
     */
    public function updateSchedule(Request $request, RankingSchedule $schedule): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'frequency' => 'required|string|in:daily,weekly,monthly',
            'is_active' => 'boolean',
            'subject_ids' => 'array|nullable',
            'subject_ids.*' => 'exists:subjects,id',
            'grade_level_ids' => 'array|nullable',
            'grade_level_ids.*' => 'exists:grade_levels,id',
        ]);

        $schedule->name = $validated['name'];
        $schedule->frequency = $validated['frequency'];
        $schedule->is_active = $request->has('is_active');
        $schedule->subjects = $validated['subject_ids'] ?? [];
        $schedule->grade_levels = $validated['grade_level_ids'] ?? [];
        $schedule->save();

        return redirect()->route('admin.performance.schedules.index')
            ->with('success', 'Ranking schedule updated successfully.');
    }

    /**
     * Delete a ranking schedule.
     */
    public function destroySchedule(RankingSchedule $schedule): RedirectResponse
    {
        $schedule->delete();

        return redirect()->route('admin.performance.schedules.index')
            ->with('success', 'Ranking schedule deleted successfully.');
    }

    /**
     * Display performance levels.
     */
    public function listLevels(): View
    {
        $levels = PerformanceLevel::orderBy('display_order')->get();

        return view('admin.performance.levels.index', compact('levels'));
    }

    /**
     * Show form to create a new performance level.
     */
    public function createLevel(): View
    {
        return view('admin.performance.levels.create');
    }

    /**
     * Store a new performance level.
     */
    public function storeLevel(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'min_score' => 'required|numeric|min:0|max:100',
            'max_score' => 'required|numeric|min:0|max:100|gte:min_score',
            'color_code' => 'required|string|max:50',
            'display_order' => 'required|integer|min:1',
        ]);

        $level = new PerformanceLevel();
        $level->name = $validated['name'];
        $level->min_score = $validated['min_score'];
        $level->max_score = $validated['max_score'];
        $level->color_code = $validated['color_code'];
        $level->display_order = $validated['display_order'];
        $level->save();

        return redirect()->route('admin.performance.levels.index')
            ->with('success', 'Performance level created successfully.');
    }

    /**
     * Show form to edit a performance level.
     */
    public function editLevel(PerformanceLevel $level): View
    {
        return view('admin.performance.levels.edit', compact('level'));
    }

    /**
     * Update a performance level.
     */
    public function updateLevel(Request $request, PerformanceLevel $level): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'min_score' => 'required|numeric|min:0|max:100',
            'max_score' => 'required|numeric|min:0|max:100|gte:min_score',
            'color_code' => 'required|string|max:50',
            'display_order' => 'required|integer|min:1',
        ]);

        $level->name = $validated['name'];
        $level->min_score = $validated['min_score'];
        $level->max_score = $validated['max_score'];
        $level->color_code = $validated['color_code'];
        $level->display_order = $validated['display_order'];
        $level->save();

        return redirect()->route('admin.performance.levels.index')
            ->with('success', 'Performance level updated successfully.');
    }

    /**
     * Delete a performance level.
     */
    public function destroyLevel(PerformanceLevel $level): RedirectResponse
    {
        $level->delete();

        return redirect()->route('admin.performance.levels.index')
            ->with('success', 'Performance level deleted successfully.');
    }

    /**
     * Show manual calculation form.
     */
    public function showCalculationForm(): View
    {
        $subjects = Subject::where('has_performance_tracking', true)
            ->orderBy('name')
            ->get();

        $gradeLevels = GradeLevel::orderBy('name')->get();

        return view('admin.performance.calculate', compact('subjects', 'gradeLevels'));
    }

    /**
     * Trigger manual calculation.
     */
    public function triggerCalculation(
        Request $request,
        PerformanceCalculationService $calculationService
    ): RedirectResponse {
        $validated = $request->validate([
            'calculation_type' => 'required|in:subject,student,all',
            'subject_id' => 'required_if:calculation_type,subject|nullable|exists:subjects,id',
            'grade_level_id' => 'required_if:calculation_type,subject|nullable|exists:grade_levels,id',
            'user_id' => 'required_if:calculation_type,student|nullable|exists:users,id',
        ]);

        $message = '';
        $stats = [];

        try {
            switch ($validated['calculation_type']) {
                case 'subject':

                    $subject = Subject::findOrFail($validated['subject_id']);
                    $gradeLevel = GradeLevel::findOrFail($validated['grade_level_id']);

                    $stats = $calculationService->calculateAllStudentsForSubject(
                        $subject,
                        $gradeLevel
                    );

                    $message = "Calculated performance for all students in {$subject->name} ({$gradeLevel->name})";
                    break;

                case 'student':

                    $user = \App\Models\User::findOrFail($validated['user_id']);

                    $subjects = Subject::where('has_performance_tracking', true)
                        ->get();

                    $studentGradeLevel = GradeLevel::whereHas('courses', function ($query) use ($user) {
                        $query->whereHas('enrollments', function ($q) use ($user) {
                            $q->where('user_id', $user->id);
                        });
                    })->first();

                    if (!$studentGradeLevel) {
                        return redirect()->back()->with('error', 'Student is not enrolled in any grade level');
                    }

                    foreach ($subjects as $subject) {
                        $calculationService->calculateAllMetricsForStudent(
                            $user,
                            $subject,
                            $studentGradeLevel
                        );

                        $stats['subjects_processed'] = ($stats['subjects_processed'] ?? 0) + 1;
                    }

                    $message = "Calculated performance for student {$user->name} across all subjects";
                    break;

                case 'all':

                    $subjects = Subject::where('has_performance_tracking', true)
                        ->get();

                    $gradeLevels = GradeLevel::all();

                    foreach ($subjects as $subject) {
                        foreach ($gradeLevels as $gradeLevel) {
                            $subjectStats = $calculationService->calculateAllStudentsForSubject(
                                $subject,
                                $gradeLevel
                            );


                            $stats['subjects_processed'] = ($stats['subjects_processed'] ?? 0) + 1;
                            $stats['students_processed'] = ($stats['students_processed'] ?? 0) + $subjectStats['students_processed'];
                            $stats['errors'] = ($stats['errors'] ?? 0) + $subjectStats['errors'];
                        }
                    }

                    $message = "Calculated performance for all students across all subjects";
                    break;
            }

            return redirect()->route('admin.performance.calculate.form')
                ->with('success', $message . ' - ' . json_encode($stats));
        } catch (\Exception $e) {
            return redirect()->route('admin.performance.calculate.form')
                ->with('error', 'Error calculating performance: ' . $e->getMessage());
        }
    }
}
