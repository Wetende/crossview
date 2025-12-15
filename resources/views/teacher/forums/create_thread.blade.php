<x-dashboard-layout>
    {{-- Assuming $course is passed to this view from the controller --}}
    @php
        $courseName = $course->title ?? 'Course';
        $courseId = $course->id ?? 0;
    @endphp
    <x-slot name="title">Create New Thread in {{ $courseName }}</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <x-slot name="header">
        <h1 class="text-30 lh-12 fw-700">Create New Thread</h1>
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
                <div class="breadcrumbs__item">
                    <a href="{{ route('teacher.course.forums.show', ['course' => $courseId]) }}">{{ $courseName }}</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('teacher.course.forums.thread.create', ['course' => $courseId]) }}">Create Thread</a>
                </div>
            </div>
        </div>
    </x-slot>

    <div class="row y-gap-30 justify-center">
        <div class="col-xl-8 col-lg-10">
            <div class="py-30 px-30 rounded-8 bg-white -dark-bg-dark-1 shadow-4">
                <h4 class="text-20 lh-1 fw-500 mb-30">Start a New Discussion in {{ $courseName }}</h4>

                <form class="contact-form row y-gap-30" action="{{ route('teacher.course.forums.thread.store', ['course' => $courseId]) }}" method="POST">
                    @csrf
                    <div class="col-12">
                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="thread_title">Thread Title</label>
                        <input type="text" name="title" id="thread_title" placeholder="Enter a clear and concise title for your thread" value="{{ old('title') }}" required>
                        @error('title') <span class="text-red-1 text-13 mt-5">{{ $message }}</span> @enderror
                    </div>

                    <div class="col-12">
                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="thread_content">Your Message</label>
                        {{-- For a real application, a rich text editor (e.g., TinyMCE, CKEditor) would be integrated here. --}}
                        {{-- For now, a simple textarea. The 'form-input' and 'form-input__message' classes are from dshb-messages.html --}}
                        <textarea id="thread_content" name="content" placeholder="Compose your message..." rows="8" required>{{ old('content') }}</textarea>
                        @error('content') <span class="text-red-1 text-13 mt-5">{{ $message }}</span> @enderror
                    </div>

                    {{-- Additional options for teachers, e.g., Pinned, Locked --}}
                    <div class="col-md-6">
                        <div class="form-checkbox d-flex items-center">
                            <input type="checkbox" name="is_pinned" id="is_pinned" value="1" {{ old('is_pinned') ? 'checked' : '' }}>
                            <div class="form-checkbox__mark">
                                <div class="form-checkbox__icon icon-check"></div>
                            </div>
                            <label class="text-14 lh-1 ml-10" for="is_pinned">Pin this thread (Stays at the top)</label>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="form-checkbox d-flex items-center">
                            <input type="checkbox" name="is_locked" id="is_locked" value="1" {{ old('is_locked') ? 'checked' : '' }}>
                            <div class="form-checkbox__mark">
                                <div class="form-checkbox__icon icon-check"></div>
                            </div>
                            <label class="text-14 lh-1 ml-10" for="is_locked">Lock this thread (No replies allowed)</label>
                        </div>
                    </div>


                    <div class="col-12 d-flex items-center mt-20">
                        <button type="submit" class="button -md -purple-1 text-white">
                            <i class="icon-send mr-10"></i> Post Thread
                        </button>
                        <a href="{{ route('teacher.course.forums.show', ['course' => $courseId]) }}" class="button -md -outline-light-1 text-dark-1 ml-15">Cancel</a>
                    </div>
                </form>
            </div>
        </div>
    </div>

    {{-- Script for Rich Text Editor (Example with a placeholder for integration) --}}
    @push('scripts')
    {{-- 
    <script src="path/to/your/tinymce.min.js"></script>
    <script>
        tinymce.init({
            selector: '#thread_content',
            plugins: 'advlist autolink lists link image charmap print preview hr anchor pagebreak',
            toolbar_mode: 'floating',
            // ... other configurations
        });
    </script>
    --}}
    @endpush

</x-dashboard-layout> 