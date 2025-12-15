<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CourseNotice;
use App\Models\Course;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

final class CourseNoticeController extends Controller
{
    /**
     * Store a newly created notice in storage.
     */
    public function store(Request $request, Course $course): RedirectResponse
    {

        if (Auth::id() !== $course->user_id) {
            return redirect()->back()->with('error', 'You are not authorized to add notices to this course.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'type' => ['required', 'string', 'in:info,warning,danger,success'],
            'display_from' => ['nullable', 'date'],
            'display_until' => ['nullable', 'date', 'after_or_equal:display_from'],
            'is_active' => ['nullable', 'boolean'],
        ]);


        $maxOrder = CourseNotice::where('course_id', $course->id)->max('order') ?? 0;


        CourseNotice::create([
            'course_id' => $course->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'type' => $validated['type'],
            'display_from' => $validated['display_from'] ?? null,
            'display_until' => $validated['display_until'] ?? null,
            'is_active' => $request->has('is_active'),
            'order' => $maxOrder + 1,
        ]);

        return redirect()->route('teacher.courses.notices', $course)
            ->with('success', 'Notice created successfully.');
    }

    /**
     * Update the specified notice in storage.
     */
    public function update(Request $request, CourseNotice $notice): RedirectResponse
    {

        $course = $notice->course;
        if (Auth::id() !== $course->user_id) {
            return redirect()->back()->with('error', 'You are not authorized to update this notice.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'type' => ['required', 'string', 'in:info,warning,danger,success'],
            'display_from' => ['nullable', 'date'],
            'display_until' => ['nullable', 'date', 'after_or_equal:display_from'],
            'is_active' => ['nullable', 'boolean'],
        ]);


        $notice->update([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'type' => $validated['type'],
            'display_from' => $validated['display_from'] ?? null,
            'display_until' => $validated['display_until'] ?? null,
            'is_active' => $request->has('is_active'),
        ]);

        return redirect()->route('teacher.courses.notices', $course)
            ->with('success', 'Notice updated successfully.');
    }

    /**
     * Remove the specified notice from storage.
     */
    public function destroy(CourseNotice $notice): RedirectResponse
    {

        $course = $notice->course;
        if (Auth::id() !== $course->user_id) {
            return redirect()->back()->with('error', 'You are not authorized to delete this notice.');
        }

        $notice->delete();

        return redirect()->route('teacher.courses.notices', $course)
            ->with('success', 'Notice deleted successfully.');
    }

    /**
     * Reorder notices
     */
    public function reorder(Request $request, Course $course): RedirectResponse
    {
        if (Auth::id() !== $course->user_id) {
            return redirect()->back()->with('error', 'You are not authorized to reorder notices for this course.');
        }

        $request->validate([
            'order' => 'required|array',
            'order.*' => 'integer|exists:course_notices,id',
        ]);

        $orderData = $request->input('order', []);

        foreach ($orderData as $position => $id) {

            $notice = CourseNotice::where('id', $id)
                      ->where('course_id', $course->id)
                      ->first();

            if ($notice) {
                $notice->update(['order' => $position]);
            }
        }

        return redirect()->back()->with('success', 'Notice order updated successfully.');
    }
}
