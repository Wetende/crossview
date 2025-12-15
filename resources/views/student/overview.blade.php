<x-dashboard-layout>
    <x-slot name="title">Student Dashboard - Overview</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20">
            <div class="col-xl-3 col-lg-6 col-md-6">
                <div class="d-flex justify-between items-center py-25 px-25 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div>
                        <div class="lh-1 fw-500">Enrolled @lmsterm('Study Materials')</div>
                        <div class="text-26 lh-1 fw-700 text-dark-1 mt-10">{{ $totalEnrolled }}</div>
                    </div>
                    <i class="text-40 icon-play-button text-purple-1"></i>
                </div>
            </div>

            <div class="col-xl-3 col-lg-6 col-md-6">
                <div class="d-flex justify-between items-center py-25 px-25 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div>
                        <div class="lh-1 fw-500">Active @lmsterm('Study Materials')</div>
                        <div class="text-26 lh-1 fw-700 text-dark-1 mt-10">{{ $activeCourses }}</div>
                    </div>
                    <i class="text-40 icon-message-2 text-purple-1"></i>
                </div>
            </div>

            <div class="col-xl-3 col-lg-6 col-md-6">
                <div class="d-flex justify-between items-center py-25 px-25 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div>
                        <div class="lh-1 fw-500">Completed @lmsterm('Study Materials')</div>
                        <div class="text-26 lh-1 fw-700 text-dark-1 mt-10">{{ $completedCourses }}</div>
                    </div>
                    <i class="text-40 icon-graduate-cap text-purple-1"></i>
                </div>
            </div>

            <div class="col-xl-3 col-lg-6 col-md-6">
                <div class="d-flex justify-between items-center py-25 px-25 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div>
                        <div class="lh-1 fw-500">Performance Score</div>
                        @if($hasPerformanceData && $overallRanking)
                            <div class="text-26 lh-1 fw-700 text-purple-1 mt-10">{{ round($overallRanking->percentile) }}%</div>
                        @else
                            <div class="text-18 lh-1 fw-500 text-light-1 mt-10">Not Available</div>
                        @endif
                    </div>
                    <i class="text-40 icon-medal text-purple-1"></i>
                </div>
            </div>

            <div class="col-xl-8 col-lg-6">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Continue Learning</h2>
                        <a href="{{ route('student.my-learning') }}" class="text-14 text-purple-1 underline">View All @lmsterm('Study Materials')</a>
                    </div>
                    <div class="py-25 px-25">
                        @php
                            $activeEnrollments = $enrollments->filter(function($enrollment) {
                                return is_null($enrollment->completed_at) && $enrollment->progress < 100;
                            });
                            $activeCount = $activeEnrollments->count();
                            $avgProgress = $activeCount > 0 ? round($activeEnrollments->avg('progress'), 2) : 0;
                            $mostRecent = $activeEnrollments->sortByDesc(function($enrollment) {
                                return optional($enrollment->updated_at ?? $enrollment->created_at)->timestamp;
                            })->first();
                        @endphp
                        <div class="mb-20 text-16 text-dark-1">
                            You are currently enrolled in <span class="fw-700">{{ $activeCount }}</span> active @lmsterm('study material'){{ $activeCount === 1 ? '' : 's' }}.
                        </div>
                        <div class="mb-25">
                            <div class="text-14 mb-5">Average Progress</div>
                            <div class="progress-bar w-1/1">
                                <div class="progress-bar__bg bg-light-3"></div>
                                <div class="progress-bar__bar bg-purple-1" data-progress="{{ $avgProgress }}"></div>
                            </div>
                            <div class="text-14 mt-5">{{ $avgProgress }}% Complete (across all active @lmsterm('study materials'))</div>
                        </div>
                        @if($mostRecent && $mostRecent->course)
                            <div class="py-20 px-20 rounded-16 bg-light-4 -dark-bg-dark-2 mb-10 d-flex flex-column flex-sm-row align-items-center justify-between">
                                <div class="mb-10 mb-sm-0">
                                    <div class="text-15 fw-500 mb-5">Most Recent @lmsterm('Study Material')</div>
                                    <div class="text-17 fw-700 text-dark-1">{{ $mostRecent->course->title }}</div>
                                    <div class="text-14 mt-5">Progress: {{ $mostRecent->progress }}%</div>
                                </div>
                                <div>
                                    <a href="{{ route('student.learn.course', $mostRecent->course->slug) }}" class="button -md -purple-1 text-white">Continue</a>
                                </div>
                            </div>
                        @else
                            <div class="d-flex justify-center items-center py-40">
                                <div class="text-center">
                                    <div class="text-18 lh-1 fw-500 text-dark-1">No @lmsterm('study materials') in progress</div>
                                    <div class="mt-10">Start learning by enrolling in a @lmsterm('study material')!</div>
                                </div>
                            </div>
                        @endif
                    </div>
                </div>
            </div>

            <div class="col-xl-4 col-lg-6">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Performance Highlights</h2>
                        <a href="{{ route('student.performance.overview') }}" class="text-14 text-purple-1 underline">View All Performance</a>
                    </div>
                    <div class="py-25 px-25">
                        @if($hasPerformanceData)
                            @if($overallRanking)
                                <div class="d-flex items-center justify-center flex-column mb-25">
                                    <div class="text-14 fw-500 mb-10">Overall Ranking in Grade</div>
                                    @php
                                        $percentile = round($overallRanking->percentile);
                                        $color = 'purple-1';
                                        
                                        if ($percentile >= 90) {
                                            $color = 'green-1';
                                        } elseif ($percentile >= 75) {
                                            $color = 'blue-1';
                                        } elseif ($percentile >= 50) {
                                            $color = 'yellow-1';
                                        } elseif ($percentile < 50) {
                                            $color = 'red-1';
                                        }
                                    @endphp
                                    <div class="text-38 lh-1 fw-700 text-{{ $color }}">{{ $percentile }}%</div>
                                    <div class="mt-10 text-14">
                                        Rank: {{ number_format($overallRanking->rank) }} of {{ number_format($overallRanking->total_students) }}
                                    </div>
                                    <div class="mt-5 text-14">
                                        Grade: {{ $overallRanking->gradeLevel->name }}
                                    </div>
                                </div>
                            @endif
                            
                            @if(count($bestPerformingSubjects) > 0)
                                <div class="border-top-light pt-20">
                                    <h3 class="text-16 fw-500 mb-15">Best Performing Subjects</h3>
                                    <div class="y-gap-15">
                                        @foreach($bestPerformingSubjects as $data)
                                            @php
                                                $score = round($data['avg_score']);
                                                $color = 'purple-1';
                                                
                                                if ($score >= 80) {
                                                    $color = 'green-1';
                                                    $level = 'Distinction';
                                                } elseif ($score >= 65) {
                                                    $color = 'blue-1';
                                                    $level = 'Credit';
                                                } elseif ($score >= 50) {
                                                    $color = 'yellow-1';
                                                    $level = 'Pass';
                                                } else {
                                                    $color = 'red-1';
                                                    $level = 'Needs Improvement';
                                                }
                                            @endphp
                                            <a href="{{ route('student.performance.subject', $data['subject']) }}" class="d-flex items-center justify-between py-10 border-bottom-light">
                                                <div>
                                                    <div class="text-15 fw-500">{{ $data['subject']->name }}</div>
                                                    <div class="d-flex items-center x-gap-20 mt-5">
                                                        <div class="text-14">Level: {{ $level }}</div>
                                                    </div>
                                                </div>
                                                <div class="text-18 fw-600 text-{{ $color }}">{{ $score }}%</div>
                                            </a>
                                        @endforeach
                                    </div>
                                </div>
                            @endif
                        @else
                            <div class="d-flex justify-center items-center py-40">
                                <div class="text-center">
                                    <div class="text-18 lh-1 fw-500 text-dark-1">No performance data yet</div>
                                    <div class="mt-10">Complete quizzes and assignments to see your progress!</div>
                                    <div class="mt-15">
                                        <a href="{{ route('student.assessments.index') }}" class="button -sm -outline-purple-1 text-purple-1">View Assessments</a>
                                    </div>
                                </div>
                            </div>
                        @endif
                    </div>
                </div>
            </div>

            <div class="col-xl-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Recent Assessments</h2>
                        <a href="{{ route('student.assessments.index') }}" class="text-14 text-purple-1 underline">View All Assessments</a>
                    </div>
                    <div class="py-25 px-25">
                        @if($recentQuizAttempts->count() > 0)
                            <div class="overflow-scroll scroll-bar-1">
                                <table class="table w-1/1">
                                    <thead class="bg-light-3">
                                        <tr>
                                            <th>Quiz Title</th>
                                            <th>Date</th>
                                            <th>Score</th>
                                            <th>Pass Mark</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach($recentQuizAttempts as $attempt)
                                            <tr class="border-bottom-light">
                                                <td class="p-10">
                                                    <div class="text-14 lh-1 fw-500">{{ $attempt->quiz->title }}</div>
                                                </td>
                                                <td class="p-10">
                                                    {{ $attempt->created_at->format('M d, Y') }}
                                                </td>
                                                <td class="p-10">
                                                    {{ $attempt->score_percentage }}%
                                                </td>
                                                <td class="p-10">
                                                    {{ $attempt->quiz->pass_mark }}%
                                                </td>
                                                <td class="p-10">
                                                    @if($attempt->score_percentage >= $attempt->quiz->pass_mark)
                                                        <div class="badge bg-green-1 text-white">Passed</div>
                                                    @else
                                                        <div class="badge bg-red-1 text-white">Failed</div>
                                                    @endif
                                                </td>
                                                <td class="p-10">
                                                    <a href="{{ route('student.quizzes.results', ['course' => $attempt->quiz->course->slug, 'quiz' => $attempt->quiz->id, 'attempt' => $attempt->id]) }}" class="button -sm -light-3 text-purple-1">View Results</a>
                                                </td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                        @else
                            <div class="d-flex justify-center items-center py-40">
                                <div class="text-center">
                                    <div class="text-18 lh-1 fw-500 text-dark-1">No quiz attempts yet</div>
                                    <div class="mt-10">Start learning to access quizzes and assessments!</div>
                                </div>
                            </div>
                        @endif
                    </div>
                </div>
            </div>

            {{-- Recommendations Section - Moved to bottom --}}
            <div class="col-xl-12">
                <x-recommended-courses 
                    :recommendations="$recommendations" 
                    :title="'Recommended For You'" 
                    :id="'dashboard-recommendations'" 
                />
            </div>
        </div>
    </div>
</x-dashboard-layout>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Set progress bar width
    const progressBars = document.querySelectorAll('.progress-bar__bar[data-progress]');
    progressBars.forEach(bar => {
        const progress = bar.getAttribute('data-progress');
        bar.style.width = progress + '%';
    });
});
</script>
@endpush 