<?php

declare(strict_types=1);

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

final class ChildCalendarController extends Controller
{
    /**
     * Display the calendar for a specific child of the authenticated parent.
     *
     * @param User $child The child user model instance.
     */
    public function index(User $child): View
    {
        /** @var User $parent */
        $parent = Auth::user();
        $this->authorize('viewChildDetails', [$parent, $child]);

        return view('parent.children.calendar', ['child' => $child]);
    }

    /**
     * Fetch calendar events for the specified child.
     *
     * @param User $child The child user model instance.
     */
    public function events(Request $request, User $child): JsonResponse
    {
        /** @var User $parent */
        $parent = Auth::user();
        $this->authorize('viewChildDetails', [$parent, $child]);






        $calendarEvents = [];




        $calendarEvents[] = [
            'title' => 'Math Assignment Due',
            'start' => now()->addDays(5)->toDateString(),

            'backgroundColor' => '#7E57C2',
            'borderColor' => '#7E57C2'
        ];
        $calendarEvents[] = [
            'title' => 'History Quiz',
            'start' => now()->addDays(10)->toDateString(),
            'backgroundColor' => '#42A5F5',
            'borderColor' => '#42A5F5'
        ];

        return response()->json($calendarEvents);
    }
}
