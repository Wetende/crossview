<x-dashboard-layout>
    {{-- Assuming $course is passed to this view from the controller --}}
    @php
        $courseName = $course->title ?? 'Course Forums'; // Actual $course->title should be available
        $courseId = $course->id ?? 0;

        // Placeholder threads data
        $threads = [
            ['id' => 1, 'title' => 'Welcome and Introductions', 'author' => 'Admin Staff', 'replies' => 15, 'views' => 120, 'last_post_author' => 'Jane Doe', 'last_post_time' => '2 hours ago', 'is_pinned' => true, 'is_locked' => false],
            ['id' => 2, 'title' => 'Question about Week 1 Lecture', 'author' => 'John Student', 'replies' => 3, 'views' => 45, 'last_post_author' => 'Teacher Bob', 'last_post_time' => '15 minutes ago', 'is_pinned' => false, 'is_locked' => false],
            ['id' => 3, 'title' => 'Resources for Project Alpha', 'author' => 'Teacher Bob', 'replies' => 0, 'views' => 10, 'last_post_author' => null, 'last_post_time' => '1 day ago', 'is_pinned' => false, 'is_locked' => true],
        ];
    @endphp
    <x-slot name="title">Forums: {{ $courseName }}</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <x-slot name="header">
        <h1 class="text-30 lh-12 fw-700">Forums: {{ $courseName }}</h1>
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
            </div>
        </div>
    </x-slot>

    <div class="row y-gap-30">
        <div class="col-12">
            <div class="py-30 px-30 rounded-8 bg-white -dark-bg-dark-1 shadow-4">
                <div class="row justify-between items-center mb-30">
                    <div class="col-auto">
                        <h4 class="text-20 lh-1 fw-500">Threads in {{ $courseName }}</h4>
                    </div>
                    <div class="col-auto">
                        <a href="{{ route('teacher.course.forums.thread.create', ['course' => $courseId]) }}" class="button -md -purple-1 text-white">
                            <i class="icon-plus mr-10"></i> Create New Thread
                        </a>
                    </div>
                </div>

                @if (count($threads) > 0)
                <div class="accordion -block-2 text-left js-accordion">
                    {{-- The dshb-forums.html has categories, here we list threads directly for a course forum --}}
                    {{-- We can treat the course forum as one single category implicitly --}}
                    @foreach ($threads as $thread)
                    <div class="accordion__item {{ $loop->first ? 'is-active' : '' }}"> {{-- Simplified: show first active or handle via JS properly --}}
                        <div class="accordion__button">
                             <div class="d-flex items-center flex-grow-1">
                                @if($thread['is_pinned'])
                                    <i class="icon-pin text-16 text-purple-1 mr-10" title="Pinned Thread"></i>
                                @elseif($thread['is_locked'])
                                    <i class="icon-lock text-16 text-orange-1 mr-10" title="Locked Thread"></i>
                                @else
                                    <i class="icon-forum text-16 text-light-1 mr-10"></i> {{-- Generic icon for normal threads --}}
                                @endif
                                <span class="text-17 fw-500 text-dark-1">{{ $thread['title'] }}</span>
                            </div>
                            <div class="accordion__icon">
                                <div class="icon" data-feather="chevron-down"></div>
                                <div class="icon" data-feather="chevron-up"></div>
                            </div>
                        </div>

                        <div class="accordion__content {{ $loop->first ? 'is-active' : '' }}">
                            <div class="accordion__content__inner py-20 px-0">
                                {{-- This section in dshb-forums.html lists sub-forums or threads. We adapt for threads. --}}
                                {{-- Since this is already a thread, the "content" would be a summary or first post peek. --}}
                                {{-- For now, we'll just show thread stats and a link to view the full thread. --}}
                                <div class="py-15 px-30 border-bottom-light -dark-border-dark-2">
                                    <div class="row y-gap-10 justify-between items-center">
                                        <div class="col-xl-7 md:col-12">
                                            <div class="d-flex items-center">
                                                {{-- Thread Starter Avatar + Name --}}
                                                <img src="{{ asset('assets/img/avatars/placeholder-sm.png') }}" alt="avatar" class="size-40 rounded-full mr-10">
                                                <div>
                                                    <a href="{{ route('teacher.forums.thread.show', ['thread' => $thread['id']]) }}" class="text-15 lh-15 fw-500 text-purple-1 hover-underline">
                                                        {{ $thread['title'] }}
                                                    </a>
                                                    <div class="text-13 lh-1 mt-5">Started by <a class="fw-500" href="#">{{ $thread['author'] }}</a></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="col-xl-2 col-auto text-right md:text-left">
                                            <div class="text-14 lh-1">{{ $thread['replies'] }} Replies</div>
                                            <div class="text-13 lh-1 mt-5">{{ $thread['views'] }} Views</div>
                                        </div>

                                        <div class="col-xl-3 col-auto text-right md:text-left">
                                            @if ($thread['last_post_author'])
                                            <div class="text-13 lh-1">Last post by <a class="fw-500" href="#">{{ $thread['last_post_author'] }}</a></div>
                                            <div class="text-13 lh-1 mt-5">{{ $thread['last_post_time'] }}</div>
                                            @else
                                            <div class="text-13 lh-1">No replies yet.</div>
                                            @endif
                                        </div>
                                    </div>
                                    <div class="mt-15 d-flex x-gap-10">
                                        <a href="{{ route('teacher.forums.thread.show', ['thread' => $thread['id']]) }}" class="button -xs -outline-purple-1 text-purple-1">View Thread</a>
                                        <a href="{{ route('teacher.forums.thread.edit', ['thread' => $thread['id']]) }}" class="button -xs -outline-blue-1 text-blue-1">Edit</a>
                                        <form action="{{ route('teacher.forums.thread.destroy', ['thread' => $thread['id']]) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this thread?');" style="display: inline;">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="button -xs -outline-red-1 text-red-1">Delete</button>
                                        </form>
                                        {{-- Add Pin/Lock/Unlock buttons here if needed, using forms for POST/PUT --}}
                                    </div>
                                </div>
                                {{-- If we were showing actual threads in accordion, the content of the thread would be here --}}
                            </div>
                        </div>
                    </div>
                    @endforeach
                </div>
                @else
                <div class="text-center py-50">
                    <i class="icon-message-2 text-60 text-light-4"></i>
                    <h4 class="text-20 fw-500 mt-15">No threads yet in this course forum.</h4>
                    <p class="mt-5">Be the first to start a discussion!</p>
                    <div class="mt-20">
                         <a href="{{ route('teacher.course.forums.thread.create', ['course' => $courseId]) }}" class="button -md -purple-1 text-white">
                            Create New Thread
                        </a>
                    </div>
                </div>
                @endif

                {{-- Pagination for threads if many --}}
                {{-- <div class="row justify-center pt-30">
                    <div class="col-auto">
                        <div class="pagination -buttons">
                            <button class="pagination__button -prev"><i class="icon icon-chevron-left"></i></button>
                            <div class="pagination__count"><a href="#">1</a><a class="-count-is-active" href="#">2</a><a href="#">3</a></div>
                            <button class="pagination__button -next"><i class="icon icon-chevron-right"></i></button>
                        </div>
                    </div>
                </div> --}}

            </div>
        </div>
    </div>
</x-dashboard-layout> 