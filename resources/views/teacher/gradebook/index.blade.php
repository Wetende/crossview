<x-dashboard-layout>
    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <x-slot name="title">
        {{ __('Gradebook - Select Course') }}
    </x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row pb-50 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">{{ __('Select a Course to View Gradebook') }}</h1>
            </div>
        </div>

        <div class="row y-gap-30">
            @if($courses->count() > 0)
                @foreach($courses as $course)
                    <div class="w-1/3 xl:w-1/2 lg:w-1/1 md:w-1/1 sm:w-1/1"> {{-- Adjusted width classes for better display --}}
                        <a href="{{ route('teacher.gradebook.course', ['course' => $course->id]) }}" class="text-dark-1">
                            <div class="relative bg-white -dark-bg-dark-1 shadow-4 rounded-8 p-20 hover-shadow-2">
                                {{-- You might want to add course image here if available --}}
                                {{-- <img class="rounded-8 w-1/1" src="{{ $course->thumbnail_url ?? asset('img/coursesCards/placeholder.png') }}" alt="{{ $course->title }}"> --}}
                                
                                <div class="pt-15">
                                    <h3 class="text-18 fw-500 lh-15 mt-10">{{ $course->title }}</h3>
                                    {{-- Add more course details if needed, e.g., number of students --}}
                                    <p class="text-14 lh-1 mt-5">{{ $course->students_count ?? $course->students()->count() }} {{ __('Students') }}</p>

                                    <div class="d-flex items-center mt-15">
                                        <button class="button -md -purple-1 text-white">{{ __('View Gradebook') }}</button>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                @endforeach
            @else
                <div class="col-12">
                    <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100 p-30">
                        <p class="text-center">{{ __('You are not assigned to any courses, or no courses have students enrolled.') }}</p>
                    </div>
                </div>
            @endif
        </div>

        {{-- Pagination if needed --}}
        {{-- <div class="row justify-center pt-30">
            <div class="col-auto">
                {{ $courses->links('vendor.pagination.default') }}
            </div>
        </div> --}}
    </div>

</x-dashboard-layout> 