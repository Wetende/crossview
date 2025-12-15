<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
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

        <div class="row">
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <h3 class="text-20 lh-1 fw-500 mb-20">Manage Parent Connections</h3>
                    
                    <div class="mt-10 mb-30">
                        <div class="bg-light-3 -dark-bg-dark-2 text-14 py-15 px-20 rounded-8">
                            <p><strong>Note:</strong> Parents who connect to your account can view your academic progress, course enrollments, and quiz results. Only approve connection requests from your actual parents or guardians.</p>
                            <p class="mt-10 mb-0">If you want to invite a parent to connect, you can <a href="{{ route('student.invite.create') }}" class="text-purple-1 underline">generate an invite code</a> for them.</p>
                        </div>
                    </div>
                    
                    @if($connections->isEmpty())
                        <div class="text-center py-40">
                            <img src="{{ asset('img/dashboard/empty-state/connections.svg') }}" alt="{{ __('No Connection Requests') }}" style="max-width: 200px;" class="mb-20">
                            <h4 class="text-18 fw-500 mb-10">{{ __('No Parent Connection Requests') }}</h4>
                            <p class="text-14 mb-20">{{ __('You don\'t have any parent connection requests at this time.') }}</p>
                            <a href="{{ route('student.invite.create') }}" class="button -md -purple-1 text-white">{{ __('Create Invite Code for Parent') }}</a>
                        </div>
                    @else
                        <div class="overflow-hidden">
                            <table class="table-2 -border-bottom col-12">
                                <thead class="bg-light-7 -dark-bg-dark-2">
                                    <tr>
                                        <th>Parent Name</th>
                                        <th>Parent Email</th>
                                        <th>Status</th>
                                        <th>Requested At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($connections as $connection)
                                        <tr>
                                            <td>{{ $connection->parent_name }}</td>
                                            <td>{{ $connection->parent_email }}</td>
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
                                            <td>
                                                @if($connection->status === 'pending')
                                                    <div class="d-flex x-gap-10">
                                                        <form action="{{ route('student.connections.approve', $connection->parent_user_id) }}" method="POST" class="d-inline">
                                                            @csrf
                                                            <button type="submit" class="button -sm -green-1 text-white">Approve</button>
                                                        </form>
                                                        
                                                        <form action="{{ route('student.connections.reject', $connection->parent_user_id) }}" method="POST" class="d-inline">
                                                            @csrf
                                                            <button type="submit" class="button -sm -red-1 text-white">Reject</button>
                                                        </form>
                                                    </div>
                                                @elseif($connection->status === 'active' || $connection->status === 'rejected')
                                                    <form action="{{ route('student.connections.destroy', $connection->parent_user_id) }}" method="POST" class="d-inline" onsubmit="return confirm('Are you sure you want to remove this connection?')">
                                                        @csrf
                                                        @method('DELETE')
                                                        <button type="submit" class="button -sm -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">Remove</button>
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
        </div>
    </div>
</x-dashboard-layout> 