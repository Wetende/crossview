<x-dashboard-layout>
    <x-slot name="title">My Grades</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
        <h1 class="text-30 lh-12 fw-700">My Grades</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.grades.index') }}">My Grades</a>
                </div>
            </div>
        </div>
    </x-slot>

    {{-- Content for listing courses to view grades --}}
    <div class="row y-gap-30">
        <div class="col-12">
            <div class="py-30 px-30 rounded-8 bg-white -dark-bg-dark-1 shadow-4">
                <div class="tabs -active-purple-2 js-tabs">
                    <div class="tabs__controls d-flex js-tabs-controls">
                        <button class="tabs__button text-14 lh-12 fw-500 text-light-1 js-tabs-button is-active" data-tab-target=".-tab-item-1" type="button">
                            All My @lmsterm('Study Materials')
                        </button>
                        {{-- Potentially add other tabs like 'Recently Graded' if needed later --}}
                    </div>

                    <div class="tabs__content pt-30 js-tabs-content">
                        <div class="tabs__pane -tab-item-1 is-active">
                            <div class="row y-gap-30">
                                {{-- Placeholder: Loop through student's enrolled courses --}}
                                @for ($i = 1; $i <= 4; $i++)
                                <div class="col-lg-6 col-md-6">
                                    <div class="py-20 px-20 rounded-8 border-light -dark-border-dark-2 hover-shadow-4 transition-1">
                                        <div class="d-flex items-center justify-between">
                                            <h4 class="text-17 lh-15 fw-500">
                                                <a href="{{ route('student.grades.course', ['courseId' => $i]) }}">@lmsterm('Study Material') Title {{ $i }}</a>
                                            </h4>
                                            <div class="text-14 lh-1 text-purple-1">View Grades</div>
                                        </div>
                                        <p class="text-13 lh-1 mt-5">Instructor: Jane Doe</p>
                                        <div class="d-flex items-center mt-10">
                                            <div class="text-14 text-dark-1">Overall Grade: <span class="fw-500">A- (92%)</span></div> {{-- Placeholder --}}
                                        </div>
                                        <a href="{{ route('student.grades.course', ['courseId' => $i]) }}" class="button -sm -purple-1 text-white mt-15">View Detailed Grades</a>
                                    </div>
                                </div>
                                @endfor

                                @if (true) {{-- Placeholder for no courses --}}
                                    {{-- <div class="col-12 text-center py-50">
                                        <i class="icon-book text-60 text-light-4"></i>
                                        <h4 class="text-20 fw-500 mt-15">No courses found.</h4>
                                        <p class="mt-5">You are not enrolled in any courses yet or no grades are available.</p>
                                    </div> --}}
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</x-dashboard-layout> 