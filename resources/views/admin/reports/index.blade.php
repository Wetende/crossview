<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4 py-30 px-30">
        <div class="row y-gap-20 justify-between items-end pb-20 lg:pb-40 md:pb-32">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Reports & Analytics</h1>
                <div class="text-15 text-light-1">View key metrics and insights for the platform.</div>
            </div>
            <div class="col-auto">
                {{-- Date Range Filter --}}
                <form class="row x-gap-10 y-gap-10 items-center" method="GET">
                    <div class="col-auto">
                        <input type="date" name="start_date" class="form-control bg-white" value="{{ $startDate }}" placeholder="Start Date">
                    </div>
                    <div class="col-auto">
                        <span class="text-light-1">-</span>
                    </div>
                    <div class="col-auto">
                        <input type="date" name="end_date" class="form-control bg-white" value="{{ $endDate }}" placeholder="End Date">
                    </div>
                    <div class="col-auto">
                        <button type="submit" class="button -sm -purple-1 text-white">Apply</button>
                    </div>
                </form>
            </div>
        </div>

        {{-- Section 1: Sales & Revenue Overview --}}
        <div class="row y-gap-30 pt-30">
            <div class="col-12">
                 <h5 class="text-16 lh-1 fw-500 mb-20">Sales & Revenue</h5>
            </div>
            <div class="col-xl-3 col-md-6">
                <div class="d-flex justify-between items-center py-35 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div>
                        <div class="lh-1 fw-500">Courses Sold</div>
                        <div class="text-24 lh-17 fw-700 mt-5">{{ number_format($coursesSold) }}</div>
                    </div>
                    <i class="icon-cart text-32 text-accent-1"></i>
                </div>
            </div>
             <div class="col-xl-3 col-md-6">
                <div class="d-flex justify-between items-center py-35 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div>
                        <div class="lh-1 fw-500">New Registrations</div>
                        <div class="text-24 lh-17 fw-700 mt-5">{{ number_format($newRegistrations) }}</div>
                    </div>
                    <i class="icon-user-plus text-32 text-purple-1"></i>
                </div>
            </div>
            <div class="col-xl-6 col-lg-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center mb-20">
                        <h5 class="text-16 lh-1 fw-500">Monthly Sales Trend</h5>
                    </div>
                    <img class="w-1/1" src="{{ asset('img/dashboard/charts/chart-1.svg') }}" alt="Monthly Sales Chart">
                </div>
            </div>
        </div>

        {{-- Section 2: User Engagement --}}
        <div class="row y-gap-30 pt-60">
             <div class="col-12">
                 <h5 class="text-16 lh-1 fw-500 mb-20">User Engagement</h5>
            </div>
            <div class="col-xl-3 col-md-6">
                <div class="d-flex justify-between items-center py-35 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div>
                        <div class="lh-1 fw-500">New Registrations (30 days)</div>
                        <div class="text-24 lh-17 fw-700 mt-5">{{ number_format($newRegistrations) }}</div>
                    </div>
                    <i class="icon-user-plus text-32 text-blue-1"></i>
                </div>
            </div>
             <div class="col-xl-3 col-md-6">
                <div class="d-flex justify-between items-center py-35 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div>
                        <div class="lh-1 fw-500">Active Users (24 hours)</div>
                        <div class="text-24 lh-17 fw-700 mt-5">{{ number_format($totalActiveUsers) }}</div>
                    </div>
                    <i class="icon-users text-32 text-green-1"></i>
                </div>
            </div>
             <div class="col-xl-6 col-lg-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center mb-20">
                        <h5 class="text-16 lh-1 fw-500">User Activity Trend</h5>
                    </div>
                    {{-- Placeholder for user activity chart --}}
                    <img class="w-1/1" src="{{ asset('img/dashboard/charts/chart-2.svg') }}" alt="User Activity Chart">
                </div>
            </div>
        </div>

        {{-- Section 3: Course Statistics --}}
        <div class="row y-gap-30 pt-60">
            <div class="col-12">
                 <h5 class="text-16 lh-1 fw-500 mb-20">Course Statistics</h5>
            </div>
            <div class="col-xl-8 col-lg-7">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <h5 class="text-16 lh-1 fw-500 mb-20">Top Enrolled Courses</h5>
                    <table class="table-2 -border-bottom col-12">
                        <thead class="bg-light-7 -dark-bg-dark-2">
                            <tr>
                                <th>Course Title</th>
                                <th>Instructor</th>
                                <th>Enrollments</th>
                                <th>Completion Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($topCourses as $course)
                            <tr>
                                <td>{{ $course->title }}</td>
                                <td>{{ $course->user->name ?? 'Unknown' }}</td>
                                <td>{{ $course->purchases_count }}</td>
                                <td>{{ $course->completion_rate ?? 'N/A' }}</td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="4" class="text-center">No course data available</td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="col-xl-4 col-lg-5">
                 <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <h5 class="text-16 lh-1 fw-500 mb-20">Course Categories</h5>
                    <table class="table w-1/1">
                        <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                            <tr>
                                <th>Category</th>
                                <th>Courses</th>
                            </tr>
                        </thead>
                        <tbody class="text-14">
                            @forelse($courseCategories as $category)
                            <tr>
                                <td>{{ $category->name }}</td>
                                <td>{{ $category->count }}</td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="2" class="text-center">No categories found</td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 