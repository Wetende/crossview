<x-dashboard-layout>
    {{-- Placeholder: Fetch actual assessment details --}}
    @php
        $activityId = $activityId ?? 'N/A';
        $assessment = null;
        // Sample data structure - this would be fetched from the controller
        $sampleAssessments = [
            '1' => ['title' => 'Introduction Quiz', 'course' => 'History 101', 'type' => 'Quiz', 'description' => 'A short quiz on the introductory concepts of ancient history.', 'questions' => 10, 'time_limit' => '15 minutes', 'attempts_allowed' => 1, 'status' => 'Upcoming', 'due_date' => '2023-10-25'],
            '2' => ['title' => 'Essay: The Roman Empire', 'course' => 'History 101', 'type' => 'Assignment', 'description' => 'Write a 1500-word essay on the rise and fall of the Roman Empire. Include at least 5 scholarly sources.', 'submission_type' => 'File Upload (PDF, DOCX)', 'status' => 'Pending Submission', 'due_date' => '2023-10-28'],
            '3' => ['title' => 'Chapter 3 Quiz', 'course' => 'Mathematics 202', 'type' => 'Quiz', 'description' => 'Quiz covering topics from Chapter 3.', 'questions' => 15, 'time_limit' => '30 minutes', 'attempts_allowed' => 2, 'status' => 'Graded', 'due_date' => '2023-10-15', 'score' => '12/15', 'start_url' => '#', 'review_url' => '#'],
             '4' => ['title' => 'Lab Report 1', 'course' => 'Physics Lab I', 'type' => 'Assignment', 'description' => 'Submit your full lab report for Experiment 1.', 'submission_type' => 'File Upload (PDF)', 'status' => 'Graded', 'due_date' => '2023-10-10', 'score' => '88/100', 'view_submission_url' => '#'],
        ];
        if (array_key_exists($activityId, $sampleAssessments)) {
            $assessment = $sampleAssessments[$activityId];
        }
        $assessmentTitle = $assessment ? $assessment['title'] : 'Assessment Details';
        $courseName = $assessment ? $assessment['course'] : 'Course Name';
    @endphp

    <x-slot name="title">{{ $assessmentTitle }}</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
        <h1 class="text-30 lh-12 fw-700">{{ $assessmentTitle }}</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.assessments.index') }}">My Assessments</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('student.assessments.show', ['activityId' => $activityId]) }}" class="text-dark-1">{{ $assessmentTitle }}</a>
                </div>
            </div>
        </div>
    </x-slot>

    <div class="row y-gap-30 justify-center">
        <div class="col-xl-8 col-lg-10">
            <div class="py-30 px-30 md:px-20 md:py-20 rounded-8 bg-white -dark-bg-dark-1 shadow-4">
                @if ($assessment)
                    <div class="text-center mb-30">
                        <span class="text-14 lh-1 text-purple-1">{{ $assessment['type'] }}</span>
                        <h2 class="text-24 fw-500 mt-5">{{ $assessment['title'] }}</h2>
                        <p class="text-14 text-light-1 mt-5">Course: {{ $assessment['course'] }} | Due: {{ $assessment['due_date'] }}</p>
                    </div>

                    <div class="mb-30">
                        <h5 class="text-17 fw-500 mb-10">Description / Instructions:</h5>
                        <p class="text-15 lh-17 text-dark-1">{{ $assessment['description'] }}</p>
                    </div>

                    @if ($assessment['type'] == 'Quiz')
                    <div class="row y-gap-20 x-gap-20 pb-20 border-bottom-light -dark-border-dark-2">
                        <div class="col-md-6">
                            <div class="d-flex items-center">
                                <i class="icon-time-left text-20 text-purple-1 mr-10"></i>
                                <div class="text-15">Time Limit: <span class="fw-500">{{ $assessment['time_limit'] }}</span></div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex items-center">
                                <i class="icon-question-circle text-20 text-purple-1 mr-10"></i>
                                <div class="text-15">Number of Questions: <span class="fw-500">{{ $assessment['questions'] }}</span></div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="d-flex items-center">
                                <i class="icon-play-button text-20 text-purple-1 mr-10"></i>
                                <div class="text-15">Attempts Allowed: <span class="fw-500">{{ $assessment['attempts_allowed'] }}</span></div>
                            </div>
                        </div>
                    </div>
                    @elseif ($assessment['type'] == 'Assignment')
                    <div class="row y-gap-10 pb-20 border-bottom-light -dark-border-dark-2">
                         <div class="col-12">
                            <div class="d-flex items-center">
                                <i class="icon-file-plus text-20 text-purple-1 mr-10"></i>
                                <div class="text-15">Submission Type: <span class="fw-500">{{ $assessment['submission_type'] }}</span></div>
                            </div>
                        </div>
                    </div>
                    @endif

                    <div class="mt-30 text-center">
                        @if ($assessment['status'] == 'Upcoming' || $assessment['status'] == 'Pending Submission')
                            {{-- This link would eventually lead to the quiz taking page or assignment submission page --}}
                            <a href="{{ $assessment['start_url'] ?? '#' }}" class="button -md -purple-1 text-white">
                                @if ($assessment['type'] == 'Quiz') Start Quiz @else Submit Assignment @endif
                            </a>
                        @elseif ($assessment['status'] == 'Graded' || $assessment['status'] == 'Submitted')
                             <div class="mb-15">
                                <h5 class="text-16 fw-500">Status: <span class="text-green-1">{{ $assessment['status'] }}</span></h5>
                                @if (isset($assessment['score']))
                                    <p class="text-15">Your Score: <span class="fw-500">{{ $assessment['score'] }}</span></p>
                                @endif
                            </div>
                            @if (isset($assessment['review_url']))
                                <a href="{{ $assessment['review_url'] }}" class="button -md -outline-purple-1 text-purple-1 mr-10">Review Quiz</a>
                            @endif
                             @if (isset($assessment['view_submission_url']))
                                <a href="{{ $assessment['view_submission_url'] }}" class="button -md -outline-purple-1 text-purple-1">View Submission</a>
                            @endif
                        @else
                            <p class="text-16 text-red-1">This assessment is currently unavailable.</p>
                        @endif
                    </div>

                @else
                    <div class="text-center py-50">
                        <i class="icon-alert-triangle text-60 text-red-1"></i>
                        <h4 class="text-24 fw-500 mt-20">Assessment Not Found</h4>
                        <p class="mt-10">The requested quiz or assignment could not be found or is no longer available.</p>
                        <div class="mt-30">
                            <a href="{{ route('student.assessments.index') }}" class="button -md -purple-1 text-white">Back to My Assessments</a>
                        </div>
                    </div>
                @endif
                
                 <div class="mt-40 border-top-light pt-20 text-center">
                    <a href="{{ route('student.assessments.index') }}" class="text-14 text-purple-1 fw-500">Return to Assessments List</a>
                </div>
            </div>
        </div>
    </div>

</x-dashboard-layout> 