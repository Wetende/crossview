<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CourseFAQ;
use App\Models\Course;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

final class CourseFaqController extends Controller
{
    /**
     * Store a newly created FAQ.
     */
    public function store(Request $request, Course $course): RedirectResponse
    {

        if (Auth::id() !== $course->user_id) {
            return redirect()->back()->with('error', 'You are not authorized to add FAQs to this course.');
        }

        $validated = $request->validate([
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ]);


        $maxOrder = CourseFAQ::where('course_id', $course->id)->max('order') ?? 0;


        CourseFAQ::create([
            'course_id' => $course->id,
            'question' => $validated['question'],
            'answer' => $validated['answer'],
            'is_published' => $request->has('is_published'),
            'order' => $maxOrder + 1,
        ]);

        return redirect()->route('teacher.courses.faq', $course)
            ->with('success', 'FAQ created successfully.');
    }

    /**
     * Update the specified FAQ.
     */
    public function update(Request $request, CourseFAQ $faq): RedirectResponse
    {

        $course = $faq->course;
        if (Auth::id() !== $course->user_id) {
            return redirect()->back()->with('error', 'You are not authorized to update this FAQ.');
        }

        $validated = $request->validate([
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string'],
            'is_published' => ['nullable', 'boolean'],
        ]);


        $faq->update([
            'question' => $validated['question'],
            'answer' => $validated['answer'],
            'is_published' => $request->has('is_published'),
        ]);

        return redirect()->route('teacher.courses.faq', $course)
            ->with('success', 'FAQ updated successfully.');
    }

    /**
     * Remove the specified FAQ.
     */
    public function destroy(CourseFAQ $faq): RedirectResponse
    {

        $course = $faq->course;
        if (Auth::id() !== $course->user_id) {
            return redirect()->back()->with('error', 'You are not authorized to delete this FAQ.');
        }

        $faq->delete();

        return redirect()->route('teacher.courses.faq', $course)
            ->with('success', 'FAQ deleted successfully.');
    }

    /**
     * Reorder FAQs.
     */
    public function reorder(Request $request, Course $course): RedirectResponse
    {

        if (Auth::id() !== $course->user_id) {
            return redirect()->back()->with('error', 'You are not authorized to reorder FAQs for this course.');
        }

        $request->validate([
            'order' => 'required|array',
            'order.*' => 'integer|exists:course_f_a_q_s,id',
        ]);

        $orderData = $request->input('order', []);

        foreach ($orderData as $position => $id) {

            $faq = CourseFAQ::where('id', $id)
                   ->where('course_id', $course->id)
                   ->first();

            if ($faq) {
                $faq->update(['order' => $position]);
            }
        }

        return redirect()->back()->with('success', 'FAQ order updated successfully.');
    }
}
