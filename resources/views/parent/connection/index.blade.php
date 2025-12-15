<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.parent.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.parent.header')
        <h1 class="text-30 lh-12 fw-700">My Connection Requests</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('parent.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="javascript:void(0);">Connection Requests</a>
                </div>
            </div>
        </div>
    </x-slot>

    <div class="dashboard__content bg-light-4 py-30 px-30">
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

        <div class="row justify-between items-end pb-30">
            <div class="col-auto">
                <h4 class="text-20 lh-1">Connection Requests</h4>
            </div>
            <div class="col-auto">
                <a href="{{ route('parent.connections.create') }}" class="button -md -purple-1 text-white">
                    <i class="icon-plus mr-10"></i>
                    New Connection Request
                </a>
            </div>
        </div>

        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
            @if($connections->isEmpty())
                <div class="text-center py-40">
                    <img src="{{ asset('img/dashboard/empty-state/connections.svg') }}" alt="{{ __('No Connection Requests') }}" style="max-width: 200px;" class="mb-20">
                    <h4 class="text-18 fw-500 mb-10">{{ __('No Connection Requests Yet') }}</h4>
                    <p class="text-14 mb-20">{{ __('You have not sent any connection requests to students.') }}</p>
                    <a href="{{ route('parent.connections.create') }}" class="button -md -purple-1 text-white">{{ __('Request New Connection') }}</a>
                </div>
            @else
                <div class="overflow-hidden">
                    <table class="table-2 -border-bottom col-12">
                        <thead class="bg-light-7 -dark-bg-dark-2">
                            <tr>
                                <th>Student Name</th>
                                <th>Student Email</th>
                                <th>Status</th>
                                <th>Requested At</th>
                                <th>Approved At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($connections as $connection)
                                <tr>
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
                                    <td>{{ $connection->requested_at ? (new \Carbon\Carbon($connection->requested_at))->format('M d, Y') : 'N/A' }}</td>
                                    <td>{{ $connection->status === 'active' && $connection->actioned_at ? (new \Carbon\Carbon($connection->actioned_at))->format('M d, Y') : 'N/A' }}</td>
                                    <td>
                                        @if($connection->status === 'active')
                                            <a href="{{ route('parent.child-progress', ['student_id' => $connection->student_user_id]) }}" class="button -sm -purple-1 text-white">View Progress</a>
                                        @elseif($connection->status === 'pending')
                                            <span class="text-orange-1">Awaiting approval</span>
                                        @elseif($connection->status === 'rejected')
                                            <form action="{{ route('parent.connections.destroy', $connection->student_user_id) }}" method="POST" class="d-inline" onsubmit="return confirm('Are you sure you want to delete this rejected connection request?')">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="button -sm -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">Delete Request</button>
                                            </form>
                                        @endif
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>

                <div class="pt-30">
                    <div class="row justify-center">
                        <div class="col-auto">
                            {{ $connections->links() }}
                        </div>
                    </div>
                </div>
            @endif
        </div>
    </div>
</x-dashboard-layout> 