<x-dashboard-layout title="Teacher Analytics Dashboard">
    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>
    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Analytics Dashboard</h1>
                <div class="mt-10">Get insights into your @lmsterm('course') performance and student engagement</div>
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
                        <div class="text-40 fw-700 text-dark-1">{{ number_format($totalEnrollments) }}</div>
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
            
            <!-- Total Revenue Card -->
            <div class="col-xl-3 col-md-6">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Total Revenue</h2>
                    </div>
                    <div class="py-30 px-30 text-center">
                        <div class="text-40 fw-700 text-dark-1">${{ number_format($directRevenue, 2) }}</div>
                        <div class="mt-10 text-light-1">Direct @lmsterm('course') purchases</div>
                    </div>
                </div>
            </div>
            
            <!-- Active Enrollments Card -->
            <div class="col-xl-3 col-md-6">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Active Enrollments</h2>
                    </div>
                    <div class="py-30 px-30 text-center">
                        <div class="text-40 fw-700 text-dark-1">{{ number_format($activeEnrollments) }}</div>
                        <div class="mt-10 text-light-1">Students currently learning</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Enrollment Trends & Popular Courses -->
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
            
            <!-- Popular Courses List -->
            <div class="col-lg-4">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Popular @lmsterm('Courses')</h2>
                    </div>
                    <div class="py-30 px-30">
                        @if(count($popularCourses) > 0)
                            <ul class="list-group">
                                @foreach($popularCourses as $course)
                                    <li class="list-group-item border-light">
                                        <div class="d-flex justify-between items-center">
                                            <div>
                                                <div class="text-14 fw-500">{{ $course->title }}</div>
                                                <div class="text-14 text-light-1 mt-5">{{ $course->enrollments_count }} enrollments</div>
                                            </div>
                                            <a href="{{ route('teacher.analytics.course', $course) }}" class="button -sm -purple-1 text-white">
                                                Details
                                            </a>
                                        </div>
                                    </li>
                                @endforeach
                            </ul>
                        @else
                            <div class="text-center py-30">
                                <p>No @lmsterm('course') data available yet.</p>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Active Students Chart -->
        <div class="row y-gap-30 pt-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Active Students by Month</h2>
                    </div>
                    <div class="py-30 px-30">
                        <canvas id="activeStudentsChart" width="100%" height="300"></canvas>
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
            
            // Active Students Chart
            const activeCtx = document.getElementById('activeStudentsChart').getContext('2d');
            const activeMonths = @json(array_column($activeStudentsByMonth, 'month'));
            const activeCounts = @json(array_column($activeStudentsByMonth, 'count'));
            
            new Chart(activeCtx, {
                type: 'line',
                data: {
                    labels: activeMonths,
                    datasets: [{
                        label: 'Active Students',
                        data: activeCounts,
                        borderColor: '#4EAFFF',
                        backgroundColor: 'rgba(78, 175, 255, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
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
        });
    </script>
    @endpush
</x-dashboard-layout> 