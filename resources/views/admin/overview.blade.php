<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-gray-50 px-4 py-6 sm:px-6">
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8">
            <div>
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">Administration</h1>
                <p class="text-sm sm:text-base text-gray-600 mt-1">
                    Welcome back, {{ auth()->user()->name }}!
                </p>
            </div>
            <div class="w-full sm:w-auto">
                <form action="{{ route('admin.overview') }}" method="GET" class="flex gap-2 items-center">
                    <div class="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
                        <label class="text-xs sm:text-sm text-gray-600">Last</label>
                        <select class="text-sm sm:text-base text-gray-800 font-medium bg-transparent border-0 p-0 focus:ring-0" name="period" onchange="this.form.submit()">
                            <option value="7" {{ request('period') == 7 ? 'selected' : '' }}>7 days</option>
                            <option value="30" {{ request('period') == 30 || !request('period') ? 'selected' : '' }}>30 days</option>
                            <option value="90" {{ request('period') == 90 ? 'selected' : '' }}>90 days</option>
                        </select>
                    </div>
                </form>
            </div>
        </div>

        <!-- Stats Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Students Card -->
            <div class="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center border border-gray-200">
                <div>
                    <p class="text-sm font-medium text-gray-600">Total Students</p>
                    <h3 class="text-2xl font-bold text-gray-800 mt-1">{{ number_format($stats['total_students']) }}</h3>
                </div>
                <div class="p-3 rounded-lg bg-purple-100">
                    <i class="icon-person-2 text-2xl text-purple-600"></i>
                </div>
            </div>

            <!-- Instructors Card -->
            <div class="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center border border-gray-200">
                <div>
                    <p class="text-sm font-medium text-gray-600">Total Instructors</p>
                    <h3 class="text-2xl font-bold text-gray-800 mt-1">{{ number_format($stats['total_instructors']) }}</h3>
                </div>
                <div class="p-3 rounded-lg bg-blue-100">
                    <i class="icon-person-2 text-2xl text-blue-600"></i>
                </div>
            </div>

            <!-- Study Materials Card -->
            <div class="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center border border-gray-200">
                <div>
                    <p class="text-sm font-medium text-gray-600">Total @lmsterm('Study Materials')</p>
                    <h3 class="text-2xl font-bold text-gray-800 mt-1">{{ number_format($stats['total_courses']) }}</h3>
                </div>
                <div class="p-3 rounded-lg bg-green-100">
                    <i class="icon-book text-2xl text-green-600"></i>
                </div>
            </div>

            <!-- Earnings Card -->
            <div class="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center border border-gray-200">
                <div>
                    <p class="text-sm font-medium text-gray-600">Total Earnings</p>
                    <h3 class="text-2xl font-bold text-gray-800 mt-1">${{ number_format($stats['total_earnings'], 2) }}</h3>
                </div>
                <div class="p-3 rounded-lg bg-yellow-100">
                    <i class="icon-dollar text-2xl text-yellow-600"></i>
                </div>
            </div>
        </div>

        <!-- Charts and Activity Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <!-- Sales Chart -->
            <div class="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h5 class="text-lg font-semibold text-gray-800">Sales Statistics</h5>
                    <div class="flex gap-4 mt-2 sm:mt-0">
                        <div class="flex items-center">
                            <span class="w-3 h-3 rounded-full bg-purple-600 mr-2"></span>
                            <span class="text-sm text-gray-600">Enrollments</span>
                        </div>
                        <div class="flex items-center">
                            <span class="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                            <span class="text-sm text-gray-600">Revenue</span>
                        </div>
                    </div>
                </div>
                <div class="h-64 sm:h-80">
                    <canvas id="salesChart" class="w-full h-full"></canvas>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div class="flex justify-between items-center mb-6">
                    <h5 class="text-lg font-semibold text-gray-800">Recent Activity</h5>
                    <a href="{{ route('admin.users.index') }}" class="text-sm font-medium text-purple-600 hover:text-purple-700">
                        View All
                    </a>
                </div>
                <div class="space-y-4">
                    @forelse($recentUsers as $user)
                    <div class="pb-4 border-b border-gray-200">
                        <div class="flex items-start">
                            <div class="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
                                <img src="{{ asset('img/dashboard/actions/1.png') }}" alt="icon" class="w-5 h-5">
                            </div>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-gray-800">
                                    New user registered: {{ $user->name }}
                                </p>
                                <p class="text-xs text-gray-600 mt-1">
                                    {{ $user->created_at->diffForHumans() }}
                                </p>
                            </div>
                        </div>
                    </div>
                    @empty
                    <div class="text-center py-4">
                        <p class="text-sm text-gray-600">No recent users.</p>
                    </div>
                    @endforelse

                    @foreach($recentCourses as $course)
                    <div class="pb-4 border-b border-gray-200">
                        <div class="flex items-start">
                            <div class="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                                <img src="{{ asset('img/dashboard/actions/2.png') }}" alt="icon" class="w-5 h-5">
                            </div>
                            <div class="ml-3">
                                <p class="text-sm font-medium text-gray-800">
                                    @lmsterm('Study Material') "{{ Str::limit($course->title, 30) }}" published
                                </p>
                                <p class="text-xs text-gray-600 mt-1">
                                    {{ $course->created_at->diffForHumans() }}
                                </p>
                            </div>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
        </div>

        <!-- Bottom Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Recent Enrollments -->
            <div class="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div class="flex justify-between items-center mb-6">
                    <h5 class="text-lg font-semibold text-gray-800">Recent Enrollments</h5>
                    <a href="{{ route('admin.courses.index') }}" class="text-sm font-medium text-purple-600 hover:text-purple-700">
                        View All @lmsterm('Study Materials')
                    </a>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-100">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Student</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">@lmsterm('Study Material')</th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            @forelse($recentEnrollments as $enrollment)
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        @if($enrollment->user->profile_picture_path)
                                            <img src="{{ asset('storage/' . $enrollment->user->profile_picture_path) }}" alt="{{ $enrollment->user->name }}" class="h-10 w-10 rounded-full object-cover">
                                        @else
                                            <div class="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-medium">
                                                {{ substr($enrollment->user->name, 0, 2) }}
                                            </div>
                                        @endif
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-800">{{ $enrollment->user->name }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-800">{{ $enrollment->course->title }}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {{ $enrollment->created_at->format('M d, Y') }}
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="3" class="px-6 py-4 text-center text-sm text-gray-600">
                                    No recent enrollments
                                </td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Study Material Status -->
            <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div class="flex justify-between items-center mb-6">
                    <h5 class="text-lg font-semibold text-gray-800">@lmsterm('Study Material') Status Overview</h5>
                </div>
                <div class="space-y-6">
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700">Published @lmsterm('Study Materials')</span>
                            <span class="text-sm font-semibold text-gray-800">{{ $courseStats['published'] }}</span>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700">Draft @lmsterm('Study Materials')</span>
                            <span class="text-sm font-semibold text-gray-800">{{ $courseStats['draft'] }}</span>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700">Featured @lmsterm('Study Materials')</span>
                            <span class="text-sm font-semibold text-gray-800">{{ $courseStats['featured'] }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        var chartLabels = @json($chartData['labels']);
        var chartEnrollments = @json($chartData['enrollments']);
        var chartRevenue = @json($chartData['revenue']);
        document.addEventListener('DOMContentLoaded', function() {
            var salesChartElem = document.getElementById('salesChart');
            if (salesChartElem) {
                var salesCtx = salesChartElem.getContext('2d');
                var salesChart = new Chart(salesCtx, {
                    type: 'line',
                    data: {
                        labels: chartLabels,
                        datasets: [
                            {
                                label: 'Enrollments',
                                data: chartEnrollments,
                                borderColor: '#7c3aed',
                                backgroundColor: 'rgba(124, 58, 237, 0.05)',
                                tension: 0.3,
                                fill: true,
                                borderWidth: 2,
                                pointBackgroundColor: '#7c3aed',
                                pointRadius: 3,
                                pointHoverRadius: 5
                            },
                            {
                                label: 'Revenue ($)',
                                data: chartRevenue,
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                tension: 0.3,
                                fill: true,
                                borderWidth: 2,
                                pointBackgroundColor: '#10b981',
                                pointRadius: 3,
                                pointHoverRadius: 5
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    display: false,
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#6b7280'
                                }
                            },
                            y: {
                                grid: {
                                    color: '#e5e7eb',
                                    drawBorder: false
                                },
                                ticks: {
                                    color: '#6b7280'
                                },
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        });
    </script>
    @endpush
</x-dashboard-layout>