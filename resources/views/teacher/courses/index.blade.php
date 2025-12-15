<x-dashboard-layout title="Teacher Dashboard - My @lmsterm('Study Materials')">
    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row pb-50 mb-10 d-flex justify-between items-center">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">My @lmsterm('Study Materials')</h1>
                <div class="text-15 lh-12 fw-500 text-dark-1 mt-5">Manage your @lmsterm('study materials'), view student enrollments, and access @lmsterm('study material') editing tools.</div>
            </div>
       
        </div>

        {{-- Filters --}}
        <div class="bg-white rounded-xl shadow-sm p-5 mb-8">
            <form action="{{ route('teacher.courses.index') }}" method="GET">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <select name="status"
                            class="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                            <option value="">All Status</option>
                            <option value="published" {{ request('status') == 'published' ? 'selected' : '' }}>Published
                            </option>
                            <option value="draft" {{ request('status') == 'draft' ? 'selected' : '' }}>Draft</option>
                        </select>
                    </div>
                    <div>
                        <select name="category"
                            class="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                            <option value="">All Categories</option>
                            @foreach ($categories as $category)
                                <option value="{{ $category->id }}"
                                    {{ request('category') == $category->id ? 'selected' : '' }}>
                                    {{ $category->name }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    <div class="md:col-span-1">
                        <input type="text" name="search" placeholder="Search @lmsterm('study materials')..."
                            value="{{ request('search') }}"
                            class="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                    </div>
                    <div>
                        <button type="submit"
                            class="w-full md:w-auto px-8 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition duration-200 shadow-sm">
                            <div class="flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path fill-rule="evenodd"
                                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                        clip-rule="evenodd" />
                                </svg>
                                Filter
                            </div>
                        </button>
                    </div>
                </div>
            </form>
        </div>

        @if ($courses->isEmpty())
            <div class="col-span-full text-center py-16 bg-white rounded-xl">
                <img src="{{ asset('img/empty-state-courses.svg') }}" alt="No courses found" class="mx-auto mb-6 h-48">
                <h3 class="text-xl font-semibold mb-2">No @lmsterm('Study Materials') Yet</h3>
                <p class="text-gray-600 mb-6">Start creating your first @lmsterm('study material') to begin teaching</p>
                <a href="{{ route('teacher.courses.create') }}" class="button -md -purple-1 text-white">
                    Create @lmsterm('Study Material')
                </a>
            </div>
        @else
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @foreach ($courses as $course)
                    <div
                        class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition duration-200 h-full">
                        <div class="relative">
                            @if ($course->thumbnail_path)
                                <img class="h-48 w-full object-cover"src="{{ Storage::url($course->thumbnail_path) }}"
                                    alt="{{ $course->title }}">
                            @else
                                <div
                                    class="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-white" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            @endif
                            <div class="absolute top-4 right-4">
                                @if ($course->is_published)
                                    <span
                                        class="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">Published</span>
                                @else
                                    <span
                                        class="px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">Draft</span>
                                @endif
                            </div>
                        </div>

                        <div class="p-5">
                            <div class="flex justify-between items-start">
                                <a href="{{ route('teacher.courses.builder', $course) }}" class="block">
                                    <h2
                                        class="text-lg font-semibold text-gray-800 line-clamp-2 hover:text-blue-600 transition">
                                        {{ $course->title }}</h2>
                                </a>

                                <div class="relative" x-data="{ open: false }">
                                    <button @click="open = !open"
                                        class="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                            fill="currentColor">
                                            <path
                                                d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                        </svg>
                                    </button>

                                    <div x-show="open" @click.away="open = false"
                                        class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                        <div class="py-1">
                                            <a href="{{ route('teacher.courses.edit', $course) }}"
                                                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2"
                                                    viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                        d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                                Edit
                                            </a>
                                            <a href="{{ route('teacher.courses.builder', $course) }}"
                                                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2"
                                                    viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                        d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                                                </svg>
                                                Builder
                                            </a>
                                            <a href="{{ route('teacher.courses.settings', $course) }}"
                                                class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2"
                                                    viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd"
                                                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                                                        clip-rule="evenodd" />
                                                </svg>
                                                Settings
                                            </a>
                                            <form action="{{ route('teacher.courses.destroy', $course) }}"
                                                method="POST"
                                                onsubmit="return confirm('Are you sure you want to delete this study material?');">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit"
                                                    class="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2"
                                                        viewBox="0 0 20 20" fill="currentColor">
                                                        <path fill-rule="evenodd"
                                                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                            clip-rule="evenodd" />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-4 flex flex-wrap gap-y-2">
                                <div class="w-full sm:w-1/2 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <span class="text-sm text-gray-600">{{ $course->enrollment_count ?? 0 }}
                                        Students</span>
                                </div>

                                <div class="w-full sm:w-1/2 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span class="text-sm text-gray-600">
                                        @if ($course->price > 0)
                                            ${{ number_format($course->price, 2) }}
                                        @else
                                            Free
                                        @endif
                                    </span>
                                </div>

                                @if ($course->category)
                                    <div class="w-full sm:w-1/2 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2"
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        <span class="text-sm text-gray-600">{{ $course->category->name }}</span>
                                    </div>
                                @endif

                                <div class="w-full sm:w-1/2 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <span class="text-sm text-gray-600">{{ $course->sections->count() }}
                                        Sections</span>
                                </div>

                                <div class="w-full flex items-center mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 mr-2"
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span class="text-sm text-gray-600">Updated
                                        {{ $course->updated_at->format('M d, Y') }}</span>
                                </div>
                            </div>

                            <div class="mt-5">
                                <a href="{{ route('teacher.courses.builder', $course) }}"
                                    class="block w-full text-center py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition duration-200">
                                    Manage @lmsterm('Study Material')
                                </a>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>

            {{-- Pagination --}}
            @if ($courses->hasPages())
                <div class="mt-8 flex justify-center">
                    <nav class="flex items-center space-x-2">
                        @if ($courses->onFirstPage())
                            <span class="px-3 py-2 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path fill-rule="evenodd"
                                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                        clip-rule="evenodd" />
                                </svg>
                            </span>
                        @else
                            <a href="{{ $courses->previousPageUrl() }}"
                                class="px-3 py-2 rounded-md bg-white hover:bg-gray-100 text-gray-700 shadow-sm transition">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path fill-rule="evenodd"
                                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                        clip-rule="evenodd" />
                                </svg>
                            </a>
                        @endif

                        <div class="flex space-x-1">
                            @for ($i = 1; $i <= $courses->lastPage(); $i++)
                                <a href="{{ $courses->url($i) }}"
                                    class="px-3 py-2 rounded-md {{ $i == $courses->currentPage() ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700' }} shadow-sm transition">
                                    {{ $i }}
                                </a>
                            @endfor
                        </div>

                        @if ($courses->hasMorePages())
                            <a href="{{ $courses->nextPageUrl() }}"
                                class="px-3 py-2 rounded-md bg-white hover:bg-gray-100 text-gray-700 shadow-sm transition">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path fill-rule="evenodd"
                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                        clip-rule="evenodd" />
                                </svg>
                            </a>
                        @else
                            <span class="px-3 py-2 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path fill-rule="evenodd"
                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                        clip-rule="evenodd" />
                                </svg>
                            </span>
                        @endif
                    </nav>
                </div>
            @endif
        @endif
    </div>
</x-dashboard-layout>
