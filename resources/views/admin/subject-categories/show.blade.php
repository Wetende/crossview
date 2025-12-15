<x-dashboard-layout title="{{ $category->name }} - Subject Category">
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>
    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="row y-gap-20 justify-between items-end pb-30">
        <div class="col-auto">
            <h1 class="text-30 lh-12 fw-700">{{ $category->name }}</h1>
            <div class="mt-10">{{ $category->level }} subject category</div>
        </div>
        <div class="col-auto">
            <div class="d-flex x-gap-10">
                <a href="{{ route('admin.subject-categories.edit', $category) }}" class="button -md -purple-1 text-white">
                    <i class="icon-edit mr-10"></i>
                    Edit Category
                </a>
                <a href="{{ route('admin.subject-categories.index') }}" class="button -md -light-3 text-dark-1">
                    <i class="icon-arrow-left mr-10"></i>
                    Back to Categories
                </a>
            </div>
        </div>
    </div>

    <div class="row y-gap-30">
        <!-- Category Details -->
        <div class="col-lg-4">
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <h2 class="text-20 lh-1 fw-500 mb-20">Category Details</h2>
                
                <div class="y-gap-15">
                    <div class="d-flex justify-between border-bottom-light pb-15">
                        <div class="text-dark-1 fw-500">Level</div>
                        <div>{{ $category->level }}</div>
                    </div>
                    
                    <div class="d-flex justify-between border-bottom-light py-15">
                        <div class="text-dark-1 fw-500">Position</div>
                        <div>{{ $category->position }}</div>
                    </div>
                    
                    <div class="d-flex justify-between border-bottom-light py-15">
                        <div class="text-dark-1 fw-500">Status</div>
                        <div>
                            @if($category->is_active)
                                <span class="badge bg-green-1 text-white">Active</span>
                            @else
                                <span class="badge bg-red-1 text-white">Inactive</span>
                            @endif
                        </div>
                    </div>
                    
                    <div class="d-flex justify-between border-bottom-light py-15">
                        <div class="text-dark-1 fw-500">Created</div>
                        <div>{{ $category->created_at->format('M d, Y') }}</div>
                    </div>
                    
                    <div class="d-flex justify-between py-15">
                        <div class="text-dark-1 fw-500">Last Updated</div>
                        <div>{{ $category->updated_at->format('M d, Y') }}</div>
                    </div>
                </div>

                @if($category->description)
                    <div class="mt-30">
                        <h3 class="text-18 lh-1 fw-500 mb-15">Description</h3>
                        <p class="text-15">{{ $category->description }}</p>
                    </div>
                @endif
            </div>
        </div>

        <!-- Subjects -->
        <div class="col-lg-8">
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <div class="d-flex justify-between items-center mb-20">
                    <h2 class="text-20 lh-1 fw-500">Subjects in this Category</h2>
                    <div class="text-14 lh-1">Total: {{ $subjects->count() }}</div>
                </div>

                @if($subjects->count() > 0)
                    <div class="overflow-hidden">
                        <table class="table w-1/1">
                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                <tr>
                                    <th class="text-left p-10">Name</th>
                                    <th class="text-center p-10">Status</th>
                                    <th class="text-center p-10">Courses</th>
                                    <th class="text-right p-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="text-14">
                                @foreach($subjects as $subject)
                                    <tr class="border-bottom-light">
                                        <td class="p-10">
                                            <div class="d-flex items-center">
                                                @if($subject->icon_path)
                                                    <div class="size-40 mr-10 rounded-8 d-flex justify-center items-center bg-light-4">
                                                        <img src="{{ asset($subject->icon_path) }}" alt="{{ $subject->name }}" class="size-20">
                                                    </div>
                                                @endif
                                                <div>
                                                    <div class="text-dark-1 fw-500">{{ $subject->name }}</div>
                                                    <div class="text-13 lh-1 mt-5 text-light-1">{{ Str::limit($subject->description, 50) }}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-center p-10">
                                            @if($subject->is_active)
                                                <span class="badge bg-green-1 text-white">Active</span>
                                            @else
                                                <span class="badge bg-red-1 text-white">Inactive</span>
                                            @endif
                                        </td>
                                        <td class="text-center p-10">{{ $subject->courses->count() }}</td>
                                        <td class="text-right p-10">
                                            <div class="d-flex items-center justify-end">
                                                <a href="#" class="btn-icon" title="Edit Subject">
                                                    <i class="icon-edit text-16 text-purple-1"></i>
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @else
                    <div class="text-center py-40">
                        <div class="text-18 fw-500 mb-10">No subjects found in this category</div>
                        <p class="text-15 mb-20">There are no subjects assigned to this category yet.</p>
                    </div>
                @endif
            </div>
        </div>
    </div>
</x-dashboard-layout> 