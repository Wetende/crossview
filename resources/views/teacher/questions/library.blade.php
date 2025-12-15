<x-dashboard-layout title="Teacher Dashboard - Question Library">
    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Question Library</h1>
                <div class="mt-10">Manage your question bank and import questions to your quizzes</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('teacher.courses.index') }}" class="button -icon -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white mr-10">
                    <i class="icon-arrow-left mr-10"></i>
                    My @lmsterm('Study Materials')
                </a>
            </div>
        </div>

        <div class="row y-gap-30">
            <!-- Filter Card -->
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Search & Filter Questions</h2>
                    </div>
                    <div class="py-30 px-30">
                        <form id="question-filter-form" class="row y-gap-20">
                            <div class="col-lg-4">
                                <div class="form-group">
                                    <label class="text-14 lh-1 fw-500 text-dark-1 mb-10">Search</label>
                                    <input type="text" id="search-input" class="form-control" placeholder="Search questions...">
                                </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label class="text-14 lh-1 fw-500 text-dark-1 mb-10">Question Type</label>
                                    <select id="type-filter" class="form-select">
                                        <option value="">All Types</option>
                                        @foreach($questionTypes as $value => $label)
                                            <option value="{{ $value }}">{{ $label }}</option>
                                        @endforeach
                                    </select>
                                </div>
                            </div>
                            <div class="col-lg-3">
                                <div class="form-group">
                                    <label class="text-14 lh-1 fw-500 text-dark-1 mb-10">Subject</label>
                                    <select id="subject-filter" class="form-select">
                                        <option value="">All Subjects</option>
                                        @foreach($subjects as $subject)
                                            <option value="{{ $subject->id }}">{{ $subject->name }}</option>
                                        @endforeach
                                    </select>
                                </div>
                            </div>
                            <div class="col-lg-2">
                                <div class="form-group pt-30">
                                    <button type="button" id="search-button" class="button -md -dark-1 text-white w-1/1">
                                        Search
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Questions List -->
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Your Questions</h2>
                        <div class="d-flex items-center">
                            <button id="select-action" class="button -sm -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white mr-10" disabled>
                                <i class="icon-check-circle mr-10"></i>
                                Batch Actions
                            </button>
                        </div>
                    </div>
                    <div class="py-30 px-30">
                        <div id="questions-container">
                            <!-- Questions will be loaded here via AJAX -->
                            <div class="text-center py-50">
                                <div class="spinner-border" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <div class="mt-10">Loading questions...</div>
                            </div>
                        </div>
                        
                        <!-- Pagination -->
                        <div id="pagination-container" class="pt-30 border-top-light">
                            <!-- Pagination will be added here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Question Preview Modal -->
    <div class="modal fade" id="questionPreviewModal" tabindex="-1" aria-labelledby="questionPreviewModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="questionPreviewModalLabel">Question Preview</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="questionPreviewContent">
                    <!-- Question content will be loaded here -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="button -md -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize variables
            let currentPage = 1;
            let searchParams = {
                page: 1
            };
            
            // Initial search
            searchQuestions();
            
            // Search button click
            document.getElementById('search-button').addEventListener('click', function() {
                searchParams = {
                    page: 1,
                    search: document.getElementById('search-input').value,
                    type: document.getElementById('type-filter').value,
                    subject_id: document.getElementById('subject-filter').value
                };
                
                searchQuestions();
            });
            
            // Handle subject change - load topics
            document.getElementById('subject-filter').addEventListener('change', function() {
                const subjectId = this.value;
                if (subjectId) {
                    loadTopics(subjectId);
                }
            });
            
            // Function to search questions
            function searchQuestions() {
                const questionsContainer = document.getElementById('questions-container');
                questionsContainer.innerHTML = `
                    <div class="text-center py-50">
                        <div class="spinner-border" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <div class="mt-10">Loading questions...</div>
                    </div>
                `;
                
                // Build query string
                const queryParams = new URLSearchParams(searchParams).toString();
                
                // Make AJAX request
                fetch('{{ route("teacher.questions.library.search") }}?' + queryParams, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    renderQuestions(data.questions, data.pagination);
                })
                .catch(error => {
                    console.error('Error:', error);
                    questionsContainer.innerHTML = `
                        <div class="text-center py-50">
                            <div class="alert alert-danger">
                                Failed to load questions. Please try again.
                            </div>
                        </div>
                    `;
                });
            }
            
            // Function to load topics for a subject
            function loadTopics(subjectId) {
                fetch('{{ route("teacher.questions.library.topics", ":subjectId") }}'.replace(':subjectId', subjectId), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    // Add a new topic filter if it doesn't exist
                    let topicFilter = document.getElementById('topic-filter');
                    if (!topicFilter) {
                        // Create the topic filter and add it to the form
                        const subjectFilterCol = document.getElementById('subject-filter').closest('.col-lg-3');
                        const topicFilterCol = document.createElement('div');
                        topicFilterCol.className = 'col-lg-3';
                        topicFilterCol.innerHTML = `
                            <div class="form-group">
                                <label class="text-14 lh-1 fw-500 text-dark-1 mb-10">Topic</label>
                                <select id="topic-filter" class="form-select">
                                    <option value="">All Topics</option>
                                </select>
                            </div>
                        `;
                        subjectFilterCol.insertAdjacentElement('afterend', topicFilterCol);
                        topicFilter = document.getElementById('topic-filter');
                    }
                    
                    // Clear existing options
                    topicFilter.innerHTML = '<option value="">All Topics</option>';
                    
                    // Add new options
                    data.forEach(topic => {
                        const option = document.createElement('option');
                        option.value = topic.id;
                        option.textContent = topic.name;
                        topicFilter.appendChild(option);
                    });
                    
                    // Add event listener
                    topicFilter.addEventListener('change', function() {
                        searchParams.subject_topic_id = this.value;
                    });
                })
                .catch(error => {
                    console.error('Error loading topics:', error);
                });
            }
            
            // Function to render questions
            function renderQuestions(questions, pagination) {
                const questionsContainer = document.getElementById('questions-container');
                const paginationContainer = document.getElementById('pagination-container');
                
                if (questions.length === 0) {
                    questionsContainer.innerHTML = `
                        <div class="text-center py-50">
                            <img src="{{ asset('img/dashboard/empty-state/no-questions.svg') }}" alt="No Questions" style="max-width: 200px;" class="mb-20">
                            <h4 class="text-18 fw-500 mb-10">No Questions Found</h4>
                            <p class="text-14 mb-20">Try adjusting your search criteria or create new questions.</p>
                        </div>
                    `;
                    paginationContainer.innerHTML = '';
                    return;
                }
                
                // Build questions HTML
                let questionsHTML = `
                    <div class="table-responsive">
                        <table class="table w-1/1">
                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                <tr>
                                    <th class="p-10">
                                        <input type="checkbox" id="select-all" class="form-check-input">
                                    </th>
                                    <th class="p-10">Question</th>
                                    <th class="p-10">Type</th>
                                    <th class="p-10">Points</th>
                                    <th class="p-10">Source</th>
                                    <th class="p-10">Topic</th>
                                    <th class="p-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="text-14">
                `;
                
                questions.forEach(question => {
                    questionsHTML += `
                        <tr class="border-bottom-light">
                            <td class="p-10">
                                <input type="checkbox" class="question-checkbox form-check-input" value="${question.id}">
                            </td>
                            <td class="p-10">${question.text.length > 50 ? question.text.substring(0, 50) + '...' : question.text}</td>
                            <td class="p-10">${getQuestionTypeLabel(question.question_type)}</td>
                            <td class="p-10">${question.points}</td>
                            <td class="p-10">${question.source}</td>
                            <td class="p-10">${question.subject_topic || 'N/A'}</td>
                            <td class="p-10">
                                <div class="d-flex items-center">
                                    <button class="button -sm -light-3 -dark-bg-dark-3 text-purple-1 mr-5" 
                                            onclick="previewQuestion(${question.id})">
                                        <i class="icon-eye"></i>
                                    </button>
                                    <button class="button -sm -light-3 -dark-bg-dark-3 text-blue-1 mr-5" 
                                            onclick="importQuestion(${question.id})">
                                        <i class="icon-import"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
                
                questionsHTML += `
                            </tbody>
                        </table>
                    </div>
                `;
                
                questionsContainer.innerHTML = questionsHTML;
                
                // Build pagination
                if (pagination.last_page > 1) {
                    let paginationHTML = '<div class="d-flex justify-center mt-30"><div class="pagination -buttons">';
                    
                    // Previous button
                    if (pagination.current_page > 1) {
                        paginationHTML += `<button class="pagination__button" onclick="changePage(${pagination.current_page - 1})">Prev</button>`;
                    }
                    
                    // Page numbers
                    for (let i = 1; i <= pagination.last_page; i++) {
                        if (i === pagination.current_page) {
                            paginationHTML += `<button class="pagination__button -is-active">${i}</button>`;
                        } else if (i === 1 || i === pagination.last_page || (i >= pagination.current_page - 2 && i <= pagination.current_page + 2)) {
                            paginationHTML += `<button class="pagination__button" onclick="changePage(${i})">${i}</button>`;
                        } else if (i === pagination.current_page - 3 || i === pagination.current_page + 3) {
                            paginationHTML += `<button class="pagination__button">...</button>`;
                        }
                    }
                    
                    // Next button
                    if (pagination.current_page < pagination.last_page) {
                        paginationHTML += `<button class="pagination__button" onclick="changePage(${pagination.current_page + 1})">Next</button>`;
                    }
                    
                    paginationHTML += '</div></div>';
                    paginationContainer.innerHTML = paginationHTML;
                } else {
                    paginationContainer.innerHTML = '';
                }
                
                // Handle select all
                document.getElementById('select-all').addEventListener('change', function() {
                    const checkboxes = document.querySelectorAll('.question-checkbox');
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = this.checked;
                    });
                    updateBatchActionButton();
                });
                
                // Handle individual checkboxes
                document.querySelectorAll('.question-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', updateBatchActionButton);
                });
                
                // Enable select actions if needed
                updateBatchActionButton();
            }
            
            // Update batch action button
            function updateBatchActionButton() {
                const checkboxes = document.querySelectorAll('.question-checkbox:checked');
                const selectActionBtn = document.getElementById('select-action');
                
                if (checkboxes.length > 0) {
                    selectActionBtn.removeAttribute('disabled');
                    selectActionBtn.textContent = `Actions (${checkboxes.length} selected)`;
                } else {
                    selectActionBtn.setAttribute('disabled', 'disabled');
                    selectActionBtn.innerHTML = '<i class="icon-check-circle mr-10"></i> Batch Actions';
                }
            }
            
            // Helper function for question type labels
            function getQuestionTypeLabel(type) {
                const types = {
                    'single_choice': 'Single Choice',
                    'multiple_choice': 'Multiple Choice',
                    'true_false': 'True/False',
                    'matching': 'Matching',
                    'image_matching': 'Image Matching',
                    'keywords': 'Keywords',
                    'fill_gap': 'Fill in the Gap'
                };
                
                return types[type] || type;
            }
            
            // Make changePage function global
            window.changePage = function(page) {
                searchParams.page = page;
                searchQuestions();
            };
            
            // Make preview function global
            window.previewQuestion = function(questionId) {
                // Implementation for question preview
                // This would typically fetch the question details and show in a modal
                alert('Preview question ' + questionId);
                // In a real implementation, you would fetch the question and display it in the modal
            };
            
            // Make import function global
            window.importQuestion = function(questionId) {
                // Implementation for question import
                // This would typically allow selecting a quiz to import the question to
                alert('Import question ' + questionId);
                // In a real implementation, you would show a dialog to select a quiz
            };
        });
    </script>
    @endpush
</x-dashboard-layout> 