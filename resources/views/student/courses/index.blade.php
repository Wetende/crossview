<x-dashboard-layout>
    <x-slot name="title">My Learning</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
    </x-slot>

    {{-- Adapted content from dshb-courses.html --}}
    <div class="row y-gap-30">
        <div class="col-12">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="tabs -active-purple-2 js-tabs">
                    <div class="tabs__controls d-flex items-center pt-20 px-30 border-bottom-light js-tabs-controls">
                        <button class="text-light-1 lh-12 tabs__button js-tabs-button is-active" data-tab-target=".-tab-item-1" type="button">
                            All My @lmsterm('Study Materials')
                        </button>
                        <button class="text-light-1 lh-12 tabs__button js-tabs-button ml-30" data-tab-target=".-tab-item-2" type="button">
                            Completed
                        </button>
                        {{-- Add more tabs if needed, e.g., In Progress --}}
                    </div>

                    <div class="tabs__content py-30 px-30 js-tabs-content">
                        <div class="tabs__pane -tab-item-1 is-active">
                            {{-- Search and Filter Row --}}
                            <div class="row y-gap-10 justify-between pb-20">
                                <div class="col-auto">
                                    <form class="search-field border-light rounded-8 h-50" action="#" method="GET">
                                        <input class="bg-white -dark-bg-dark-2 pr-50" type="text" name="search" placeholder="Search My @lmsterm('Study Materials')">
                                        <button class="" type="submit">
                                            <i class="icon-search text-light-1 text-20"></i>
                                        </button>
                                    </form>
                                </div>
                                <div class="col-auto">
                                    {{-- Filters can be added here if necessary --}}
                                </div>
                            </div>

                            {{-- Course List --}}
                            <div class="row y-gap-30">
                                @if($enrollments->count() > 0)
                                    @foreach($enrollments as $enrollment)
                                        @php $course = $enrollment->course; @endphp
                                        @if($course)
                                        <div class="col-xl-4 col-lg-6 col-md-6">
                                            <div class="coursesCard -type-1">
                                                <div class="relative">
                                                    <div class="coursesCard__image overflow-hidden rounded-8">
                                                        <img class="w-1/1" src="{{ $course->thumbnail_path ? asset($course->thumbnail_path) : asset('img/courses/default-thumbnail.jpg') }}" alt="{{ $course->title }}">
                                                        <div class="coursesCard__image_overlay rounded-8"></div>
                                                    </div>
                                                </div>
                                                <div class="h-100 pt-15">
                                                    <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">
                                                        <a class="-dark-text-white" href="{{ route('student.learn.course', $course->slug) }}">{{ $course->title }}</a>
                                                    </div>
                                                    <div class="d-flex x-gap-10 items-center pt-10">
                                                        <div class="text-14 lh-1">Progress: {{ $enrollment->progress }}%</div>
                                                    </div>
                                                    <div class="mt-10">
                                                        <div class="progress-bar w-1/1">
                                                            <div class="progress-bar__bg bg-light-3"></div>
                                                            <div class="progress-bar__bar bg-purple-1" style="width: {{ $enrollment->progress }}%;"></div>
                                                        </div>
                                                        <div class="d-flex justify-between items-center mt-5">
                                                            <div class="text-14 lh-1">{{ $enrollment->progress }}% Complete</div>
                                                            <a href="{{ route('student.learn.course', $course->slug) }}" class="button -sm -purple-1 text-white">Continue</a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        @endif
                                    @endforeach
                                @else
                                    <div class="col-12 text-center pt-20">
                                        <p>No @lmsterm('study materials') to display in this section.</p>
                                    </div>
                                @endif
                            </div>
                        </div>

                        <div class="tabs__pane -tab-item-2">
                            <div class="row y-gap-30">
                                @php $completed = $enrollments->whereNotNull('completed_at'); @endphp
                                @if($completed->count() > 0)
                                    @foreach($completed as $enrollment)
                                        @php $course = $enrollment->course; @endphp
                                        @if($course)
                                        <div class="col-xl-4 col-lg-6 col-md-6">
                                            <div class="coursesCard -type-1">
                                                <div class="relative">
                                                    <div class="coursesCard__image overflow-hidden rounded-8">
                                                        <img class="w-1/1" src="{{ $course->thumbnail_path ? asset($course->thumbnail_path) : asset('img/courses/default-thumbnail.jpg') }}" alt="{{ $course->title }}">
                                                        <div class="coursesCard__image_overlay rounded-8"></div>
                                                    </div>
                                                </div>
                                                <div class="h-100 pt-15">
                                                    <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">
                                                        <a class="-dark-text-white" href="{{ route('student.learn.course', $course->slug) }}">{{ $course->title }}</a>
                                                    </div>
                                                    <div class="d-flex x-gap-10 items-center pt-10">
                                                        <div class="text-14 lh-1">Completed</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        @endif
                                    @endforeach
                                @else
                                    <div class="col-12 text-center pt-20">
                                        <p>No completed @lmsterm('study materials') to display.</p>
                                    </div>
                                @endif
                            </div>
                        </div>
                        {{-- Add more tab panes if needed --}}
                    </div>
                </div>
            </div>
        </div>
    </div>

</x-dashboard-layout> 