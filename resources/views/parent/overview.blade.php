<x-dashboard-layout>
    <x-slot name="title">Parent Dashboard - Overview</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.parent.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.parent.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        @if(session('success'))
            <div class="row mb-20">
                <div class="col-12">
                    <div class="notice success">
                        <p>{{ session('success') }}</p>
                    </div>
                </div>
            </div>
        @endif
        
        @if(session('error'))
            <div class="row mb-20">
                <div class="col-12">
                    <div class="notice error">
                        <p>{{ session('error') }}</p>
                    </div>
                </div>
            </div>
        @endif

        @if($linkedStudents->isEmpty())
            {{-- Main Page Welcome & Title --}}
            <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
                <div class="col-auto">
                    <h1 class="text-30 lh-12 fw-700">{{ __('Parent Dashboard') }}</h1>
                    <div class="mt-10">{{ __('Welcome, :name! Connect with your child to monitor their learning journey.', ['name' => Auth::user()->name]) }}</div>
                </div>
            </div>

            {{-- Enhanced "Link Child" Section --}}
            <div class="row">
                <div class="col-12">
                    <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                        <div class="text-center py-40">
                            <img src="{{ asset('img/dashboard/empty-state/students.svg') }}" alt="{{ __('No Linked Students') }}" style="max-width: 180px;" class="mb-20">
                            <h2 class="text-24 lh-12 fw-700 mb-10">{{ __('No Children Linked Yet') }}</h2>
                            
                            <p class="text-15 text-light-1 mx-auto" style="max-width: 500px;">
                                {{ __('To start monitoring academic progress and stay updated, you need to connect with your child\'s account.') }}<br>
                                {{ __('Here\'s how you can do it:') }}
                            </p>

                            <div class="row justify-center x-gap-20 y-gap-20 pt-25 pb-25">
                                <div class="col-md-4 col-sm-6">
                                    <a href="{{ route('parent.link.create') }}" class="button -md -purple-1 text-white w-1/1">
                                        <i class="icon-ticket text-16 mr-10"></i> {{ __('Use Invite Code') }}
                                    </a>
                                    <p class="text-13 text-light-1 mt-10">{{ __('If your child has provided an 8-character invite code, enter it here to link instantly.') }}</p>
                                </div>
                                <div class="col-md-4 col-sm-6">
                                    <a href="{{ route('parent.connections.create') }}" class="button -md -outline-purple-1 text-purple-1 w-1/1">
                                        <i class="icon-send text-16 mr-10"></i> {{ __('Request via Email') }}
                                    </a>
                                    <p class="text-13 text-light-1 mt-10">{{ __('Send a connection request to your child\'s registered email address. They will need to approve it.') }}</p>
                                </div>
                            </div>

                            <div class="mt-20 pt-25 border-top-light">
                                <h5 class="text-17 fw-500 mb-15">{{ __('Once Linked, You\'ll Be Able To:') }}</h5>
                                <div class="row justify-center y-gap-10 text-left" style="max-width: 800px; margin-left:auto; margin-right:auto;">
                                    <div class="col-lg-4 col-md-6">
                                        <div class="d-flex items-center">
                                            <i class="icon-check text-green-1 mr-10"></i>
                                            <span class="text-14">{{ __('View detailed @lmsterm("study material") progress.') }}</span>
                                        </div>
                                    </div>
                                    <div class="col-lg-4 col-md-6">
                                        <div class="d-flex items-center">
                                            <i class="icon-check text-green-1 mr-10"></i>
                                            <span class="text-14">{{ __('Track quiz results and grades.') }}</span>
                                        </div>
                                    </div>
                                    <div class="col-lg-4 col-md-6">
                                        <div class="d-flex items-center">
                                            <i class="icon-check text-green-1 mr-10"></i>
                                            <span class="text-14">{{ __('See important calendar events.') }}</span>
                                        </div>
                                    </div>
                                    <div class="col-lg-4 col-md-6">
                                        <div class="d-flex items-center">
                                            <i class="icon-check text-green-1 mr-10"></i>
                                            <span class="text-14">{{ __('Communicate with instructors.') }}</span>
                                        </div>
                                    </div>
                                    <div class="col-lg-4 col-md-6">
                                        <div class="d-flex items-center">
                                            <i class="icon-check text-green-1 mr-10"></i>
                                            <span class="text-14">{{ __('Monitor learning achievements.') }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {{-- "Discover More" Section --}}
            <div class="row y-gap-30 mt-30">
                <div class="col-12">
                    <h3 class="text-20 lh-1 fw-500 mb-20">{{ __('Discover More') }}</h3>
                </div>
                <div class="col-lg-4 col-md-6">
                    <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                        <div class="d-flex items-center mb-15">
                            <i class="icon-play-button text-purple-1 text-24 mr-15"></i>
                            <h5 class="text-17 fw-500">{{ __('How It Works') }}</h5>
                        </div>
                        <p class="text-14 text-light-1 mb-15">{{ __('Learn about connecting with your child and using the parent portal effectively.') }}</p>
                        <a href="#" class="button -sm -outline-purple-1 text-purple-1">{{ __('Read Guide') }}</a>
                    </div>
                </div>
                <div class="col-lg-4 col-md-6">
                    <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                        <div class="d-flex items-center mb-15">
                            <i class="icon-online-learning text-purple-1 text-24 mr-15"></i>
                            <h5 class="text-17 fw-500">{{ __('Browse @lmsterm("Study Materials")') }}</h5>
                        </div>
                        <p class="text-14 text-light-1 mb-15">{{ __('Explore the @lmsterm("study materials") available on our platform for your child.') }}</p>
                        <a href="#" class="button -sm -outline-purple-1 text-purple-1">{{ __('View Catalog') }}</a>
                    </div>
                </div>
                <div class="col-lg-4 col-md-6">
                    <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                        <div class="d-flex items-center mb-15">
                            <i class="icon-message text-purple-1 text-24 mr-15"></i>
                            <h5 class="text-17 fw-500">{{ __('Get Support') }}</h5>
                        </div>
                        <p class="text-14 text-light-1 mb-15">{{ __('Have questions? Visit our help center or contact our support team.') }}</p>
                        <a href="#" class="button -sm -outline-purple-1 text-purple-1">{{ __('Help Center') }}</a>
                    </div>
                </div>
            </div>
        @else
            <!-- Student Selector -->
            <div class="row mb-30">
                <div class="col-12">
                    <div class="d-flex justify-between items-center py-25 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 border-2 border-light-6 -dark-border-dark-2">
                        <div class="d-flex items-center">
                            <div class="d-flex items-center mr-25">
                                <div class="size-40 rounded-10 bg-purple-3 d-flex justify-center items-center mr-15">
                                    <i class="icon-user text-purple-1 text-16"></i>
                                </div>
                                <div>
                                    <div class="text-12 text-light-1 fw-500 mb-2">VIEWING CHILD</div>
                                    <div class="text-16 fw-600 text-dark-1">Select Child:</div>
                                </div>
                            </div>
                            <form action="{{ route('parent.select-student') }}" method="POST">
                                @csrf
                                <div class="d-flex items-center">
                                    <select name="student_id" id="student_id" class="form-control mr-15 rounded-8 border-light-3 -dark-border-dark-3 py-10 px-15" onchange="this.form.submit()">
                                        @foreach($linkedStudents as $student)
                                            <option value="{{ $student->id }}" {{ $selectedStudent && $selectedStudent->id == $student->id ? 'selected' : '' }}>
                                                {{ $student->name }}
                                            </option>
                                        @endforeach
                                    </select>
                                    <noscript>
                                        <button type="submit" class="button -sm -purple-1 text-white">View</button>
                                    </noscript>
                                </div>
                            </form>
                        </div>
                        <div class="d-flex items-center x-gap-10">
                            <a href="{{ route('parent.linked_students.index') }}" class="button -sm -outline-purple-1 text-purple-1">
                                <i class="icon-chart mr-8"></i>
                                Analytics
                            </a>
                            <a href="{{ route('parent.link.create') }}" class="button -sm -purple-1 text-white">
                                <i class="icon-plus mr-8"></i>
                                Link Another Child
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Global Statistics Overview -->
            <div class="row y-gap-30 mb-30">
                <div class="col-12">
                    <div class="d-flex justify-between items-center py-20 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                        <h3 class="text-18 lh-1 fw-500">Family Learning Overview</h3>
                        <a href="{{ route('parent.linked_students.index') }}" class="button -sm -purple-1 text-white">
                            <i class="icon-chart text-16 mr-5"></i> Detailed Analytics
                        </a>
                    </div>
                </div>
                
                <!-- Global Stats Cards -->
                <div class="col-xl-3 col-lg-6 col-md-6">
                    <div class="py-25 px-25 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100 border-2 border-transparent hover-border-purple-1">
                        <div class="d-flex direction-column text-center">
                            <div class="size-70 rounded-16 d-flex justify-center items-center bg-purple-3 mx-auto mb-20">
                                <i class="icon-user text-purple-1 text-28"></i>
                            </div>
                            <div class="text-30 lh-1 fw-700 text-dark-1 mb-5">{{ $globalStats['total_children'] }}</div>
                            <div class="text-14 lh-1 text-light-1 fw-500">Linked {{ $globalStats['total_children'] == 1 ? 'Child' : 'Children' }}</div>
                            <div class="progress-bar bg-purple-3 h-2 rounded-full mt-15">
                                <div class="progress-bar__item bg-purple-1 h-full rounded-full" style="width: 100%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-xl-3 col-lg-6 col-md-6">
                    <div class="py-25 px-25 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100 border-2 border-transparent hover-border-blue-1">
                        <div class="d-flex direction-column text-center">
                            <div class="size-70 rounded-16 d-flex justify-center items-center bg-blue-3 mx-auto mb-20">
                                <i class="icon-play-button text-blue-1 text-28"></i>
                            </div>
                            <div class="text-30 lh-1 fw-700 text-dark-1 mb-5">{{ $globalStats['total_courses_across_children'] }}</div>
                            <div class="text-14 lh-1 text-light-1 fw-500">Total Enrollments</div>
                            <div class="progress-bar bg-blue-3 h-2 rounded-full mt-15">
                                <div class="progress-bar__item bg-blue-1 h-full rounded-full" style="width: {{ min(100, ($globalStats['total_courses_across_children'] / max(1, $globalStats['total_children'])) * 10) }}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-xl-3 col-lg-6 col-md-6">
                    <div class="py-25 px-25 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100 border-2 border-transparent hover-border-green-1">
                        <div class="d-flex direction-column text-center">
                            <div class="size-70 rounded-16 d-flex justify-center items-center bg-green-3 mx-auto mb-20">
                                <i class="icon-check text-green-1 text-28"></i>
                            </div>
                            <div class="text-30 lh-1 fw-700 text-dark-1 mb-5">{{ $globalStats['completion_rate'] }}%</div>
                            <div class="text-14 lh-1 text-light-1 fw-500">Completion Rate</div>
                            <div class="progress-bar bg-green-3 h-2 rounded-full mt-15">
                                <div class="progress-bar__item bg-green-1 h-full rounded-full" style="width: {{ $globalStats['completion_rate'] }}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-xl-3 col-lg-6 col-md-6">
                    <div class="py-25 px-25 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100 border-2 border-transparent hover-border-orange-1">
                        <div class="d-flex direction-column text-center">
                            <div class="size-70 rounded-16 d-flex justify-center items-center bg-orange-3 mx-auto mb-20">
                                <i class="icon-star text-orange-1 text-28"></i>
                            </div>
                            <div class="text-30 lh-1 fw-700 text-dark-1 mb-5">{{ $globalStats['average_performance_across_children'] }}%</div>
                            <div class="text-14 lh-1 text-light-1 fw-500">Avg Performance</div>
                            <div class="progress-bar bg-orange-3 h-2 rounded-full mt-15">
                                <div class="progress-bar__item bg-orange-1 h-full rounded-full" style="width: {{ $globalStats['average_performance_across_children'] }}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Top Performers Section -->
            @if(!empty($globalStats['top_performers']))
                <div class="row mb-30">
                    <div class="col-12">
                        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <h3 class="text-18 lh-1 fw-500 mb-20">
                                <i class="icon-trophy text-purple-1 mr-10"></i>
                                Top Performers (75th Percentile+)
                            </h3>
                            <div class="row y-gap-20">
                                @foreach($globalStats['top_performers'] as $performer)
                                    <div class="col-lg-4 col-md-6">
                                        <div class="d-flex items-center p-20 rounded-8 bg-light-2 -dark-bg-dark-2">
                                            <div class="size-50 rounded-full d-flex justify-center items-center bg-purple-3 mr-15">
                                                <i class="icon-award text-purple-1 text-20"></i>
                                            </div>
                                            <div>
                                                <h4 class="text-16 fw-500">{{ $performer['student']->name }}</h4>
                                                <div class="text-13 text-light-1">{{ $performer['ranking']->formatted_rank }} • {{ number_format($performer['ranking']->percentile, 1) }}th percentile</div>
                                                <div class="text-13 fw-500 text-green-1">{{ $performer['ranking']->performance_tier }}</div>
                                            </div>
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    </div>
                </div>
            @endif

            <!-- Student Summary Cards -->
            <div class="row y-gap-30 mb-30">
                <div class="col-12">
                    <div class="d-flex justify-between items-center py-20 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                        <h3 class="text-18 lh-1 fw-500">All Children - Individual Summary</h3>
                    </div>
                </div>
                @foreach($summaryData as $studentId => $data)
                    <div class="col-xl-4 col-lg-6 col-md-6">
                        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100 {{ $selectedStudent && $selectedStudent->id == $studentId ? 'border-purple-1' : '' }}">
                            <div class="d-flex items-center justify-between mb-15">
                                <h4 class="text-20 fw-500">{{ $data['name'] }}</h4>
                                @if($data['overall_ranking'])
                                    <div class="badge bg-purple-1 text-white">
                                        {{ $data['overall_ranking']->formatted_rank }}
                                    </div>
                                @endif
                            </div>
                            
                            @if($data['has_performance_data'])
                                <div class="row y-gap-10 mb-15">
                                    @if($data['overall_ranking'])
                                        <div class="col-12">
                                            <div class="d-flex items-center justify-between">
                                                <span class="text-14 text-light-1">Percentile:</span>
                                                <span class="text-14 fw-500 text-purple-1">{{ number_format($data['overall_ranking']->percentile, 1) }}%</span>
                                            </div>
                                        </div>
                                    @endif
                                    @if($data['avg_performance_score'] > 0)
                                        <div class="col-12">
                                            <div class="d-flex items-center justify-between">
                                                <span class="text-14 text-light-1">Avg Score:</span>
                                                <span class="text-14 fw-500 {{ $data['avg_performance_score'] >= 80 ? 'text-green-1' : ($data['avg_performance_score'] >= 65 ? 'text-blue-1' : ($data['avg_performance_score'] >= 50 ? 'text-orange-1' : 'text-red-1')) }}">{{ $data['avg_performance_score'] }}%</span>
                                            </div>
                                        </div>
                                    @endif
                                    @if($data['subject_rankings_count'] > 0)
                                        <div class="col-12">
                                            <div class="d-flex items-center justify-between">
                                                <span class="text-14 text-light-1">Subject Rankings:</span>
                                                <span class="text-14 fw-500">{{ $data['subject_rankings_count'] }}</span>
                                            </div>
                                        </div>
                                    @endif
                                </div>
                            @endif
                            
                            <div class="d-flex items-center mb-10">
                                <div class="mr-10"><i class="icon-play-button text-purple-1"></i></div>
                                <div>Active @lmsterm('Study Materials'): <span class="fw-500">{{ $data['active_courses'] }}</span></div>
                            </div>
                            <div class="d-flex items-center mb-10">
                                <div class="mr-10"><i class="icon-check text-green-1"></i></div>
                                <div>Completed: <span class="fw-500">{{ $data['completed_courses'] }}</span></div>
                            </div>
                            <div class="d-flex items-center mb-15">
                                <div class="mr-10"><i class="icon-online-learning text-purple-1"></i></div>
                                <div>Progress: <span class="fw-500">{{ $data['avg_progress'] }}%</span></div>
                            </div>
                            <form action="{{ route('parent.select-student') }}" method="POST">
                                @csrf
                                <input type="hidden" name="student_id" value="{{ $studentId }}">
                                <button type="submit" class="button -sm {{ $selectedStudent && $selectedStudent->id == $studentId ? '-purple-1 text-white' : '-outline-purple-1 text-purple-1' }} w-1/1">
                                    {{ $selectedStudent && $selectedStudent->id == $studentId ? 'Currently Viewing' : 'View Details' }}
                                </button>
                            </form>
                        </div>
                    </div>
                @endforeach
            </div>

            @if($studentData)
                <div class="row">
                    <div class="col-12 mb-30">
                        <div class="d-flex justify-between items-center py-20 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <h3 class="text-18 lh-1 fw-500">{{ $studentData['student']->name }}'s Dashboard</h3>
                            <a href="{{ route('parent.child.dashboard', ['child' => $studentData['student']->id]) }}" class="button -sm -purple-1 text-white">
                                <i class="icon-grid text-16 mr-5"></i> View Full Dashboard
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- @lmsterm('Study Materials') Enrolled -->
                <div class="row mb-30">
                    <div class="col-12">
                        <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                                <h3 class="text-17 lh-1 fw-500">
                                    <i class="icon-play-button text-purple-1 mr-10"></i>
                                    Enrolled @lmsterm('Study Materials')
                                </h3>
                                <a href="{{ route('parent.child-progress') }}" class="button -sm -outline-purple-1 text-purple-1">View All</a>
                            </div>
                            <div class="py-30 px-30">
                                @if($studentData['enrollments']->isNotEmpty())
                                    <div class="row y-gap-20">
                                        @foreach($studentData['enrollments'] as $enrollment)
                                            <div class="col-lg-6 col-md-12">
                                                <div class="rounded-12 border-light -dark-border-dark-2 p-20 h-100 bg-light-2 -dark-bg-dark-2 shadow-2">
                                                    <div class="d-flex items-start justify-between mb-15">
                                                        <div class="size-50 rounded-10 bg-purple-3 d-flex justify-center items-center">
                                                            <i class="icon-book text-purple-1 text-20"></i>
                                                        </div>
                                                        <div class="text-center">
                                                            <div class="progress-circle size-50" data-percent="{{ $enrollment->progress ?? 0 }}">
                                                                <div class="progress-circle__inner">
                                                                    <div class="progress-circle__bar"></div>
                                                                    <div class="progress-circle__number text-12">{{ number_format($enrollment->progress ?? 0) }}%</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <h4 class="text-16 lh-15 fw-500 text-dark-1 mb-10">{{ $enrollment->course->title }}</h4>
                                                    
                                                    <div class="d-flex items-center mb-8">
                                                        <div class="size-6 rounded-full {{ $enrollment->completed_at ? 'bg-green-1' : 'bg-orange-1' }} mr-8"></div>
                                                        <div class="text-13 lh-1 {{ $enrollment->completed_at ? 'text-green-1' : 'text-orange-1' }} fw-500">
                                                            {{ $enrollment->completed_at ? 'Completed' : 'In Progress' }}
                                                        </div>
                                                    </div>
                                                    
                                                    <div class="text-13 lh-1 text-light-1 mb-15">
                                                        <i class="icon-clock text-12 mr-5"></i>
                                                        {{ $enrollment->updated_at ? $enrollment->updated_at->diffForHumans() : 'No recent activity' }}
                                                    </div>
                                                    
                                                    <div class="progress-bar bg-light-3 -dark-bg-dark-5 h-4 rounded-full mb-15">
                                                        <div class="progress-bar__item {{ $enrollment->progress >= 80 ? 'bg-green-1' : ($enrollment->progress >= 50 ? 'bg-blue-1' : 'bg-orange-1') }} h-full rounded-full" style="width: {{ $enrollment->progress ?? 0 }}%"></div>
                                                    </div>
                                                    
                                                    <a href="{{ route('parent.child.course.progress', ['child' => $studentData['student']->id, 'course' => $enrollment->course_id]) }}" class="button -xs -purple-1 text-white w-1/1 justify-center">
                                                        <i class="icon-eye text-12 mr-5"></i>
                                                        View Progress
                                                    </a>
                                                </div>
                                            </div>
                                        @endforeach
                                    </div>
                                @else
                                    <div class="text-center py-40">
                                        <div class="size-80 rounded-full bg-light-3 -dark-bg-dark-3 d-flex justify-center items-center mx-auto mb-20">
                                            <i class="icon-book text-light-1 text-32"></i>
                                        </div>
                                        <h4 class="text-16 fw-500 text-dark-1 mb-5">No @lmsterm('Study Materials') Enrolled</h4>
                                        <p class="text-14 text-light-1">Your child hasn't enrolled in any courses yet.</p>
                                    </div>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Quiz Attempts -->
                <div class="row mb-30">
                    <div class="col-12">
                        <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                                <h3 class="text-17 lh-1 fw-500">Recent Quiz Results</h3>
                            </div>
                            <div class="py-30 px-30">
                                @if($studentData['quiz_attempts']->isNotEmpty())
                                    <div class="table-responsive">
                                        <table class="table w-1/1">
                                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                                <tr>
                                                    <th>Quiz</th>
                                                    <th>Score</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody class="text-14">
                                                @foreach($studentData['quiz_attempts'] as $attempt)
                                                    <tr class="border-bottom-light">
                                                        <td>{{ $attempt->quiz->title }}</td>
                                                        <td>{{ number_format($attempt->score, 1) }}%</td>
                                                        <td>
                                                            <div class="badge {{ $attempt->passed ? 'bg-green-1 text-white' : 'bg-red-1 text-white' }}">
                                                                {{ $attempt->passed ? 'Passed' : 'Failed' }}
                                                            </div>
                                                        </td>
                                                        <td>{{ $attempt->completed_at ? $attempt->completed_at->format('M d, Y') : 'Incomplete' }}</td>
                                                        <td>
                                                            <a href="{{ route('parent.child.quiz-results', ['child' => $studentData['student']->id, 'quizAttempt' => $attempt->id]) }}" class="button -sm -purple-1 text-white">View Details</a>
                                                        </td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                @else
                                    <div class="text-center py-20">
                                        <p>No quiz attempts yet.</p>
                                    </div>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Performance Activity -->
                <div class="row mb-30">
                    <div class="col-12">
                        <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                                <h3 class="text-17 lh-1 fw-500">Recent Performance Activity</h3>
                            </div>
                            <div class="py-30 px-30">
                                @if($studentData['recent_performances']->isNotEmpty())
                                    <div class="table-responsive">
                                        <table class="table w-1/1">
                                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                                <tr>
                                                    <th>Subject</th>
                                                    <th>Metric</th>
                                                    <th>Score</th>
                                                    <th>Level</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody class="text-14">
                                                @foreach($studentData['recent_performances'] as $performance)
                                                    <tr class="border-bottom-light">
                                                        <td>{{ $performance->subject->name ?? 'N/A' }}</td>
                                                        <td>{{ $performance->performanceMetric->name ?? 'General Assessment' }}</td>
                                                        <td>
                                                            <span class="text-{{ $performance->percentage_score >= 80 ? 'green' : ($performance->percentage_score >= 70 ? 'blue' : ($performance->percentage_score >= 60 ? 'orange' : 'red')) }}-1 fw-500">
                                                                {{ number_format($performance->percentage_score, 1) }}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            @php
                                                                $level = 'Fail';
                                                                $badgeColor = 'bg-red-1';
                                                                if ($performance->percentage_score >= 80) {
                                                                    $level = 'Distinction';
                                                                    $badgeColor = 'bg-green-1';
                                                                } elseif ($performance->percentage_score >= 70) {
                                                                    $level = 'Credit';
                                                                    $badgeColor = 'bg-blue-1';
                                                                } elseif ($performance->percentage_score >= 60) {
                                                                    $level = 'Pass';
                                                                    $badgeColor = 'bg-orange-1';
                                                                }
                                                            @endphp
                                                            <span class="badge {{ $badgeColor }} text-white">{{ $level }}</span>
                                                        </td>
                                                        <td>{{ $performance->last_calculated_at ? $performance->last_calculated_at->format('M d, Y') : 'N/A' }}</td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                @else
                                    <div class="text-center py-20">
                                        <p>No performance data available yet.</p>
                                    </div>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Activity -->
                <div class="row mb-30">
                    <div class="col-12">
                        <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                                <h3 class="text-17 lh-1 fw-500">
                                    <i class="icon-history text-purple-1 mr-10"></i>
                                    Recent Learning Activity
                                </h3>
                            </div>
                            <div class="py-30 px-30">
                                @if($studentData['recent_activity']->isNotEmpty())
                                    <div class="row y-gap-20">
                                        @foreach($studentData['recent_activity'] as $activity)
                                            <div class="col-lg-4 col-md-6 col-sm-12">
                                                <div class="rounded-12 bg-light-2 -dark-bg-dark-2 p-20 h-100 border-light -dark-border-dark-2">
                                                    <div class="d-flex items-center mb-15">
                                                        <div class="size-45 rounded-10 bg-purple-3 d-flex justify-center items-center mr-15">
                                                            <i class="icon-play-button text-purple-1 text-18"></i>
                                                        </div>
                                                        <div class="size-8 rounded-full bg-green-1"></div>
                                                    </div>
                                                    
                                                    <h4 class="text-15 lh-15 fw-500 text-dark-1 mb-10">{{ $activity->course->title }}</h4>
                                                    
                                                    <div class="d-flex items-center text-13 text-light-1 mb-15">
                                                        <i class="icon-clock text-12 mr-5"></i>
                                                        {{ $activity->updated_at->diffForHumans() }}
                                                    </div>
                                                    
                                                    <div class="d-flex items-center justify-between">
                                                        <div class="text-12 text-light-1">
                                                            Progress: {{ number_format($activity->progress ?? 0) }}%
                                                        </div>
                                                        <div class="progress-bar bg-light-3 -dark-bg-dark-5 h-3 rounded-full" style="width: 60px;">
                                                            <div class="progress-bar__item bg-purple-1 h-full rounded-full" style="width: {{ $activity->progress ?? 0 }}%"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        @endforeach
                                    </div>
                                @else
                                    <div class="text-center py-40">
                                        <div class="size-80 rounded-full bg-light-3 -dark-bg-dark-3 d-flex justify-center items-center mx-auto mb-20">
                                            <i class="icon-history text-light-1 text-32"></i>
                                        </div>
                                        <h4 class="text-16 fw-500 text-dark-1 mb-5">No Recent Activity</h4>
                                        <p class="text-14 text-light-1">Your child hasn't been active in any courses recently.</p>
                                    </div>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
            @endif
        @endif
    </div>
</x-dashboard-layout> 