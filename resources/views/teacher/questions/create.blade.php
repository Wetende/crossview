<style>
    .question-option-container {
        margin-bottom: 10px;
    }
    .option-controls {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .matching-pair-container, .image-matching-container, .keyword-answer-container, .gap-answer-container {
        margin-bottom: 15px;
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background-color: #f9f9f9;
    }
    .drag-handle {
        cursor: move;
        padding: 5px;
    }
    #questionForm .form-group.required label:after {
        content: " *";
        color: red;
    }
</style>

<div class="container-fluid px-0">
    <!-- Question header with title and back button -->
    <div class="d-flex justify-content-between align-items-center mb-30">
        <h4 class="fw-700 text-dark-1">{{ __('Create Question') }}</h4>
        <a href="{{ route('teacher.courses.builder', $course->id) }}" class="button -sm -outline-dark-1 text-dark-1">
            <i class="fas fa-arrow-left mr-8"></i> {{ __('Back to Builder') }}
        </a>
    </div>

    <div class="row">
        <div class="col-lg-12">
            <div class="card -dark-bg-light-1">
                <div class="card-header">
                    <h5 class="card-title mb-0 text-dark-1">{{ __('Add Question to Quiz') }}: <span class="fw-500">{{ $quiz->title }}</span></h5>
                </div>
                <div class="card-body">
                    <form id="questionForm" action="{{ route('teacher.courses.sections.quizzes.questions.store', [$course, $section, $quiz]) }}" method="POST" enctype="multipart/form-data">
                        @csrf
                        
                        <div class="row g-3">
                            <!-- Question Type Selection -->
                            <div class="col-md-12 form-group required">
                                <label for="question_type" class="form-label fw-500 text-dark-1">{{ __('Question Type') }}</label>
                                <select id="question_type" name="question_type" class="form-select" required>
                                    <option value="single_choice" {{ $questionType == 'single_choice' ? 'selected' : '' }}>{{ __('Single Choice') }}</option>
                                    <option value="multiple_choice" {{ $questionType == 'multiple_choice' ? 'selected' : '' }}>{{ __('Multiple Choice') }}</option>
                                    <option value="true_false" {{ $questionType == 'true_false' ? 'selected' : '' }}>{{ __('True/False') }}</option>
                                    <option value="matching" {{ $questionType == 'matching' ? 'selected' : '' }}>{{ __('Matching') }}</option>
                                    <option value="image_matching" {{ $questionType == 'image_matching' ? 'selected' : '' }}>{{ __('Image Matching') }}</option>
                                    <option value="keywords" {{ $questionType == 'keywords' ? 'selected' : '' }}>{{ __('Keywords') }}</option>
                                    <option value="fill_gap" {{ $questionType == 'fill_gap' ? 'selected' : '' }}>{{ __('Fill in the Gap') }}</option>
                                </select>
                                @error('question_type') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                            </div>

                            <!-- Question Text -->
                            <div class="col-md-12 form-group required">
                                <label for="text" class="form-label fw-500 text-dark-1">{{ __('Question Text') }}</label>
                                <textarea id="text" name="text" class="form-control rich-text-editor" rows="4" required>{{ old('text') }}</textarea>
                                <div id="fill_gap_instructions" class="text-14 mt-2 text-green-1 d-none">
                                    {{ __('For gap questions, use [gap] to mark where gaps should appear.') }}
                                </div>
                                @error('text') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                            </div>

                            <!-- Question Image -->
                            <div class="col-md-12 form-group">
                                <label for="image" class="form-label fw-500 text-dark-1">{{ __('Question Image (Optional)') }}</label>
                                <input type="file" id="image" name="image" class="form-control" accept="image/*">
                                @error('image') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                            </div>

                            <!-- Question Points -->
                            <div class="col-md-6 form-group required">
                                <label for="points" class="form-label fw-500 text-dark-1">{{ __('Points') }}</label>
                                <input type="number" id="points" name="points" class="form-control" value="{{ old('points', 1) }}" min="0.5" step="0.5" required>
                                @error('points') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                            </div>

                            <!-- Subject Topic (if applicable) -->
                            <div class="col-md-6 form-group">
                                <label for="subject_topic_id" class="form-label fw-500 text-dark-1">{{ __('Subject Topic (Optional)') }}</label>
                                <select id="subject_topic_id" name="subject_topic_id" class="form-select">
                                    <option value="">{{ __('Select Subject Topic') }}</option>
                                    @foreach($subjectTopics as $topic)
                                        <option value="{{ $topic->id }}" {{ old('subject_topic_id') == $topic->id ? 'selected' : '' }}>{{ $topic->name }}</option>
                                    @endforeach
                                </select>
                                @error('subject_topic_id') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                            </div>

                            <!-- Add to My Library -->
                            <div class="col-md-12 form-group">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="add_to_my_library" name="add_to_my_library" value="1" {{ old('add_to_my_library') ? 'checked' : '' }}>
                                    <label class="form-check-label fw-500 text-dark-1" for="add_to_my_library">{{ __('Add to My Question Library') }}</label>
                                </div>
                                @error('add_to_my_library') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                            </div>

                            <!-- Question Type Specific Form Sections -->
                            <div class="col-md-12">
                                <div id="question_type_forms">
                                    <!-- Single/Multiple Choice Options -->
                                    <div id="choice_options_section" class="question-type-section d-none">
                                        <hr>
                                        <h5 class="fw-500 text-dark-1 mb-3">{{ __('Answer Options') }}</h5>
                                        
                                        <div id="options_container">
                                            <!-- Options will be dynamically added here by JavaScript -->
                                        </div>
                                        
                                        <button type="button" id="add_option_btn" class="button -sm -dark-1 text-white mt-3">
                                            <i class="feather-plus me-1"></i> {{ __('Add Option') }}
                                        </button>
                                    </div>
                                    
                                    <!-- True/False Options -->
                                    <div id="true_false_section" class="question-type-section d-none">
                                        <hr>
                                        <h5 class="fw-500 text-dark-1 mb-3">{{ __('Correct Answer') }}</h5>
                                        
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="true_false_answer" id="true_answer" value="true" {{ old('true_false_answer') == 'true' ? 'checked' : '' }}>
                                            <label class="form-check-label fw-500 text-dark-1" for="true_answer">{{ __('True') }}</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="true_false_answer" id="false_answer" value="false" {{ old('true_false_answer') == 'false' ? 'checked' : '' }}>
                                            <label class="form-check-label fw-500 text-dark-1" for="false_answer">{{ __('False') }}</label>
                                        </div>
                                        @error('true_false_answer') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                                    </div>
                                    
                                    <!-- Matching Pairs -->
                                    <div id="matching_section" class="question-type-section d-none">
                                        <hr>
                                        <h5 class="fw-500 text-dark-1 mb-3">{{ __('Matching Pairs') }}</h5>
                                        
                                        <div id="matching_pairs_container">
                                            <!-- Matching pairs will be dynamically added here -->
                                        </div>
                                        
                                        <button type="button" id="add_matching_pair_btn" class="button -sm -dark-1 text-white mt-3">
                                            <i class="feather-plus me-1"></i> {{ __('Add Matching Pair') }}
                                        </button>
                                    </div>
                                    
                                    <!-- Image Matching Pairs -->
                                    <div id="image_matching_section" class="question-type-section d-none">
                                        <hr>
                                        <h5 class="fw-500 text-dark-1 mb-3">{{ __('Image Matching Pairs') }}</h5>
                                        
                                        <div id="image_matching_container">
                                            <!-- Image matching pairs will be dynamically added here -->
                                        </div>
                                        
                                        <button type="button" id="add_image_matching_btn" class="button -sm -dark-1 text-white mt-3">
                                            <i class="feather-plus me-1"></i> {{ __('Add Image Matching Pair') }}
                                        </button>
                                    </div>
                                    
                                    <!-- Keywords -->
                                    <div id="keywords_section" class="question-type-section d-none">
                                        <hr>
                                        <h5 class="fw-500 text-dark-1 mb-3">{{ __('Keyword Answers') }}</h5>
                                        
                                        <div class="form-check mb-3">
                                            <input class="form-check-input" type="checkbox" id="case_sensitive" name="case_sensitive" value="1" {{ old('case_sensitive') ? 'checked' : '' }}>
                                            <label class="form-check-label fw-500 text-dark-1" for="case_sensitive">{{ __('Case Sensitive') }}</label>
                                        </div>
                                        
                                        <div id="keywords_container">
                                            <!-- Keywords will be dynamically added here -->
                                        </div>
                                        
                                        <button type="button" id="add_keyword_btn" class="button -sm -dark-1 text-white mt-3">
                                            <i class="feather-plus me-1"></i> {{ __('Add Keyword') }}
                                        </button>
                                    </div>
                                    
                                    <!-- Fill in the Gap -->
                                    <div id="fill_gap_section" class="question-type-section d-none">
                                        <hr>
                                        <h5 class="fw-500 text-dark-1 mb-3">{{ __('Gap Answers') }}</h5>
                                        <p class="text-14 text-muted mb-3">{{ __('Add possible correct answers for each gap. Use [gap] in your question text to mark where gaps should appear.') }}</p>
                                        
                                        <div id="gaps_container">
                                            <!-- Gap answers will be dynamically added here based on [gap] tags in question text -->
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Hint and Explanation -->
                            <div class="col-md-12 form-group">
                                <label for="hint" class="form-label fw-500 text-dark-1">{{ __('Hint (Optional)') }}</label>
                                <textarea id="hint" name="hint" class="form-control" rows="2">{{ old('hint') }}</textarea>
                                @error('hint') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                            </div>

                            <div class="col-md-12 form-group">
                                <label for="explanation" class="form-label fw-500 text-dark-1">{{ __('Explanation (Optional)') }}</label>
                                <textarea id="explanation" name="explanation" class="form-control rich-text-editor" rows="3">{{ old('explanation') }}</textarea>
                                <small class="form-text text-muted">{{ __('This will be shown to students after they answer the question.') }}</small>
                                @error('explanation') <div class="text-red-1 mt-1">{{ $message }}</div> @enderror
                            </div>

                            <div class="col-12 mt-4">
                                <button type="submit" class="button -md -blue-1 text-white">{{ __('Save Question') }}</button>
                                <a href="{{ route('teacher.courses.builder', $course->id) }}" class="button -md -outline-dark-1 text-dark-1">{{ __('Cancel') }}</a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    // We're keeping just the essential JavaScript here. The full script should handle all question types and interactions.
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize TinyMCE for rich text editors
        if (typeof tinymce !== 'undefined') {
            tinymce.init({
                selector: '.rich-text-editor',
                height: 300,
                menubar: false,
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
        
        // Question type change handler
        const questionType = document.getElementById('question_type');
        const choiceOptionsSection = document.getElementById('choice_options_section');
        const trueFalseSection = document.getElementById('true_false_section');
        const matchingSection = document.getElementById('matching_section');
        const imageMatchingSection = document.getElementById('image_matching_section');
        const keywordsSection = document.getElementById('keywords_section');
        const fillGapSection = document.getElementById('fill_gap_section');
        const fillGapInstructions = document.getElementById('fill_gap_instructions');
        
        function showQuestionTypeSection() {
            // Hide all sections first
            document.querySelectorAll('.question-type-section').forEach(section => {
                section.classList.add('d-none');
            });
            
            // Show the gap instructions only for fill_gap type
            fillGapInstructions.classList.add('d-none');
            
            // Show the appropriate section based on selected question type
            const selectedType = questionType.value;
            
            if (selectedType === 'single_choice' || selectedType === 'multiple_choice') {
                choiceOptionsSection.classList.remove('d-none');
                initChoiceOptions();
            } else if (selectedType === 'true_false') {
                trueFalseSection.classList.remove('d-none');
            } else if (selectedType === 'matching') {
                matchingSection.classList.remove('d-none');
                initMatchingPairs();
            } else if (selectedType === 'image_matching') {
                imageMatchingSection.classList.remove('d-none');
                initImageMatching();
            } else if (selectedType === 'keywords') {
                keywordsSection.classList.remove('d-none');
                initKeywords();
            } else if (selectedType === 'fill_gap') {
                fillGapSection.classList.remove('d-none');
                fillGapInstructions.classList.remove('d-none');
                // Gaps will be initialized when question text changes
            }
        }
        
        // Initial setup based on pre-selected question type
        showQuestionTypeSection();
        
        // Change handler for question type
        questionType.addEventListener('change', showQuestionTypeSection);
        
        // Initialize each question type's specific functionality
        function initChoiceOptions() {
            const optionsContainer = document.getElementById('options_container');
            const addOptionBtn = document.getElementById('add_option_btn');
            
            // Clear existing options
            optionsContainer.innerHTML = '';
            
            // Add initial options (at least 2)
            addOption();
            addOption();
            
            // Add option button handler
            addOptionBtn.addEventListener('click', addOption);
            
            function addOption() {
                const optionIndex = optionsContainer.children.length;
                const optionType = questionType.value === 'single_choice' ? 'radio' : 'checkbox';
                
                const optionDiv = document.createElement('div');
                optionDiv.className = 'question-option-container d-flex align-items-start mb-3';
                optionDiv.innerHTML = `
                    <div class="option-controls me-3 pt-2">
                        <input class="${optionType} form-check-input" type="${optionType}" name="is_correct[]" value="${optionIndex}" id="option_correct_${optionIndex}">
                    </div>
                    <div class="flex-grow-1">
                        <textarea class="form-control" name="options[${optionIndex}][text]" rows="1" placeholder="{{ __('Option text') }}" required></textarea>
                    </div>
                    <div class="option-controls ms-3">
                        <button type="button" class="button -xs -red-1 text-white remove-option-btn" data-index="${optionIndex}">
                            <i class="feather-x"></i>
                        </button>
                    </div>
                `;
                
                optionsContainer.appendChild(optionDiv);
                
                // Add remove button handler
                optionDiv.querySelector('.remove-option-btn').addEventListener('click', function() {
                    if (optionsContainer.children.length > 2) {
                        optionDiv.remove();
                        // Renumber the remaining options
                        renumberOptions();
                    } else {
                        alert("{{ __('A question must have at least 2 options.') }}");
                    }
                });
            }
            
            function renumberOptions() {
                const options = optionsContainer.querySelectorAll('.question-option-container');
                options.forEach((option, index) => {
                    const correctInput = option.querySelector('input[type="' + optionType + '"]');
                    correctInput.value = index;
                    correctInput.id = `option_correct_${index}`;
                    
                    const textArea = option.querySelector('textarea');
                    textArea.name = `options[${index}][text]`;
                    
                    const removeBtn = option.querySelector('.remove-option-btn');
                    removeBtn.dataset.index = index;
                });
            }
        }
        
        // Similarly, add initialization functions for other question types
        function initMatchingPairs() {
            // Implementation for matching pairs
        }
        
        function initImageMatching() {
            // Implementation for image matching
        }
        
        function initKeywords() {
            // Implementation for keywords
        }
        
        // Handle gap questions
        const questionText = document.getElementById('text');
        questionText.addEventListener('keyup', function() {
            if (questionType.value === 'fill_gap') {
                updateGapsContainer();
            }
        });
        
        function updateGapsContainer() {
            // Logic to update gaps based on [gap] tags in question text
        }
    });
</script> 