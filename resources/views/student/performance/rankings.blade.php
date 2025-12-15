<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 md:mt-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Performance Rankings</h1>
                <div class="mt-10">See how you rank compared to other students in your subjects and grade level.</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('student.performance.overview') }}" class="button -blue-1 h-40 px-30">Back to Overview</a>
            </div>
        </div>

        <div class="row y-gap-30">
            <!-- Filters Card -->
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 py-20 px-30">
                    <form action="{{ route('student.performance.rankings') }}" method="GET" class="row y-gap-20 items-end">
                        <div class="col-xl-4 col-lg-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Subject</label>
                            <select name="subject_id" class="form-control">
                                <option value="">All Subjects</option>
                                @foreach($subjects as $subject)
                                    <option value="{{ $subject->id }}" {{ request('subject_id') == $subject->id ? 'selected' : '' }}>
                                        {{ $subject->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        
                        <div class="col-xl-4 col-lg-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Grade Level</label>
                            <select name="grade_level_id" class="form-control">
                                <option value="">All Grade Levels</option>
                                @foreach($gradeLevels as $gradeLevel)
                                    <option value="{{ $gradeLevel->id }}" {{ request('grade_level_id') == $gradeLevel->id ? 'selected' : '' }}>
                                        {{ $gradeLevel->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        
                        <div class="col-xl-2 col-lg-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Ranking Type</label>
                            <select name="ranking_type" class="form-control">
                                <option value="">All Types</option>
                                <option value="subject_grade" {{ request('ranking_type') == 'subject_grade' ? 'selected' : '' }}>Subject in Grade</option>
                                <option value="subject_all" {{ request('ranking_type') == 'subject_all' ? 'selected' : '' }}>Subject Overall</option>
                                <option value="overall" {{ request('ranking_type') == 'overall' ? 'selected' : '' }}>Overall Performance</option>
                            </select>
                        </div>
                        
                        <div class="col-xl-2 col-lg-6">
                            <button type="submit" class="button -md -dark-1 text-white w-1/1">Apply Filters</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Rankings Card -->
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 py-30 px-30">
                    <div class="d-flex justify-between items-center">
                        <h2 class="text-20 lh-1 fw-500">Your Rankings</h2>
                    </div>
                    
                    <div class="mt-30">
                        @if($rankings->isNotEmpty())
                            <div class="overflow-x-auto">
                                <table class="table w-1/1">
                                    <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                        <tr>
                                            <th class="p-10">Ranking Type</th>
                                            <th class="p-10">Subject</th>
                                            <th class="p-10">Grade Level</th>
                                            <th class="p-10">Rank</th>
                                            <th class="p-10">Total Students</th>
                                            <th class="p-10">Percentile</th>
                                        </tr>
                                    </thead>
                                    <tbody class="text-14">
                                        @foreach($rankings as $ranking)
                                            @php
                                                $percentile = round($ranking->percentile);
                                                $colorClass = '';
                                                
                                                if ($percentile >= 90) {
                                                    $colorClass = 'text-green-1';
                                                } elseif ($percentile >= 75) {
                                                    $colorClass = 'text-blue-1';
                                                } elseif ($percentile >= 50) {
                                                    $colorClass = 'text-yellow-1';
                                                } else {
                                                    $colorClass = 'text-red-1';
                                                }
                                                
                                                $rankingType = 'Subject in Grade';
                                                if ($ranking->ranking_type === 'subject_all') {
                                                    $rankingType = 'Subject Overall';
                                                } elseif ($ranking->ranking_type === 'overall') {
                                                    $rankingType = 'Overall Performance';
                                                }
                                            @endphp
                                            <tr class="border-bottom-light">
                                                <td class="p-10">{{ $rankingType }}</td>
                                                <td class="p-10">
                                                    @if($ranking->subject)
                                                        <a href="{{ route('student.performance.subject', $ranking->subject) }}" class="text-purple-1">
                                                            {{ $ranking->subject->name }}
                                                        </a>
                                                    @else
                                                        <span class="text-light-1">All Subjects</span>
                                                    @endif
                                                </td>
                                                <td class="p-10">{{ $ranking->gradeLevel->name }}</td>
                                                <td class="p-10 fw-500">{{ number_format($ranking->rank) }}</td>
                                                <td class="p-10">{{ number_format($ranking->total_students) }}</td>
                                                <td class="p-10 fw-700 {{ $colorClass }}">{{ $percentile }}%</td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="mt-30">
                                {{ $rankings->links() }}
                            </div>
                        @else
                            <div class="d-flex items-center justify-center py-40">
                                <div class="text-14 lh-1 text-light-1">No ranking data available for the selected filters.</div>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
            
            <!-- Understanding Rankings Card -->
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 py-30 px-30">
                    <div class="d-flex justify-between items-center">
                        <h2 class="text-20 lh-1 fw-500">Understanding Your Rankings</h2>
                    </div>
                    
                    <div class="mt-30">
                        <div class="row y-gap-20">
                            <div class="col-xl-6">
                                <div class="border-light rounded-8 p-20">
                                    <h3 class="text-16 fw-500 mb-15">Ranking Types Explained</h3>
                                    <ul class="list-disc list-inside">
                                        <li class="text-14 mb-8"><strong>Subject in Grade:</strong> Your position among students in the same subject and grade level.</li>
                                        <li class="text-14 mb-8"><strong>Subject Overall:</strong> Your position among all students studying this subject across all grade levels.</li>
                                        <li class="text-14 mb-8"><strong>Overall Performance:</strong> Your overall ranking across all subjects in your grade level.</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div class="col-xl-6">
                                <div class="border-light rounded-8 p-20">
                                    <h3 class="text-16 fw-500 mb-15">Understanding Percentile</h3>
                                    <ul class="list-disc list-inside">
                                        <li class="text-14 mb-8"><strong>90%+ (Excellent):</strong> You're performing better than 90% of your peers.</li>
                                        <li class="text-14 mb-8"><strong>75-89% (Very Good):</strong> You're in the top quarter of students.</li>
                                        <li class="text-14 mb-8"><strong>50-74% (Good):</strong> You're performing above the median.</li>
                                        <li class="text-14 mb-8"><strong>Below 50% (Needs Improvement):</strong> You're below the median performance.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mt-20">
                            <div class="col-12">
                                <div class="bg-light-4 -dark-bg-dark-2 rounded-8 p-20">
                                    <h3 class="text-16 fw-500 mb-10">Important Note</h3>
                                    <p class="text-14">Rankings are updated regularly based on your latest assessment results. Focus on improving your performance over time rather than just comparing your rank to others. The EPQ system is designed to help you identify your strengths and areas for improvement.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 