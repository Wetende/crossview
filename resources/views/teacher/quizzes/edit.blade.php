{{-- Quiz CSS --}}
<style>
    .quiz-settings .form-group.required label:after {
        content: " *";
        color: red;
    }
    .question-item {
        border: 1px solid #eaeaea;
        margin-bottom: 20px;
        padding: 15px;
        border-radius: 8px;
        background-color: #fff;
    }
    .question-item:hover {
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .question-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #f0f0f0;
    }
    .question-controls {
        display: flex;
        gap: 5px;
    }
    .question-content {
        margin-bottom: 15px;
    }
    .question-options {
        padding-left: 20px;
    }
    .question-option {
        margin-bottom: 5px;
    }
    .correct-answer {
        font-weight: bold;
        color: #28a745;
    }
    .question-drag-handle {
        cursor: move;
        padding: 5px;
        color: #aaa;
    }
</style>

<div class="container-fluid px-0">
    <!-- Quiz header with title and back button -->
    <div class="d-flex justify-content-between align-items-center mb-30">
        <h4 class="fw-700 text-dark-1">{{ __('Edit Quiz') }}: {{ $quiz->title }}</h4>
        <a href="{{ route('teacher.courses.builder', $course->id) }}" class="button -sm -outline-dark-1 text-dark-1">
            <i class="fas fa-arrow-left mr-8"></i> {{ __('Back to Builder') }}
        </a>
    </div>

    <div class="row">
        <div class="col-lg-12">
            <div class="card -dark-bg-light-1">
                <div class="card-body">
                    <!-- Tabs -->
                    <ul class="nav nav-tabs" id="quizTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="settings-tab" data-bs-toggle="tab" data-bs-target="#settings" type="button" role="tab" aria-controls="settings" aria-selected="true">
                                <i class="feather-settings me-1"></i> {{ __('Settings') }}
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="questions-tab" data-bs-toggle="tab" data-bs-target="#questions" type="button" role="tab" aria-controls="questions" aria-selected="false">
                                <i class="feather-help-circle me-1"></i> {{ __('Questions') }} <span class="badge bg-blue-1 text-white">{{ $quiz->questions->count() }}</span>
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="faq-tab" data-bs-toggle="tab" data-bs-target="#faq" type="button" role="tab" aria-controls="faq" aria-selected="false">
                                <i class="feather-help-circle me-1"></i> {{ __('Q&A') }}
                            </button>
                        </li>
                    </ul>

                    <!-- Tab Content -->
                    <div class="tab-content mt-4" id="quizTabContent">
                        <!-- Settings Tab -->
                        <div class="tab-pane fade show active" id="settings" role="tabpanel" aria-labelledby="settings-tab">
                            <form class="quiz-settings" action="{{ route('teacher.courses.sections.quizzes.update', [$course, $section, $quiz]) }}" method="POST">
                                @csrf
                                @method('PUT')
                                <input type="hidden" name="update_type" value="settings">
                                
                                <div class="row g-3">
                                    <!-- Basic Info -->
                                    <div class="col-md-12 form-group required">
                                        <label for="title" class="form-label fw-500 text-dark-1">{{ __('Quiz Title') }}</label>
                                        <input type="text" id="title" name="title" class="form-control" value="{{ old('title', $quiz->title) }}" required>
                                        @error('title') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                                    </div>
                                    
                                    <div class="col-md-12 form-group">
                                        <label for="description" class="form-label fw-500 text-dark-1">{{ __('Description') }}</label>
                                        <textarea id="description" name="description" class="form-control rich-text-editor" rows="5">{{ old('description', $quiz->description) }}</textarea>
                                        @error('description') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                                    </div>

                                    <!-- Time and Style -->
                                    <div class="col-md-6 form-group">
                                        <label for="time_limit" class="form-label fw-500 text-dark-1">{{ __('Time Limit (Minutes)') }}</label>
                                        <div class="input-group">
                                            <input type="number" id="time_limit" name="time_limit" class="form-control" value="{{ old('time_limit', $quiz->time_limit) }}" min="0" step="1">
                                            <span class="input-group-text">{{ __('minutes') }}</span>
                                        </div>
                                        <small class="form-text text-muted">{{ __('Set to 0 for no time limit') }}</small>
                                        @error('time_limit') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                                    </div>
                                    
                                    <div class="col-md-6 form-group">
                                        <label for="style" class="form-label fw-500 text-dark-1">{{ __('Quiz Style') }}</label>
                                        <select id="style" name="style" class="form-select">
                                            <option value="standard" {{ old('style', $quiz->style) == 'standard' ? 'selected' : '' }}>{{ __('Standard (All questions on one page)') }}</option>
                                            <option value="one_per_page" {{ old('style', $quiz->style) == 'one_per_page' ? 'selected' : '' }}>{{ __('One Question Per Page') }}</option>
                                            <option value="survey" {{ old('style', $quiz->style) == 'survey' ? 'selected' : '' }}>{{ __('Survey Style (No correct answers)') }}</option>
                                        </select>
                                        @error('style') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                                    </div>

                                    <!-- Quiz Behavior -->
                                    <div class="col-md-6 form-group">
                                        <div class="form-check form-switch mt-4">
                                            <input class="form-check-input" type="checkbox" id="randomize_questions" name="randomize_questions" value="1" {{ old('randomize_questions', $quiz->randomize_questions) ? 'checked' : '' }}>
                                            <label class="form-check-label fw-500 text-dark-1" for="randomize_questions">{{ __('Randomize Question Order') }}</label>
                                        </div>
                                        @error('randomize_questions') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                                    </div>
                                    
                                    <div class="col-md-6 form-group">
                                        <div class="form-check form-switch mt-4">
                                            <input class="form-check-input" type="checkbox" id="show_correct_answer" name="show_correct_answer" value="1" {{ old('show_correct_answer', $quiz->show_correct_answer) ? 'checked' : '' }}>
                                            <label class="form-check-label fw-500 text-dark-1" for="show_correct_answer">{{ __('Show Correct Answers After Submission') }}</label>
                                        </div>
                                        @error('show_correct_answer') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                                    </div>

                                    <!-- Passing Grade and Retake Settings -->
                                    <div class="col-md-6 form-group required">
                                        <label for="passing_grade" class="form-label fw-500 text-dark-1">{{ __('Passing Grade (%)') }}</label>
                                        <div class="input-group">
                                            <input type="number" id="passing_grade" name="passing_grade" class="form-control" value="{{ old('passing_grade', $quiz->passing_grade) }}" min="0" max="100" step="1" required>
                                            <span class="input-group-text">%</span>
                                        </div>
                                        @error('passing_grade') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                                    </div>
                                    
                                    <div class="col-md-6 form-group">
                                        <label for="retake_penalty_percent" class="form-label fw-500 text-dark-1">{{ __('Points Cut After Retake (%)') }}</label>
                                        <div class="input-group">
                                            <input type="number" id="retake_penalty_percent" name="retake_penalty_percent" class="form-control" value="{{ old('retake_penalty_percent', $quiz->retake_penalty_percent) }}" min="0" max="100" step="1">
                                            <span class="input-group-text">%</span>
                                        </div>
                                        <small class="form-text text-muted">{{ __('Set to 0 for no penalty on retakes') }}</small>
                                        @error('retake_penalty_percent') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                                    </div>
                                    
                                    <div class="col-12 mt-4">
                                        <button type="submit" class="button -md -blue-1 text-white">{{ __('Save Settings') }}</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <!-- Questions Tab -->
                        <div class="tab-pane fade" id="questions" role="tabpanel" aria-labelledby="questions-tab">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h5 class="fw-500 text-dark-1">{{ __('Quiz Questions') }}</h5>
                                <div>
                                    <button type="button" class="button -sm -dark-1 text-white me-2" id="quiz-library-btn">
                                        <i class="feather-book me-1"></i> {{ __('Question Library') }}
                                    </button>
                                    <a href="{{ route('teacher.courses.sections.quizzes.questions.create', [$course, $section, $quiz]) }}" class="button -sm -blue-1 text-white">
                                        <i class="feather-plus me-1"></i> {{ __('Add Question') }}
                                    </a>
                                </div>
                            </div>
                            
                            @if($quiz->questions->count() > 0)
                                <div id="questions_list">
                                    @foreach($quiz->questions->sortBy('order') as $question)
                                        <div class="question-item" data-question-id="{{ $question->id }}">
                                            <div class="question-header">
                                                <div class="d-flex align-items-center">
                                                    <div class="question-drag-handle me-2">
                                                        <i class="feather-move"></i>
                                                    </div>
                                                    <h6 class="fw-500 text-dark-1 mb-0">{{ __('Question') }} #{{ $loop->iteration }}: {{ $question->question_type }}</h6>
                                                    @if($question->points)
                                                        <span class="badge bg-green-1 text-white ms-2">{{ $question->points }} {{ __('pts') }}</span>
                                                    @endif
                                                </div>
                                                <div class="question-controls">
                                                    <a href="{{ route('teacher.courses.sections.quizzes.questions.edit', [$course, $section, $quiz, $question]) }}" class="button -sm -outline-dark-1 text-dark-1">
                                                        <i class="feather-edit-2"></i>
                                                    </a>
                                                    <form action="{{ route('teacher.courses.sections.quizzes.questions.destroy', [$course, $section, $quiz, $question]) }}" method="POST" class="d-inline delete-question-form">
                                                        @csrf
                                                        @method('DELETE')
                                                        <button type="submit" class="button -sm -red-1 text-white delete-question-btn">
                                                            <i class="feather-trash-2"></i>
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>
                                            <div class="question-content">
                                                {!! $question->text !!}
                                                @if($question->image_path)
                                                    <div class="question-image mt-2">
                                                        <img src="{{ $question->image_path }}" alt="Question image" class="img-fluid" style="max-height: 200px;">
                                                    </div>
                                                @endif
                                            </div>
                                            
                                            @if(in_array($question->question_type, ['single_choice', 'multiple_choice', 'true_false']))
                                                <div class="question-options">
                                                    @foreach($question->options as $option)
                                                        <div class="question-option {{ $option->is_correct ? 'correct-answer' : '' }}">
                                                            @if($question->question_type == 'single_choice')
                                                                <i class="feather-{{ $option->is_correct ? 'check-circle' : 'circle' }} me-2"></i>
                                                            @else
                                                                <i class="feather-{{ $option->is_correct ? 'check-square' : 'square' }} me-2"></i>
                                                            @endif
                                                            {{ $option->text }}
                                                        </div>
                                                    @endforeach
                                                </div>
                                            @elseif($question->question_type == 'text')
                                                <div class="text-muted fst-italic mt-2">{{ __('Text Input Question') }}</div>
                                            @elseif($question->question_type == 'essay')
                                                <div class="text-muted fst-italic mt-2">{{ __('Essay Question (Manual Grading)') }}</div>
                                            @endif
                                        </div>
                                    @endforeach
                                </div>
                                
                                <form action="{{ route('teacher.courses.sections.quizzes.questions.reorder', [$course, $section, $quiz]) }}" method="POST" id="reorderQuestionsForm">
                                    @csrf
                                    <input type="hidden" name="question_order" id="question_order" value="">
                                </form>
                            @else
                                <div class="alert alert-info">
                                    <i class="feather-info me-2"></i> {{ __('No questions have been added to this quiz yet.') }}
                                </div>
                            @endif
                        </div>
                        
                        <!-- FAQ Tab -->
                        <div class="tab-pane fade" id="faq" role="tabpanel" aria-labelledby="faq-tab">
                            <!-- Quiz FAQ Content -->
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="mb-4">
                                        <h5 class="fw-500 text-dark-1">{{ __('Quiz Frequently Asked Questions') }}</h5>
                                        <p class="text-muted">{{ __('Manage common questions and answers about this quiz.') }}</p>
                                    </div>
                                    
                                    <form action="{{ route('teacher.courses.sections.quizzes.update', [$course, $section, $quiz]) }}" method="POST">
                                        @csrf
                                        @method('PUT')
                                        <input type="hidden" name="update_type" value="faq">
                                        
                                        <div id="faq_container">
                                            @if(is_array($quiz->faq) && count($quiz->faq) > 0)
                                                @foreach($quiz->faq as $index => $item)
                                                    <div class="card mb-3 faq-item">
                                                        <div class="card-body">
                                                            <div class="mb-3">
                                                                <label class="fw-500 text-dark-1">{{ __('Question') }}</label>
                                                                <input type="text" name="faq[{{ $index }}][question]" class="form-control" value="{{ $item['question'] }}" placeholder="{{ __('FAQ Question') }}">
                                                            </div>
                                                            <div class="mb-2">
                                                                <label class="fw-500 text-dark-1">{{ __('Answer') }}</label>
                                                                <textarea name="faq[{{ $index }}][answer]" class="form-control" rows="3" placeholder="{{ __('FAQ Answer') }}">{{ $item['answer'] }}</textarea>
                                                            </div>
                                                            <button type="button" class="button -sm -red-1 text-white remove-faq">{{ __('Remove') }}</button>
                                                        </div>
                                                    </div>
                                                @endforeach
                                            @else
                                                <div class="card mb-3 faq-item">
                                                    <div class="card-body">
                                                        <div class="mb-3">
                                                            <label class="fw-500 text-dark-1">{{ __('Question') }}</label>
                                                            <input type="text" name="faq[0][question]" class="form-control" placeholder="{{ __('FAQ Question') }}">
                                                        </div>
                                                        <div class="mb-2">
                                                            <label class="fw-500 text-dark-1">{{ __('Answer') }}</label>
                                                            <textarea name="faq[0][answer]" class="form-control" rows="3" placeholder="{{ __('FAQ Answer') }}"></textarea>
                                                        </div>
                                                        <button type="button" class="button -sm -red-1 text-white remove-faq">{{ __('Remove') }}</button>
                                                    </div>
                                                </div>
                                            @endif
                                        </div>
                                        
                                        <div class="mb-4">
                                            <button type="button" class="button -sm -dark-1 text-white" id="add_faq">
                                                <i class="feather-plus me-1"></i> {{ __('Add FAQ Item') }}
                                            </button>
                                        </div>
                                        
                                        <div>
                                            <button type="submit" class="button -md -blue-1 text-white">{{ __('Save FAQ') }}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

{{-- Question Library Modal --}}
<div class="modal fade" id="questionLibraryModal" tabindex="-1" aria-labelledby="questionLibraryModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="questionLibraryModalLabel">{{ __('Question Library') }}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <input type="text" class="form-control" id="searchQuestionLibrary" placeholder="{{ __('Search questions...') }}">
                </div>
                <div id="questionLibraryContent">
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">{{ __('Loading...') }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="button -dark-1 text-white" data-bs-dismiss="modal">{{ __('Close') }}</button>
                <button type="button" class="button -blue-1 text-white" id="importSelectedQuestions" disabled>{{ __('Import Selected') }}</button>
            </div>
        </div>
    </div>
</div>

{{-- Delete Confirmation Modal --}}
<div class="modal fade" id="deleteConfirmationModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">{{ __('Confirm Delete') }}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                {{ __('Are you sure you want to delete this question? This action cannot be undone.') }}
            </div>
            <div class="modal-footer">
                <button type="button" class="button -dark-1 text-white" data-bs-dismiss="modal">{{ __('Cancel') }}</button>
                <button type="button" class="button -red-1 text-white" id="confirmDelete">{{ __('Delete') }}</button>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize TinyMCE
        if (typeof tinymce !== 'undefined') {
            tinymce.init({
                selector: '.rich-text-editor',
                height: 300,
                plugins: [
                    'advlist autolink lists link image charmap print preview anchor',
                    'searchreplace visualblocks code fullscreen',
                    'insertdatetime media table paste code help wordcount'
                ],
                toolbar: 'undo redo | formatselect | ' +
                    'bold italic backcolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            });
        }
        
        // Question sorting
        if (typeof Sortable !== 'undefined' && document.getElementById('questions_list')) {
            const questionsList = document.getElementById('questions_list');
            new Sortable(questionsList, {
                handle: '.question-drag-handle',
                animation: 150,
                onEnd: function() {
                    const questionOrder = [];
                    document.querySelectorAll('#questions_list .question-item').forEach(function(item) {
                        questionOrder.push(item.dataset.questionId);
                    });
                    document.getElementById('question_order').value = questionOrder.join(',');
                    document.getElementById('reorderQuestionsForm').submit();
                }
            });
        }
        
        // Delete confirmation
        const deleteQuestionBtns = document.querySelectorAll('.delete-question-btn');
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
        let formToSubmit = null;
        
        deleteQuestionBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                formToSubmit = this.closest('form');
                deleteModal.show();
            });
        });
        
        document.getElementById('confirmDelete').addEventListener('click', function() {
            if (formToSubmit) {
                formToSubmit.submit();
            }
            deleteModal.hide();
        });
        
        // Question Library Modal
        const questionLibraryBtn = document.getElementById('quiz-library-btn');
        const questionLibraryModal = new bootstrap.Modal(document.getElementById('questionLibraryModal'));
        
        if (questionLibraryBtn) {
            questionLibraryBtn.addEventListener('click', function() {
                questionLibraryModal.show();
                // Load question library content via AJAX
                fetch('{{ route('teacher.courses.sections.quizzes.question-library', [$course, $section, $quiz]) }}')
                    .then(response => response.text())
                    .then(html => {
                        document.getElementById('questionLibraryContent').innerHTML = html;
                        initializeLibraryFunctions();
                    });
            });
        }
        
        function initializeLibraryFunctions() {
            const searchInput = document.getElementById('searchQuestionLibrary');
            const checkboxes = document.querySelectorAll('.question-library-checkbox');
            const importButton = document.getElementById('importSelectedQuestions');
            
            searchInput.addEventListener('keyup', function() {
                const searchValue = this.value.toLowerCase();
                document.querySelectorAll('.question-library-item').forEach(item => {
                    const question = item.querySelector('.question-text').textContent.toLowerCase();
                    if (question.includes(searchValue)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
            
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const checkedCount = document.querySelectorAll('.question-library-checkbox:checked').length;
                    importButton.disabled = checkedCount === 0;
                });
            });
            
            importButton.addEventListener('click', function() {
                const selectedQuestions = [];
                document.querySelectorAll('.question-library-checkbox:checked').forEach(checkbox => {
                    selectedQuestions.push(checkbox.value);
                });
                
                if (selectedQuestions.length > 0) {
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = '{{ route('teacher.courses.sections.quizzes.import-questions', [$course, $section, $quiz]) }}';
                    
                    const csrfToken = document.createElement('input');
                    csrfToken.type = 'hidden';
                    csrfToken.name = '_token';
                    csrfToken.value = '{{ csrf_token() }}';
                    form.appendChild(csrfToken);
                    
                    const questionsInput = document.createElement('input');
                    questionsInput.type = 'hidden';
                    questionsInput.name = 'questions';
                    questionsInput.value = selectedQuestions.join(',');
                    form.appendChild(questionsInput);
                    
                    document.body.appendChild(form);
                    form.submit();
                }
            });
        }
        
        // FAQ Management
        const addFaqBtn = document.getElementById('add_faq');
        const faqContainer = document.getElementById('faq_container');
        
        if (addFaqBtn && faqContainer) {
            let faqCount = document.querySelectorAll('.faq-item').length;
            
            addFaqBtn.addEventListener('click', function() {
                const faqItem = document.createElement('div');
                faqItem.className = 'card mb-3 faq-item';
                faqItem.innerHTML = `
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="fw-500 text-dark-1">{{ __('Question') }}</label>
                            <input type="text" name="faq[${faqCount}][question]" class="form-control" placeholder="{{ __('FAQ Question') }}">
                        </div>
                        <div class="mb-2">
                            <label class="fw-500 text-dark-1">{{ __('Answer') }}</label>
                            <textarea name="faq[${faqCount}][answer]" class="form-control" rows="3" placeholder="{{ __('FAQ Answer') }}"></textarea>
                        </div>
                        <button type="button" class="button -sm -red-1 text-white remove-faq">{{ __('Remove') }}</button>
                    </div>
                `;
                faqContainer.appendChild(faqItem);
                faqCount++;
                
                // Add remove event listener to new item
                faqItem.querySelector('.remove-faq').addEventListener('click', function() {
                    faqContainer.removeChild(faqItem);
                });
            });
            
            // Remove FAQ items
            document.querySelectorAll('.remove-faq').forEach(btn => {
                btn.addEventListener('click', function() {
                    const faqItem = this.closest('.faq-item');
                    faqContainer.removeChild(faqItem);
                });
            });
        }
    });
</script> 