<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Performance Levels</h1>
                <div class="mt-10">Manage performance level thresholds and indicators</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.performance.levels.create') }}" class="button -md -purple-1 text-white">
                    <i class="icon-plus mr-10"></i>
                    Add New Level
                </a>
            </div>
        </div>

        <!-- Levels List Card -->
        <div class="row y-gap-30">
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center">
                        <h2 class="text-20 lh-1 fw-500">All Performance Levels</h2>
                    </div>
                    
                    @if($levels->count() > 0)
                    <div class="table-responsive mt-30">
                        <table class="table w-1/1">
                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Score Range</th>
                                    <th>Color</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody class="text-14">
                                @foreach($levels as $level)
                                <tr class="border-bottom-light">
                                    <td>{{ $level->id }}</td>
                                    <td>{{ $level->name }}</td>
                                    <td>{{ $level->min_score }} - {{ $level->max_score }}</td>
                                    <td>
                                        <div class="d-flex items-center">
                                            <div class="size-20 rounded-4 mr-10" style="background-color: {{ $level->color_code }}"></div>
                                            <span>{{ $level->color_code }}</span>
                                        </div>
                                    </td>
                                    <td>{{ Str::limit($level->description, 50) }}</td>
                                    <td>
                                        <div class="d-flex items-center">
                                            <a href="{{ route('admin.performance.levels.edit', $level) }}" class="flex-center bg-light-2 -dark-bg-dark-3 size-35 rounded-8 mr-10">
                                                <i class="icon-edit text-16 text-purple-1"></i>
                                            </a>
                                            <form action="{{ route('admin.performance.levels.destroy', $level) }}" method="POST" class="d-inline">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="flex-center bg-light-2 -dark-bg-dark-3 size-35 rounded-8" onclick="return confirm('Are you sure you want to delete this level?')">
                                                    <i class="icon-trash text-16 text-red-1"></i>
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="mt-30">
                        {{ $levels->links() }}
                    </div>
                    @else
                    <div class="text-center py-40">
                        <img src="{{ asset('img/dashboard/empty-state/levels.svg') }}" alt="No Levels" style="max-width: 200px;" class="mb-20">
                        <h4 class="text-18 fw-500 mb-10">No Performance Levels Found</h4>
                        <p class="text-14 mb-20">Create performance levels to categorize student performance.</p>
                        <a href="{{ route('admin.performance.levels.create') }}" class="button -md -purple-1 text-white">Add First Level</a>
                    </div>
                    @endif
                </div>
            </div>
        </div>

        <!-- Level Color Legend -->
        <div class="row y-gap-30 pt-30">
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center">
                        <h2 class="text-20 lh-1 fw-500">Level Color Legend</h2>
                    </div>
                    
                    @if($levels->count() > 0)
                    <div class="mt-30">
                        <div class="row y-gap-20">
                            @foreach($levels as $level)
                            <div class="col-lg-3 col-md-4 col-sm-6">
                                <div class="py-20 px-20 rounded-8" style="background-color: {{ $level->color_code }}10; border-left: 4px solid {{ $level->color_code }}">
                                    <div class="text-16 fw-500" style="color: {{ $level->color_code }}">{{ $level->name }}</div>
                                    <div class="d-flex items-center mt-5">
                                        <div class="text-14 mr-10">Score Range:</div>
                                        <div class="text-14 fw-500">{{ $level->min_score }} - {{ $level->max_score }}</div>
                                    </div>
                                </div>
                            </div>
                            @endforeach
                        </div>
                    </div>
                    @else
                    <div class="py-20 mt-10 text-center">
                        <div class="text-14 lh-1 text-light-1">No performance levels have been defined yet.</div>
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 