<x-dashboard-layout title="{{ $course->title }} - Analytics">
    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>
<x-slot name="header">
    @include('layouts.partials.teacher.header')
</x-slot>

<div class="dashboard__content bg-light-4">
    <div class="row y-gap-20 justify-between items-end pb-30">
        <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">@lmsterm('Course') Analytics</h1>
            <div class="mt-10">{{ $course->title }}</div>
        </div>
        <div class="col-auto">
                <a href="{{ route('teacher.analytics.index') }}" class="button -md -light-3 text-dark-1">
                    <i class="icon-arrow-left mr-10"></i>
                    Back to Analytics
            </a>
        </div>
    </div>

    <!-- Overview Stats -->
    <div class="row y-gap-30">
            <!-- Total Enrollments Card -->
        <div class="col-xl-3 col-md-6">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Total Enrollments</h2>
                </div>
                <div class="py-30 px-30 text-center">
                    <div class="text-40 fw-700 text-dark-1">{{ number_format($enrollmentCount) }}</div>
                        <div class="mt-10">
                            <span class="badge bg-green-1 text-white">{{ number_format($recentEnrollments) }} new in 30 days</span>
                        </div>
                    </div>
            </div>
        </div>
        
        <!-- Completion Rate Card -->
        <div class="col-xl-3 col-md-6">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                    <h2 class="text-17 lh-1 fw-500">Completion Rate</h2>
                </div>
                <div class="py-30 px-30 text-center">
                    <div class="text-40 fw-700 text-dark-1">{{ $completionRate }}%</div>
                    <div class="mt-10">
                        <div class="progress-bar">
                            <div class="progress-bar__bg bg-light-3"></div>
                            <div class="progress-bar__bar bg-purple-1" style="width: {{ $completionRate }}%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Revenue Card -->
        <div class="col-xl-3 col-md-6">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Revenue Generated</h2>
                </div>
                <div class="py-30 px-30 text-center">
                        <div class="text-40 fw-700 text-dark-1">${{ number_format($revenue, 2) }}</div>
                        <div class="mt-10 text-light-1">From direct purchases</div>
                    </div>
            </div>
        </div>
        
            <!-- Average Rating Card -->
        <div class="col-xl-3 col-md-6">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Average Rating</h2>
                </div>
                <div class="py-30 px-30 text-center">
                        <div class="text-40 fw-700 text-dark-1">
                            {{ number_format($averageRating, 1) }}
                            <span class="text-24 text-orange-1"><i class="icon-star"></i></span>
                        </div>
                        <div class="mt-10 text-light-1">From {{ $reviewCount }} reviews</div>
                </div>
            </div>
        </div>
    </div>
    
        <!-- Enrollment Trends & Student Progress -->
        <div class="row y-gap-30 pt-30">
    <!-- Enrollment Trends Chart -->
            <div class="col-lg-8">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                    <h2 class="text-17 lh-1 fw-500">Enrollment Trends</h2>
                </div>
                <div class="py-30 px-30">
                    <canvas id="enrollmentTrendsChart" width="100%" height="300"></canvas>
                </div>
            </div>
        </div>
            
            <!-- Student Progress -->
            <div class="col-lg-4">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Student Progress</h2>
                    </div>
                    <div class="py-30 px-30">
                        <canvas id="progressPieChart" width="100%" height="270"></canvas>
                    </div>
                </div>
            </div>
    </div>
    
        <!-- Popular Lessons Chart -->
    <div class="row y-gap-30 pt-30">
        <div class="col-12">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Most Viewed Lessons</h2>
                </div>
                <div class="py-30 px-30">
                        @if(count($popularLessons) > 0)
                            <div class="table-responsive">
                                <table class="table w-1/1">
                                    <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                        <tr>
                                            <th>Lesson Title</th>
                                            <th>Section</th>
                                            <th>Type</th>
                                            <th class="text-right">Views</th>
                                            <th class="text-right">Completion %</th>
                                        </tr>
                                    </thead>
                                    <tbody class="text-14">
                                        @foreach($popularLessons as $lesson)
                                            <tr class="border-bottom-light">
                                                <td>{{ $lesson->title }}</td>
                                                <td>{{ $lesson->section->title }}</td>
                                                <td>{{ ucfirst($lesson->type) }}</td>
                                                <td class="text-right">{{ number_format($lesson->views) }}</td>
                                                <td class="text-right">{{ number_format($lesson->completion_rate) }}%</td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                        </div>
                    @else
                        <div class="text-center py-30">
                                <p>No lesson data available yet.</p>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Enrollment Trends Chart
        const trendsCtx = document.getElementById('enrollmentTrendsChart').getContext('2d');
        const monthsData = @json(array_column($enrollmentTrends, 'month'));
        const countsData = @json(array_column($enrollmentTrends, 'count'));
        
        new Chart(trendsCtx, {
            type: 'bar',
            data: {
                labels: monthsData,
                datasets: [{
                    label: 'New Enrollments',
                    data: countsData,
                    backgroundColor: '#6440FB',
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
        
            // Progress Pie Chart
            const progressCtx = document.getElementById('progressPieChart').getContext('2d');
            const progressData = [
                {{ $notStartedCount }},  // Not Started
                {{ $inProgressCount }},  // In Progress
                {{ $completedCount }}    // Completed
            ];
            
            new Chart(progressCtx, {
                type: 'doughnut',
            data: {
                    labels: ['Not Started', 'In Progress', 'Completed'],
                datasets: [{
                        data: progressData,
                        backgroundColor: ['#E3E2E8', '#4EAFFF', '#00CD74'],
                        borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    },
                    cutout: '70%'
                }
            });
    });
</script>
@endpush
</x-dashboard-layout> 