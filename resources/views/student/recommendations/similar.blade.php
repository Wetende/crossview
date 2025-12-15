<x-slot name="header">
    @include('layouts.partials.student.header')
</x-slot>

<x-dashboard-layout>
    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Similar @lmsterm('Study Materials')</h1>
<div class="mt-10">@lmsterm('Study Materials') similar to "{{ $course->title }}"</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('courses.show', $course->slug) }}" class="button -md -outline-purple-1 text-purple-1">Back to Course</a>
            </div>
        </div>

        <div class="row">
            <div class="col-12">
                <x-recommended-courses :recommendations="$recommendations" :title="$title" />
            </div>
        </div>
    </div>
</x-dashboard-layout> 