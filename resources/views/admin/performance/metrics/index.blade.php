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
                <h1 class="text-30 lh-12 fw-700">Performance Metrics</h1>
                <div class="mt-10">Manage performance metrics used for student evaluations</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.performance.metrics.create') }}" class="button -md -purple-1 text-white">
                    <i class="icon-plus mr-10"></i>
                    Add New Metric
                </a>
            </div>
        </div>

        <!-- Metrics List Card -->
        <div class="row y-gap-30">
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center">
                        <h2 class="text-20 lh-1 fw-500">All Performance Metrics</h2>
                    </div>
                    
                    @if($metrics->count() > 0)
                    <div class="table-responsive mt-30">
                        <table class="table w-1/1">
                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Key</th>
                                    <th>Description</th>
                                    <th>Weight</th>
                                    <th>Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody class="text-14">
                                @foreach($metrics as $metric)
                                <tr class="border-bottom-light">
                                    <td>{{ $metric->id }}</td>
                                    <td>{{ $metric->name }}</td>
                                    <td>{{ $metric->key }}</td>
                                    <td>{{ Str::limit($metric->description, 50) }}</td>
                                    <td>{{ $metric->weight }}</td>
                                    <td>
                                        @if($metric->is_subject_specific)
                                            <span class="badge bg-purple-1 text-white">Subject Specific</span>
                                        @else
                                            <span class="badge bg-blue-1 text-white">General</span>
                                        @endif
                                    </td>
                                    <td>
                                        <div class="d-flex items-center">
                                            <a href="{{ route('admin.performance.metrics.edit', $metric) }}" class="flex-center bg-light-2 -dark-bg-dark-3 size-35 rounded-8 mr-10">
                                                <i class="icon-edit text-16 text-purple-1"></i>
                                            </a>
                                            <form action="{{ route('admin.performance.metrics.destroy', $metric) }}" method="POST" class="d-inline">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="flex-center bg-light-2 -dark-bg-dark-3 size-35 rounded-8" onclick="return confirm('Are you sure you want to delete this metric?')">
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
                        {{ $metrics->links() }}
                    </div>
                    @else
                    <div class="text-center py-40">
                        <img src="{{ asset('img/dashboard/empty-state/metrics.svg') }}" alt="No Metrics" style="max-width: 200px;" class="mb-20">
                        <h4 class="text-18 fw-500 mb-10">No Performance Metrics Found</h4>
                        <p class="text-14 mb-20">Create performance metrics to start tracking student performance.</p>
                        <a href="{{ route('admin.performance.metrics.create') }}" class="button -md -purple-1 text-white">Add First Metric</a>
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 