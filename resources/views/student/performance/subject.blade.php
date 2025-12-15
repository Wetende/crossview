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
            <h1 class="text-30 lh-12 fw-700">{{ $subject->name }} Performance</h1>
            <div class="mt-10">Detailed performance metrics for this subject</div>
        </div>
        <div class="col-auto">
            <a href="{{ route('student.performance.overview') }}" class="button -sm -light-3 text-dark-1">
                <i class="icon-arrow-left mr-10"></i>
                Back to Overview
            </a>
        </div>
    </div>

    <!-- Subject Overview Card -->
    <div class="row y-gap-30">
        <div class="col-12">
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <div class="d-flex justify-between items-center">
                    <h4 class="text-20 lh-1 fw-500">Subject Overview</h4>
                    <div class="size-50 flex-center rounded-full bg-purple-3">
                        <i class="text-purple-1 text-20 icon-book"></i>
                    </div>
                </div>

                <div class="row y-gap-20 pt-30">
                    <div class="col-lg-4">
                        <div class="text-center py-30 px-30 rounded-8 bg-light-3 -dark-bg-dark-2">
                            <div class="text-14 lh-1">Average Score</div>
                            <div class="text-40 lh-11 text-purple-1 fw-700 mt-20">{{ number_format($averageScore, 1) }}</div>
                            @if($currentLevel)
                            <div class="d-inline-block py-5 px-10 rounded-4 mt-10" style="background-color: {{ $currentLevel->color_code }}20;">
                                <span class="text-14 fw-500" style="color: {{ $currentLevel->color_code }}">{{ $currentLevel->name }}</span>
                            </div>
                            @endif
                        </div>
                    </div>
                    
                    @if($ranking)
                    <div class="col-lg-4">
                        <div class="text-center py-30 px-30 rounded-8 bg-light-3 -dark-bg-dark-2">
                            <div class="text-14 lh-1">Your Rank</div>
                            <div class="text-40 lh-11 text-purple-1 fw-700 mt-20">{{ $ranking->rank }}</div>
                            <div class="text-14 lh-1 mt-5">out of {{ $ranking->total_students }} students</div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4">
                        <div class="text-center py-30 px-30 rounded-8 bg-light-3 -dark-bg-dark-2">
                            <div class="text-14 lh-1">Percentile</div>
                            <div class="text-40 lh-11 text-purple-1 fw-700 mt-20">{{ number_format($ranking->percentile, 1) }}</div>
                            <div class="text-14 lh-1 mt-5">Better than {{ number_format($ranking->percentile, 1) }}% of students</div>
                        </div>
                    </div>
                    @else
                    <div class="col-lg-8">
                        <div class="text-center py-30 px-30 rounded-8 bg-light-3 -dark-bg-dark-2">
                            <div class="text-14 lh-1">Ranking</div>
                            <div class="text-18 lh-11 mt-20">No ranking data available yet for this subject</div>
                            <div class="text-14 lh-1 mt-5">Rankings are generated periodically</div>
                        </div>
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </div>

    <!-- Performance Metrics -->
    <div class="row y-gap-30 pt-30">
        <div class="col-12">
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <div class="d-flex justify-between items-center">
                    <h4 class="text-20 lh-1 fw-500">Performance Metrics</h4>
                </div>

                @if($performances->count() > 0)
                <div class="mt-30">
                    <div class="row y-gap-30">
                        @foreach($performances as $performance)
                        @php
                            $level = null;
                            foreach ($performanceLevels as $lvl) {
                                if ($performance->percentage_score >= $lvl->min_score && $performance->percentage_score <= $lvl->max_score) {
                                    $level = $lvl;
                                    break;
                                }
                            }
                        @endphp
                        <div class="col-lg-6">
                            <div class="py-20 px-20 rounded-8 bg-light-3 -dark-bg-dark-2">
                                <div class="d-flex justify-between items-center">
                                    <h5 class="text-17 fw-500">{{ $performance->performanceMetric->name }}</h5>
                                    <div class="text-14">Score: <span class="text-18 fw-700">{{ number_format($performance->percentage_score, 1) }}</span></div>
                                </div>
                                
                                <div class="d-flex items-center mt-15">
                                    <div class="progress-bar w-1/1">
                                        <div class="progress-bar__bg bg-light-5"></div>
                                        <div class="progress-bar__bar" style="width: {{ $performance->percentage_score }}%; background-color: {{ $level ? $level->color_code : '#6440FB' }}"></div>
                                    </div>
                                </div>
                                
                                @if($level)
                                <div class="d-flex justify-between items-center mt-10">
                                    <div class="text-14">Last Updated: {{ $performance->last_calculated_at->format('M d, Y') }}</div>
                                    <div class="d-inline-block py-5 px-10 rounded-4" style="background-color: {{ $level->color_code }}20;">
                                        <span class="text-14 fw-500" style="color: {{ $level->color_code }}">{{ $level->name }}</span>
                                    </div>
                                </div>
                                @endif
                                
                                @if($performance->performanceMetric->description)
                                <div class="mt-15 py-10 px-15 bg-light-6 -dark-bg-dark-3 rounded-8">
                                    <p class="text-14">{{ $performance->performanceMetric->description }}</p>
                                </div>
                                @endif
                            </div>
                        </div>
                        @endforeach
                    </div>
                </div>
                @else
                <div class="py-30 mt-10 text-center">
                    <div class="text-16">No performance metrics available for this subject yet.</div>
                    <div class="text-14 mt-5">Complete quizzes and assignments to see your performance metrics.</div>
                </div>
                @endif
            </div>
        </div>
    </div>

    <!-- Performance History -->
    <div class="row y-gap-30 pt-30 pb-30">
        <div class="col-12">
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <div class="d-flex justify-between items-center">
                    <h4 class="text-20 lh-1 fw-500">Recent Activity</h4>
                    <a href="{{ route('student.performance.history') }}" class="text-14 text-purple-1 underline">View All History</a>
                </div>

                @if($performances->count() > 0)
                <div class="table-responsive mt-30">
                    <table class="table w-1/1">
                        <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                            <tr>
                                <th>Metric</th>
                                <th>Score</th>
                                <th>Level</th>
                                <th>Last Updated</th>
                            </tr>
                        </thead>
                        <tbody class="text-14">
                            @foreach($performances as $performance)
                            @php
                                $level = null;
                                foreach ($performanceLevels as $lvl) {
                                    if ($performance->percentage_score >= $lvl->min_score && $performance->percentage_score <= $lvl->max_score) {
                                        $level = $lvl;
                                        break;
                                    }
                                }
                            @endphp
                            <tr class="border-bottom-light">
                                <td>{{ $performance->performanceMetric->name }}</td>
                                <td>{{ number_format($performance->percentage_score, 1) }}</td>
                                <td>
                                    @if($level)
                                    <div class="d-inline-block py-5 px-10 rounded-4" style="background-color: {{ $level->color_code }}20;">
                                        <span class="text-14 fw-500" style="color: {{ $level->color_code }}">{{ $level->name }}</span>
                                    </div>
                                    @else
                                    <span>-</span>
                                    @endif
                                </td>
                                <td>{{ $performance->last_calculated_at->format('M d, Y') }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                @else
                <div class="py-30 mt-10 text-center">
                    <div class="text-16">No activity data available for this subject yet.</div>
                </div>
                @endif
            </div>
        </div>
    </div>
</div>
</x-dashboard-layout> 