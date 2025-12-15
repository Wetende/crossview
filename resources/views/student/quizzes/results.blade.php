<x-dashboard-layout>
    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Quiz Results</h1>
                <div class="mt-10">{{ $quiz->title }} - {{ $course->title }}</div>
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
                        <h2 class="text-17 lh-1 fw-500">Quiz Summary</h2>
                        <div class="badge {{ $attempt->passed ? 'bg-green-1' : 'bg-red-1' }} text-white">
                            {{ $attempt->passed ? 'Passed' : 'Failed' }}
                        </div>
                    </div>

                    <div class="py-30 px-30">
                        <div class="row y-gap-30 justify-center">
                            <div class="col-md-6 col-12">
                                <div class="py-25 px-25 rounded-16 bg-light-3 -dark-bg-dark-2 text-center">
                                    <div class="text-14 text-light-1 mb-10">Your Score</div>
                                    <div class="text-40 lh-1 fw-700 text-dark-1">{{ round($attempt->score, 1) }}%</div>
                                    @if($quiz->pass_mark !== null)
                                        <div class="text-14 mt-10">
                                            Pass mark: {{ $quiz->pass_mark }}%
                                        </div>
                                    @endif
                                </div>
                            </div>
                            <div class="col-md-6 col-12">
                                <div class="py-25 px-25 rounded-16 bg-light-3 -dark-bg-dark-2 text-center">
                                    <div class="text-14 text-light-1 mb-10">Attempt Details</div>
                                    <div class="text-14 mt-10">Attempt: #{{ $attempt->attempt_number }}</div>
                                    <div class="text-14 mt-5">Date: {{ $attempt->completed_at->format('M j, Y, g:i a') }}</div>
                                    <div class="text-14 mt-5">Total Questions: {{ $attempt->answers->count() }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-30 pt-30 border-top-light">
                            <h3 class="text-20 fw-500 mb-20">Question Results</h3>

                            @foreach($attempt->answers as $index => $answer)
                                <div class="py-20 px-30 bg-light-6 -dark-bg-dark-3 rounded-8 mb-15">
                                    <div class="d-flex justify-between items-center mb-15">
                                        <h4 class="text-17 fw-500">{{ $index + 1 }}. {{ $answer->question->question_text }}</h4>
                                        <div class="d-flex items-center">
                                            @if($answer->is_correct)
                                                <div class="d-flex items-center justify-center size-35 rounded-full bg-green-1 mr-10">
                                                    <i class="icon-check text-white"></i>
                                                </div>
                                            @else
                                                <div class="d-flex items-center justify-center size-35 rounded-full bg-red-1 mr-10">
                                                    <i class="icon-close text-white"></i>
                                                </div>
                                            @endif
                                            @if($answer->question->points > 0)
                                                <div class="text-14 lh-1">
                                                    <span class="{{ $answer->is_correct ? 'text-green-1' : 'text-red-1' }}">
                                                        {{ $answer->score }} / {{ $answer->question->points }}
                                                    </span>
                                                    points
                                                </div>
                                            @endif
                                        </div>
                                    </div>

                                    <div class="result-details">
                                        <div class="row y-gap-10">
                                            <div class="col-md-6">
                                                <div class="text-14 fw-500 text-dark-1">Your Answer:</div>
                                                <div class="mt-5">
                                                    @php
                                                        $answerData = json_decode($answer->answer_text, true);
                                                    @endphp

                                                    @if($answer->question->question_type->value === 'single_choice')
                                                        @php
                                                            $selectedOption = $answer->question->options->where('id', $answerData)->first();
                                                        @endphp
                                                        {{ $selectedOption ? $selectedOption->option_text : 'No answer provided' }}
                                                    @elseif($answer->question->question_type->value === 'multiple_choice')
                                                        @if(is_array($answerData) && count($answerData) > 0)
                                                            <ul class="pl-20">
                                                                @foreach($answerData as $optionId)
                                                                    @php
                                                                        $option = $answer->question->options->where('id', $optionId)->first();
                                                                    @endphp
                                                                    <li>{{ $option ? $option->option_text : 'Unknown option' }}</li>
                                                                @endforeach
                                                            </ul>
                                                        @else
                                                            No answer provided
                                                        @endif
                                                    @elseif($answer->question->question_type->value === 'true_false')
                                                        {{ $answerData === 'true' ? 'True' : 'False' }}
                                                    @elseif($answer->question->question_type->value === 'fill_blank')
                                                        {{ $answerData ?? 'No answer provided' }}
                                                    @else
                                                        {{ $answer->answer_text ?? 'No answer provided' }}
                                                    @endif
                                                </div>
                                            </div>
                                            
                                            <div class="col-md-6">
                                                <div class="text-14 fw-500 text-dark-1">Correct Answer:</div>
                                                <div class="mt-5">
                                                    @if($answer->question->question_type->value === 'single_choice')
                                                        @php
                                                            $correctOption = $answer->question->options->where('is_correct', true)->first();
                                                        @endphp
                                                        {{ $correctOption ? $correctOption->option_text : 'No correct answer defined' }}
                                                    @elseif($answer->question->question_type->value === 'multiple_choice')
                                                        @php
                                                            $correctOptions = $answer->question->options->where('is_correct', true);
                                                        @endphp
                                                        @if($correctOptions->count() > 0)
                                                            <ul class="pl-20">
                                                                @foreach($correctOptions as $option)
                                                                    <li>{{ $option->option_text }}</li>
                                                                @endforeach
                                                            </ul>
                                                        @else
                                                            No correct answer defined
                                                        @endif
                                                    @elseif($answer->question->question_type->value === 'true_false')
                                                        {{ $answer->question->correct_answer === 'true' ? 'True' : 'False' }}
                                                    @elseif($answer->question->question_type->value === 'fill_blank')
                                                        @php
                                                            $gapAnswers = $answer->question->gapAnswers;
                                                        @endphp
                                                        @if($gapAnswers->count() > 0)
                                                            {{ $gapAnswers->pluck('answer_text')->implode(' or ') }}
                                                        @else
                                                            No correct answer defined
                                                        @endif
                                                    @else
                                                        Not available
                                                    @endif
                                                </div>
                                            </div>
                                        </div>
                                        
                                        @if($answer->question->explanation)
                                            <div class="mt-15 pt-15 border-top-light">
                                                <div class="text-14 fw-500 text-dark-1">Explanation:</div>
                                                <div class="mt-5 text-15 lh-16">{{ $answer->question->explanation }}</div>
                                            </div>
                                        @endif
                                    </div>
                                </div>
                            @endforeach
                        </div>

                        <div class="d-flex justify-between items-center mt-30 pt-30 border-top-light">
                            <div>
                                @if(!$attempt->passed && $quiz->allow_retakes && ($quiz->max_attempts === null || $attempt->attempt_number < $quiz->max_attempts))
                                    <a href="{{ route('student.quizzes.take', [$course, $quiz]) }}" class="button -md -outline-purple-1 text-purple-1">
                                        <i class="icon-reload text-14 mr-10"></i>
                                        Retake Quiz
                                        @if($quiz->retake_penalty_percent > 0)
                                            <span class="text-14 text-red-1 ml-10">({{ $quiz->retake_penalty_percent }}% penalty)</span>
                                        @endif
                                    </a>
                                @endif
                            </div>
                            <a href="{{ route('student.learn.lesson', [$course, $lesson]) }}" class="button -md -purple-1 text-white">
                                Continue Learning
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 