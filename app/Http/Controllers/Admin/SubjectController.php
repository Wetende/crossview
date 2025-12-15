<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Subject;
use App\Models\PerformanceMetric;
use App\Models\SubjectPerformanceMetric;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

final class SubjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {

    }

    /**
     * Display the specified resource.
     */
    public function show(Subject $subject)
    {
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Subject $subject)
    {

    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Subject $subject)
    {

    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Subject $subject)
    {

    }

    public function reorder(Request $request)
    {

    }

    /**
     * Display a listing of subjects for performance tracking.
     */
    public function performanceIndex(): View
    {
        $subjects = Subject::orderBy('name')->get();

        return view('admin.performance.subjects.index', compact('subjects'));
    }

    /**
     * Show the form to configure performance metrics for a subject.
     */
    public function configurePerformance(Subject $subject): View
    {

        $availableMetrics = PerformanceMetric::where('is_active', true)
            ->orderBy('display_order')
            ->get();


        $subjectMetrics = SubjectPerformanceMetric::where('subject_id', $subject->id)
            ->with('performanceMetric')
            ->get()
            ->keyBy('performance_metric_id');

        return view('admin.performance.subjects.configure', compact(
            'subject',
            'availableMetrics',
            'subjectMetrics'
        ));
    }

    /**
     * Update performance metrics for a subject.
     */
    public function updatePerformanceMetrics(Request $request, Subject $subject): RedirectResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'has_performance_tracking' => 'boolean',
                'metrics' => 'array',
                'metrics.*.id' => 'required|exists:performance_metrics,id',
                'metrics.*.weight' => 'required|numeric|min:0|max:10',
                'metrics.*.is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }


            $subject->has_performance_tracking = $request->has('has_performance_tracking');
            $subject->save();


            if ($request->has('metrics') && $subject->has_performance_tracking) {
                foreach ($request->input('metrics') as $metricData) {
                    $metricId = $metricData['id'];
                    $weight = $metricData['weight'];
                    $isActive = $metricData['is_active'] ?? false;


                    SubjectPerformanceMetric::updateOrCreate(
                        [
                            'subject_id' => $subject->id,
                            'performance_metric_id' => $metricId,
                        ],
                        [
                            'weight' => $weight,
                            'is_active' => $isActive,
                        ]
                    );
                }


                $defaultConfig = [];
                foreach ($request->input('metrics') as $metricData) {
                    if ($metricData['is_active'] ?? false) {
                        $defaultConfig[$metricData['id']] = [
                            'weight' => $metricData['weight'],
                        ];
                    }
                }

                $subject->default_performance_metrics = $defaultConfig;
                $subject->save();
            } else {


            }

            return redirect()->route('admin.performance.subjects.configure', $subject)
                ->with('success', 'Performance metrics updated successfully for ' . $subject->name);
        } catch (ValidationException $e) {
            return redirect()->route('admin.performance.subjects.configure', $subject)
                ->withErrors($e->errors())
                ->withInput();
        } catch (\Exception $e) {
            return redirect()->route('admin.performance.subjects.configure', $subject)
                ->with('error', 'An error occurred: ' . $e->getMessage())
                ->withInput();
        }
    }
}
