<x-dashboard-layout title="@lmsterm('Study Material') Trash">
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">@lmsterm('Study Material') Trash</h1>
                <div class="mt-10">Manage and restore deleted @lmsterm('study materials').</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.courses.index') }}" class="button -md -light-3 text-dark-1">
                    <i class="icon-arrow-left mr-10"></i>
                    Back to @lmsterm('Study Materials')
                </a>
            </div>
        </div>

        <!-- Filters Card -->
        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 mb-30">
            <h2 class="text-20 lh-1 fw-500 mb-20">Filters</h2>
            <form action="{{ route('admin.courses.trash') }}" method="GET" class="row x-gap-20 y-gap-20 items-end">
                <div class="col-xl-8 col-lg-7">
                    <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Search Deleted @lmsterm('Study Materials')</label>
                    <input type="text" name="search" class="form-control" placeholder="Enter @lmsterm('study material') title, teacher, category..." 
                           value="{{ request('search') }}">
                </div>
                <div class="col-xl-2 col-lg-2 col-md-6">
                     <button type="submit" class="button -md -purple-1 text-white w-1/1">Filter</button>
                </div>
                <div class="col-xl-2 col-lg-3 col-md-6">
                     <a href="{{ route('admin.courses.trash') }}" class="button -md -light-3 text-dark-1 w-1/1">Reset</a>
                </div>
            </form>
        </div>

        <!-- Trashed Courses Table Card -->
        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
            <div class="d-flex items-center justify-between mb-20">
                 <h2 class="text-20 lh-1 fw-500">Deleted @lmsterm('Study Materials')</h2>
            </div>
           
            @if($courses->count() > 0)
                <div class="overflow-scroll scroll-bar-1">
                    <table class="table w-1/1">
                        <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                            <tr>
                                <th>@lmsterm('STUDY MATERIAL')</th>
                                <th>TEACHER</th>
                                <th>CATEGORY</th>
                                <th>DELETED AT</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody class="text-14">
                            @foreach($courses as $course)
                                <tr class="border-bottom-light">
                                    <td>
                                        <div class="d-flex items-center">
                                            @if($course->thumbnail_url)
                                                <img src="{{ $course->thumbnail_url }}" alt="{{ $course->title }}" class="size-60 rounded-8 object-cover mr-15">
                                            @else
                                                <div class="flex-center size-60 rounded-8 bg-light-2 mr-15">
                                                    <i class="icon-book text-24 text-light-1"></i>
                                                </div>
                                            @endif
                                            <div>
                                                <div class="text-15 lh-12 fw-500 text-dark-1">{{ $course->title }}</div>
                                                <p class="text-13 lh-1 mt-5 text-light-1">{{ Str::limit($course->short_description, 60) }}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-13 lh-1">{{ $course->user->name ?? 'Unknown' }}</td>
                                    <td>
                                        <div class="text-13 lh-1">{{ $course->category->name ?? 'N/A' }}</div>
                                        <div class="text-12 lh-1 mt-5 text-light-1">{{ $course->subject->name ?? 'N/A' }}</div>
                                    </td>
                                    <td>
                                        <div class="text-13 lh-1">{{ $course->deleted_at->format('M d, Y H:i') }}</div>
                                        <div class="text-12 lh-1 mt-5 text-light-1">{{ $course->deleted_at->diffForHumans() }}</div>
                                    </td>
                                    <td>
                                        <div class="d-flex x-gap-10 items-center">
                                            <form action="{{ route('admin.courses.restore', $course->id) }}" method="POST" class="d-inline">
                                                @csrf
                                                @method('PUT')
                                                <button type="submit" class="flex-center bg-green-1 text-white size-35 rounded-8" title="Restore @lmsterm('Study Material')">
                                                    <i class="icon-redo text-16"></i>
                                                </button>
                                            </form>
                                            
                                            <form action="{{ route('admin.courses.force-delete', $course) }}" method="POST" class="d-inline" 
                                                onsubmit="return confirm('Are you sure you want to permanently delete this study material? This action cannot be undone.');">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="flex-center bg-red-1 text-white size-35 rounded-8" title="Delete Permanently">
                                                    <i class="icon-trash text-16"></i>
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                 <!-- Pagination -->
                @if($courses->hasPages())
                    <div class="pt-30">
                        {{ $courses->links('components.pagination') }}
                    </div>
                @endif
            @else
                <div class="text-center py-40">
                    <img src="{{ asset('img/dashboard/empty-state/empty-courses.svg') }}" alt="Empty State" style="max-width: 200px;" class="mb-20">
                    <h4 class="text-18 fw-500 mb-10">No Deleted @lmsterm('Study Materials')</h4>
                    <p class="text-14 text-light-1">When @lmsterm('study materials') are deleted, they will appear here.</p>
                </div>
            @endif
        </div>
    </div>
</x-dashboard-layout> 