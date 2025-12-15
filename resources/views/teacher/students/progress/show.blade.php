<x-dashboard-layout>
<div class="dashboard__content bg-light-4">
    <div class="row y-gap-20 justify-between items-end pb-30">
        <div class="col-auto">
            <h1 class="text-30 lh-12 fw-700">Student Progress Details</h1>
            <div class="mt-10">{{ $student->name }} - {{ $course->title }}</div>
        </div>
        <div class="col-auto">
            <a href="{{ route('teacher.courses.students.index', $course) }}" class="button -icon -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                <i class="icon-arrow-left mr-15"></i>
                Back to Student List
            </a>
        </div>
    </div>

    <div class="row y-gap-30">
        <!-- Student Overview Card -->
        <div class="col-12">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                    <h2 class="text-17 lh-1 fw-500">Student Overview</h2>
                </div>
                <div class="py-30 px-30">
                    <div class="row y-gap-20">
                        <div class="col-lg-3 col-md-6">
                            <div class="d-flex items-center">
                                <div class="size-60 rounded-8 d-flex justify-center items-center bg-light-7 -dark-bg-dark-3 mr-20">
                                    @if($student->profile_picture_path)
                                        <img src="{{ asset('storage/' . $student->profile_picture_path) }}" alt="{{ $student->name }}" class="size-60 object-cover rounded-8">
                                    @else
                                        <div class="text-20 fw-600">{{ substr($student->name, 0, 2) }}</div>
                                    @endif
                                </div>
                                <div>
                                    <div class="text-16 fw-500">{{ $student->name }}</div>
                                    <div class="text-14 text-light-1 mt-5">{{ $student->email }}</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="d-flex flex-column">
                                <div class="text-14 text-light-1">Enrollment Date</div>
                                <div class="text-16 fw-500 mt-5">{{ $enrollment->enrolled_at->format('M d, Y') }}</div>
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="d-flex flex-column">
                                <div class="text-14 text-light-1">Overall Progress</div>
                                <div class="d-flex items-center mt-5">
                                    <div class="progress-bar" style="width: 120px">
                                        <div class="progress-bar__bg bg-light-3"></div>
                                        <div class="progress-bar__bar bg-purple-1" style="width: {{ $enrollment->progress }}%;"></div>
                                    </div>
                                    <div class="text-16 fw-500 ml-10">{{ $enrollment->progress }}%</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="d-flex flex-column">
                                <div class="text-14 text-light-1">Completion Status</div>
                                <div class="mt-5">
                                    @if($enrollment->completed_at)
                                        <div class="badge bg-green-1 text-white">Completed on {{ $enrollment->completed_at->format('M d, Y') }}</div>
                                    @else
                                        <div class="badge bg-orange-1 text-white">In Progress</div>
                                    @endif
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Course Content Progress -->
        <div class="col-12">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                    <h2 class="text-17 lh-1 fw-500">Course Content Progress</h2>
                </div>
                <div class="py-30 px-30">
                    @foreach($sections as $section)
                        <div class="border-light rounded-8 mb-30">
                            <div class="py-15 px-20 bg-light-6 -dark-bg-dark-2 rounded-top-8">
                                <h3 class="text-16 fw-500">{{ $section->title }}</h3>
                            </div>
                            <div class="py-20 px-20">
                                <!-- Lessons -->
                                @foreach($section->lessons as $lesson)
                                    <div class="d-flex justify-between py-8 border-bottom-light">
                                        <div class="d-flex items-center">
                                            <div class="d-flex justify-center items-center bg-light-3 rounded-full size-30 mr-10">
                                                <i class="icon-play text-14"></i>
                                            </div>
                                            <div class="text-14 fw-500">{{ $lesson->title }}</div>
                                        </div>
                                        <div>
                                            @if(isset($lessonCompletions[$lesson->id]))
                                                <div class="badge bg-green-1 text-white">Completed {{ $lessonCompletions[$lesson->id]->completed_at->format('M d, Y') }}</div>
                                            @else
                                                <div class="badge bg-light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">Not Started</div>
                                            @endif
                                        </div>
                                    </div>
                                @endforeach

                                <!-- Quizzes -->
                                @foreach($section->quizzes as $quiz)
                                    <div class="d-flex justify-between py-8 border-bottom-light">
                                        <div class="d-flex items-center">
                                            <div class="d-flex justify-center items-center bg-light-3 rounded-full size-30 mr-10">
                                                <i class="icon-puzzle text-14"></i>
                                            </div>
                                            <div class="text-14 fw-500">Quiz: {{ $quiz->title }}</div>
                                        </div>
                                        <div>
                                            @if(isset($quizAttempts[$quiz->id]) && $quizAttempts[$quiz->id]->count() > 0)
                                                <a href="#" class="badge bg-purple-1 text-white" 
                                                   onclick="event.preventDefault(); document.getElementById('quiz-attempts-{{ $quiz->id }}').classList.toggle('d-none');">
                                                   {{ $quizAttempts[$quiz->id]->count() }} Attempts
                                                </a>
                                            @else
                                                <div class="badge bg-light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">Not Attempted</div>
                                            @endif
                                        </div>
                                    </div>
                                    
                                    <!-- Quiz Attempts Details (Hidden by Default) -->
                                    @if(isset($quizAttempts[$quiz->id]) && $quizAttempts[$quiz->id]->count() > 0)
                                        <div id="quiz-attempts-{{ $quiz->id }}" class="d-none ml-40 mr-10 mt-10 mb-20 bg-light-4 -dark-bg-dark-2 rounded-8 py-15 px-20">
                                            <div class="text-14 fw-500 mb-10">Quiz Attempts</div>
                                            <table class="table w-1/1">
                                                <thead class="text-14 fw-500">
                                                    <tr>
                                                        <th class="py-5">Attempt</th>
                                                        <th class="py-5">Score</th>
                                                        <th class="py-5">Status</th>
                                                        <th class="py-5">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody class="text-14">
                                                    @foreach($quizAttempts[$quiz->id] as $index => $attempt)
                                                        <tr>
                                                            <td class="py-5">{{ $index + 1 }}</td>
                                                            <td class="py-5">{{ $attempt->score }}/{{ $attempt->total_points }}</td>
                                                            <td class="py-5">
                                                                @if($attempt->passed)
                                                                    <span class="badge bg-green-1 text-white">Pass</span>
                                                                @else
                                                                    <span class="badge bg-red-1 text-white">Fail</span>
                                                                @endif
                                                            </td>
                                                            <td class="py-5">{{ $attempt->attempted_at->format('M d, Y H:i') }}</td>
                                                        </tr>
                                                    @endforeach
                                                </tbody>
                                            </table>
                                        </div>
                                    @endif
                                @endforeach

                                <!-- Assignments -->
                                @foreach($section->assignments as $assignment)
                                    <div class="d-flex justify-between py-8 border-bottom-light">
                                        <div class="d-flex items-center">
                                            <div class="d-flex justify-center items-center bg-light-3 rounded-full size-30 mr-10">
                                                <i class="icon-file-text text-14"></i>
                                            </div>
                                            <div class="text-14 fw-500">Assignment: {{ $assignment->title }}</div>
                                        </div>
                                        <div>
                                            @if(isset($assignmentSubmissions[$assignment->id]))
                                                @php $submission = $assignmentSubmissions[$assignment->id]; @endphp
                                                @if($submission->grade)
                                                    <div class="badge bg-green-1 text-white">Graded: {{ $submission->grade }}/{{ $assignment->max_points }}</div>
                                                @else
                                                    <div class="badge bg-blue-1 text-white">Submitted, Not Graded</div>
                                                @endif
                                            @else
                                                <div class="badge bg-light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">Not Submitted</div>
                                            @endif
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        </div>
    </div>
</div>
</x-dashboard-layout> 