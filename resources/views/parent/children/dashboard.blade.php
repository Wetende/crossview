<x-dashboard-layout>
    <x-slot name="title">Dashboard for {{ $child->name }}</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.parent.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.parent.header')
        <h1 class="text-30 lh-12 fw-700">{{ $child->name }}'s Dashboard</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('parent.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('parent.linked_students.index') }}">My Children</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="javascript:void(0);">{{ $child->name }}</a>
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

        <!-- Quick Stats Overview -->
        <div class="row y-gap-30 mb-30">
            <div class="col-12">
                <div class="d-flex justify-between items-center py-20 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <h3 class="text-18 lh-1 fw-500">{{ $child->name }}'s Learning Overview</h3>
                    <div class="d-flex x-gap-10">
                        <a href="{{ route('parent.child.grades', ['child' => $child->id]) }}" class="button -sm -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                            <i class="icon-star text-16 mr-5"></i> View Grades
                        </a>
                        <a href="{{ route('parent.child.calendar.index', ['child' => $child->id]) }}" class="button -sm -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                            <i class="icon-calendar text-16 mr-5"></i> View Calendar
                        </a>
                    </div>
                </div>
            </div>
            
            <!-- Quick Stats Cards -->
            <div class="col-xl-3 col-lg-6 col-md-6">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-center direction-column text-center">
                        <div class="size-60 rounded-full d-flex justify-center items-center bg-purple-3 mx-auto mb-15">
                            <i class="icon-play-button text-purple-1 text-24"></i>
                        </div>
                        <div class="text-24 lh-1 fw-500 text-dark-1">{{ $totalCourses }}</div>
                        <div class="text-15 lh-1 mt-10">Total @lmsterm('Study Materials')</div>
                    </div>
                </div>
            </div>
            
            <div class="col-xl-3 col-lg-6 col-md-6">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-center direction-column text-center">
                        <div class="size-60 rounded-full d-flex justify-center items-center bg-green-3 mx-auto mb-15">
                            <i class="icon-check text-green-1 text-24"></i>
                        </div>
                        <div class="text-24 lh-1 fw-500 text-dark-1">{{ $completedCourses }}</div>
                        <div class="text-15 lh-1 mt-10">Completed @lmsterm('Study Materials')</div>
                    </div>
                </div>
            </div>
            
            <div class="col-xl-3 col-lg-6 col-md-6">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-center direction-column text-center">
                        <div class="size-60 rounded-full d-flex justify-center items-center bg-orange-3 mx-auto mb-15">
                            <i class="icon-time-management text-orange-1 text-24"></i>
                        </div>
                        <div class="text-24 lh-1 fw-500 text-dark-1">{{ $inProgressCourses }}</div>
                        <div class="text-15 lh-1 mt-10">In Progress</div>
                    </div>
                </div>
            </div>
            
            <div class="col-xl-3 col-lg-6 col-md-6">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-center direction-column text-center">
                        <div class="size-60 rounded-full d-flex justify-center items-center bg-blue-3 mx-auto mb-15">
                            <i class="icon-online-learning text-blue-1 text-24"></i>
                        </div>
                        <div class="text-24 lh-1 fw-500 text-dark-1">{{ $avgProgress }}%</div>
                        <div class="text-15 lh-1 mt-10">Average Progress</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Courses Enrolled -->
        <div class="row mb-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h3 class="text-17 lh-1 fw-500">Enrolled @lmsterm('Study Materials')</h3>
                    </div>
                    <div class="py-30 px-30">
                        @if($enrollments->isNotEmpty())
                            <div class="row y-gap-20">
                                @foreach($enrollments as $enrollment)
                                    <div class="col-12">
                                        <div class="d-flex rounded-8 border-light -dark-border-dark-2 p-20">
                                            @php
                                                $backgroundUrl = $enrollment->course->thumbnail_path ? asset($enrollment->course->thumbnail_path) : asset('img/courses/default-thumbnail.jpg');
                                                $progressValue = $enrollment->progress ?? 0;
                                            @endphp
                                            <div class="shrink-0 size-60 rounded-16 bg-image-cover mr-20 js-bg-image" data-bg-url="{{ $backgroundUrl }}"></div>
                                            <div class="w-1/1">
                                                <div class="d-flex justify-between">
                                                    <h4 class="text-17 lh-15 fw-500 text-dark-1">{{ $enrollment->course->title }}</h4>
                                                    <div class="d-flex items-center">
                                                        <span class="badge {{ $enrollment->completed_at ? 'bg-green-1 text-white' : 'bg-orange-1 text-white' }} mr-10">
                                                            {{ $enrollment->completed_at ? 'Completed' : 'In Progress' }}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div class="mt-15">
                                                    <div class="d-flex justify-between items-center mb-8">
                                                        <div class="text-14 lh-1 text-dark-1">Progress</div>
                                                        <div class="text-14 lh-1 text-dark-1 fw-500">{{ number_format($progressValue, 1) }}%</div>
                                                    </div>
                                                    <div class="progress-bar bg-light-3 -dark-bg-dark-5 h-6 rounded-full">
                                                        <div class="progress-bar__item bg-purple-1 h-full rounded-full js-progress-bar" data-progress="{{ $progressValue }}"></div>
                                                    </div>
                                                </div>

                                                <div class="d-flex items-center mt-15">
                                                    <div class="text-14 lh-1 text-light-1 mr-30">Enrolled: {{ $enrollment->enrolled_at ? $enrollment->enrolled_at->format('M d, Y') : 'N/A' }}</div>
                                                    @if($enrollment->completed_at)
                                                        <div class="text-14 lh-1 text-light-1">Completed: {{ $enrollment->completed_at->format('M d, Y') }}</div>
                                                    @endif
                                                </div>
                                                
                                                <div class="mt-15">
                                                    <a href="{{ route('parent.child.course.progress', ['child' => $child->id, 'course' => $enrollment->course_id]) }}" class="button -sm -purple-1 text-white">View Detailed Progress</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        @else
                            <div class="text-center py-20">
                                <p>No @lmsterm('study materials') enrolled yet.</p>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Recent Quiz Attempts -->
        <div class="row mb-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h3 class="text-17 lh-1 fw-500">Recent Quiz Results</h3>
                    </div>
                    <div class="py-30 px-30">
                        @if($quizAttempts->isNotEmpty())
                            <div class="table-responsive">
                                <table class="table w-1/1">
                                    <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                        <tr>
                                            <th>Quiz</th>
                                            <th>@lmsterm('Study Material')</th>
                                            <th>Score</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="text-14">
                                        @foreach($quizAttempts as $attempt)
                                            <tr class="border-bottom-light">
                                                <td>{{ $attempt->quiz->title }}</td>
                                                <td>{{ $attempt->quiz->course->title ?? 'N/A' }}</td>
                                                <td>{{ number_format($attempt->score, 1) }}%</td>
                                                <td>
                                                    <div class="badge {{ $attempt->passed ? 'bg-green-1 text-white' : 'bg-red-1 text-white' }}">
                                                        {{ $attempt->passed ? 'Passed' : 'Failed' }}
                                                    </div>
                                                </td>
                                                <td>{{ $attempt->completed_at ? $attempt->completed_at->format('M d, Y') : 'Incomplete' }}</td>
                                                <td>
                                                    <a href="{{ route('parent.child.quiz-results', ['child' => $child->id, 'quizAttempt' => $attempt->id]) }}" class="button -sm -purple-1 text-white">View Details</a>
                                                </td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                        @else
                            <div class="text-center py-20">
                                <p>No quiz attempts yet.</p>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Recent Performance Activity -->
        <div class="row mb-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h3 class="text-17 lh-1 fw-500">Recent Performance Activity</h3>
                    </div>
                    <div class="py-30 px-30">
                        @if($recentPerformances->isNotEmpty())
                            <div class="table-responsive">
                                <table class="table w-1/1">
                                    <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                        <tr>
                                            <th>Subject</th>
                                            <th>Metric</th>
                                            <th>Score</th>
                                            <th>Level</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody class="text-14">
                                        @foreach($recentPerformances as $performance)
                                            <tr class="border-bottom-light">
                                                <td>{{ $performance->subject->name ?? 'N/A' }}</td>
                                                <td>{{ $performance->performanceMetric->name ?? 'General Assessment' }}</td>
                                                <td>
                                                    <span class="text-{{ $performance->percentage_score >= 80 ? 'green' : ($performance->percentage_score >= 70 ? 'blue' : ($performance->percentage_score >= 60 ? 'orange' : 'red')) }}-1 fw-500">
                                                        {{ number_format($performance->percentage_score, 1) }}%
                                                    </span>
                                                </td>
                                                <td>
                                                    @php
                                                        $level = 'Fail';
                                                        $badgeColor = 'bg-red-1';
                                                        if ($performance->percentage_score >= 80) {
                                                            $level = 'Distinction';
                                                            $badgeColor = 'bg-green-1';
                                                        } elseif ($performance->percentage_score >= 70) {
                                                            $level = 'Credit';
                                                            $badgeColor = 'bg-blue-1';
                                                        } elseif ($performance->percentage_score >= 60) {
                                                            $level = 'Pass';
                                                            $badgeColor = 'bg-orange-1';
                                                        }
                                                    @endphp
                                                    <span class="badge {{ $badgeColor }} text-white">{{ $level }}</span>
                                                </td>
                                                <td>{{ $performance->last_calculated_at ? $performance->last_calculated_at->format('M d, Y') : 'N/A' }}</td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                        @else
                            <div class="text-center py-20">
                                <p>No performance data available yet.</p>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Recent Activity -->
        <div class="row mb-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h3 class="text-17 lh-1 fw-500">Recent Learning Activity</h3>
                    </div>
                    <div class="py-30 px-30">
                        @if($recentActivity->isNotEmpty())
                            <div class="row y-gap-20">
                                @foreach($recentActivity as $activity)
                                    <div class="col-12">
                                        <div class="d-flex items-center p-10 {{ !$loop->last ? 'border-bottom-light' : '' }}">
                                            <div class="d-flex justify-center items-center size-50 rounded-full bg-purple-3 mr-10">
                                                <i class="icon-play-button text-purple-1 text-20"></i>
                                            </div>
                                            <div>
                                                <h4 class="text-15 lh-15 fw-500 text-dark-1">{{ $activity->course->title }}</h4>
                                                <div class="text-13 lh-1 mt-5">
                                                    Last activity: {{ $activity->updated_at->diffForHumans() }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        @else
                            <div class="text-center py-20">
                                <p>No recent activity.</p>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
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