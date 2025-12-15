@vite('resources/css/app.css')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css">
<script src="https://cdn.ckeditor.com/4.16.2/standard/ckeditor.js"></script>

<div class="bg-white shadow-lg rounded-lg" id="lesson-editor-container">
    <div class="px-4">
        <div class="p-6">
            <!-- Dynamic Title -->
            <div class="mb-6">
                <h2 id="editor-title" class="text-xl font-semibold text-gray-800">Select a lesson to edit or create a new one</h2>
                <p id="editor-subtitle" class="text-gray-600 mt-1">Choose a lesson from the sidebar or add a new lesson to get started.</p>
            </div>
            
            <!-- Lesson Editor Form (Initially Hidden) -->
            <form id="lesson-editor-form" class="hidden" data-lesson-id="" data-section-id="">
                <input type="hidden" id="lesson-id-input" name="lesson_id" value="">
                <input type="hidden" id="section-id-input" name="section_id" value="">
                <input type="hidden" id="lesson-type-input" name="lesson_type" value="">
                
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <!-- Lesson Name Field -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Lesson Name</label>
                        <input type="text" id="lesson-title" name="title" placeholder="Enter lesson name"
                            class="block w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out" required>
                </div>
            
                    <!-- Lesson Duration -->
                <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Lesson Duration</label>
                    <div class="relative">
                            <input type="text" id="lesson-duration" name="lesson_duration" placeholder="Example: 2h 45m"
                                class="block w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out">
                            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <i class="fas fa-clock text-gray-400"></i>
                            </div>
                        </div>
                </div>
            </div>

                <!-- Dynamic Lesson Type Fields Container (for quiz/assignment types) -->
                <div id="dynamic-lesson-type-fields" class="hidden">
                    <!-- Quiz and Assignment fields will be dynamically loaded here -->
                </div>

             <!-- Lesson Resources (Multiple Field Input) -->
                <div class="bg-white p-6 rounded-sm shadow-sm border border-gray-200 mt-6">
                <label class="block text-sm font-light text-gray-800 mb-4">Lesson Resources</label>
                
                    <div id="resources-container" class="space-y-4">
                        <!-- Resources will be dynamically added here -->
                    </div>
                    
                    <button type="button" id="add-resource-btn" class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-sm shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    Add Resource
                </button>
            </div>

                <!-- Settings Section -->
                <div class="bg-gray-50 p-6 rounded-sm border border-gray-200 mt-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Lesson Settings</h3>
                    
                    <div class="flex items-center">
                        <input type="checkbox" id="is-published" name="is_published" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                        <label for="is-published" class="ml-2 block text-sm text-gray-700">Published (visible to students)</label>
                    </div>
                </div>
            
            <!-- Submit Button -->
            <div class="mt-8 flex justify-end space-x-3">
                    <button type="button" id="cancel-lesson-edit" class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Cancel
                </button>
                    <button type="submit" id="save-lesson-btn" class="px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Save Lesson
                </button>
            </div>
            </form>
        </div>
    </div>
</div>

<style>
    .cke_notifications_area {
        display: none !important;
    }
    .hidden {
        display: none;
    }
    .resource-item {
        transition: all 0.2s ease;
    }
    .resource-item:hover {
        background-color: #f8fafc;
    }
</style>

<script>
    // Set course ID for JavaScript access
    @if(isset($course))
        window.courseId = {{ $course->id }};
        window.studyMaterialId = {{ $course->id }};
    @else
        window.courseId = null;
        window.studyMaterialId = null;
    @endif
</script>

<script>
    // Legacy JavaScript removed - lesson type specific functionality is now handled by individual components

    // Resource management
    document.addEventListener('DOMContentLoaded', function() {
        const resourcesContainer = document.getElementById('resourcesContainer');
        const resourceTemplate = document.getElementById('resourceTemplate');
        const addResourceBtn = document.getElementById('addResourceBtn');
        
        // Only add event listeners if elements exist
        if (addResourceBtn) {
            // Add new resource field
            addResourceBtn.addEventListener('click', function() {
                if (!resourceTemplate || !resourcesContainer) return;
                
                const newResource = resourceTemplate.cloneNode(true);
                newResource.classList.remove('hidden');
                resourcesContainer.appendChild(newResource);
                
                // Initialize the new resource's remove button
                const removeBtn = newResource.querySelector('.remove-resource');
                if (removeBtn) {
                    removeBtn.addEventListener('click', function() {
                        newResource.remove();
                    });
                }
            });
        }
        
        // Initialize existing remove buttons
        document.querySelectorAll('.remove-resource').forEach(btn => {
            btn.addEventListener('click', function() {
                // Don't allow removing the last resource
                if (document.querySelectorAll('.resource-item').length > 1) {
                    this.closest('.resource-item').remove();
                }
            });
        });
        
        // Handle resource type changes
        if (resourcesContainer) {
            resourcesContainer.addEventListener('change', function(e) {
                if (e.target.classList.contains('resource-type')) {
                    const resourceItem = e.target.closest('.resource-item');
                    if (!resourceItem) return;
                    
                    const inputContainer = resourceItem.querySelector('.resource-input-container');
                    if (!inputContainer) return;
                    
                    const resourceType = e.target.value;
                    
                    // Clear existing input
                    inputContainer.innerHTML = '';
                    
                    // Create appropriate input based on type
                    if (resourceType === 'link') {
                        inputContainer.innerHTML = `
                            <input type="url" name="resource_url[]" placeholder="https://example.com" 
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <input type="hidden" name="resource_title[]" value="">
                        `;
                    } else {
                        inputContainer.innerHTML = `
                            <input type="text" name="resource_title[]" placeholder="Resource title" 
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <input type="file" name="resource_file[]" 
                                class="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                        `;
                    }
                }
            });
        }
    });
</script>

<script>
    // Lesson Builder State Management
    const LessonBuilder = {
        currentLesson: null,
        currentLessonType: null,
        courseId: window.courseId,
        studyMaterialId: window.studyMaterialId,
        
        // Initialize CKEditor - now handled by individual lesson type components
        initializeEditor() {
            // CKEditor initialization is now handled by individual lesson type components
            // This method is kept for backward compatibility but does nothing
        },
        
        // Show the lesson form for creating a new lesson
        createNewLesson(lessonType, sectionId) {
            this.currentLesson = null;
            this.currentLessonType = lessonType;
            
            // Update title and subtitle
            const editorTitle = document.getElementById('editor-title');
            const editorSubtitle = document.getElementById('editor-subtitle');
            
            if (editorTitle) editorTitle.textContent = `Create New ${this.capitalizeFirst(lessonType)} Lesson`;
            if (editorSubtitle) editorSubtitle.textContent = `Fill in the details below to create your ${lessonType} lesson.`;
            
            // Clear and setup form
            this.clearForm();
            
            const lessonTypeInput = document.getElementById('lesson-type-input');
            const sectionIdInput = document.getElementById('section-id-input');
            const lessonIdInput = document.getElementById('lesson-id-input');
            
            if (lessonTypeInput) lessonTypeInput.value = lessonType;
            if (sectionIdInput) sectionIdInput.value = sectionId;
            if (lessonIdInput) lessonIdInput.value = '';
            
            // Show appropriate fields for lesson type
            this.showFieldsForLessonType(lessonType);
            
            // Show the form
            const lessonEditorForm = document.getElementById('lesson-editor-form');
            if (lessonEditorForm) lessonEditorForm.classList.remove('hidden');
            
            // Update save button text
            const saveButton = document.getElementById('save-lesson-btn');
            if (saveButton) saveButton.textContent = 'Create Lesson';
        },
        
        // Load an existing lesson for editing
        loadLesson(lessonId) {
            const studyMaterialId = this.studyMaterialId;
            
            if (!studyMaterialId) {
                console.error('Study Material ID is not available');
                return;
            }
            
            // Update title to show loading state
            const editorTitle = document.getElementById('editor-title');
            const editorSubtitle = document.getElementById('editor-subtitle');
            
            if (editorTitle) editorTitle.textContent = 'Loading lesson...';
            if (editorSubtitle) editorSubtitle.textContent = 'Please wait while we load the lesson data.';
            
            // Fetch lesson data
            fetch(`/teacher/study-materials/${studyMaterialId}/lessons/${lessonId}/builder-data`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        this.populateForm(data.lesson);
                        this.currentLesson = data.lesson;
                        this.currentLessonType = data.lessonType;
                        
                        // Update title and subtitle
                        if (editorTitle) editorTitle.textContent = `Edit: ${data.lesson.title}`;
                        if (editorSubtitle) editorSubtitle.textContent = `Make changes to your ${data.lessonType} lesson below.`;
                        
                        // Show appropriate fields
                        this.showFieldsForLessonType(data.lessonType);
                        
                        // Show the form
                        const lessonEditorForm = document.getElementById('lesson-editor-form');
                        if (lessonEditorForm) lessonEditorForm.classList.remove('hidden');
                        
                        // Update save button text
                        const saveButton = document.getElementById('save-lesson-btn');
                        if (saveButton) saveButton.textContent = 'Update Lesson';
                    } else {
                        alert('Failed to load lesson: ' + data.message);
                    }
                })
                .catch(error => {
                    alert('Failed to load lesson data: ' + error.message);
                    console.error('Error:', error);
                });
        },
        
        // Populate form with lesson data
        populateForm(lesson) {
            const titleInput = document.getElementById('lesson-title');
            const durationInput = document.getElementById('lesson-duration');
            const publishedCheckbox = document.getElementById('is-published');
            const lessonIdInput = document.getElementById('lesson-id-input');
            const sectionIdInput = document.getElementById('section-id-input');
            const lessonTypeInput = document.getElementById('lesson-type-input');
            
            if (titleInput) titleInput.value = lesson.title || '';
            if (durationInput) durationInput.value = lesson.duration || '';
            if (publishedCheckbox) publishedCheckbox.checked = lesson.is_published || false;
            if (lessonIdInput) lessonIdInput.value = lesson.id;
            if (sectionIdInput) sectionIdInput.value = lesson.section_id;
            if (lessonTypeInput && lesson.lesson_type) lessonTypeInput.value = lesson.lesson_type.value;
            
            // Resources will be handled by the specific lesson type component
        },
        
        // Clear the form
        clearForm() {
            const titleInput = document.getElementById('lesson-title');
            const durationInput = document.getElementById('lesson-duration');
            const publishedCheckbox = document.getElementById('is-published');
            const dynamicFields = document.getElementById('dynamic-lesson-type-fields');
            const resourcesContainer = document.getElementById('resources-container');
            
            if (titleInput) titleInput.value = '';
            if (durationInput) durationInput.value = '';
            if (publishedCheckbox) publishedCheckbox.checked = false;
            
            // Clear dynamic fields
            if (dynamicFields) {
                dynamicFields.innerHTML = '';
                dynamicFields.classList.add('hidden');
            }
            
            // Clear resources
            if (resourcesContainer) resourcesContainer.innerHTML = '';
        },
        
        // Show fields for specific lesson type
        showFieldsForLessonType(lessonType) {
            // Hide all first
            this.hideAllLessonTypeFields();
            
            // Load dynamic fields for all lesson types
            this.loadLessonTypeFields(lessonType);
        },
        
        // Hide all lesson type specific fields
        hideAllLessonTypeFields() {
            // Hide dynamic container
            const dynamicFields = document.getElementById('dynamic-lesson-type-fields');
            if (dynamicFields) dynamicFields.classList.add('hidden');
        },
        
        // Load lesson type fields dynamically (for quiz/assignment types)
        loadLessonTypeFields(lessonType) {
            const container = document.getElementById('dynamic-lesson-type-fields');
            if (!container) {
                console.error('Dynamic lesson type fields container not found');
                return;
            }
            
            // Show loading state
            container.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</div>';
            container.classList.remove('hidden');
            
            // Map backend lesson types to frontend types for the API call
            const typeMapping = {
                'quiz_link': 'quiz',
                'assignment_link': 'assignment'
            };
            
            const apiLessonType = typeMapping[lessonType] || lessonType;
            
            // Load the component via AJAX
            fetch(`/teacher/study-materials/${this.studyMaterialId}/builder/lesson-types/${apiLessonType}`)
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => {
                            throw new Error('HTTP ' + response.status + ': ' + response.statusText + '. Response: ' + text);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    
                    if (data.success) {
                        container.innerHTML = data.html;
                        
                        // Force script execution for dynamically loaded content
                        const scripts = container.querySelectorAll('script');
                        
                        scripts.forEach((script, index) => {
                            try {
                                const newScript = document.createElement('script');
                                if (script.src) {
                                    newScript.src = script.src;
                                } else {
                                    newScript.textContent = script.textContent;
                                }
                                document.head.appendChild(newScript);
                                
                                // Remove the script after execution to avoid duplicates
                                setTimeout(() => {
                                    if (newScript.parentNode) {
                                        newScript.parentNode.removeChild(newScript);
                                    }
                                }, 100);
                            } catch (error) {
                                // Script execution failed
                                console.error('Failed to execute script:', error);
                            }
                        });
                        
                        // Reinitialize any components that might need it
                        this.reinitializeComponents();
                        
                        // Store lesson data for population if needed
                        if (this.currentLesson) {
                            this.populateForm(this.currentLesson);
                        }
                        
                        // Additional initialization for dynamic lesson types
                        setTimeout(() => {
                            
                            if (lessonType === 'text' && window.initializeTextLessonEditors) {
                                window.initializeTextLessonEditors();
                            } else if (lessonType === 'video' && window.initializeVideoLessonEditors) {
                                window.initializeVideoLessonEditors();
                            } else if (lessonType === 'stream' && window.initializeStreamLessonEditors) {
                                window.initializeStreamLessonEditors();
                            } else if (lessonType === 'past_papers' && window.initializePastPapersLessonEditors) {
                                window.initializePastPapersLessonEditors();
                            } else if (lessonType === 'quiz' && window.QuizLessonHandler) {
                                // Initialize quiz-specific functionality
                                if (window.QuizLessonHandler.initialize) {
                                    window.QuizLessonHandler.initialize();
                                }
                            } else if (lessonType === 'assignment' && window.AssignmentLessonHandler) {
                                // Initialize assignment-specific functionality
                                if (window.AssignmentLessonHandler.initialize) {
                                    window.AssignmentLessonHandler.initialize();
                                }
                            }
                        }, 300);
                    } else {
                        const errorMsg = data.error || data.message || 'Unknown error';
                        container.innerHTML = `<div class="text-red-600 text-center py-4">
                            <p>Error loading lesson fields</p>
                            <p class="text-sm mt-2">Error: ${errorMsg}</p>
                            <button onclick="LessonBuilder.loadLessonTypeFields('${lessonType}')" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm">Retry</button>
                        </div>`;
                    }
                })
                .catch(error => {
                    container.innerHTML = `<div class="text-red-600 text-center py-4">
                        <p>Failed to load lesson type fields</p>
                        <p class="text-sm mt-2">Error: ${error.message}</p>
                        <button onclick="LessonBuilder.loadLessonTypeFields('${lessonType}')" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm">Retry</button>
                    </div>`;
                });
        },
        
        // Reinitialize components after dynamic loading
        reinitializeComponents() {
            // Add any component reinitialization needed here
            // For example, if TomSelect or other plugins are used in dynamic components
        },
        
        // Save lesson data
        saveLessonData() {
            // Get form data
            const form = document.getElementById('lesson-editor-form');
            if (!form) {
                console.error('Lesson editor form not found');
                return;
            }
            
            const formData = new FormData(form);
            const lessonIdInput = document.getElementById('lesson-id-input');
            const lessonId = lessonIdInput ? lessonIdInput.value : '';
            const studyMaterialId = this.studyMaterialId;
            
            if (!studyMaterialId) {
                console.error('Study Material ID is not available');
                alert('Cannot save lesson: Study Material ID is missing');
                return;
            }
            
            // Determine if we're creating or updating
            const isNew = !lessonId;
            const url = isNew 
                ? `/teacher/study-materials/${studyMaterialId}/lessons` 
                : `/teacher/study-materials/${studyMaterialId}/lessons/${lessonId}`;
            const method = isNew ? 'POST' : 'PUT';
            
            // Add editor content to form data if applicable
            // This is now handled by individual lesson type components
            
            // Set the loading state
            const saveButton = document.getElementById('save-lesson-btn');
            if (!saveButton) {
                console.error('Save button not found');
                return;
            }
            
            const originalButtonText = saveButton.textContent;
            saveButton.textContent = 'Saving...';
            saveButton.disabled = true;
            
            // Get CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]');
            if (!csrfToken) {
                console.error('CSRF token not found');
                alert('Cannot save lesson: CSRF token is missing');
                saveButton.textContent = originalButtonText;
                saveButton.disabled = false;
                return;
            }
            
            // Send the request
            fetch(url, {
                method: method,
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': csrfToken.content,
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Handle success - add to sidebar if new
                    if (isNew) {
                        // Add the new lesson to the sidebar
                        this.addLessonToSidebar(data.lesson.section_id, data.lesson);
                    } else {
                        // Update existing lesson in sidebar
                        const lessonTitle = document.querySelector(`.lesson-title[data-lesson-id="${lessonId}"]`);
                        if (lessonTitle) {
                            lessonTitle.textContent = data.lesson.title;
                        }
                    }
                    
                    // Show success message
                    alert('Lesson saved successfully!');
                    
                    // Update current lesson reference
                    this.currentLesson = data.lesson;
                    
                    // Update title to show edit mode
                    const editorTitle = document.getElementById('editor-title');
                    if (editorTitle) editorTitle.textContent = `Edit: ${data.lesson.title}`;
                    
                    if (lessonIdInput) lessonIdInput.value = data.lesson.id;
                    
                    // Update save button text
                    saveButton.textContent = 'Update Lesson';
                } else {
                    // Handle error
                    alert('Failed to save lesson: ' + data.message);
                }
            })
            .catch(error => {
                alert('Failed to save lesson data: ' + error.message);
                console.error('Error:', error);
            })
            .finally(() => {
                // Reset button state
                saveButton.textContent = originalButtonText;
                saveButton.disabled = false;
            });
        },
        
        // Add lesson to sidebar (for newly created lessons)
        addLessonToSidebar(sectionId, lesson) {
            const section = document.getElementById(`section-${sectionId}`);
            if (!section) {
                console.error('Section not found:', sectionId);
                return;
            }
            
            const sectionContent = section.querySelector('.section-content');
            if (!sectionContent) {
                console.error('Section content not found in section:', sectionId);
                return;
            }
            
            const addLessonBtn = sectionContent.querySelector('.add-lesson-btn');
            if (!addLessonBtn) {
                console.error('Add lesson button not found in section:', sectionId);
                return;
            }
            
            // Get the appropriate icon based on lesson type
            let lessonIcon = 'far fa-file-alt'; // default for text
            switch(lesson.lesson_type) {
                case 'text':
                    lessonIcon = 'far fa-file-alt';
                    break;
                case 'video':
                    lessonIcon = 'fas fa-play-circle';
                    break;
                case 'stream':
                    lessonIcon = 'fas fa-broadcast-tower';
                    break;
                case 'past_papers':
                    lessonIcon = 'fas fa-file-archive';
                    break;
                case 'quiz':
                    lessonIcon = 'fas fa-question-circle';
                    break;
                case 'assignment':
                    lessonIcon = 'fas fa-tasks';
                    break;
            }
            
            // Create lesson HTML
            const lessonHTML = `
                <div class="flex items-center justify-between py-2 px-4 hover:bg-gray-50 rounded-md group lesson-item" data-lesson-id="${lesson.id}">
                    <div class="flex items-center">
                        <i class="${lessonIcon} text-gray-500 mr-2"></i>
                        <span class="text-gray-700 cursor-pointer lesson-title" data-lesson-id="${lesson.id}">${lesson.title}</span>
                    </div>
                    <div class="invisible group-hover:visible flex items-center">
                        <button class="edit-lesson-btn p-1 text-gray-500 hover:text-blue-500 focus:outline-none" 
                            data-lesson-id="${lesson.id}" title="Edit lesson">
                            <i class="fas fa-edit text-xs"></i>
                        </button>
                        <button class="delete-lesson-btn p-1 text-gray-500 hover:text-red-500 focus:outline-none" 
                            data-lesson-id="${lesson.id}" title="Delete lesson">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>
                </div>`;
            
            // Insert before the add lesson button
            addLessonBtn.insertAdjacentHTML('beforebegin', lessonHTML);
            
            // Add event listeners to the new lesson
            const newLessonElement = sectionContent.querySelector(`[data-lesson-id="${lesson.id}"]`);
            if (!newLessonElement) {
                console.error('Newly added lesson element not found:', lesson.id);
                return;
            }
            
            // Make the lesson title clickable to load in builder
            const lessonTitle = newLessonElement.querySelector('.lesson-title');
            if (lessonTitle) {
                lessonTitle.addEventListener('click', () => {
                    this.loadLesson(lesson.id);
                });
            }
            
            // Edit lesson button (redirect for now, will be removed later)
            const editBtn = newLessonElement.querySelector('.edit-lesson-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    this.loadLesson(lesson.id);
                });
            }
            
            // Delete lesson button
            const deleteBtn = newLessonElement.querySelector('.delete-lesson-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this lesson?')) {
                        this.deleteLesson(lesson.id);
                    }
                });
            }
        },
        
        // Delete lesson
        deleteLesson(lessonId) {
            const studyMaterialId = this.studyMaterialId;
            
            if (!studyMaterialId) {
                console.error('Study Material ID is not available');
                alert('Cannot delete lesson: Study Material ID is missing');
                return;
            }
            
            // Get CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]');
            if (!csrfToken) {
                console.error('CSRF token not found');
                alert('Cannot delete lesson: CSRF token is missing');
                return;
            }
            
            fetch(`/teacher/study-materials/${studyMaterialId}/lessons/${lessonId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken.content,
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Remove the lesson from the sidebar
                    const lessonElement = document.querySelector(`[data-lesson-id="${lessonId}"]`);
                    if (lessonElement) {
                        lessonElement.remove();
                    }
                    
                    // If this lesson is currently being edited, clear the form
                    if (this.currentLesson && this.currentLesson.id == lessonId) {
                        this.cancelEdit();
                    }
                    
                    alert('Lesson deleted successfully!');
                } else {
                    alert('Failed to delete lesson: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error deleting lesson:', error);
                alert('Failed to delete lesson: ' + error.message);
            });
        },
        
        // Cancel editing
        cancelEdit() {
            const lessonEditorForm = document.getElementById('lesson-editor-form');
            const editorTitle = document.getElementById('editor-title');
            const editorSubtitle = document.getElementById('editor-subtitle');
            
            if (lessonEditorForm) lessonEditorForm.classList.add('hidden');
            if (editorTitle) editorTitle.textContent = 'Select a lesson to edit or create a new one';
            if (editorSubtitle) editorSubtitle.textContent = 'Choose a lesson from the sidebar or add a new lesson to get started.';
            
            this.currentLesson = null;
            this.currentLessonType = null;
        },
        
        // Utility function to capitalize first letter
        capitalizeFirst(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
    };
    
    // Initialize lesson editor form submission
    document.addEventListener('DOMContentLoaded', function() {
        const lessonForm = document.getElementById('lesson-editor-form');
        const cancelButton = document.getElementById('cancel-lesson-edit');
        
        if (lessonForm) {
            lessonForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Handle CKEditor content if it exists
                if (typeof CKEDITOR !== 'undefined' && CKEDITOR.instances['lesson-content']) {
                    const content = CKEDITOR.instances['lesson-content'].getData();
                    // The content will be submitted with the form
                }
                
                // Save the lesson
                LessonBuilder.saveLessonData();
            });
        }
        
        if (cancelButton) {
            cancelButton.addEventListener('click', function() {
                const form = document.getElementById('lesson-editor-form');
                const title = document.getElementById('editor-title');
                const subtitle = document.getElementById('editor-subtitle');
                
                if (form) form.classList.add('hidden');
                if (title) title.textContent = 'Select a lesson to edit or create a new one';
                if (subtitle) subtitle.textContent = 'Choose a lesson from the sidebar or add a new lesson to get started.';
                
                if (typeof LessonBuilder !== 'undefined' && LessonBuilder.cancelEdit) {
                    LessonBuilder.cancelEdit();
                }
            });
        }
    });
</script>