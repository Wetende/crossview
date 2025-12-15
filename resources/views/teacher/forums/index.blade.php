<x-dashboard-layout>
    <x-slot name="title">Forum Management</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
        <div class="col-auto">
            <h1 class="text-30 lh-12 fw-700">Forum Management</h1>
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
                </div>
            </div>
        </div>
    </div>

    <div class="row y-gap-30">
        <div class="col-12">
            <div class="py-30 px-30 rounded-8 bg-white -dark-bg-dark-1 shadow-4">
                <div class="tabs -active-purple-2 js-tabs">
                    <div class="tabs__controls d-flex js-tabs-controls">
                        <button class="tabs__button text-14 lh-12 fw-500 text-light-1 js-tabs-button is-active" data-tab-target=".-tab-item-1" type="button">
                            Manage Forums by @lmsterm('Study Material')
                        </button>
                        {{-- Optional: Tab for general/site-wide forums if teacher has permission --}}
                        {{-- <button class="tabs__button text-14 lh-12 fw-500 text-light-1 js-tabs-button" data-tab-target=".-tab-item-2" type="button">
                            General Forums
                        </button> --}}
                    </div>

                    <div class="tabs__content pt-30 js-tabs-content">
                        <div class="tabs__pane -tab-item-1 is-active">
                            <div class="row y-gap-30">
                                {{-- Placeholder: Loop through teacher's courses --}}
                                @php
                                    $teacherCourses = [
                                        ['id' => 1, 'title' => 'Advanced JavaScript', 'image' => asset('assets/img/courses/list/1.png'), 'forum_thread_count' => 15, 'forum_post_count' => 120],
                                        ['id' => 2, 'title' => 'Creative Writing Workshop', 'image' => asset('assets/img/courses/list/2.png'), 'forum_thread_count' => 8, 'forum_post_count' => 75],
                                        ['id' => 3, 'title' => 'Introduction to Physics', 'image' => asset('assets/img/courses/list/3.png'), 'forum_thread_count' => 0, 'forum_post_count' => 0],
                                    ];
                                @endphp

                                @forelse ($teacherCourses as $course)
                                <div class="col-lg-4 col-md-6">
                                    <div class="coursesCard -type-1 rounded-8 bg-white shadow-2">
                                        <div class="coursesCard__image ratio ratio-16:9">
                                            <img class="img-ratio" src="{{ $course['image'] }}" alt="course image">
                                        </div>
                                        <div class="coursesCard__content pa-20">
                                            <h4 class="coursesCard__title text-17 lh-15 fw-500 text-dark-1">
                                                {{ $course['title'] }}
                                            </h4>
                                            <div class="d-flex x-gap-10 items-center pt-10">
                                                <div class="d-flex items-center">
                                                    <div class="mr-8">
                                                        <img src="{{ asset('assets/img/coursesCards/icons/thread.svg') }}" alt="icon">
                                                    </div>
                                                    <div class="text-14 lh-1">{{ $course['forum_thread_count'] }} Threads</div>
                                                </div>
                                                <div class="d-flex items-center">
                                                    <div class="mr-8">
                                                        <img src="{{ asset('assets/img/coursesCards/icons/comment.svg') }}" alt="icon">
                                                    </div>
                                                    <div class="text-14 lh-1">{{ $course['forum_post_count'] }} Posts</div>
                                                </div>
                                            </div>
                                            <div class="coursesCard__button d-flex justify-center mt-15">
                                                <a href="{{ route('teacher.forums.course.forums.show', ['course' => $course['id']]) }}" class="button -sm -purple-1 text-white">
                                                    Manage @lmsterm('Study Material') Forums
                                                </a>                                                
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                @empty
                                <div class="col-12 text-center py-50">
                                    <i class="icon-book text-60 text-light-4"></i>
                                    <h4 class="text-20 fw-500 mt-15">No @lmsterm('study materials') assigned to you.</h4>
                                    <p class="mt-5">You cannot manage forums for @lmsterm('study materials') you do not teach.</p>
                                </div>
                                @endforelse
                            </div>
                            {{-- Pagination if many courses --}}
                            {{-- <div class="row justify-center pt-30">
                                <div class="col-auto">
                                    <div class="pagination -buttons">
                                        <button class="pagination__button -prev">
                                            <i class="icon icon-chevron-left"></i>
                                        </button>
                                        <div class="pagination__count">
                                            <a href="#">1</a>
                                            <a class="-count-is-active" href="#">2</a>
                                            <a href="#">3</a>
                                        </div>
                                        <button class="pagination__button -next">
                                            <i class="icon icon-chevron-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div> --}}
                        </div>

                        {{-- <div class="tabs__pane -tab-item-2">
                            <p>Management interface for general/site-wide forums would go here if applicable.</p>
                        </div> --}}
                    </div>
                </div>
            </div>
        </div>
    </div>

</x-dashboard-layout> 