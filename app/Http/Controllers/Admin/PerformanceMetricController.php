<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PerformanceMetric;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

final class PerformanceMetricController extends Controller
{
    /**
     * Display a listing of performance metrics.
     */
    public function index(): View
    {
        $metrics = PerformanceMetric::orderBy('display_order')->get();

        return view('admin.performance.metrics.index', compact('metrics'));
    }

    /**
     * Show the form for creating a new performance metric.
     */
    public function create(): View
    {
        return view('admin.performance.metrics.create');
    }

    /**
     * Store a newly created performance metric.
     */
    public function store(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:performance_metrics',
            'description' => 'nullable|string',
            'type' => 'required|string|max:255',
            'icon_path' => 'nullable|string|max:255',
            'color_code' => 'nullable|string|max:50',
            'display_order' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return redirect()->route('admin.performance.metrics.create')
                ->withErrors($validator)
                ->withInput();
        }

        $data = $validator->validated();


        $data['slug'] = Str::slug($data['name']);


        if (!isset($data['display_order'])) {
            $data['display_order'] = PerformanceMetric::max('display_order') + 1;
        }


        $data['is_active'] = true;

        PerformanceMetric::create($data);

        return redirect()->route('admin.performance.metrics.index')
            ->with('success', 'Performance metric created successfully.');
    }

    /**
     * Show the form for editing the specified performance metric.
     */
    public function edit(PerformanceMetric $metric): View
    {
        return view('admin.performance.metrics.edit', compact('metric'));
    }

    /**
     * Update the specified performance metric.
     */
    public function update(Request $request, PerformanceMetric $metric): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('performance_metrics')->ignore($metric->id),
            ],
            'description' => 'nullable|string',
            'type' => 'required|string|max:255',
            'icon_path' => 'nullable|string|max:255',
            'color_code' => 'nullable|string|max:50',
            'display_order' => 'nullable|integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->route('admin.performance.metrics.edit', $metric)
                ->withErrors($validator)
                ->withInput();
        }

        $data = $validator->validated();


        if ($metric->name !== $data['name']) {
            $data['slug'] = Str::slug($data['name']);
        }


        $data['is_active'] = $request->has('is_active');

        $metric->update($data);

        return redirect()->route('admin.performance.metrics.index')
            ->with('success', 'Performance metric updated successfully.');
    }

    /**
     * Remove the specified performance metric.
     */
    public function destroy(PerformanceMetric $metric): RedirectResponse
    {

        $usedBySubjects = $metric->subjectPerformanceMetrics()->exists();

        if ($usedBySubjects) {
            return redirect()->route('admin.performance.metrics.index')
                ->with('error', 'Cannot delete this metric as it is being used by one or more subjects.');
        }


        $hasPerformanceRecords = $metric->studentPerformances()->exists();

        if ($hasPerformanceRecords) {
            return redirect()->route('admin.performance.metrics.index')
                ->with('error', 'Cannot delete this metric as it has associated student performance records.');
        }

        $metric->delete();

        return redirect()->route('admin.performance.metrics.index')
            ->with('success', 'Performance metric deleted successfully.');
    }

    /**
     * Update the display order of performance metrics.
     */
    public function updateOrder(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'metrics' => 'required|array',
            'metrics.*' => 'required|integer|exists:performance_metrics,id',
        ]);

        if ($validator->fails()) {
            return redirect()->route('admin.performance.metrics.index')
                ->with('error', 'Invalid metrics order data.');
        }

        $order = 1;
        foreach ($request->input('metrics') as $id) {
            PerformanceMetric::find($id)->update(['display_order' => $order]);
            $order++;
        }

        return redirect()->route('admin.performance.metrics.index')
            ->with('success', 'Performance metrics order updated successfully.');
    }
}
