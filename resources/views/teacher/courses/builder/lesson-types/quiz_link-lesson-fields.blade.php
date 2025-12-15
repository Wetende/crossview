{{-- Enhanced Quiz Lesson Fields Component --}}
<div id="quiz-fields" class="space-y-6">
    <div class="border-b border-gray-200 pb-4">
        <h3 class="text-lg font-medium text-gray-900 flex items-center">
            <i class="fas fa-question-circle mr-2 text-blue-500"></i> Create New Quiz
        </h3>
        <p class="text-sm text-gray-500 mt-1">Design a new quiz for your students</p>
    </div>
    
    {{-- Optional: Select Existing Quiz (Collapsible) --}}
    <div class="bg-blue-50 border border-blue-200 rounded-md">
        <button type="button" id="toggle-existing-quiz" onclick="toggleExistingQuiz()" class="w-full px-4 py-3 text-left text-sm font-medium text-blue-900 hover:bg-blue-100 focus:outline-none flex items-center justify-between">
            <span class="flex items-center">
                <i class="fas fa-folder-open mr-2"></i>
                Or select an existing quiz
            </span>
            <i class="fas fa-chevron-down transition-transform duration-200"></i>
            </button>
        <div id="existing-quiz-section" class="hidden px-4 pb-4">
            <div class="mt-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Select Existing Quiz</label>
                <select id="quiz-selection" name="quiz_id" onchange="handleQuizSelection()"
                    class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Choose an existing quiz...</option>
                    @if(isset($quizzes))
                        @foreach($quizzes as $quiz)
                            <option value="{{ $quiz['id'] }}" 
                                data-question-count="{{ $quiz['question_count'] }}"
                                data-pass-mark="{{ $quiz['pass_mark'] }}">
                                {{ $quiz['title'] }} ({{ $quiz['question_count'] }} questions)
                            </option>
                        @endforeach
                    @endif
                </select>
                <p class="text-xs text-gray-500 mt-1">Select this if you want to reuse an existing quiz from your course sections</p>
            </div>
        </div>
    </div>
    
    {{-- Main Quiz Creation Form --}}
    <div id="quiz-creation-form">
        <div class="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
            <h4 class="text-sm font-medium text-gray-900 mb-3">Quiz Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
                    <input type="text" id="new-quiz-title" name="new_quiz_title" 
                        placeholder="Enter quiz title..."
                        class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Quiz Description</label>
                    <textarea id="new-quiz-description" name="new_quiz_description" rows="3" 
                        placeholder="Brief description of the quiz..."
                        class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Pass Mark (%)</label>
                    <input type="number" id="new-quiz-pass-mark" name="new_quiz_pass_mark" min="0" max="100" value="70"
                        class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Quiz Duration (minutes)</label>
                    <input type="number" id="new-quiz-duration" name="new_quiz_duration" min="1" value="30"
                        class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
        </div>
        
        {{-- Questions Section --}}
        <div class="bg-white border border-gray-200 rounded-md p-4 mb-4">
            <div class="flex justify-between items-center mb-4">
                <h4 class="text-sm font-medium text-gray-900">Questions</h4>
                <div class="flex items-center space-x-2">
                    <select id="question-type-selector" class="px-3 py-1 border border-gray-300 rounded-md text-sm">
                        <option value="single_choice">Single Choice</option>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True/False</option>
                        <option value="fill_in_the_gap">Fill in the Gap</option>
                        <option value="matching">Matching</option>
                        <option value="keywords">Keywords</option>
                    </select>
                    <button type="button" id="add-question-btn" 
                        onclick="addQuizQuestion()"
                        class="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <i class="fas fa-plus mr-1"></i> Add Question
                    </button>
                </div>
            </div>
            
            {{-- Questions Container --}}
            <div id="questions-container" class="space-y-4">
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-question-circle text-3xl mb-2"></i>
                    <p>No questions added yet. Click "Add Question" to get started.</p>
                </div>
            </div>
        </div>
        
        {{-- Auto-Grading Settings --}}
        <div class="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
            <h4 class="text-sm font-medium text-gray-900 mb-3">Auto-Grading Settings</h4>
            <div class="space-y-3">
                <div class="flex items-center">
                    <input type="checkbox" id="auto-grade" name="auto_grade" value="1" checked
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                    <label for="auto-grade" class="ml-2 block text-sm text-gray-700">
                        Auto-grade quiz when completed
                    </label>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" id="show-results" name="show_results" value="1" checked
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                    <label for="show-results" class="ml-2 block text-sm text-gray-700">
                        Show results to students immediately
                    </label>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" id="show-correct-answers" name="show_correct_answers" value="1"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                    <label for="show-correct-answers" class="ml-2 block text-sm text-gray-700">
                        Show correct answers after completion
                    </label>
                </div>
            </div>
        </div>
        
        {{-- Time and Attempts --}}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <div class="flex items-center mb-3">
                    <input type="checkbox" id="enable-time-limit" name="enable_time_limit" value="1" onchange="toggleTimeLimit()"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                    <label for="enable-time-limit" class="ml-2 block text-sm font-medium text-gray-700">
                        Enable Time Limit
                    </label>
                </div>
                <div id="time-limit-fields" class="hidden grid grid-cols-2 gap-2">
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Hours</label>
                        <input type="number" id="quiz-hours" name="quiz_hours" min="0" max="23" value="0"
                            class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Minutes</label>
                        <input type="number" id="quiz-minutes" name="quiz_minutes" min="0" max="59" value="30"
                            class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Maximum Attempts</label>
                <select id="max-attempts" name="max_attempts"
                    class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="1">1 attempt</option>
                    <option value="2">2 attempts</option>
                    <option value="3" selected>3 attempts</option>
                    <option value="5">5 attempts</option>
                    <option value="-1">Unlimited attempts</option>
                </select>
            </div>
        </div>
    </div>
    
    {{-- Instructions for Students --}}
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Instructions for Students</label>
        <textarea id="quiz-instructions" name="quiz_instructions" rows="3" 
            placeholder="Provide additional instructions or context for this quiz..."
            class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
    </div>
</div>

{{-- Question Templates (Hidden) --}}
<div id="question-templates" class="hidden">
    {{-- Single Choice Question Template --}}
    <div class="question-template" data-type="single_choice">
        <div class="question-item border border-gray-200 rounded-md p-4 bg-white mb-4">
            <div class="flex justify-between items-start mb-3">
                <h5 class="text-sm font-medium text-gray-900">Question <span class="question-number">1</span> - Single Choice</h5>
                <button type="button" class="remove-question-btn text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                    <textarea name="questions[0][text]" rows="2" 
                        placeholder="Enter your question here..."
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Answer Options (select correct answer)</label>
                    <div class="space-y-2 options-container">
                        <div class="flex items-center space-x-2">
                            <input type="radio" name="questions[0][correct_answer]" value="0" class="h-4 w-4 text-blue-600">
                            <input type="text" name="questions[0][options][0][text]" placeholder="Option A" 
                                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div class="flex items-center space-x-2">
                            <input type="radio" name="questions[0][correct_answer]" value="1" class="h-4 w-4 text-blue-600">
                            <input type="text" name="questions[0][options][1][text]" placeholder="Option B" 
                                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    <button type="button" class="add-option-btn mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                        <i class="fas fa-plus mr-1"></i> Add Option
                    </button>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Points</label>
                    <input type="number" name="questions[0][points]" min="1" value="1" 
                        class="block w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            
            <input type="hidden" name="questions[0][type]" value="single_choice">
        </div>
    </div>
    
    {{-- Multiple Choice Question Template --}}
    <div class="question-template" data-type="multiple_choice">
        <div class="question-item border border-gray-200 rounded-md p-4 bg-white mb-4">
            <div class="flex justify-between items-start mb-3">
                <h5 class="text-sm font-medium text-gray-900">Question <span class="question-number">1</span> - Multiple Choice</h5>
                <button type="button" class="remove-question-btn text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                    <textarea name="questions[0][text]" rows="2" 
                        placeholder="Enter your question here..."
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Answer Options (check all correct answers)</label>
                    <div class="space-y-2 options-container">
                        <div class="flex items-center space-x-2">
                            <input type="checkbox" name="questions[0][options][0][is_correct]" value="1" class="h-4 w-4 text-blue-600">
                            <input type="text" name="questions[0][options][0][text]" placeholder="Option A" 
                                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div class="flex items-center space-x-2">
                            <input type="checkbox" name="questions[0][options][1][is_correct]" value="1" class="h-4 w-4 text-blue-600">
                            <input type="text" name="questions[0][options][1][text]" placeholder="Option B" 
                                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    <button type="button" class="add-option-btn mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                        <i class="fas fa-plus mr-1"></i> Add Option
                    </button>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Points</label>
                    <input type="number" name="questions[0][points]" min="1" value="1" 
                        class="block w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            
            <input type="hidden" name="questions[0][type]" value="multiple_choice">
        </div>
    </div>
    
    {{-- True/False Question Template --}}
    <div class="question-template" data-type="true_false">
        <div class="question-item border border-gray-200 rounded-md p-4 bg-white mb-4">
            <div class="flex justify-between items-start mb-3">
                <h5 class="text-sm font-medium text-gray-900">Question <span class="question-number">1</span> - True/False</h5>
                <button type="button" class="remove-question-btn text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                    <textarea name="questions[0][text]" rows="2" 
                        placeholder="Enter your true/false statement here..."
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
                    <div class="space-y-2">
                        <div class="flex items-center space-x-2">
                            <input type="radio" name="questions[0][correct_answer]" value="true" class="h-4 w-4 text-blue-600">
                            <span class="text-sm text-gray-700">True</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <input type="radio" name="questions[0][correct_answer]" value="false" class="h-4 w-4 text-blue-600">
                            <span class="text-sm text-gray-700">False</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Points</label>
                    <input type="number" name="questions[0][points]" min="1" value="1" 
                        class="block w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            
            <input type="hidden" name="questions[0][type]" value="true_false">
        </div>
    </div>
    
    {{-- Fill in the Gap Question Template --}}
    <div class="question-template" data-type="fill_in_the_gap">
        <div class="question-item border border-gray-200 rounded-md p-4 bg-white mb-4">
            <div class="flex justify-between items-start mb-3">
                <h5 class="text-sm font-medium text-gray-900">Question <span class="question-number">1</span> - Fill in the Gap</h5>
                <button type="button" class="remove-question-btn text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Question Text with Gaps</label>
                    <textarea name="questions[0][text]" rows="3" 
                        placeholder="Enter your question with [gap] placeholders. Example: The capital of France is [gap]."
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    <p class="text-xs text-gray-500 mt-1">Use [gap] to mark where students should fill in answers</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Correct Answers</label>
                    <div class="space-y-2 gaps-container">
                        <div class="flex items-center space-x-2">
                            <span class="text-sm text-gray-500 w-16">Gap 1:</span>
                            <input type="text" name="questions[0][gap_answers][0]" placeholder="Correct answer" 
                                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    <button type="button" class="add-gap-btn mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                        <i class="fas fa-plus mr-1"></i> Add Gap Answer
                    </button>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Points</label>
                    <input type="number" name="questions[0][points]" min="1" value="1" 
                        class="block w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            
            <input type="hidden" name="questions[0][type]" value="fill_gap">
        </div>
    </div>
    
    {{-- Keywords Question Template --}}
    <div class="question-template" data-type="keywords">
        <div class="question-item border border-gray-200 rounded-md p-4 bg-white mb-4">
            <div class="flex justify-between items-start mb-3">
                <h5 class="text-sm font-medium text-gray-900">Question <span class="question-number">1</span> - Keywords</h5>
                <button type="button" class="remove-question-btn text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                    <textarea name="questions[0][text]" rows="2" 
                        placeholder="Enter your question here..."
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Required Keywords</label>
                    <div class="space-y-2 keywords-container">
                        <input type="text" name="questions[0][keywords][0]" placeholder="Enter keyword" 
                            class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <button type="button" class="add-keyword-btn mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                        <i class="fas fa-plus mr-1"></i> Add Keyword
                    </button>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Points</label>
                    <input type="number" name="questions[0][points]" min="1" value="1" 
                        class="block w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            
            <input type="hidden" name="questions[0][type]" value="keywords">
        </div>
    </div>
    
    {{-- Matching Question Template --}}
    <div class="question-template" data-type="matching">
        <div class="question-item border border-gray-200 rounded-md p-4 bg-white mb-4">
            <div class="flex justify-between items-start mb-3">
                <h5 class="text-sm font-medium text-gray-900">Question <span class="question-number">1</span> - Matching</h5>
                <button type="button" class="remove-question-btn text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                    <textarea name="questions[0][text]" rows="2" 
                        placeholder="Enter instructions for matching items..."
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Matching Pairs</label>
                    <div class="space-y-2 pairs-container">
                        <div class="grid grid-cols-2 gap-2">
                            <input type="text" name="questions[0][pairs][0][left]" placeholder="Left item" 
                                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <input type="text" name="questions[0][pairs][0][right]" placeholder="Right item" 
                                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    <button type="button" class="add-pair-btn mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                        <i class="fas fa-plus mr-1"></i> Add Pair
                    </button>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Points</label>
                    <input type="number" name="questions[0][points]" min="1" value="1" 
                        class="block w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            
            <input type="hidden" name="questions[0][type]" value="matching">
        </div>
    </div>
</div>

{{-- Simple CSS --}}
<style>
.hidden {
    display: none !important;
}

#quiz-creation-form {
    transition: opacity 0.3s ease, pointer-events 0.3s ease;
}

#toggle-existing-quiz i {
    transition: transform 0.2s ease;
}
</style>

{{-- JavaScript for Quiz Lesson Handler --}}
<script>

window.QuizLessonHandler = {
    initialize: function() {
        console.log('QuizLessonHandler initialized');
        
        
        if (window.pendingLessonData) {
            this.populateFields(window.pendingLessonData);
        }
        
        
        this.bindEvents();
    },
    
    populateFields: function(lessonData) {
        console.log('Populating quiz fields with lesson data:', lessonData);
        
        // Populate basic quiz fields
        if (lessonData.quiz_id) {
            const quizSelect = document.getElementById('quiz-selection');
            if (quizSelect) {
                quizSelect.value = lessonData.quiz_id;
                this.handleQuizSelection();
            }
        }
        
        if (lessonData.quiz_instructions) {
            const instructionsField = document.getElementById('quiz-instructions');
            if (instructionsField) {
                instructionsField.value = lessonData.quiz_instructions;
            }
        }
        
        
        window.pendingLessonData = null;
    },
    
    bindEvents: function() {
        
        const quizSelect = document.getElementById('quiz-selection');
        if (quizSelect) {
            quizSelect.addEventListener('change', this.handleQuizSelection.bind(this));
        }
        
        
        const toggleBtn = document.getElementById('toggle-existing-quiz');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', this.toggleExistingQuiz.bind(this));
        }
        
        
        const timeLimitCheckbox = document.getElementById('enable-time-limit');
        if (timeLimitCheckbox) {
            timeLimitCheckbox.addEventListener('change', this.toggleTimeLimit.bind(this));
        }
        
        
        const addQuestionBtn = document.getElementById('add-question-btn');
        if (addQuestionBtn) {
            addQuestionBtn.addEventListener('click', this.addQuestion.bind(this));
        }
    },
    
    handleQuizSelection: function() {
        const selector = document.getElementById('quiz-selection');
        const form = document.getElementById('quiz-creation-form');
        
        if (selector && form) {
            if (selector.value) {
                form.style.opacity = '0.5';
                form.style.pointerEvents = 'none';
            } else {
                form.style.opacity = '1';
                form.style.pointerEvents = 'auto';
            }
        }
    },
    
    toggleExistingQuiz: function() {
        const section = document.getElementById('existing-quiz-section');
        const icon = document.querySelector('#toggle-existing-quiz i.fa-chevron-down');
        
        if (section && section.classList.contains('hidden')) {
            section.classList.remove('hidden');
            if (icon) icon.style.transform = 'rotate(180deg)';
        } else if (section) {
            section.classList.add('hidden');
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    },
    
    toggleTimeLimit: function() {
        const checkbox = document.getElementById('enable-time-limit');
        const fields = document.getElementById('time-limit-fields');
        
        if (checkbox && fields) {
            if (checkbox.checked) {
                fields.classList.remove('hidden');
            } else {
                fields.classList.add('hidden');
            }
        }
    },
    
    addQuestion: function() {
        if (window.QuizBuilder && window.QuizBuilder.addQuestion) {
            window.QuizBuilder.addQuestion();
        } else {
            console.warn('QuizBuilder not available');
        }
    },
    
    validateFields: function() {
        const errors = [];
        const existingQuizId = document.getElementById('quiz-selection') ? document.getElementById('quiz-selection').value : null;
        
        if (existingQuizId) {
            
            return errors;
        }
        
        
        const title = document.getElementById('new-quiz-title') ? document.getElementById('new-quiz-title').value : '';
        if (!title || title.trim() === '') {
            errors.push('Quiz title is required.');
        }
        
        
        const questionsContainer = document.getElementById('questions-container');
        if (!questionsContainer) {
            errors.push('Questions container not found.');
            return errors;
        }
        
        const questions = questionsContainer.querySelectorAll('.question-item');
        
        
        const visibleQuestions = [];
        questions.forEach(function(question) {
            
            if (question.style.display !== 'none' && 
                !question.hasAttribute('data-type') && 
                !question.closest('#question-templates')) {
                visibleQuestions.push(question);
            }
        });
        
        if (visibleQuestions.length === 0) {
            errors.push('Please add at least one question to the quiz.');
            return errors;
        }
        
        // Validate each visible question
        visibleQuestions.forEach(function(question, index) {
            const questionNumber = index + 1;
            
            const questionText = question.querySelector('textarea[name*="[text]"]');
            if (!questionText || !questionText.value || questionText.value.trim() === '') {
                errors.push('Question ' + questionNumber + ': Question text is required.');
            }
            
            const questionType = question.querySelector('input[name*="[type]"]');
            if (questionType && questionType.value) {
                const type = questionType.value;
                
                // Validate based on question type
                if (type === 'single_choice' || type === 'multiple_choice') {
                    const options = question.querySelectorAll('input[name*="[options]"][name*="[text]"]');
                    let hasValidOptions = 0;
                    options.forEach(function(option) {
                        if (option.value && option.value.trim() !== '') hasValidOptions++;
                    });
                    
                    if (hasValidOptions < 2) {
                        errors.push('Question ' + questionNumber + ': Please provide at least 2 answer options.');
                    }
                    
                    // Check if correct answer is selected
                    const correctAnswers = question.querySelectorAll('input[name*="correct_answer"]:checked, input[name*="[is_correct]"]:checked');
                    if (correctAnswers.length === 0) {
                        errors.push('Question ' + questionNumber + ': Please select the correct answer(s).');
                    }
                }
                
                if (type === 'true_false') {
                    const correctAnswer = question.querySelector('input[name*="correct_answer"]:checked');
                    if (!correctAnswer) {
                        errors.push('Question ' + questionNumber + ': Please select the correct answer (True or False).');
                    }
                }
                
                if (type === 'fill_in_the_gap') {
                    const gapAnswers = question.querySelectorAll('input[name*="gap_answers"]');
                    let hasValidGaps = 0;
                    gapAnswers.forEach(function(gap) {
                        if (gap.value && gap.value.trim() !== '') hasValidGaps++;
                    });
                    
                    if (hasValidGaps === 0) {
                        errors.push('Question ' + questionNumber + ': Please provide at least one gap answer.');
                    }
                }
                
                if (type === 'keywords') {
                    const keywords = question.querySelectorAll('input[name*="keywords"]');
                    let hasValidKeywords = 0;
                    keywords.forEach(function(keyword) {
                        if (keyword.value && keyword.value.trim() !== '') hasValidKeywords++;
                    });
                    
                    if (hasValidKeywords === 0) {
                        errors.push('Question ' + questionNumber + ': Please provide at least one keyword.');
                    }
                }
                
                if (type === 'matching') {
                    const leftInputs = question.querySelectorAll('input[name*="pairs"][name*="[left]"]');
                    const rightInputs = question.querySelectorAll('input[name*="pairs"][name*="[right]"]');
                    
                    let completePairs = 0;
                    for (let i = 0; i < Math.min(leftInputs.length, rightInputs.length); i++) {
                        if (leftInputs[i].value && leftInputs[i].value.trim() !== '' &&
                            rightInputs[i].value && rightInputs[i].value.trim() !== '') {
                            completePairs++;
                        }
                    }
                    
                    if (completePairs < 1) {
                        errors.push('Question ' + questionNumber + ': Please provide at least one complete matching pair.');
                    }
                }
            }
        });
        
        return errors;
    },
    
    clearFields: function() {
        
        const quizFields = document.querySelectorAll('#quiz-fields input, #quiz-fields select, #quiz-fields textarea');
        quizFields.forEach(function(field) {
            if (field.type === 'checkbox') {
                field.checked = false;
            } else {
                field.value = '';
            }
        });
        
        // Clear all questions
        const questionsContainer = document.getElementById('questions-container');
        if (questionsContainer) {
            questionsContainer.innerHTML = 
                '<div class="text-center py-8 text-gray-500">' +
                    '<i class="fas fa-question-circle text-3xl mb-2"></i>' +
                    '<p>No questions added yet. Click "Add Question" to get started.</p>' +
                '</div>';
        }
        
        
        if (window.QuizBuilder) {
            window.QuizBuilder.questionIndex = 0;
        }
        
        // Reset form state
        const existingSection = document.getElementById('existing-quiz-section');
        if (existingSection) {
            existingSection.classList.add('hidden');
        }
        
        const creationForm = document.getElementById('quiz-creation-form');
        if (creationForm) {
            creationForm.style.opacity = '1';
            creationForm.style.pointerEvents = 'auto';
        }
    }
};


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (window.QuizLessonHandler) {
            window.QuizLessonHandler.initialize();
        }
    });
} else {
    
    if (window.QuizLessonHandler) {
        window.QuizLessonHandler.initialize();
    }
}
</script> 