<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\CalendarEvent;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

final class CalendarController extends Controller
{
    /**
     * Display the teacher's calendar.
     */
    public function index(): View
    {
        /** @var User $teacher */
        $teacher = Auth::user();
        $courses = $teacher->courses()->orderBy('title')->get();
        return view('teacher.calendar.index', ['courses' => $courses]);
    }

    /**
     * Fetch events for the calendar (typically called via AJAX).
     */
    public function listEvents(Request $request): JsonResponse
    {
        /** @var User $teacher */
        $teacher = Auth::user();
        $start = $request->input('start');
        $end = $request->input('end');



        $events = CalendarEvent::where('user_id', $teacher->id)

            ->where(function ($query) use ($teacher) {
                $query->where('user_id', $teacher->id)
                      ->orWhereIn('eventable_id', $teacher->courses()->pluck('id')->toArray())
                      ->where('eventable_type', Course::class);
            })
            ->when($start, fn ($query, $startDate) => $query->where('start_time', '>=', Carbon::parse($startDate)))
            ->when($end, fn ($query, $endDate) => $query->where('end_time', '<=', Carbon::parse($endDate)))
            ->get()
            ->map(function (CalendarEvent $event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'start' => $event->start_time->toIso8601String(),
                    'end' => $event->end_time ? $event->end_time->toIso8601String() : null,
                    'allDay' => $event->is_all_day,

                    'color' => $event->user_id === Auth::id() ? 'blue' : 'green',
                ];
            });

        return response()->json($events);
    }

    /**
     * Store a newly created event in storage.
     */
    public function storeEvent(Request $request): RedirectResponse
    {
        /** @var User $teacher */
        $teacher = Auth::user();
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'start_time' => 'required|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
            'is_all_day' => 'boolean',
            'description' => 'nullable|string',
            'eventable_id' => 'nullable|integer',
            'eventable_type' => 'nullable|string',
        ]);

        $eventData = [
            'user_id' => $teacher->id,
            'title' => $validated['title'],
            'start_time' => Carbon::parse($validated['start_time']),
            'end_time' => isset($validated['end_time']) ? Carbon::parse($validated['end_time']) : null,
            'is_all_day' => $validated['is_all_day'] ?? false,
            'description' => $validated['description'],
        ];

        if (!empty($validated['eventable_id']) && !empty($validated['eventable_type'])) {

            if ($validated['eventable_type'] === 'course') {
                $eventData['eventable_type'] = Course::class;
                $eventData['eventable_id'] = $validated['eventable_id'];

                $course = Course::find($validated['eventable_id']);
                if (!$course || !$teacher->courses()->where('id', $course->id)->exists()) {
                    return back()->withErrors(['eventable_id' => 'Invalid course selected or you do not have permission.'])->withInput();
                }
            }
        } else {

            $eventData['eventable_id'] = null;
            $eventData['eventable_type'] = null;
        }

        CalendarEvent::create($eventData);

        return redirect()->route('teacher.dashboard.calendar.index')->with('success', 'Event created successfully.');
    }
}
