<x-dashboard-layout :title="__('My Children')">
    <x-slot name="header">
        @include('layouts.partials.parent.header')
    </x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.parent.sidebar')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">{{ __('My Children') }}</h1>
                <div class="mt-10">{{ __('Monitor your children\'s academic performance, rankings, and progress.') }}</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('parent.link.create') }}" class="button -md -purple-1 text-white">
                    <i class="icon-plus mr-8"></i>
                    {{ __('Link New Child') }}
                </a>
            </div>
        </div>

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

        @if($linkedStudents && $linkedStudents->count() > 0)
            <!-- Child Filter Section -->
            @if($linkedStudents->count() > 1)
                <div class="row mb-30">
                    <div class="col-12">
                        <div class="py-20 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <form method="GET" action="{{ route('parent.linked_students.index') }}" class="d-flex items-center">
                                <div class="lh-1 fw-500 mr-20">Select Child:</div>
                                <select name="child_id" id="child_id" class="form-control mr-15" onchange="this.form.submit()">
                                    @foreach($linkedStudents as $student)
                                        <option value="{{ $student->id }}" {{ $selectedStudent && $selectedStudent->id == $student->id ? 'selected' : '' }}>
                                            {{ $student->name }}
                                        </option>
                                    @endforeach
                                </select>
                                <noscript>
                                    <button type="submit" class="button -sm -purple-1 text-white">View</button>
                                </noscript>
                            </form>
                        </div>
                    </div>
                </div>
            @endif

            <!-- All Children Summary Cards -->
            <div class="row y-gap-30 mb-30">
                <div class="col-12">
                    <div class="d-flex justify-between items-center py-20 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                        <h3 class="text-18 lh-1 fw-500">All Children - Quick Overview</h3>
                    </div>
                </div>
                
                @foreach($childrenPerformanceData as $childId => $childData)
                    <div class="col-xl-4 col-lg-6 col-md-6">
                        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100 {{ $selectedStudent && $selectedStudent->id == $childId ? 'border-purple-1' : '' }}">
                            <div class="d-flex items-center justify-between mb-20">
                                <h4 class="text-20 fw-500">{{ $childData['student']->name }}</h4>
                                @if($childData['overall_ranking'])
                                    <div class="badge bg-purple-1 text-white">
                                        {{ $childData['overall_ranking']->formatted_rank }}
                                    </div>
                                @endif
                            </div>

                            @if($childData['has_data'])
                                <div class="row y-gap-15">
                                    @if($childData['overall_ranking'])
                                        <div class="col-12">
                                            <div class="d-flex items-center justify-between">
                                                <span class="text-14 text-light-1">Overall Rank:</span>
                                                <span class="text-14 fw-500">{{ $childData['overall_ranking']->rank }}/{{ $childData['overall_ranking']->total_students }}</span>
                                            </div>
                                            <div class="d-flex items-center justify-between mt-5">
                                                <span class="text-14 text-light-1">Percentile:</span>
                                                <span class="text-14 fw-500 text-purple-1">{{ number_format($childData['overall_ranking']->percentile, 1) }}%</span>
                                            </div>
                                            <div class="d-flex items-center justify-between mt-5">
                                                <span class="text-14 text-light-1">Performance Tier:</span>
                                                <span class="text-14 fw-500 text-green-1">{{ $childData['overall_ranking']->performance_tier }}</span>
                                            </div>
                                        </div>
                                    @endif

                                    <div class="col-12">
                                        <div class="d-flex items-center justify-between">
                                            <span class="text-14 text-light-1">@lmsterm('Study Materials'):</span>
                                            <span class="text-14 fw-500">{{ $childData['total_courses'] }}</span>
                                        </div>
                                        <div class="d-flex items-center justify-between mt-5">
                                            <span class="text-14 text-light-1">Completed:</span>
                                            <span class="text-14 fw-500">{{ $childData['completed_courses'] }}</span>
                                        </div>
                                        <div class="d-flex items-center justify-between mt-5">
                                            <span class="text-14 text-light-1">Avg Progress:</span>
                                            <span class="text-14 fw-500 text-purple-1">{{ $childData['avg_progress'] }}%</span>
                                        </div>
                                    </div>
                                </div>
                            @else
                                <div class="text-center py-20">
                                    <i class="icon-chart text-40 text-light-4 mb-10"></i>
                                    <p class="text-14 text-light-1">No performance data available yet</p>
                                </div>
                            @endif

                            <div class="mt-20">
                                <form method="GET" action="{{ route('parent.linked_students.index') }}" class="d-inline">
                                    <input type="hidden" name="child_id" value="{{ $childId }}">
                                    <button type="submit" class="button -sm {{ $selectedStudent && $selectedStudent->id == $childId ? '-purple-1 text-white' : '-outline-purple-1 text-purple-1' }} w-1/1">
                                        {{ $selectedStudent && $selectedStudent->id == $childId ? 'Currently Viewing' : 'View Details' }}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>

            @if($selectedStudentData && $hasPerformanceData)
                <!-- Detailed Performance Data for Selected Child -->
                <div class="row y-gap-30">
                    <div class="col-12">
                        <div class="d-flex justify-between items-center py-20 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <h3 class="text-18 lh-1 fw-500">{{ $selectedStudent->name }}'s Detailed Performance</h3>
                            <div class="d-flex x-gap-10">
                                <a href="{{ route('parent.child.dashboard', ['child' => $selectedStudent->id]) }}" class="button -sm -purple-1 text-white">
                                    <i class="icon-grid text-16 mr-5"></i> Full Dashboard
                                </a>
                                <a href="{{ route('parent.child.grades', ['child' => $selectedStudent->id]) }}" class="button -sm -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                                    <i class="icon-star text-16 mr-5"></i> Grades
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Overall Performance Card -->
                    @if($selectedStudentData['overall_ranking'])
                        <div class="col-xl-4 col-lg-6">
                            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                                <div class="text-center">
                                    <div class="size-80 rounded-full d-flex justify-center items-center bg-purple-3 mx-auto mb-20">
                                        <i class="icon-trophy text-purple-1 text-30"></i>
                                    </div>
                                    <h4 class="text-20 fw-500 mb-10">Overall Ranking</h4>
                                    <div class="text-32 lh-1 fw-700 text-purple-1 mb-10">{{ $selectedStudentData['overall_ranking']->formatted_rank }}</div>
                                    <div class="text-14 text-light-1 mb-15">
                                        out of {{ $selectedStudentData['overall_ranking']->total_students }} students
                                    </div>
                                    <div class="d-flex justify-center items-center">
                                        <div class="badge bg-green-1 text-white mr-10">
                                            {{ number_format($selectedStudentData['overall_ranking']->percentile, 1) }}th Percentile
                                        </div>
                                        <div class="badge bg-blue-1 text-white">
                                            {{ $selectedStudentData['overall_ranking']->performance_tier }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    @endif

                    <!-- Subject Rankings -->
                    @if($selectedStudentData['subject_rankings']->isNotEmpty())
                        <div class="col-xl-8 col-lg-6">
                            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                                <h4 class="text-18 fw-500 mb-20">Subject Rankings</h4>
                                <div class="row y-gap-15">
                                    @foreach($selectedStudentData['subject_rankings'] as $ranking)
                                        <div class="col-md-6">
                                            <div class="d-flex items-center justify-between p-15 rounded-8 bg-light-2 -dark-bg-dark-2">
                                                <div>
                                                    <div class="text-15 fw-500">{{ $ranking->subject->name }}</div>
                                                    <div class="text-13 text-light-1">{{ $ranking->formatted_rank }} ({{ number_format($ranking->percentile, 1) }}%)</div>
                                                </div>
                                                <div class="badge {{ $ranking->percentile >= 75 ? 'bg-green-1' : ($ranking->percentile >= 50 ? 'bg-orange-1' : 'bg-red-1') }} text-white">
                                                    {{ $ranking->performance_tier }}
                                                </div>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        </div>
                    @endif

                    <!-- Subject Performance Averages -->
                    @if($selectedStudentData['subject_averages']->isNotEmpty())
                        <div class="col-12">
                            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                                <h4 class="text-18 fw-500 mb-20">Subject Performance Averages</h4>
                                <div class="row y-gap-20">
                                    @foreach($selectedStudentData['subject_averages'] as $subjectAverage)
                                        <div class="col-xl-3 col-lg-4 col-md-6">
                                            <div class="p-20 rounded-8 border-light -dark-border-dark-2">
                                                <div class="d-flex items-center justify-between mb-10">
                                                    <h5 class="text-16 fw-500">{{ $subjectAverage['subject']->name }}</h5>
                                                    <span class="text-16 fw-500 {{ $subjectAverage['text_class'] }}">
                                                        {{ $subjectAverage['average_score'] }}%
                                                    </span>
                                                </div>
                                                <div class="progress-bar bg-light-3 -dark-bg-dark-5 h-6 rounded-full">
                                                    <div class="progress-bar__item {{ $subjectAverage['css_class'] }} h-full rounded-full" style="width: {{ $subjectAverage['average_score'] }}%"></div>
                                                </div>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        </div>
                    @endif

                    <!-- Recent Performance History -->
                    @if($selectedStudentData['recent_performances']->isNotEmpty())
                        <div class="col-12">
                            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                                <h4 class="text-18 fw-500 mb-20">Recent Performance Activity</h4>
                                <div class="overflow-hidden">
                                    <table class="table w-1/1">
                                        <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                            <tr>
                                                <th>Subject</th>
                                                <th>Metric</th>
                                                <th class="text-center">Score</th>
                                                <th class="text-center">Level</th>
                                                <th class="text-center">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody class="text-14">
                                            @foreach($selectedStudentData['recent_performances'] as $performance)
                                                <tr class="border-bottom-light">
                                                    <td>{{ $performance->subject->name }}</td>
                                                    <td>{{ $performance->performanceMetric->name ?? 'Overall' }}</td>
                                                    <td class="text-center">
                                                        <span class="fw-500 {{ $performance->percentage_score >= 80 ? 'text-green-1' : ($performance->percentage_score >= 65 ? 'text-blue-1' : ($performance->percentage_score >= 50 ? 'text-orange-1' : 'text-red-1')) }}">
                                                            {{ number_format($performance->percentage_score, 1) }}%
                                                        </span>
                                                    </td>
                                                    <td class="text-center">
                                                        <span class="badge {{ $performance->percentage_score >= 80 ? 'bg-green-1' : ($performance->percentage_score >= 65 ? 'bg-blue-1' : ($performance->percentage_score >= 50 ? 'bg-orange-1' : 'bg-red-1')) }} text-white">
                                                            {{ $performance->proficiency_level }}
                                                        </span>
                                                    </td>
                                                    <td class="text-center">{{ $performance->last_calculated_at ? $performance->last_calculated_at->format('M d, Y') : 'N/A' }}</td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    @endif
                </div>
            @elseif($selectedStudentData && !$selectedStudentData['has_data'])
                <!-- No Performance Data for Selected Child -->
                <div class="row">
                    <div class="col-12">
                        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                            <div class="text-center py-40">
                                <img src="{{ asset('img/dashboard/empty-state/performance.svg') }}" alt="{{ __('No Performance Data') }}" style="max-width: 200px;" class="mb-20">
                                <h4 class="text-18 fw-500 mb-10">{{ __('No Performance Data Available') }}</h4>
                                <p class="text-14 mb-20">{{ __(':childName has not yet participated in any assessments or activities that generate performance data.', ['childName' => $selectedStudent->name]) }}</p>
                                <a href="{{ route('parent.child.dashboard', ['child' => $selectedStudent->id]) }}" class="button -md -purple-1 text-white">
                                    {{ __('View Child Dashboard') }}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            @endif
        @else
            <!-- Empty State -->
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <div class="text-center py-40">
                    <img src="{{ asset('img/dashboard/empty-state/students.svg') }}" alt="{{ __('No Linked Students') }}" style="max-width: 200px;" class="mb-20">
                    <h4 class="text-18 fw-500 mb-10">{{ __('No Children Linked Yet') }}</h4>
                    <p class="text-14 mb-20">{{ __('You have not linked any student accounts. Connect with your child to monitor their academic progress and performance.') }}</p>
                    <div class="row justify-center x-gap-20 y-gap-20">
                        <div class="col-auto">
                            <a href="{{ route('parent.link.create') }}" class="button -md -purple-1 text-white">
                                <i class="icon-ticket text-16 mr-10"></i> {{ __('Use Invite Code') }}
                            </a>
                        </div>
                        <div class="col-auto">
                            <a href="{{ route('parent.connections.create') }}" class="button -md -outline-purple-1 text-purple-1">
                                <i class="icon-send text-16 mr-10"></i> {{ __('Request via Email') }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        @endif
    </div>
</x-dashboard-layout> 