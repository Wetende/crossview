<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.admin.header')
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

        <div class="row y-gap-30">
            {{-- Parent Information Card --}}
            <div class="col-lg-6">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center">
                        <h4 class="text-18 lh-1 fw-500">Parent Information</h4>
                        <span class="badge bg-purple-1 text-white">Parent</span>
                    </div>
                    
                    <div class="mt-30">
                        <div class="d-flex items-center">
                            <div class="shrink-0">
                                <img src="{{ $parent->avatar_path ? asset($parent->avatar_path) : asset('img/avatars/small/default.png') }}" alt="{{ $parent->name }}" class="size-60 rounded-full">
                            </div>
                            <div class="ml-20">
                                <h4 class="text-17 lh-15 fw-500">{{ $parent->name }}</h4>
                                <p class="mt-5">{{ $parent->email }}</p>
                            </div>
                        </div>
                        
                        <div class="mt-30">
                            <div class="row y-gap-20">
                                <div class="col-12">
                                    <div class="d-flex items-center">
                                        <div class="text-14 lh-1 text-dark-1 fw-500 w-1/3">ID:</div>
                                        <div class="text-14 lh-1 ml-30">{{ $parent->id }}</div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="d-flex items-center">
                                        <div class="text-14 lh-1 text-dark-1 fw-500 w-1/3">Registered On:</div>
                                        <div class="text-14 lh-1 ml-30">{{ $parent->created_at ? $parent->created_at->format('M d, Y') : 'N/A' }}</div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="d-flex items-center">
                                        <div class="text-14 lh-1 text-dark-1 fw-500 w-1/3">Status:</div>
                                        <div class="text-14 lh-1 ml-30">
                                            @if($parent->is_active)
                                                <span class="badge bg-green-1 text-white">Active</span>
                                            @else
                                                <span class="badge bg-red-1 text-white">Inactive</span>
                                            @endif
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="d-flex items-center">
                                        <div class="text-14 lh-1 text-dark-1 fw-500 w-1/3">Total Linked Students:</div>
                                        <div class="text-14 lh-1 ml-30">{{ $parent->linkedStudents ? $parent->linkedStudents->count() : 0 }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Student Information Card --}}
            <div class="col-lg-6">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center">
                        <h4 class="text-18 lh-1 fw-500">Student Information</h4>
                        <span class="badge bg-blue-1 text-white">Student</span>
                    </div>
                    
                    <div class="mt-30">
                        <div class="d-flex items-center">
                            <div class="shrink-0">
                                <img src="{{ $student->avatar_path ? asset($student->avatar_path) : asset('img/avatars/small/default.png') }}" alt="{{ $student->name }}" class="size-60 rounded-full">
                            </div>
                            <div class="ml-20">
                                <h4 class="text-17 lh-15 fw-500">{{ $student->name }}</h4>
                                <p class="mt-5">{{ $student->email }}</p>
                            </div>
                        </div>
                        
                        <div class="mt-30">
                            <div class="row y-gap-20">
                                <div class="col-12">
                                    <div class="d-flex items-center">
                                        <div class="text-14 lh-1 text-dark-1 fw-500 w-1/3">ID:</div>
                                        <div class="text-14 lh-1 ml-30">{{ $student->id }}</div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="d-flex items-center">
                                        <div class="text-14 lh-1 text-dark-1 fw-500 w-1/3">Registered On:</div>
                                        <div class="text-14 lh-1 ml-30">{{ $student->created_at ? $student->created_at->format('M d, Y') : 'N/A' }}</div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="d-flex items-center">
                                        <div class="text-14 lh-1 text-dark-1 fw-500 w-1/3">Status:</div>
                                        <div class="text-14 lh-1 ml-30">
                                            @if($student->is_active)
                                                <span class="badge bg-green-1 text-white">Active</span>
                                            @else
                                                <span class="badge bg-red-1 text-white">Inactive</span>
                                            @endif
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="d-flex items-center">
                                        <div class="text-14 lh-1 text-dark-1 fw-500 w-1/3">Total Linked Parents:</div>
                                        <div class="text-14 lh-1 ml-30">{{ $student->linkedParents ? $student->linkedParents->count() : 0 }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {{-- Connection Details --}}
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <h4 class="text-18 lh-1 fw-500 mb-30">Connection Details</h4>

                    <div class="row y-gap-20">
                        <div class="col-md-4">
                            <div class="text-14 lh-1 text-dark-1 fw-500">Connection Status:</div>
                            <div class="mt-10">
                                @if($connection->status === 'active')
                                    <span class="badge bg-green-1 text-white">Active</span>
                                @elseif($connection->status === 'pending')
                                    <span class="badge bg-orange-1 text-white">Pending</span>
                                @elseif($connection->status === 'rejected')
                                    <span class="badge bg-red-1 text-white">Rejected</span>
                                @else
                                    <span class="badge bg-light-7 -dark-bg-dark-3 text-dark-1 -dark-text-white">{{ ucfirst($connection->status) }}</span>
                                @endif
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-14 lh-1 text-dark-1 fw-500">Created On:</div>
                            <div class="mt-10 text-14">{{ (new \Carbon\Carbon($connection->created_at))->format('M d, Y h:i A') }}</div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-14 lh-1 text-dark-1 fw-500">Last Updated:</div>
                            <div class="mt-10 text-14">{{ (new \Carbon\Carbon($connection->updated_at))->format('M d, Y h:i A') }}</div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-14 lh-1 text-dark-1 fw-500">Requested At:</div>
                            <div class="mt-10 text-14">{{ $connection->requested_at ? (new \Carbon\Carbon($connection->requested_at))->format('M d, Y h:i A') : 'N/A' }}</div>
                        </div>
                        <div class="col-md-4">
                            <div class="text-14 lh-1 text-dark-1 fw-500">Approved At:</div>
                            <div class="mt-10 text-14">{{ $connection->status === 'active' && $connection->actioned_at ? (new \Carbon\Carbon($connection->actioned_at))->format('M d, Y h:i A') : 'N/A' }}</div>
                        </div>
                    </div>

                    <div class="border-top-light pt-30 mt-30">
                        <h5 class="text-16 lh-1 fw-500 mb-20">Connection Management</h5>
                        
                        <form action="{{ route('admin.parent-student.update-status', [$parent->id, $student->id]) }}" method="POST" class="row y-gap-20">
                            @csrf
                            <div class="col-md-6">
                                <label class="text-14 lh-1 text-dark-1 fw-500 mb-10">Update Connection Status:</label>
                                <select name="status" class="form-select">
                                    <option value="active" {{ $connection->status === 'active' ? 'selected' : '' }}>Active</option>
                                    <option value="pending" {{ $connection->status === 'pending' ? 'selected' : '' }}>Pending</option>
                                    <option value="rejected" {{ $connection->status === 'rejected' ? 'selected' : '' }}>Rejected</option>
                                </select>
                            </div>
                            <div class="col-12 mt-10">
                                <button type="submit" class="button -md -purple-1 text-white">Update Status</button>
                            </div>
                        </form>
                        
                        <div class="mt-30">
                            <form action="{{ route('admin.parent-student.destroy', [$parent->id, $student->id]) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this connection? This action cannot be undone.')">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="button -md -red-1 text-white">Delete Connection</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row y-gap-20 mt-30">
            <div class="col-12">
                <a href="{{ route('admin.parent-student.index') }}" class="button -md -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                    <i class="icon-arrow-left mr-10"></i>
                    Back to All Connections
                </a>
            </div>
        </div>
    </div>
</x-dashboard-layout> 