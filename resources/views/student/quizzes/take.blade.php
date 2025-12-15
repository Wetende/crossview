<x-dashboard-layout>
    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">{{ $quiz->title }}</h1>
                <div class="mt-10">{{ $course->title }}</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('student.learn.lesson', [$course, $lesson]) }}" class="button -md -outline-purple-1 text-purple-1">
                    <i class="icon-arrow-left text-14 mr-10"></i>
                    Back to Lesson
                </a>
            </div>
        </div>

        <div class="row y-gap-30">
            <div class="col-xl-8 offset-xl-2">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex items-center justify-between py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Quiz Instructions</h2>
                        <div class="d-flex items-center">
                            <div class="badge bg-light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white mr-10">
                                {{ $quiz->questions->count() }} Questions
                            </div>
                            
                            @if($quiz->time_limit)
                                <div class="badge bg-light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                                    <i class="icon-time text-14 mr-5"></i>
                                    {{ $quiz->time_limit }} Minutes
                                </div>
                            @endif
                        </div>
                    </div>

                    <div class="py-30 px-30">
                        @if($quiz->description)
                            <div class="mb-30">
                                <h4 class="text-18 fw-500 mb-10">Description</h4>
                                <p class="text-15 lh-16">{{ $quiz->description }}</p>
                            </div>
                        @endif

                        <div class="mb-20">
                            <h4 class="text-18 fw-500 mb-10">Quiz Information</h4>
                            <div class="row y-gap-15 x-gap-30">
                                @if($quiz->pass_mark !== null)
                                    <div class="col-auto">
                                        <div class="d-flex items-center">
                                            <div class="size-40 d-flex items-center justify-center rounded-full bg-purple-1 mr-10">
                                                <i class="icon-check-2 text-white"></i>
                                            </div>
                                            <div class="text-15 lh-12">Pass Mark: {{ $quiz->pass_mark }}%</div>
                                        </div>
                                    </div>
                                @endif
                                <div class="col-auto">
                                    <div class="d-flex items-center">
                                        <div class="size-40 d-flex items-center justify-center rounded-full bg-purple-1 mr-10">
                                            <i class="icon-reload text-white"></i>
                                        </div>
                                        <div class="text-15 lh-12">
                                            {{ $quiz->allow_retakes ? 'Retakes Allowed' : 'No Retakes' }}
                                            @if($quiz->max_attempts)
                                                (Max {{ $quiz->max_attempts }} attempts)
                                            @endif
                                        </div>
                                    </div>
                                </div>
                                @if($quiz->retake_penalty_percent > 0)
                                    <div class="col-auto">
                                        <div class="d-flex items-center">
                                            <div class="size-40 d-flex items-center justify-center rounded-full bg-orange-1 mr-10">
                                                <i class="icon-warning text-white"></i>
                                            </div>
                                            <div class="text-15 lh-12">Retake Penalty: {{ $quiz->retake_penalty_percent }}%</div>
                                        </div>
                                    </div>
                                @endif
                            </div>
                        </div>

                        @if($attempts->count() > 0)
                            <div class="mb-30">
                                <h4 class="text-18 fw-500 mb-10">Your Previous Attempts</h4>
                                <div class="overflow-hidden">
                                    <table class="table w-1/1">
                                        <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                            <tr>
                                                <th>Attempt</th>
                                                <th>Date</th>
                                                <th>Score</th>
                                                <th>Result</th>
                                            </tr>
                                        </thead>
                                        <tbody class="text-14">
                                            @foreach($attempts as $attempt)
                                                <tr class="border-bottom-light">
                                                    <td>#{{ $attempt->attempt_number }}</td>
                                                    <td>{{ $attempt->completed_at->format('M j, Y, g:i a') }}</td>
                                                    <td>{{ round($attempt->score, 1) }}%</td>
                                                    <td>
                                                        @if($attempt->passed)
                                                            <span class="badge bg-green-1 text-white">Passed</span>
                                                        @else
                                                            <span class="badge bg-red-1 text-white">Failed</span>
                                                        @endif
                                                    </td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        @endif

                        <div class="mb-15">
                            <form id="quizForm" action="{{ route('student.quizzes.submit', [$course, $quiz]) }}" method="POST">
                                @csrf
                                @if($quiz->time_limit)
                                <input type="hidden" id="quizTimeLimit" value="{{ $quiz->time_limit }}">
                                @endif

                                @if($errors->any())
                                    <div class="alert alert-danger mb-30">
                                        <ul class="mt-10">
                                            @foreach($errors->all() as $error)
                                                <li>{{ $error }}</li>
                                            @endforeach
                                        </ul>
                                    </div>
                                @endif

                                @foreach($quiz->questions as $index => $question)
                                    <div class="py-20 px-30 bg-light-6 -dark-bg-dark-3 rounded-8 mb-20">
                                        <div class="d-flex justify-between items-center mb-20">
                                            <h3 class="text-18 fw-500">{{ $index + 1 }}. {{ $question->question_text }}</h3>
                                            @if($question->points > 0)
                                                <div class="badge bg-purple-1 text-white">{{ $question->points }} Points</div>
                                            @endif
                                        </div>

                                        <div class="question-content">
                                            @switch($question->question_type->value)
                                                @case('single_choice')
                                                    <div class="single-choice-question">
                                                        @foreach($question->options as $option)
                                                            <div class="form-radio mt-10">
                                                                <div class="radio">
                                                                    <input type="radio" name="answers[{{ $question->id }}]" value="{{ $option->id }}" id="option-{{ $option->id }}">
                                                                    <div class="radio__mark">
                                                                        <div class="radio__icon"></div>
                                                                    </div>
                                                                    <label for="option-{{ $option->id }}" class="radio__text">{{ $option->option_text }}</label>
                                                                </div>
                                                            </div>
                                                        @endforeach
                                                    </div>
                                                @break

                                                @case('multiple_choice')
                                                    <div class="multiple-choice-question">
                                                        @foreach($question->options as $option)
                                                            <div class="form-checkbox mt-10">
                                                                <div class="checkbox">
                                                                    <input type="checkbox" name="answers[{{ $question->id }}][]" value="{{ $option->id }}" id="option-{{ $option->id }}">
                                                                    <div class="checkbox__mark">
                                                                        <div class="checkbox__icon"></div>
                                                                    </div>
                                                                    <label for="option-{{ $option->id }}" class="checkbox__text">{{ $option->option_text }}</label>
                                                                </div>
                                                            </div>
                                                        @endforeach
                                                    </div>
                                                @break

                                                @case('true_false')
                                                    <div class="true-false-question">
                                                        <div class="form-radio mt-10">
                                                            <div class="radio">
                                                                <input type="radio" name="answers[{{ $question->id }}]" value="true" id="true-{{ $question->id }}">
                                                                <div class="radio__mark">
                                                                    <div class="radio__icon"></div>
                                                                </div>
                                                                <label for="true-{{ $question->id }}" class="radio__text">True</label>
                                                            </div>
                                                        </div>
                                                        <div class="form-radio mt-10">
                                                            <div class="radio">
                                                                <input type="radio" name="answers[{{ $question->id }}]" value="false" id="false-{{ $question->id }}">
                                                                <div class="radio__mark">
                                                                    <div class="radio__icon"></div>
                                                                </div>
                                                                <label for="false-{{ $question->id }}" class="radio__text">False</label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                @break

                                                @case('fill_blank')
                                                    <div class="fill-blank-question">
                                                        <div class="text-15 lh-16 mb-10">Fill in the blank with the correct answer:</div>
                                                        <div class="form-group">
                                                            <input type="text" name="answers[{{ $question->id }}]" class="form-control" placeholder="Your answer">
                                                        </div>
                                                    </div>
                                                @break

                                                @default
                                                    <div class="unsupported-question">
                                                        <div class="alert alert-warning">
                                                            This question type is not currently supported.
                                                        </div>
                                                    </div>
                                            @endswitch
                                        </div>
                                    </div>
                                @endforeach

                                <div class="d-flex items-center justify-end mt-30">
                                    <button type="submit" class="button -md -purple-1 text-white">
                                        Submit Quiz
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Hide validation message when user interacts with any input
        document.querySelectorAll('input[type="radio"], input[type="checkbox"], input[type="text"]').forEach(function(input) {
            input.addEventListener('change', function() {
                var validationMsg = document.getElementById('quiz-validation-message');
                if (validationMsg) {
                    validationMsg.style.display = 'none';
                }
                
                // Remove error highlight from questions
                document.querySelectorAll('.border-red-1').forEach(function(el) {
                    el.classList.remove('border', 'border-red-1');
                });
            });
        });
        
        // Quiz timer implementation
        var timeLimitElement = document.getElementById('quizTimeLimit');
        
        if (timeLimitElement) {
            var timeLimit = parseInt(timeLimitElement.value) * 60; // Convert minutes to seconds
            var timeRemaining = timeLimit;
            
            var timerElement = document.createElement('div');
            timerElement.className = 'quiz-timer bg-purple-1 text-white px-20 py-10 rounded-8 position-fixed top-20 right-20';
            timerElement.style.zIndex = '1000';
            document.body.appendChild(timerElement);
            
            var timerInterval = setInterval(function() {
                timeRemaining--;
                
                var minutes = Math.floor(timeRemaining / 60);
                var seconds = timeRemaining % 60;
                
                timerElement.textContent = 'Time Remaining: ' + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
                
                if (timeRemaining <= 0) {
                    clearInterval(timerInterval);
                    document.getElementById('quizForm').submit();
                }
            }, 1000);
        }
        
        // Form validation
        var quizForm = document.getElementById('quizForm');
        
        quizForm.addEventListener('submit', function(e) {
            var hasError = false;
            var firstErrorElement = null;
            
            // Collect all questions
            var questions = document.querySelectorAll('.question-content');
            
            for (var i = 0; i < questions.length; i++) {
                var question = questions[i];
                
                // For single choice questions
                if (question.querySelector('.single-choice-question')) {
                    var radioButtons = question.querySelectorAll('input[type="radio"]:checked');
                    if (radioButtons.length === 0) {
                        hasError = true;
                        if (!firstErrorElement) firstErrorElement = question;
                    }
                }
                
                // For multiple choice questions
                if (question.querySelector('.multiple-choice-question')) {
                    var checkboxes = question.querySelectorAll('input[type="checkbox"]:checked');
                    if (checkboxes.length === 0) {
                        hasError = true;
                        if (!firstErrorElement) firstErrorElement = question;
                    }
                }
                
                // For true/false questions
                if (question.querySelector('.true-false-question')) {
                    var tfRadioButtons = question.querySelectorAll('input[type="radio"]:checked');
                    if (tfRadioButtons.length === 0) {
                        hasError = true;
                        if (!firstErrorElement) firstErrorElement = question;
                    }
                }
                
                // For fill in the blank questions
                if (question.querySelector('.fill-blank-question')) {
                    var input = question.querySelector('input[type="text"]');
                    if (input && input.value.trim() === '') {
                        hasError = true;
                        if (!firstErrorElement) firstErrorElement = question;
                    }
                }
            }
            
            if (hasError) {
                e.preventDefault();
                
                // Create or show validation message
                var validationMsg = document.getElementById('quiz-validation-message');
                if (!validationMsg) {
                    validationMsg = document.createElement('div');
                    validationMsg.id = 'quiz-validation-message';
                    validationMsg.className = 'alert alert-danger mb-30';
                    validationMsg.innerHTML = '<strong>Please answer all questions before submitting.</strong>';
                    
                    var formTitle = document.querySelector('.dashboard__content h2');
                    if (formTitle) {
                        formTitle.parentNode.insertBefore(validationMsg, formTitle.nextSibling);
                    } else {
                        quizForm.parentNode.insertBefore(validationMsg, quizForm);
                    }
                } else {
                    validationMsg.style.display = 'block';
                }
                
                if (firstErrorElement) {
                    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Highlight the first error
                    firstErrorElement.closest('.py-20').classList.add('border', 'border-red-1');
                }
            }
        });
    });
    </script>
    @endpush
</x-dashboard-layout> 