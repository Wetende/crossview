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
                <h1 class="text-30 lh-12 fw-700">Parent-Student Connections</h1>
                <div class="text-15 text-light-1">Manage relationships between parents and students.</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.parent-student.create') }}" class="button -md -purple-1 text-white">
                    <i class="icon-plus mr-10"></i>
                    Add New Connection
                </a>
            </div>
        </div>

        {{-- Search and Filter Section --}}
        <div class="row y-gap-20 items-center justify-between pb-30">
            <div class="col-xl-10 col-lg-9">
                <form class="contact-form row x-gap-20 y-gap-20" action="{{ route('admin.parent-student.index') }}" method="GET">
                    <div class="col-lg-5 col-md-6">
                        <input type="text" name="search" placeholder="Search by parent/student name or email..." value="{{ request('search') }}">
                    </div>
                    <div class="col-lg-4 col-md-6">
                        <select class="selectize-singular" name="status">
                            <option value="">All Statuses</option>
                            <option value="active" {{ request('status') === 'active' ? 'selected' : '' }}>Active</option>
                            <option value="pending" {{ request('status') === 'pending' ? 'selected' : '' }}>Pending</option>
                            <option value="rejected" {{ request('status') === 'rejected' ? 'selected' : '' }}>Rejected</option>
                        </select>
                    </div>
                    <div class="col-auto">
                        <button type="submit" class="button -md -purple-1 text-white">Filter</button>
                        <a href="{{ route('admin.parent-student.index') }}" class="button -md -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">Reset</a>
                    </div>
                </form>
            </div>
        </div>

        {{-- Display success/error messages --}}
        @if(session('success'))
            <div class="row mb-20">
                <div class="col-12">
                    <div class="alert alert-success bg-light-9 border-success-3 text-success-3">
                        {{ session('success') }}
                    </div>
                </div>
            </div>
        @endif

        @if(session('error'))
            <div class="row mb-20">
                <div class="col-12">
                    <div class="alert alert-error bg-light-8 border-red-3 text-red-3">
                        {{ session('error') }}
                    </div>
                </div>
            </div>
        @endif

        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
            <div class="overflow-hidden">
                <table class="table-2 -border-bottom col-12">
                    <thead class="bg-light-7 -dark-bg-dark-2">
                        <tr>
                            <th>Parent Name</th>
                            <th>Parent Email</th>
                            <th>Student Name</th>
                            <th>Student Email</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($connections as $connection)
                            <tr>
                                <td>{{ $connection->parent_name }}</td>
                                <td>{{ $connection->parent_email }}</td>
                                <td>{{ $connection->student_name }}</td>
                                <td>{{ $connection->student_email }}</td>
                                <td>
                                    @if($connection->status === 'active')
                                        <span class="badge bg-green-1 text-white">Active</span>
                                    @elseif($connection->status === 'pending')
                                        <span class="badge bg-orange-1 text-white">Pending</span>
                                    @elseif($connection->status === 'rejected')
                                        <span class="badge bg-red-1 text-white">Rejected</span>
                                    @else
                                        <span class="badge bg-light-7 -dark-bg-dark-3 text-dark-1 -dark-text-white">{{ ucfirst($connection->status) }}</span>
                                    @endif
                                </td>
                                <td>{{ (new \Carbon\Carbon($connection->created_at))->format('M d, Y') }}</td>
                                <td>
                                    <div class="d-flex x-gap-10">
                                        <a href="{{ route('admin.parent-student.show', [$connection->parent_user_id, $connection->student_user_id]) }}" class="icon-eye text-16" title="View Details"></a>
                                        
                                        <form action="{{ route('admin.parent-student.destroy', [$connection->parent_user_id, $connection->student_user_id]) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this connection?')">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit" class="icon-trash text-16" style="background:none; border:none; padding:0; margin:0; cursor:pointer;" title="Delete Connection"></button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="text-center py-4">
                                    <p class="text-light-1">No parent-student connections found.</p>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            {{-- Pagination --}}
            <div class="pt-30">
                <div class="row justify-center">
                    <div class="col-auto">
                        {{ $connections->links() }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 