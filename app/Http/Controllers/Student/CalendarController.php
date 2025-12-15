<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

final class CalendarController extends Controller
{
    /**
     * Display the student's calendar page.
     */
    public function index(Request $request): View
    {

        return view('student.calendar.index');
    }

    /**
     * Fetch calendar events for the student (e.g., for FullCalendar).
     * This would typically be called via AJAX.
     */
    public function events(Request $request): JsonResponse
    {


        $events = [
            [
                'title' => 'Math Quiz Due',
                'start' => '2023-11-15T10:30:00',
                'end'   => '2023-11-15T12:30:00',
                'allDay' => false,
                'url'   => '#',
                'color' => '#5C6BC0'
            ],
            [
                'title' => 'History Essay Submission',
                'start' => '2023-11-20',
                'allDay' => true,
                'url'   => '#',
                'color' => '#FF7043'
            ],

        ];

        return response()->json($events);
    }







}
