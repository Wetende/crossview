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
                <h1 class="text-30 lh-12 fw-700">User Details</h1>
                <div class="mt-10">View detailed information about this user.</div>
            </div>
            <div class="col-auto">
                <div class="d-flex x-gap-10">
                    <a href="{{ route('admin.users.edit', $user->id) }}" class="button -md -purple-1 text-white">
                        <i class="icon-edit mr-8"></i>
                        Edit User
                    </a>
                    <a href="{{ route('admin.users.index') }}" class="button -md -outline-purple-1 text-purple-1">
                        <i class="icon-arrow-left mr-8"></i>
                        Back to Users
                    </a>
                </div>
            </div>
        </div>

        <div class="row y-gap-30">
            <!-- User Basic Information -->
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center pb-20 mb-20 border-bottom-light">
                        <h2 class="text-20 lh-1 fw-500">Basic Information</h2>
                        <span class="badge {{ $user->is_active ? 'bg-green-1 text-white' : 'bg-red-1 text-white' }}">
                            {{ $user->is_active ? 'Active' : 'Inactive' }}
                        </span>
                    </div>

                    <div class="row y-gap-20">
                        <div class="col-lg-3 col-md-6">
                            <div class="d-flex flex-column items-center justify-center py-30 px-10 text-center">
                                @if($user->profile_picture_path)
                                    <img src="{{ asset('storage/' . $user->profile_picture_path) }}" alt="{{ $user->name }}" class="size-120 rounded-full object-cover mb-15">
                                @else
                                    <div class="flex-center bg-light-6 rounded-full size-120 mb-15">
                                        <span class="text-24 fw-500 text-dark-1">{{ substr($user->name, 0, 1) }}</span>
                                    </div>
                                @endif
                                <div class="text-18 fw-500 text-dark-1">{{ $user->name }}</div>
                                <div class="d-flex mt-5">
                                    @foreach($user->roles as $role)
                                        <span class="badge 
                                            {{ $role->name === 'admin' ? 'bg-purple-1 text-white' : 
                                                ($role->name === 'teacher' ? 'bg-orange-1 text-white' : 
                                                ($role->name === 'parent' ? 'bg-blue-1 text-white' : 'bg-green-1 text-white')) }} 
                                            mr-5">
                                            {{ ucfirst($role->name) }}
                                        </span>
                                    @endforeach
                                </div>
                            </div>
                        </div>

                        <div class="col-lg-9 col-md-6">
                            <div class="py-20 px-30">
                                <div class="row y-gap-20">
                                    <div class="col-lg-6">
                                        <div class="text-14 text-light-1 mb-5">Email</div>
                                        <div class="text-16 fw-500 text-dark-1">{{ $user->email }}</div>
                                    </div>
                                    <div class="col-lg-6">
                                        <div class="text-14 text-light-1 mb-5">Registered On</div>
                                        <div class="text-16 fw-500 text-dark-1">{{ $user->created_at->format('M d, Y h:i A') }}</div>
                                    </div>
                                    <div class="col-lg-6">
                                        <div class="text-14 text-light-1 mb-5">Last Updated</div>
                                        <div class="text-16 fw-500 text-dark-1">{{ $user->updated_at->format('M d, Y h:i A') }}</div>
                                    </div>
                                    <div class="col-lg-6">
                                        <div class="text-14 text-light-1 mb-5">ID</div>
                                        <div class="text-16 fw-500 text-dark-1">#{{ $user->id }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Activity -->
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center pb-20 mb-20 border-bottom-light">
                        <h2 class="text-20 lh-1 fw-500">Activity Information</h2>
                    </div>

                    <div class="tabs -active-purple-2 js-tabs">
                        <div class="tabs__controls d-flex x-gap-30 items-center mb-30 js-tabs-controls">
                            <button class="tabs__button text-16 fw-500 text-light-1 js-tabs-button is-active" data-tab-target="courses">
                                Courses Enrolled
                            </button>
                            <button class="tabs__button text-16 fw-500 text-light-1 js-tabs-button" data-tab-target="assignments">
                                Assignments
                            </button>
                            <button class="tabs__button text-16 fw-500 text-light-1 js-tabs-button" data-tab-target="logins">
                                Login History
                            </button>
                        </div>

                        <div class="tabs__content js-tabs-content">
                            <!-- Courses Tab -->
                            <div class="tabs__pane is-active" data-tab-content="courses">
                                @if($user->enrolledCourses && $user->enrolledCourses->count() > 0)
                                    <div class="overflow-hidden">
                                        <table class="table-2 col-12">
                                            <thead class="bg-light-3">
                                                <tr>
                                                    <th>Course</th>
                                                    <th>Enrolled Date</th>
                                                    <th>Completion</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @foreach($user->enrolledCourses as $course)
                                                <tr>
                                                    <td>
                                                        <div class="d-flex items-center">
                                                            <div class="mr-10">
                                                                @if($course->thumbnail_path)
                                                                    <img src="{{ asset('storage/' . $course->thumbnail_path) }}" alt="{{ $course->title }}" class="size-60 rounded-8 object-cover">
                                                                @else
                                                                    <div class="size-60 bg-light-4 rounded-8 flex-center">
                                                                        <i class="icon-book text-24"></i>
                                                                    </div>
                                                                @endif
                                                            </div>
                                                            <div>
                                                                <div class="text-16 fw-500 text-dark-1">{{ $course->title }}</div>
                                                                <div class="text-14 text-light-1">{{ Str::limit($course->description, 30) }}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{{ $course->pivot->created_at->format('M d, Y') }}</td>
                                                    <td>
                                                        <div class="progress-bar h-4 w-1/1 bg-light-3">
                                                            <div class="progress-bar__bg bg-purple-1" style="width: {{ $course->pivot->progress }}%;"></div>
                                                        </div>
                                                        <div class="text-14 mt-5">{{ $course->pivot->progress }}% Complete</div>
                                                    </td>
                                                    <td>
                                                        @if($course->pivot->status === 'completed')
                                                            <span class="badge bg-green-1 text-white">Completed</span>
                                                        @elseif($course->pivot->status === 'in_progress')
                                                            <span class="badge bg-orange-1 text-white">In Progress</span>
                                                        @else
                                                            <span class="badge bg-blue-1 text-white">Not Started</span>
                                                        @endif
                                                    </td>
                                                </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                @else
                                    <div class="text-center py-30">
                                        <div class="text-18 fw-500 text-dark-1 mb-10">No Courses Enrolled</div>
                                        <p class="text-15 text-light-1">This user is not enrolled in any courses yet.</p>
                                    </div>
                                @endif
                            </div>

                            <!-- Assignments Tab -->
                            <div class="tabs__pane" data-tab-content="assignments">
                                @if($user->assignments && $user->assignments->count() > 0)
                                    <div class="overflow-hidden">
                                        <table class="table-2 col-12">
                                            <thead class="bg-light-3">
                                                <tr>
                                                    <th>Assignment</th>
                                                    <th>Course</th>
                                                    <th>Due Date</th>
                                                    <th>Status</th>
                                                    <th>Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @foreach($user->assignments as $assignment)
                                                <tr>
                                                    <td>{{ $assignment->title }}</td>
                                                    <td>{{ $assignment->course->title }}</td>
                                                    <td>{{ $assignment->due_date->format('M d, Y') }}</td>
                                                    <td>
                                                        @if($assignment->pivot->status === 'submitted')
                                                            <span class="badge bg-green-1 text-white">Submitted</span>
                                                        @elseif($assignment->pivot->status === 'overdue')
                                                            <span class="badge bg-red-1 text-white">Overdue</span>
                                                        @else
                                                            <span class="badge bg-orange-1 text-white">Pending</span>
                                                        @endif
                                                    </td>
                                                    <td>{{ $assignment->pivot->grade ?? 'Not Graded' }}</td>
                                                </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                @else
                                    <div class="text-center py-30">
                                        <div class="text-18 fw-500 text-dark-1 mb-10">No Assignments</div>
                                        <p class="text-15 text-light-1">This user has no assignment submissions yet.</p>
                                    </div>
                                @endif
                            </div>

                            <!-- Login History Tab -->
                            <div class="tabs__pane" data-tab-content="logins">
                                @if($user->loginHistories && $user->loginHistories->count() > 0)
                                    <div class="overflow-hidden">
                                        <table class="table-2 col-12">
                                            <thead class="bg-light-3">
                                                <tr>
                                                    <th>Login Time</th>
                                                    <th>IP Address</th>
                                                    <th>Device</th>
                                                    <th>Location</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @foreach($user->loginHistories as $login)
                                                <tr>
                                                    <td>{{ $login->created_at->format('M d, Y h:i A') }}</td>
                                                    <td>{{ $login->ip_address }}</td>
                                                    <td>{{ $login->user_agent }}</td>
                                                    <td>{{ $login->location ?? 'Unknown' }}</td>
                                                </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                @else
                                    <div class="text-center py-30">
                                        <div class="text-18 fw-500 text-dark-1 mb-10">No Login History</div>
                                        <p class="text-15 text-light-1">No login records available for this user.</p>
                                    </div>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center pb-20 border-bottom-light">
                        <h2 class="text-20 lh-1 fw-500">Actions</h2>
                    </div>

                    <div class="d-flex py-20 x-gap-10">
                        <!-- Send Message -->
                        <a href="{{ route('admin.messages.create', ['user_id' => $user->id]) }}" class="button -md -purple-3 text-purple-1">
                            <i class="icon-message mr-8"></i>
                            Send Message
                        </a>

                        <!-- Impersonate User -->
                        <a href="{{ route('admin.users.impersonate', $user->id) }}" class="button -md -blue-3 text-blue-1">
                            <i class="icon-user-profile mr-8"></i>
                            Login as User
                        </a>

                        <!-- Delete User -->
                        <form action="{{ route('admin.users.destroy', $user->id) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this user? This action cannot be undone.');" style="display: inline-block;">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="button -md -red-3 text-red-1">
                                <i class="icon-trash mr-8"></i>
                                Delete User
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 