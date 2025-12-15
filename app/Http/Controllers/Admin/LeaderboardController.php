<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Leaderboard;
use App\Services\LeaderboardService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

final class LeaderboardController extends Controller
{
    public function __construct(
        private readonly LeaderboardService $leaderboardService,
    ) {
    }

    /**
     * Display a listing of the leaderboards.
     */
    public function index()
    {
        $leaderboards = Leaderboard::orderBy('is_active', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return view('admin.leaderboards.index', compact('leaderboards'));
    }

    /**
     * Show the form for creating a new leaderboard.
     */
    public function create()
    {
        $timePeriods = [
            'all_time' => 'All Time',
            'yearly' => 'Yearly',
            'monthly' => 'Monthly',
            'weekly' => 'Weekly',
        ];

        $scopeTypes = [
            'site' => 'Site-wide',
            'course' => 'Course-specific',
            'category' => 'Category-specific',
        ];

        return view('admin.leaderboards.create', compact('timePeriods', 'scopeTypes'));
    }

    /**
     * Store a newly created leaderboard.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'scope_type' => ['required', 'string', Rule::in(['site', 'course', 'category'])],
            'scope_id' => 'nullable|integer|required_unless:scope_type,site',
            'time_period' => ['required', 'string', Rule::in(['all_time', 'yearly', 'monthly', 'weekly'])],
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        $startDate = !empty($validated['start_date']) ? Carbon::parse($validated['start_date']) : null;
        $endDate = !empty($validated['end_date']) ? Carbon::parse($validated['end_date']) : null;

        $scopeableModel = null;
        if ($validated['scope_type'] !== 'site' && !empty($validated['scope_id'])) {
            $scopeableModel = match ($validated['scope_type']) {
                'course' => \App\Models\Course::find($validated['scope_id']),
                'category' => \App\Models\Category::find($validated['scope_id']),
                default => null,
            };

            if (!$scopeableModel) {
                return back()->withErrors(['scope_id' => 'The selected ' . $validated['scope_type'] . ' does not exist.'])->withInput();
            }
        }

        $leaderboard = $this->leaderboardService->createLeaderboard(
            name: $validated['name'],
            description: $validated['description'],
            scopeType: $validated['scope_type'],
            scopeableModel: $scopeableModel,
            timePeriod: $validated['time_period'],
            startDate: $startDate,
            endDate: $endDate,
            isActive: $validated['is_active'] ?? false,
        );

        return redirect()
            ->route('admin.leaderboards.show', $leaderboard)
            ->with('success', 'Leaderboard created successfully.');
    }

    /**
     * Display the specified leaderboard.
     */
    public function show(Leaderboard $leaderboard)
    {
        $entries = $leaderboard->entries()
            ->with('user')
            ->orderBy('rank')
            ->paginate(20);

        return view('admin.leaderboards.show', compact('leaderboard', 'entries'));
    }

    /**
     * Show the form for editing the specified leaderboard.
     */
    public function edit(Leaderboard $leaderboard)
    {
        $timePeriods = [
            'all_time' => 'All Time',
            'yearly' => 'Yearly',
            'monthly' => 'Monthly',
            'weekly' => 'Weekly',
        ];

        $scopeTypes = [
            'site' => 'Site-wide',
            'course' => 'Course-specific',
            'category' => 'Category-specific',
        ];

        return view('admin.leaderboards.edit', compact('leaderboard', 'timePeriods', 'scopeTypes'));
    }

    /**
     * Update the specified leaderboard.
     */
    public function update(Request $request, Leaderboard $leaderboard)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'scope_type' => ['required', 'string', Rule::in(['site', 'course', 'category'])],
            'scope_id' => 'nullable|integer|required_unless:scope_type,site',
            'time_period' => ['required', 'string', Rule::in(['all_time', 'yearly', 'monthly', 'weekly'])],
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $validated['is_active'] = $validated['is_active'] ?? false;

        $leaderboard->update($validated);

        return redirect()
            ->route('admin.leaderboards.show', $leaderboard)
            ->with('success', 'Leaderboard updated successfully.');
    }

    /**
     * Remove the specified leaderboard.
     */
    public function destroy(Leaderboard $leaderboard)
    {

        $leaderboard->entries()->delete();


        $leaderboard->delete();

        return redirect()
            ->route('admin.leaderboards.index')
            ->with('success', 'Leaderboard deleted successfully.');
    }

    /**
     * Update the rankings for a specific leaderboard.
     */
    public function updateRankings(Leaderboard $leaderboard)
    {
        $this->leaderboardService->updateLeaderboard($leaderboard);

        return redirect()
            ->route('admin.leaderboards.show', $leaderboard)
            ->with('success', 'Leaderboard rankings updated successfully.');
    }
}
