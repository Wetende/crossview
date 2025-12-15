<x-dashboard-layout title="Teacher Dashboard - Overview">
    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row pb-50 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Teacher Dashboard</h1>
                <div class="text-15 lh-12 fw-500 text-dark-1 mt-5">Welcome, {{ Auth::user()->name ?? 'Teacher' }}!</div> 
            </div>
        </div>

        <div class="row y-gap-30">
    
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                    <div class="flex justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Total @lmsterm('Study Materials')</p>
<h3 class="text-2xl font-bold text-gray-800 mt-1">{{ $totalCourses }}</h3>
                        </div>
                        <div class="bg-indigo-100 rounded-lg p-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                    </div>
                    @if($totalCourses > 0)
                    <div class="mt-4 flex items-center text-sm">
                        <span class="{{ $enrollmentGrowthPercent >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium flex items-center">
                            @if($enrollmentGrowthPercent >= 0)
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            @else
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            @endif
                            {{ abs($enrollmentGrowthPercent) }}%
                        </span>
                        <span class="text-gray-500 ml-2">from last month</span>
                    </div>
                    @else
                    <div class="mt-4 text-sm text-gray-500">
                        Create your first course now!
                    </div>
                    @endif
                </div>
    
                <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                    <div class="flex justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Total Students</p>
                            <h3 class="text-2xl font-bold text-gray-800 mt-1">{{ $totalStudents }}</h3>
                        </div>
                        <div class="bg-blue-100 rounded-lg p-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                    @if($totalStudents > 0)
                    <div class="mt-4 flex items-center text-sm">
                        <span class="{{ $enrollmentGrowthPercent >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium flex items-center">
                            @if($enrollmentGrowthPercent >= 0)
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            @else
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            @endif
                            {{ abs($enrollmentGrowthPercent) }}%
                        </span>
                        <span class="text-gray-500 ml-2">from last month</span>
                    </div>
                    @else
                    <div class="mt-4 text-sm text-gray-500">
                        No students enrolled yet.
                    </div>
                    @endif
                </div>
    
                <!-- Pending Reviews -->
                <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                    <div class="flex justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Pending Reviews</p>
                            <h3 class="text-2xl font-bold text-gray-800 mt-1">{{ $pendingReviews }}</h3>
                        </div>
                        <div class="bg-yellow-100 rounded-lg p-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                    </div>
                    <div class="mt-4 text-sm">
                        @if($pendingReviews > 0)
                        <a href="{{ route('teacher.reviews.index') }}" class="text-blue-600 hover:underline">View all reviews</a>
                        @else
                        <span class="text-gray-500">No pending reviews</span>
                        @endif
                    </div>
                </div>
    
                <!-- Total Earnings -->
                <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
                    <div class="flex justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Total Earnings</p>
                            <h3 class="text-2xl font-bold text-gray-800 mt-1">${{ number_format($totalEarnings, 2) }}</h3>
                        </div>
                        <div class="bg-green-100 rounded-lg p-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div class="mt-4 text-sm">
                        <a href="{{ route('teacher.payouts.index') }}" class="text-blue-600 hover:underline">View payment history</a>
                    </div>
                </div>
            </div>
    
            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Recent Activity Section -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-lg font-bold text-gray-800">Recent Activity</h2>
                        @if($recentActivities->count() > 0)
                        <a href="{{ route('teacher.analytics.index') }}" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View Analytics</a>
                        @endif
                    </div>
    
                    <div class="space-y-5">
                        @forelse($recentActivities as $activity)
                            <div class="flex items-start {{ !$loop->first ? 'pt-5 border-t border-gray-100' : '' }}">
                                <div class="flex-shrink-0">
                                    <div class="h-10 w-10 rounded-full 
                                        @if($activity['type'] === 'enrollment') bg-green-100
                                        @elseif($activity['type'] === 'review') bg-yellow-100
                                        @elseif($activity['type'] === 'completion') bg-blue-100
                                        @else bg-purple-100 @endif
                                        flex items-center justify-center">
                                        @if($activity['type'] === 'enrollment')
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                            </svg>
                                        @elseif($activity['type'] === 'review')
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                        @elseif($activity['type'] === 'completion')
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        @else
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        @endif
                                    </div>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm font-medium text-gray-900">
                                        @if($activity['type'] === 'enrollment')
                                            New student enrolled in "{{ $activity['data']->course->title }}"
                                        @elseif($activity['type'] === 'review')
                                            New {{ $activity['data']->is_approved ? '' : 'pending ' }}review for "{{ $activity['data']->course->title }}"
                                        @elseif($activity['type'] === 'completion')
                                            Student completed "{{ $activity['data']->course->title }}"
                                        @else
                                            {{ ucfirst($activity['type']) }} activity for your course
                                        @endif
                                    </p>
                                    <p class="text-xs text-gray-500 mt-1">{{ $activity['date']->diffForHumans() }}</p>
                                </div>
                            </div>
                        @empty
                            <div class="text-center py-8">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p class="text-gray-500 mb-2">No recent activity</p>
                                <p class="text-sm text-gray-400">Activity will appear here as students interact with your courses</p>
                            </div>
                        @endforelse
                    </div>
                </div>
    
                <!-- My Courses Section -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-lg font-bold text-gray-800">My @lmsterm('Study Materials')</h2>
                        <a href="{{ route('teacher.courses.index') }}" class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View All @lmsterm('Study Materials')</a>
                    </div>
    
                    <div class="space-y-4">
                        @forelse($popularCourses as $course)
                            <div class="flex space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                                @if($course->thumbnail_path)
                                    <img class="h-16 w-16 rounded-lg object-cover" src="{{ Storage::url($course->thumbnail_path) }}" alt="{{ $course->title }}">
                                @else
                                    <div class="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                @endif
                                <div class="flex-grow">
                                    <h3 class="font-medium text-gray-900 mb-1">{{ $course->title }}</h3>
                                    <div class="flex items-center text-sm text-gray-500">
                                        <div class="flex items-center mr-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            {{ $course->enrollments_count }} {{ Str::plural('Student', $course->enrollments_count) }}
                                        </div>
                                        <div class="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            {{ $course->average_rating ?? '0' }} Rating
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center">
                                    <a href="{{ route('teacher.courses.builder', $course->id) }}" class="p-1 text-gray-500 hover:text-indigo-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        @empty
                            <div class="text-center py-10">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <h3 class="text-xl font-medium text-gray-700 mb-2">No courses yet</h3>
                                <p class="text-gray-500 mb-4">Start creating your first course and share your knowledge with students.</p>
                                <a href="{{ route('teacher.courses.create') }}" class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Create New @lmsterm('Study Material')
                                </a>
                            </div>
                        @endforelse
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout>

