<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PerformanceLevel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

final class PerformanceLevelController extends Controller
{
    /**
     * Display a listing of performance levels.
     */
    public function index(): View
    {
        $levels = PerformanceLevel::orderBy('display_order')->get();

        return view('admin.performance.levels.index', compact('levels'));
    }

    /**
     * Show the form for creating a new performance level.
     */
    public function create(): View
    {
        return view('admin.performance.levels.create');
    }

    /**
     * Store a newly created performance level.
     */
    public function store(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:performance_levels',
            'min_score' => 'required|numeric|min:0|max:100',
            'max_score' => 'required|numeric|min:0|max:100|gte:min_score',
            'color_code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'display_order' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return redirect()->route('admin.performance.levels.create')
                ->withErrors($validator)
                ->withInput();
        }

        $data = $validator->validated();


        if (!isset($data['display_order'])) {
            $data['display_order'] = PerformanceLevel::max('display_order') + 1;
        }


        $overlapping = $this->checkForOverlappingRanges(
            $data['min_score'],
            $data['max_score']
        );

        if ($overlapping) {
            return redirect()->route('admin.performance.levels.create')
                ->withErrors(['min_score' => 'The score range overlaps with an existing level.'])
                ->withInput();
        }

        PerformanceLevel::create($data);

        return redirect()->route('admin.performance.levels.index')
            ->with('success', 'Performance level created successfully.');
    }

    /**
     * Show the form for editing the specified performance level.
     */
    public function edit(PerformanceLevel $level): View
    {
        return view('admin.performance.levels.edit', compact('level'));
    }

    /**
     * Update the specified performance level.
     */
    public function update(Request $request, PerformanceLevel $level): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('performance_levels')->ignore($level->id),
            ],
            'min_score' => 'required|numeric|min:0|max:100',
            'max_score' => 'required|numeric|min:0|max:100|gte:min_score',
            'color_code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'display_order' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return redirect()->route('admin.performance.levels.edit', $level)
                ->withErrors($validator)
                ->withInput();
        }

        $data = $validator->validated();


        $overlapping = $this->checkForOverlappingRanges(
            $data['min_score'],
            $data['max_score'],
            $level->id
        );

        if ($overlapping) {
            return redirect()->route('admin.performance.levels.edit', $level)
                ->withErrors(['min_score' => 'The score range overlaps with an existing level.'])
                ->withInput();
        }

        $level->update($data);

        return redirect()->route('admin.performance.levels.index')
            ->with('success', 'Performance level updated successfully.');
    }

    /**
     * Remove the specified performance level.
     */
    public function destroy(PerformanceLevel $level): RedirectResponse
    {





        $level->delete();

        return redirect()->route('admin.performance.levels.index')
            ->with('success', 'Performance level deleted successfully.');
    }

    /**
     * Update the display order of performance levels.
     */
    public function updateOrder(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'levels' => 'required|array',
            'levels.*' => 'required|integer|exists:performance_levels,id',
        ]);

        if ($validator->fails()) {
            return redirect()->route('admin.performance.levels.index')
                ->with('error', 'Invalid levels order data.');
        }

        $order = 1;
        foreach ($request->input('levels') as $id) {
            PerformanceLevel::find($id)->update(['display_order' => $order]);
            $order++;
        }

        return redirect()->route('admin.performance.levels.index')
            ->with('success', 'Performance levels order updated successfully.');
    }

    /**
     * Check for overlapping score ranges with existing levels.
     */
    private function checkForOverlappingRanges(float $minScore, float $maxScore, ?int $excludeLevelId = null): bool
    {
        $query = PerformanceLevel::query()
            ->where(function ($query) use ($minScore, $maxScore) {

                $query->where(function ($q) use ($minScore) {

                    $q->where('min_score', '<=', $minScore)
                      ->where('max_score', '>=', $minScore);
                })->orWhere(function ($q) use ($maxScore) {

                    $q->where('min_score', '<=', $maxScore)
                      ->where('max_score', '>=', $maxScore);
                })->orWhere(function ($q) use ($minScore, $maxScore) {

                    $q->where('min_score', '>=', $minScore)
                      ->where('max_score', '<=', $maxScore);
                });
            });

        if ($excludeLevelId) {
            $query->where('id', '!=', $excludeLevelId);
        }

        return $query->exists();
    }
}
