<x-dashboard-layout title="Subject Categories">
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>
    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="row y-gap-20 justify-between items-end pb-30">
        <div class="col-auto">
            <h1 class="text-30 lh-12 fw-700">Subject Categories</h1>
            <div class="mt-10">Manage subject categories for the Kenya CBC curriculum</div>
        </div>
        <div class="col-auto">
            <a href="{{ route('admin.subject-categories.create') }}" class="button -md -purple-1 text-white">
                <i class="icon-plus mr-10"></i>
                Create Category
            </a>
        </div>
    </div>

    @if(session('success'))
        <div class="alert alert-success mb-30">
            {{ session('success') }}
        </div>
    @endif

    @if(session('error'))
        <div class="alert alert-error mb-30">
            {{ session('error') }}
        </div>
    @endif

    <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
        <div class="tabs -active-purple-2 js-tabs">
            <div class="tabs__controls d-flex x-gap-30 y-gap-20 pb-20 border-bottom-light js-tabs-controls">
                <button class="tabs__button text-light-1 js-tabs-button is-active" data-tab-target="junior-secondary">
                    Junior Secondary (Grades 7–9)
                </button>
                <button class="tabs__button text-light-1 js-tabs-button" data-tab-target="senior-school">
                    Senior School (Grades 10–12)
                </button>
            </div>

            <div class="tabs__content pt-30 js-tabs-content">
                <div class="tabs__pane is-active" data-tab-content="junior-secondary">
                    <div class="overflow-hidden">
                        <table class="table w-1/1">
                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                <tr>
                                    <th class="text-left p-10">Name</th>
                                    <th class="text-left p-10">Description</th>
                                    <th class="text-center p-10">Position</th>
                                    <th class="text-center p-10">Status</th>
                                    <th class="text-center p-10">Subjects</th>
                                    <th class="text-right p-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="text-14">
                                @forelse($categories->where('level', 'Junior Secondary') as $category)
                                    <tr class="border-bottom-light">
                                        <td class="p-10">{{ $category->name }}</td>
                                        <td class="p-10">{{ $category->description }}</td>
                                        <td class="text-center p-10">{{ $category->position }}</td>
                                        <td class="text-center p-10">
                                            @if($category->is_active)
                                                <span class="badge bg-green-1 text-white">Active</span>
                                            @else
                                                <span class="badge bg-red-1 text-white">Inactive</span>
                                            @endif
                                        </td>
                                        <td class="text-center p-10">
                                            {{ $category->subjects->count() }}
                                        </td>
                                        <td class="text-right p-10">
                                            <div class="d-flex items-center justify-end">
                                                <a href="{{ route('admin.subject-categories.show', $category) }}" class="btn-icon mr-10" title="View">
                                                    <i class="icon-eye text-16 text-blue-1"></i>
                                                </a>
                                                <a href="{{ route('admin.subject-categories.edit', $category) }}" class="btn-icon mr-10" title="Edit">
                                                    <i class="icon-edit text-16 text-purple-1"></i>
                                                </a>
                                                <form action="{{ route('admin.subject-categories.destroy', $category) }}" method="POST" class="d-inline" onsubmit="return confirm('Are you sure you want to delete this category?');">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit" class="btn-icon" title="Delete">
                                                        <i class="icon-trash text-16 text-red-1"></i>
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="6" class="text-center py-20">No Junior Secondary categories found.</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="tabs__pane" data-tab-content="senior-school">
                    <div class="overflow-hidden">
                        <table class="table w-1/1">
                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                <tr>
                                    <th class="text-left p-10">Name</th>
                                    <th class="text-left p-10">Description</th>
                                    <th class="text-center p-10">Position</th>
                                    <th class="text-center p-10">Status</th>
                                    <th class="text-center p-10">Subjects</th>
                                    <th class="text-right p-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="text-14">
                                @forelse($categories->where('level', 'Senior School') as $category)
                                    <tr class="border-bottom-light">
                                        <td class="p-10">{{ $category->name }}</td>
                                        <td class="p-10">{{ $category->description }}</td>
                                        <td class="text-center p-10">{{ $category->position }}</td>
                                        <td class="text-center p-10">
                                            @if($category->is_active)
                                                <span class="badge bg-green-1 text-white">Active</span>
                                            @else
                                                <span class="badge bg-red-1 text-white">Inactive</span>
                                            @endif
                                        </td>
                                        <td class="text-center p-10">
                                            {{ $category->subjects->count() }}
                                        </td>
                                        <td class="text-right p-10">
                                            <div class="d-flex items-center justify-end">
                                                <a href="{{ route('admin.subject-categories.show', $category) }}" class="btn-icon mr-10" title="View">
                                                    <i class="icon-eye text-16 text-blue-1"></i>
                                                </a>
                                                <a href="{{ route('admin.subject-categories.edit', $category) }}" class="btn-icon mr-10" title="Edit">
                                                    <i class="icon-edit text-16 text-purple-1"></i>
                                                </a>
                                                <form action="{{ route('admin.subject-categories.destroy', $category) }}" method="POST" class="d-inline" onsubmit="return confirm('Are you sure you want to delete this category?');">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit" class="btn-icon" title="Delete">
                                                        <i class="icon-trash text-16 text-red-1"></i>
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="6" class="text-center py-20">No Senior School categories found.</td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 