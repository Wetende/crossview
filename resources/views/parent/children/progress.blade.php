<x-dashboard-layout>
    <x-slot name="title">Child Progress</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.parent.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.parent.header')
        <h1 class="text-30 lh-12 fw-700">Child's Progress</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('parent.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('parent.child-progress') }}">Child Progress</a>
                </div>
            </div>
        </div>
    </x-slot>

    <div class="dashboard__content bg-light-4">
        @if(session('success'))
            <div class="row mb-20">
                <div class="col-12">
                    <div class="notice success">
                        <p>{{ session('success') }}</p>
                    </div>
                </div>
            </div>
        @endif
        
        @if(session('error'))
            <div class="row mb-20">
                <div class="col-12">
                    <div class="notice error">
                        <p>{{ session('error') }}</p>
                    </div>
                </div>
            </div>
        @endif

        @if($linkedStudents->isEmpty())
            <div class="row">
                <div class="col-12">
                    <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                        <div class="text-center py-40">
                            <img src="{{ asset('img/dashboard/empty-state/students.svg') }}" alt="{{ __('No Linked Students') }}" style="max-width: 200px;" class="mb-20">
                            <h4 class="text-18 fw-500 mb-10">{{ __('No Children Linked Yet') }}</h4>
                            <p class="text-14 mb-20">{{ __('You have not linked any student accounts. Use the button below to add one using an invite code.') }}</p>
                            <a href="{{ route('parent.link.create') }}" class="button -md -purple-1 text-white">{{ __('Link New Child') }}</a>
                        </div>
                    </div>
                </div>
            </div>
        @else
            <!-- Student Selector -->
            <div class="row mb-30">
                <div class="col-12">
                    <div class="d-flex justify-between items-center py-20 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                        <div class="d-flex items-center">
                            <div class="lh-1 fw-500 mr-20">Select Child:</div>
                            <form action="{{ route('parent.select-student') }}" method="POST">
                                @csrf
                                <div class="d-flex items-center">
                                    <select name="student_id" id="student_id" class="form-control mr-10" onchange="this.form.submit()">
                                        @foreach($linkedStudents as $student)
                                            <option value="{{ $student->id }}" {{ $selectedStudent && $selectedStudent->id == $student->id ? 'selected' : '' }}>
                                                {{ $student->name }}
                                            </option>
                                        @endforeach
                                    </select>
                                    <noscript>
                                        <button type="submit" class="button -sm -purple-1 text-white">View</button>
                                    </noscript>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            @if($selectedStudent)
                <div class="row">
                    <div class="col-12 mb-30">
                        <div class="d-flex justify-between items-center py-20 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <h3 class="text-18 lh-1 fw-500">{{ $selectedStudent->name }}'s @lmsterm('Study Material') Progress</h3>
                            <div class="d-flex x-gap-10">
                                <a href="{{ route('parent.child.dashboard', ['child' => $selectedStudent->id]) }}" class="button -sm -purple-1 text-white">
                                    <i class="icon-grid text-16 mr-5"></i> View Dashboard
                                </a>
                                <a href="{{ route('parent.child.grades', ['child' => $selectedStudent->id]) }}" class="button -sm -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                                    <i class="icon-star text-16 mr-5"></i> View Grades
                                </a>
                                <a href="{{ route('parent.child.calendar.index', ['child' => $selectedStudent->id]) }}" class="button -sm -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                                    <i class="icon-calendar text-16 mr-5"></i> View Calendar
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                @if($enrollments->isEmpty())
                    <div class="row">
                        <div class="col-12">
                            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                                <div class="text-center py-40">
                                    <img src="{{ asset('img/dashboard/empty-state/courses.svg') }}" alt="{{ __('No @lmsterm('Study Materials')') }}" style="max-width: 200px;" class="mb-20">
                                    <h4 class="text-18 fw-500 mb-10">{{ __('No @lmsterm('Study Materials') Enrolled Yet') }}</h4>
                                                                          <p class="text-14 mb-20">{{ __('Your child is not enrolled in any @lmsterm('study materials') yet.') }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                @else
                    <div class="row y-gap-30">
                        @foreach($enrollments as $enrollment)
                            <div class="col-xl-6 col-lg-6 col-md-12">
                                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                                    <div class="d-flex items-center">
                                        @php
                                            $backgroundUrl = $enrollment->course->thumbnail_path ? asset($enrollment->course->thumbnail_path) : asset('img/courses/default-thumbnail.jpg');
                                            $progressValue = $enrollment->progress ?? 0;
                                        @endphp
                                        <div class="shrink-0 size-60 rounded-16 bg-image-cover js-bg-image" data-bg-url="{{ $backgroundUrl }}"></div>
                                        <div class="ml-20">
                                            <h4 class="text-17 lh-15 fw-500 text-dark-1">{{ $enrollment->course->title }}</h4>
                                            <div class="d-flex items-center mt-5">
                                                <div class="text-14 lh-1 {{ $enrollment->completed_at ? 'text-green-1' : 'text-light-1' }}">
                                                    {{ $enrollment->completed_at ? 'Completed' : 'In Progress' }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mt-20">
                                        <div class="d-flex justify-between items-center mb-8">
                                            <div class="text-14 lh-1 text-dark-1">Progress</div>
                                            <div class="text-14 lh-1 text-dark-1 fw-500">{{ number_format($progressValue, 1) }}%</div>
                                        </div>
                                        <div class="progress-bar bg-light-3 -dark-bg-dark-5 h-6 rounded-full">
                                            <div class="progress-bar__item bg-purple-1 h-full rounded-full js-progress-bar" data-progress="{{ $progressValue }}"></div>
                                        </div>
                                    </div>

                                    <div class="mt-20">
                                        <div class="d-flex justify-between mb-10">
                                            <div class="text-14 lh-1 text-dark-1">Enrolled: {{ $enrollment->enrolled_at ? $enrollment->enrolled_at->format('M d, Y') : 'N/A' }}</div>
                                            @if($enrollment->completed_at)
                                                <div class="text-14 lh-1 text-dark-1">Completed: {{ $enrollment->completed_at->format('M d, Y') }}</div>
                                            @endif
                                        </div>
                                        
                                        <div class="mt-10">
                                                                                            @if($enrollment->course->quizzes->count() > 0)
                                                <div class="d-flex items-center mb-10">
                                                    <div class="mr-10"><i class="icon-file-text text-purple-1"></i></div>
                                                    <div>Quizzes: <span class="fw-500">{{ $enrollment->course->quizzes->count() }}</span></div>
                                                </div>
                                            @endif
                                        </div>
                                        
                                        <a href="{{ route('parent.child.course.progress', ['child' => $selectedStudent->id, 'course' => $enrollment->course_id]) }}" class="button -sm -purple-1 text-white w-1/1 mt-10">View Detailed Progress</a>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @endif
            @else
                <div class="row">
                    <div class="col-12">
                        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <div class="text-center py-20">
                                <p>Please select a child to view their progress.</p>
                            </div>
                        </div>
                    </div>
                </div>
            @endif
        @endif
    </div>
</x-dashboard-layout>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Set background images
    document.querySelectorAll('.js-bg-image').forEach(function(element) {
        const bgUrl = element.getAttribute('data-bg-url');
        element.style.backgroundImage = 'url(' + bgUrl + ')';
    });
    
    // Set progress bars
    document.querySelectorAll('.js-progress-bar').forEach(function(element) {
        const progress = element.getAttribute('data-progress');
        element.style.width = progress + '%';
    });
});
</script>
@endpush 