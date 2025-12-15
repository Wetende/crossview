<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Leaderboard;
use App\Models\LeaderboardEntry;
use App\Services\LeaderboardService;
use App\Services\UserPointsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class LeaderboardController extends Controller
{
    public function __construct(
        private readonly LeaderboardService $leaderboardService,
        private readonly UserPointsService $userPointsService,
    ) {
    }

    /**
     * Display a listing of site-wide leaderboards.
     */
    public function index()
    {
        $leaderboards = $this->leaderboardService->getLeaderboardsForScope('site');


        $userLeaderboards = $this->leaderboardService->getLeaderboardsForUser(Auth::user())
            ->whereNotIn('scope_type', ['site']);

        $userPoints = $this->userPointsService->getTotalPoints(Auth::user());
        $pointHistory = $this->userPointsService->getPointHistory(Auth::user(), null, 5);

        return view('student.leaderboards.index', compact(
            'leaderboards',
            'userLeaderboards',
            'userPoints',
            'pointHistory'
        ));
    }

    /**
     * Display the specified leaderboard.
     */
    public function show(Leaderboard $leaderboard)
    {
        $entries = $leaderboard->topEntries(50)
            ->with('user')
            ->get();

        $userPosition = $this->leaderboardService->getUserPosition($leaderboard, Auth::user());

        return view('student.leaderboards.show', compact('leaderboard', 'entries', 'userPosition'));
    }

    /**
     * Display the course leaderboard.
     */
    public function courseLeaderboard(Request $request, $courseId)
    {
        $course = \App\Models\Course::findOrFail($courseId);

        $leaderboards = $this->leaderboardService->getLeaderboardsForScope('course', $course->id);


        if ($leaderboards->isEmpty()) {
            return view('student.leaderboards.no-leaderboard', [
                'message' => 'No leaderboard is available for this course.',
                'backUrl' => route('student.courses.show', $course),
            ]);
        }


        if ($leaderboards->count() > 1) {
            return view('student.leaderboards.select', [
                'scopeType' => 'course',
                'scopeName' => $course->title,
                'leaderboards' => $leaderboards,
            ]);
        }


        return redirect()->route('student.leaderboards.show', $leaderboards->first());
    }

    /**
     * Display the user's points history.
     */
    public function pointsHistory(Request $request)
    {
        $timePeriod = $request->query('period');
        $pointHistory = $this->userPointsService->getPointHistory(
            Auth::user(),
            $timePeriod,
            50
        );

        $totalPoints = $this->userPointsService->getTotalPoints(Auth::user());

        return view('student.leaderboards.points-history', [
            'pointHistory' => $pointHistory,
            'totalPoints' => $totalPoints,
            'currentPeriod' => $timePeriod ?? 'all_time',
        ]);
    }

    /**
     * Update user preference for leaderboard visibility
     */
    public function updateVisibility(Request $request)
    {
        $validated = $request->validate([
            'leaderboard_id' => 'required|exists:leaderboards,id',
            'is_public' => 'required|boolean',
        ]);


        $entry = LeaderboardEntry::where('user_id', Auth::id())
            ->where('leaderboard_id', $validated['leaderboard_id'])
            ->first();

        if ($entry) {
            $entry->update(['is_public' => $validated['is_public']]);
            return back()->with('success', 'Your leaderboard visibility preference has been updated.');
        }

        return back()->with('error', 'You do not have an entry in this leaderboard.');
    }
}
