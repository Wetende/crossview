<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Thread;
use App\Models\User;
use App\Http\Requests\Teacher\StoreThreadRequest;
use App\Http\Requests\Teacher\UpdateThreadRequest;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

final class ForumController extends Controller
{
    public function index(): View
    {
        /** @var User $teacher */
        $teacher = Auth::user();
        $this->authorize('viewAny', Course::class);


        $courses = $teacher->courses()->orderBy('title')->paginate(15);

        return view('teacher.forums.index', compact('courses'));
    }

    /**
     * Show forums for a specific course.
     */
    public function showCourseForums(Course $course): View
    {
        $this->authorize('viewForums', $course);


        $threads = $course->threads()
            ->with(['user', 'latestPost.user'])
            ->latest('updated_at')
            ->paginate(10);

        return view('teacher.forums.course', compact('course', 'threads'));
    }

    /**
     * Show the form for creating a new thread in a course.
     */
    public function createThreadForm(Course $course): View
    {

        $this->authorize('createThread', $course);

        return view('teacher.forums.create_thread', ['course' => $course]);
    }

    /**
     * Store a newly created thread in storage.
     */
    public function store(StoreThreadRequest $request, Course $course): RedirectResponse
    {

        $this->authorize('createThread', $course);

        $validated = $request->validated();

        /** @var User $teacher */
        $teacher = Auth::user();

        $thread = $course->threads()->create([
            'title' => $validated['title'],
            'user_id' => $teacher->id,
        ]);


        $thread->posts()->create([
            'content' => $validated['content'],
            'user_id' => $teacher->id,
        ]);

        return redirect()->route('teacher.dashboard.course.forums.show', $course->id)->with('success', 'Thread created successfully.');
    }

    /**
     * Display the specified thread.
     */
    public function showThread(Thread $thread): View
    {

        $this->authorize('view', $thread);


        $thread->load(['posts' => function ($query) {
            $query->with('user')->orderBy('created_at');
        }, 'user', 'course']);

        $posts = $thread->posts()->paginate(10);

        return view('teacher.forums.thread', ['thread' => $thread, 'posts' => $posts]);
    }

    /**
     * Show the form for editing the specified thread.
     */
    public function editThreadForm(Thread $thread): View
    {

        $this->authorize('update', $thread);
        $thread->load('course');

        return view('teacher.forums.edit_thread', ['thread' => $thread]);
    }

    /**
     * Update the specified thread in storage.
     */
    public function update(UpdateThreadRequest $request, Thread $thread): RedirectResponse
    {

        $this->authorize('update', $thread);

        $validated = $request->validated();

        $thread->update([
            'title' => $validated['title'],
        ]);









        return redirect()->route('teacher.dashboard.forums.thread.show', $thread->id)->with('success', 'Thread updated successfully.');
    }

    /**
     * Remove the specified thread from storage.
     */
    public function destroy(Thread $thread): RedirectResponse
    {

        $this->authorize('delete', $thread);

        $course = $thread->course;


        if (!$course) {

            return redirect()->route('teacher.dashboard.forums.index')->with('error', 'Thread deleted, but could not redirect to course forums.');
        }

        $thread->posts()->delete();
        $thread->delete();

        return redirect()->route('teacher.dashboard.course.forums.show', $course->id)->with('success', 'Thread deleted successfully.');
    }
}
