<x-dashboard-layout title="Student Progress Overview">
    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>
    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Student Progress</h1>
                <div class="mt-10">Monitor student progress across all your courses</div>
            </div>
        </div>

        <!-- Filter Section -->
        <div class="row y-gap-20 mb-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center py-15 px-20 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Filter Students</h2>
                    </div>
                    <div class="py-20 px-20">
                        <form action="" method="GET" class="row y-gap-20">
                            <div class="col-xl-4 col-lg-6">
                                <label class="text-14 lh-1 fw-500 text-dark-1 mb-10">Course</label>
                                <select class="form-select" name="course_id">
                                    <option value="">All @lmsterm('Study Materials')</option>
                                    @foreach($courses as $course)
                                        <option value="{{ $course->id }}" {{ request('course_id') == $course->id ? 'selected' : '' }}>
                                            {{ $course->title }}
                                        </option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-xl-4 col-lg-6">
                                <label class="text-14 lh-1 fw-500 text-dark-1 mb-10">Progress Status</label>
                                <select class="form-select" name="status">
                                    <option value="">All Status</option>
                                    <option value="not_started" {{ request('status') == 'not_started' ? 'selected' : '' }}>Not Started</option>
                                    <option value="in_progress" {{ request('status') == 'in_progress' ? 'selected' : '' }}>In Progress</option>
                                    <option value="completed" {{ request('status') == 'completed' ? 'selected' : '' }}>Completed</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <button type="submit" class="button -md -purple-1 text-white">Apply Filters</button>
                                <a href="{{ route('teacher.students.progress') }}" class="button -md -light-3 text-dark-1 ml-10">Clear</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Students List -->
        <div class="row y-gap-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Student Progress Overview</h2>
                    </div>
                    <div class="py-30 px-30">
                        @if(count($studentProgress) > 0)
                            <div class="overflow-x-auto">
                                <table class="table w-1/1">
                                    <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                        <tr>
                                            <th class="p-10">Student</th>
                                            <th class="p-10">@lmsterm('Study Materials') Enrolled</th>
<th class="p-10">@lmsterm('Study Materials') Completed</th>
                                            <th class="p-10">Overall Progress</th>
                                            <th class="p-10 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="text-14">
                                        @foreach($studentProgress as $progress)
                                            <tr class="border-bottom-light">
                                                <td class="p-10">
                                                    <div class="d-flex items-center">
                                                        <div class="mr-10">
                                                            <div class="size-40 rounded-full d-flex justify-center items-center bg-light-7">
                                                                <i class="icon-user text-16"></i>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div class="text-14 fw-500 text-dark-1">{{ $progress['student']->name }}</div>
                                                            <div class="text-13 text-light-1">{{ $progress['student']->email }}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="p-10 fw-500">{{ $progress['total_courses'] }}</td>
                                                <td class="p-10 fw-500">{{ $progress['completed_courses'] }}</td>
                                                <td class="p-10">
                                                    <div class="d-flex items-center">
                                                        <div class="progress-bar mr-10" style="width: 100px;">
                                                            <div class="progress-bar__bg bg-light-3"></div>
                                                            <div class="progress-bar__bar bg-purple-1" style="width: {{ $progress['overall_progress'] }}%;"></div>
                                                        </div>
                                                        <div>{{ $progress['overall_progress'] }}%</div>
                                                    </div>
                                                </td>
                                                <td class="p-10 text-center">
                                                    <div class="dropdown">
                                                        <button class="button -sm -light-3 text-14 fw-500" type="button" data-bs-toggle="dropdown">
                                                            View Details
                                                        </button>
                                                        <ul class="dropdown-menu">
                                                            @foreach($progress['enrollments'] as $enrollment)
                                                                <li>
                                                                    <a class="dropdown-item" href="{{ route('teacher.courses.students.progress', [$enrollment->course, $progress['student']]) }}">
                                                                        {{ Str::limit($enrollment->course->title, 40) }}
                                                                    </a>
                                                                </li>
                                                            @endforeach
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                        @else
                            <div class="text-center py-50">
                                <div class="icon-empty-state mb-20">
                                    <i class="icon-user-graduate text-60 text-light-1"></i>
                                </div>
                                <h4 class="text-18 fw-500 mb-10">No Students Found</h4>
                                <p class="text-14">There are no students enrolled in your courses yet.</p>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 