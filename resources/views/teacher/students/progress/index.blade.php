<x-slot name="header">
    @include('layouts.partials.teacher.header')
</x-slot>

<x-dashboard-layout>
    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Student Progress: {{ $course->title }}</h1>
                <div class="mt-10">Monitor student progress, view completions and quiz attempts</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('teacher.courses.index') }}" class="button -icon -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                    <i class="icon-arrow-left mr-15"></i>
                    Back to @lmsterm('Study Materials')
                </a>
            </div>
        </div>

        <div class="row y-gap-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Enrolled Students</h2>
                        <div class="d-flex items-center">
                            <form action="{{ route('teacher.courses.students.index', $course) }}" method="GET" class="d-flex items-center">
                                <div class="mr-10">
                                    <select name="status" class="form-select bg-white" onchange="this.form.submit()">
                                        <option value="">All Students</option>
                                        <option value="completed" {{ request('status') == 'completed' ? 'selected' : '' }}>Completed</option>
                                        <option value="in_progress" {{ request('status') == 'in_progress' ? 'selected' : '' }}>In Progress</option>
                                    </select>
                                </div>
                                <div class="d-flex items-center ml-10">
                                    <input type="text" name="search" value="{{ request('search') }}" placeholder="Search students..." class="form-control bg-white">
                                    <button type="submit" class="button -icon -dark-1 text-white ml-10">
                                        <i class="icon-search"></i>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div class="py-30 px-30">
                        @if($enrollments->count() > 0)
                            <div class="overflow-scroll">
                                <table class="table w-1/1">
                                    <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                        <tr>
                                            <th class="p-10">Student</th>
                                            <th class="p-10">Enrollment Date</th>
                                            <th class="p-10">Progress</th>
                                            <th class="p-10">Status</th>
                                            <th class="p-10 text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="text-14">
                                        @foreach($enrollments as $enrollment)
                                            <tr class="border-bottom-light">
                                                <td class="p-10">
                                                    <div class="d-flex items-center">
                                                        <div class="size-50 rounded-8 d-flex justify-center items-center bg-light-7 -dark-bg-dark-3 mr-10">
                                                            @if($enrollment->user->profile_picture_path)
                                                                <img src="{{ asset('storage/' . $enrollment->user->profile_picture_path) }}" alt="{{ $enrollment->user->name }}" class="size-50 object-cover rounded-8">
                                                            @else
                                                                <div class="text-16 fw-500">{{ substr($enrollment->user->name, 0, 2) }}</div>
                                                            @endif
                                                        </div>
                                                        <div>
                                                            <div class="text-14 fw-500">{{ $enrollment->user->name }}</div>
                                                            <div class="text-light-1 mt-5">{{ $enrollment->user->email }}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="p-10">{{ $enrollment->enrolled_at->format('M d, Y') }}</td>
                                                <td class="p-10">
                                                    <div class="d-flex items-center">
                                                        <div class="progress-bar">
                                                            <div class="progress-bar__bg bg-light-3"></div>
                                                            <div class="progress-bar__bar bg-purple-1" style="width: {{ $enrollment->progress }}%;"></div>
                                                        </div>
                                                        <div class="text-14 fw-500 ml-10">{{ $enrollment->progress }}%</div>
                                                    </div>
                                                </td>
                                                <td class="p-10">
                                                    @if($enrollment->completed_at)
                                                        <div class="badge bg-green-1 text-white">Completed</div>
                                                    @else
                                                        <div class="badge bg-light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">In Progress</div>
                                                    @endif
                                                </td>
                                                <td class="p-10 text-end">
                                                    <a href="{{ route('teacher.courses.students.progress', ['course' => $course->id, 'student' => $enrollment->user->id]) }}" class="button -sm -dark-1 text-white">
                                                        View Details
                                                    </a>
                                                </td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                            <div class="mt-20">
                                {{ $enrollments->links() }}
                            </div>
                        @else
                            <div class="text-center py-40">
                                <img src="{{ asset('img/dashboard/empty-state/no-students.svg') }}" alt="No Students" style="max-width: 200px;" class="mb-20">
                                <h4 class="text-18 fw-500 mb-10">No Students Found</h4>
                                <p class="text-14 mb-20">There are no students enrolled in this course yet, or none match your search criteria.</p>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 