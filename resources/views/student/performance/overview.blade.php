<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
    </x-slot>

<div class="dashboard__content bg-light-4">
    <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
        <div class="col-auto">
            <h1 class="text-30 lh-12 fw-700">Performance Overview</h1>
            <div class="mt-10">Your academic performance across all subjects</div>
        </div>
    </div>

    <!-- Overall Performance Card -->
    <div class="row y-gap-30">
        <div class="col-12">
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <div class="d-flex justify-between items-center">
                    <h4 class="text-20 lh-1 fw-500">Overall Performance</h4>
                    <div class="size-50 flex-center rounded-full bg-purple-3">
                        <i class="text-purple-1 text-20 icon-badge"></i>
                    </div>
                </div>

                @if ($overallRanking)
                <div class="row y-gap-20 pt-30">
                    <div class="col-lg-4">
                        <div class="text-center py-30 px-30 rounded-8 bg-light-3 -dark-bg-dark-2">
                            <div class="text-14 lh-1">Your Rank</div>
                            <div class="text-40 lh-11 text-purple-1 fw-700 mt-20">{{ $overallRanking->rank }}</div>
                            <div class="text-14 lh-1 mt-5">out of {{ $overallRanking->total_students }} students</div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4">
                        <div class="text-center py-30 px-30 rounded-8 bg-light-3 -dark-bg-dark-2">
                            <div class="text-14 lh-1">Percentile</div>
                            <div class="text-40 lh-11 text-purple-1 fw-700 mt-20">{{ number_format($overallRanking->percentile, 1) }}</div>
                            <div class="text-14 lh-1 mt-5">Better than {{ number_format($overallRanking->percentile, 1) }}% of students</div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4">
                        <div class="text-center py-30 px-30 rounded-8 bg-light-3 -dark-bg-dark-2">
                            <div class="text-14 lh-1">Grade Level</div>
                            <div class="text-40 lh-11 text-purple-1 fw-700 mt-20">{{ $overallRanking->gradeLevel->name }}</div>
                            <div class="text-14 lh-1 mt-5">Current academic level</div>
                        </div>
                    </div>
                </div>
                @else
                <div class="py-20 mt-20 text-center">
                    <div class="text-16">No overall ranking data available yet.</div>
                    <div class="text-14 mt-5">Rankings are generated periodically based on your academic activities.</div>
                </div>
                @endif
            </div>
        </div>
    </div>

    <!-- Best Performing Subjects -->
    <div class="row y-gap-30 pt-30">
        <div class="col-12">
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <div class="d-flex justify-between items-center">
                    <h4 class="text-20 lh-1 fw-500">Your Best Performing Subjects</h4>
                    <a href="{{ route('student.performance.rankings') }}" class="text-14 text-purple-1 underline">View All Rankings</a>
                </div>

                @if (!empty($bestSubjects))
                <div class="row y-gap-20 pt-30">
                    @foreach ($bestSubjects as $item)
                    <div class="col-lg-4">
                        <div class="py-25 px-20 rounded-8 bg-light-3 -dark-bg-dark-2">
                            <div class="d-flex justify-between items-center">
                                <div>
                                    <div class="text-17 fw-500">{{ $item['subject']->name }}</div>
                                    @php
                                        $level = null;
                                        foreach ($performanceLevels as $lvl) {
                                            if ($item['average_score'] >= $lvl->min_score && $item['average_score'] <= $lvl->max_score) {
                                                $level = $lvl;
                                                break;
                                            }
                                        }
                                    @endphp
                                    
                                    @if ($level)
                                    <div class="d-inline-block py-5 px-10 rounded-4 mt-10" style="background-color: {{ $level->color_code . '20' }};">
                                        <span class="text-14 fw-500" style="color: {{ $level->color_code }};">{{ $level->name }}</span>
                                    </div>
                                    @endif
                                </div>
                                <div class="text-30 lh-1 fw-700">{{ number_format($item['average_score'], 1) }}</div>
                            </div>
                            
                            @if ($item['ranking'])
                            <div class="d-flex justify-between items-center mt-20 py-10 border-top-light">
                                <div class="text-14">Rank: <span class="fw-500">{{ $item['ranking']->rank }}</span>/{{ $item['ranking']->total_students }}</div>
                                <div class="text-14">Percentile: <span class="fw-500">{{ number_format($item['ranking']->percentile, 1) }}</span></div>
                            </div>
                            @endif
                            
                            <div class="d-flex justify-end mt-15">
                                <a href="{{ route('student.performance.subject', $item['subject']) }}" class="button -sm -purple-1 text-white">View Details</a>
                            </div>
                        </div>
                    </div>
                    @endforeach
                </div>
                @else
                <div class="py-30 mt-10 text-center">
                    <div class="text-16">No subject performance data available yet.</div>
                    <div class="text-14 mt-5">Complete quizzes and assignments to see your performance metrics.</div>
                </div>
                @endif
            </div>
        </div>
    </div>

    <!-- All Subjects Performance -->
    <div class="row y-gap-30 pt-30 pb-30">
        <div class="col-12">
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <div class="d-flex justify-between items-center">
                    <h4 class="text-20 lh-1 fw-500">All Subjects Performance</h4>
                </div>

                @if (!empty($subjectPerformances))
                <div class="table-responsive mt-30">
                    <table class="table w-1/1">
                        <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                            <tr>
                                <th>Subject</th>
                                <th>Average Score</th>
                                <th>Performance Level</th>
                                <th>Rank</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody class="text-14">
                            @foreach ($subjectPerformances as $item)
                            <tr class="border-bottom-light">
                                <td>{{ $item['subject']->name }}</td>
                                <td>{{ number_format($item['average_score'], 1) }}</td>
                                <td>
                                    @php
                                        $level = null;
                                        foreach ($performanceLevels as $lvl) {
                                            if ($item['average_score'] >= $lvl->min_score && $item['average_score'] <= $lvl->max_score) {
                                                $level = $lvl;
                                                break;
                                            }
                                        }
                                    @endphp
                                    
                                    @if ($level)
                                    <div class="d-inline-block py-5 px-10 rounded-4" style="background-color: {{ $level->color_code . '20' }};">
                                        <span class="text-14 fw-500" style="color: {{ $level->color_code }};">{{ $level->name }}</span>
                                    </div>
                                    @else
                                    <span>-</span>
                                    @endif
                                </td>
                                <td>
                                    @if ($item['ranking'])
                                    {{ $item['ranking']->rank }} / {{ $item['ranking']->total_students }}
                                    @else
                                    -
                                    @endif
                                </td>
                                <td>
                                    <a href="{{ route('student.performance.subject', $item['subject']) }}" class="button -sm -light-3 text-purple-1">View Details</a>
                                </td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                @else
                <div class="py-30 mt-10 text-center">
                    <div class="text-16">No subject performance data available yet.</div>
                </div>
                @endif
            </div>
        </div>
    </div>
</div>
</x-dashboard-layout> 