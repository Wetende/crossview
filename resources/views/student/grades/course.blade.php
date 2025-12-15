<x-dashboard-layout>
    {{-- Placeholder: Fetch actual course title --}}
    @php 
        $courseName = "@lmsterm('Study Material') Title for ID: " . ($courseId ?? 'N/A'); 
        $overallGrade = "A-"; // Placeholder
        $gradeItems = [
            ['item' => 'Assignment 1: Introduction', 'grade' => '95/100', 'status' => 'Graded', 'feedback' => 'Excellent work!', 'date' => '2023-10-15'],
            ['item' => 'Quiz 1: Basic Concepts', 'grade' => '88/100', 'status' => 'Graded', 'feedback' => 'Good effort, review topic X.', 'date' => '2023-10-20'],
            ['item' => 'Midterm Project Proposal', 'grade' => 'Pending', 'status' => 'Submitted', 'feedback' => '-', 'date' => '2023-10-25'],
            ['item' => 'Assignment 2: Advanced Techniques', 'grade' => '-', 'status' => 'Not Submitted', 'feedback' => '-', 'date' => 'Due: 2023-11-05'],
        ];
    @endphp
    <x-slot name="title">Grades: {{ $courseName }}</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
        <h1 class="text-30 lh-12 fw-700">Grades: {{ $courseName }}</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.grades.index') }}">My Grades</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.grades.course', ['courseId' => $courseId ?? 1]) }}" class="text-dark-1">{{ $courseName }}</a>
                </div>
            </div>
        </div>
    </x-slot>

    {{-- Adapted content from dshb-grades.html (simplified for student) --}}
    <div class="row y-gap-30">
        <div class="col-12">
            <div class="py-30 px-30 rounded-8 bg-white -dark-bg-dark-1 shadow-4">
                <div class="row justify-between items-center mb-20">
                    <div class="col-auto">
                        <h4 class="text-20 lh-1 fw-500">Grade Report for {{ $courseName }}</h4>
                    </div>
                    <div class="col-auto">
                        <div class="text-16 fw-500">Overall Grade: <span class="text-purple-1">{{ $overallGrade }}</span></div>
                    </div>
                </div>
                
                <div class="tabs -active-purple-2 js-tabs">
                    <div class="tabs__controls d-flex js-tabs-controls">
                        <button class="tabs__button text-14 lh-12 fw-500 text-light-1 js-tabs-button is-active" data-tab-target=".-tab-item-grades" type="button">
                            All Grades
                        </button>
                        {{-- Could add tabs for 'Assignments', 'Quizzes' etc. if needed --}}
                    </div>

                    <div class="tabs__content pt-30 js-tabs-content">
                        <div class="tabs__pane -tab-item-grades is-active">
                            <div class="overflow-scroll scroll-bar-1">
                                <table class="table-2 -border-bottom">
                                    <thead>
                                        <tr>
                                            <th class="text-15 fw-500 text-dark-1">Gradable Item</th>
                                            <th class="text-15 fw-500 text-dark-1 text-center">Grade/Score</th>
                                            <th class="text-15 fw-500 text-dark-1 text-center">Status</th>
                                            <th class="text-15 fw-500 text-dark-1">Feedback</th>
                                            <th class="text-15 fw-500 text-dark-1 text-center">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @forelse ($gradeItems as $item)
                                        <tr>
                                            <td class="text-15 text-dark-1">{{ $item['item'] }}</td>
                                            <td class="text-15 text-dark-1 text-center">{{ $item['grade'] }}</td>
                                            <td class="text-15 text-dark-1 text-center">
                                                <span class="badge {{ 
                                                    $item['status'] == 'Graded' ? 'bg-green-1 text-white' : 
                                                    ($item['status'] == 'Submitted' ? 'bg-blue-1 text-white' : 
                                                    ($item['status'] == 'Pending' ? 'bg-orange-1 text-white' : 'bg-red-1 text-white')) 
                                                }}">{{ $item['status'] }}</span>
                                            </td>
                                            <td class="text-15 text-dark-1">{!! nl2br(e($item['feedback'])) !!}</td>
                                            <td class="text-15 text-dark-1 text-center">{{ $item['date'] }}</td>
                                        </tr>
                                        @empty
                                        <tr>
                                            <td colspan="5" class="text-center py-4">
                                                <i class="icon-inbox text-40 text-light-4"></i>
                                                <p class="mt-10">No grades available for this course yet.</p>
                                            </td>
                                        </tr>
                                        @endforelse

                                        {{-- Course Total (Example) --}}
                                        <tr class="bg-light-5 -dark-bg-dark-2">
                                            <td class="text-15 fw-500 text-dark-1">@lmsterm('Study Material') Total</td>
                                            <td class="text-15 fw-500 text-dark-1 text-center">{{ $overallGrade }}</td>
                                            <td colspan="3"></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-30">
                    <a href="{{ route('student.grades.index') }}" class="button -md -outline-purple-1 text-purple-1">Back to My Grades Overview</a>
                </div>
            </div>
        </div>
    </div>

</x-dashboard-layout> 