<x-dashboard-layout>
    {{-- Assuming $thread and $thread->course are passed to this view --}}
    @php
        $threadTitle = $thread->title ?? 'Edit Thread';
        $threadId = $thread->id ?? 0;
        $course = $thread->course ?? null;
        $courseName = $course ? $course->title : 'General Forum';
        $courseId = $course ? $course->id : null;
    @endphp
    <x-slot name="title">Edit Thread: {{ $threadTitle }}</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <x-slot name="header">
        <h1 class="text-30 lh-12 fw-700">Edit Thread</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('teacher.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('teacher.forums.index') }}">Forum Management</a>
                </div>
                @if ($course)
                <div class="breadcrumbs__item">
                    <a href="{{ route('teacher.course.forums.show', ['course' => $courseId]) }}">{{ $courseName }}</a>
                </div>
                @endif
                <div class="breadcrumbs__item">
                    {{-- Link to the thread being edited --}}
                    <a href="{{ route('teacher.forums.thread.show', ['thread' => $threadId]) }}">{{ $threadTitle }}</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('teacher.forums.thread.edit', ['thread' => $threadId]) }}">Edit</a>
                </div>
            </div>
        </div>
    </x-slot>

    <div class="row y-gap-30 justify-center">
        <div class="col-xl-8 col-lg-10">
            <div class="py-30 px-30 rounded-8 bg-white -dark-bg-dark-1 shadow-4">
                <h4 class="text-20 lh-1 fw-500 mb-30">Editing Thread: {{ $threadTitle }}</h4>

                <form class="contact-form row y-gap-30" action="{{ route('teacher.forums.thread.update', ['thread' => $threadId]) }}" method="POST">
                    @csrf
                    @method('PUT') {{-- Important for updates --}}

                    <div class="col-12">
                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="thread_title_edit">Thread Title</label>
                        <input type="text" name="title" id="thread_title_edit" placeholder="Enter a clear and concise title" value="{{ old('title', $thread->title ?? '') }}" required>
                        @error('title') <span class="text-red-1 text-13 mt-5">{{ $message }}</span> @enderror
                    </div>

                    <div class="col-12">
                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="thread_content_edit">Original Message</label>
                        <textarea id="thread_content_edit" name="content" placeholder="Compose your message..." rows="10" required>{{ old('content', $thread->content ?? '') }}</textarea>
                        {{-- Rich text editor should be applied here too --}}
                        @error('content') <span class="text-red-1 text-13 mt-5">{{ $message }}</span> @enderror
                    </div>
                    
                    {{-- Additional options for teachers, e.g., Pinned, Locked --}}
                    <div class="col-md-6">
                        <div class="form-checkbox d-flex items-center">
                            <input type="checkbox" name="is_pinned" id="is_pinned_edit" value="1" {{ old('is_pinned', $thread->is_pinned ?? false) ? 'checked' : '' }}>
                            <div class="form-checkbox__mark">
                                <div class="form-checkbox__icon icon-check"></div>
                            </div>
                            <label class="text-14 lh-1 ml-10" for="is_pinned_edit">Pin this thread</label>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="form-checkbox d-flex items-center">
                            <input type="checkbox" name="is_locked" id="is_locked_edit" value="1" {{ old('is_locked', $thread->is_locked ?? false) ? 'checked' : '' }}>
                            <div class="form-checkbox__mark">
                                <div class="form-checkbox__icon icon-check"></div>
                            </div>
                            <label class="text-14 lh-1 ml-0" for="is_locked_edit">Lock this thread (No replies)</label>
                        </div>
                    </div>

                    <div class="col-12 d-flex items-center mt-20">
                        <button type="submit" class="button -md -purple-1 text-white">
                            <i class="icon-save mr-10"></i> Save Changes
                        </button>
                        <a href="{{ route('teacher.forums.thread.show', ['thread' => $threadId]) }}" class="button -md -outline-light-1 text-dark-1 ml-15">Cancel</a>
                    </div>
                </form>
            </div>
        </div>
    </div>
    
    @push('scripts')
    {{-- Placeholder for Rich Text Editor --}}
    @endpush
</x-dashboard-layout> 