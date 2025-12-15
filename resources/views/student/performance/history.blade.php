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
            <h1 class="text-30 lh-12 fw-700">Performance History</h1>
            <div class="mt-10">Your academic performance history and progress</div>
        </div>
        <div class="col-auto">
            <a href="{{ route('student.performance.overview') }}" class="button -sm -light-3 text-dark-1">
                <i class="icon-arrow-left mr-10"></i>
                Back to Overview
            </a>
        </div>
    </div>

    <!-- Filter Section -->
    <div class="row mb-30">
        <div class="col-12">
            <div class="py-20 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <form action="{{ route('student.performance.history') }}" method="GET" class="row y-gap-20">
                    <div class="col-xl-3 col-lg-6">
                        <div class="text-14 lh-1 fw-500 text-dark-1 mb-10">Subject</div>
                        <select name="subject_id" class="form-select">
                            <option value="">All Subjects</option>
                            @foreach($performances->unique('subject_id') as $performance)
                                <option value="{{ $performance->subject_id }}" {{ request('subject_id') == $performance->subject_id ? 'selected' : '' }}>
                                    {{ $performance->subject->name }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    
                    <div class="col-xl-3 col-lg-6">
                        <div class="text-14 lh-1 fw-500 text-dark-1 mb-10">Metric</div>
                        <select name="metric_id" class="form-select">
                            <option value="">All Metrics</option>
                            @foreach($performances->unique('performance_metric_id') as $performance)
                                <option value="{{ $performance->performance_metric_id }}" {{ request('metric_id') == $performance->performance_metric_id ? 'selected' : '' }}>
                                    {{ $performance->performanceMetric->name }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    
                    <div class="col-xl-3 col-lg-6">
                        <div class="text-14 lh-1 fw-500 text-dark-1 mb-10">Grade Level</div>
                        <select name="grade_level_id" class="form-select">
                            <option value="">All Grade Levels</option>
                            @foreach($performances->unique('grade_level_id') as $performance)
                                <option value="{{ $performance->grade_level_id }}" {{ request('grade_level_id') == $performance->grade_level_id ? 'selected' : '' }}>
                                    {{ $performance->gradeLevel->name }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                    
                    <div class="col-xl-3 col-lg-6 d-flex align-items-end">
                        <button type="submit" class="button -md -purple-1 text-white">
                            <i class="icon-filter mr-10"></i>
                            Apply Filters
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- History Table -->
    <div class="row">
        <div class="col-12">
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <div class="d-flex justify-between items-center">
                    <h4 class="text-20 lh-1 fw-500">Performance History</h4>
                </div>

                @if($performances->count() > 0)
                <div class="table-responsive mt-30">
                    <table class="table w-1/1">
                        <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                            <tr>
                                <th>Date</th>
                                <th>Subject</th>
                                <th>Metric</th>
                                <th>Grade Level</th>
                                <th>Score</th>
                                <th>Level</th>
                            </tr>
                        </thead>
                        <tbody class="text-14">
                            @foreach($performances as $performance)
                            <tr class="border-bottom-light">
                                <td>{{ $performance->last_calculated_at->format('M d, Y') }}</td>
                                <td>
                                    <a href="{{ route('student.performance.subject', $performance->subject) }}" class="text-purple-1">
                                        {{ $performance->subject->name }}
                                    </a>
                                </td>
                                <td>{{ $performance->performanceMetric->name }}</td>
                                <td>{{ $performance->gradeLevel->name }}</td>
                                <td>{{ number_format($performance->percentage_score, 1) }}</td>
                                <td>
                                    @php
                                        $levelColor = '#6440FB'; // Default purple
                                        $levelBg = 'rgba(100, 64, 251, 0.1)'; // Default light purple
                                        $levelName = 'Unknown';
                                        
                                        switch ($performance->level) {
                                            case 'Distinction':
                                                $levelColor = '#00A44B';
                                                $levelBg = 'rgba(0, 164, 75, 0.1)';
                                                $levelName = 'Distinction';
                                                break;
                                            case 'Credit':
                                                $levelColor = '#0095FF';
                                                $levelBg = 'rgba(0, 149, 255, 0.1)';
                                                $levelName = 'Credit';
                                                break;
                                            case 'Pass':
                                                $levelColor = '#FFC221';
                                                $levelBg = 'rgba(255, 194, 33, 0.1)';
                                                $levelName = 'Pass';
                                                break;
                                            case 'Needs Improvement':
                                                $levelColor = '#E53535';
                                                $levelBg = 'rgba(229, 53, 53, 0.1)';
                                                $levelName = 'Needs Improvement';
                                                break;
                                        }
                                    @endphp
                                    
                                    <div class="d-inline-block py-5 px-10 rounded-4" style="background-color: {{ $levelBg }}">
                                        <span class="text-14 fw-500" style="color: {{ $levelColor }}">{{ $levelName }}</span>
                                    </div>
                                </td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-30">
                    {{ $performances->withQueryString()->links() }}
                </div>
                @else
                <div class="py-30 mt-10 text-center">
                    <div class="text-16">No performance history found.</div>
                    <div class="text-14 mt-5">Complete more activities to build your performance history.</div>
                </div>
                @endif
            </div>
        </div>
    </div>
</div>
</x-dashboard-layout> 