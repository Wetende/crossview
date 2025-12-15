<div class="bg-gradient-to-b from-slate-50 to-white border-r border-gray-200 h-full overflow-y-auto">
    <div class="p-8">
        <div class="flex items-center space-x-3">
            <div class="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                <i class="fas fa-graduation-cap text-white text-lg"></i>
            </div>
            <div>
                <h2 class="text-xl font-semibold text-gray-800">@lmsterm('Study Material') Curriculum</h2>
                <p class="text-sm text-gray-500 flex items-center">
                    <i class="fas fa-organize text-xs mr-1"></i>
                    Organize your @lmsterm('Study Material') Content
                </p>
            </div>
        </div>
    </div>

    @foreach ($course->sections as $section)
        <div class="mb-4" id="section-{{ $section->id }}">
            <div class="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer group">
             <div class="flex items-center w-full">
                        <button class="toggle-section mr-4 text-gray-500 hover:text-blue-600 focus:outline-none transition-transform duration-200 transform hover:scale-110">
                            <i class="fas fa-grip-vertical text-sm"></i>
                        </button>

                        <div class="section-title-container w-full flex items-center">
                            <i class="fas fa-folder-open text-blue-400 mr-2"></i>
                            <span class="font-medium text-gray-700 section-title">{{ $section->title }}</span>
                            <input type="text"
                                class="font-medium w-full border border-blue-300 rounded px-3 py-1.5 hidden section-title-input ml-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                value="{{ $section->title }}" data-section-id="{{ $section->id }}">
                        </div>
                    </div>


                <div class="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-all duration-200">
                    <button
                        class="edit-section-btn p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg focus:outline-none transition-all duration-200"
                        title="Edit section">
                        <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button
                        class="delete-section-btn p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none transition-all duration-200"
                        data-section-id="{{ $section->id }}" title="Delete section">
                        <i class="fas fa-trash-alt text-sm"></i>
                    </button>
                </div>
            </div>

            <div class="section-content pl-4">
                @foreach ($section->lessons as $lessonIndex => $lesson)
                    <div class="flex items-center justify-between py-3 px-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 group lesson-item transition-all duration-200"
                        data-lesson-id="{{ $lesson->id }}">

                        <div class="flex items-center space-x-3 flex-1">
                            <!-- Lesson Icon with Background -->
                            <div class="flex-shrink-0">
                                @if ($lesson->lesson_type->value == 'text')
                                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-file-alt text-green-600 text-sm"></i>
                                    </div>
                                @elseif($lesson->lesson_type->value == 'video')
                                    <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-play-circle text-red-600 text-sm"></i>
                                    </div>
                                @elseif($lesson->lesson_type->value == 'stream')
                                    <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-broadcast-tower text-purple-600 text-sm"></i>
                                    </div>
                                @elseif($lesson->lesson_type->value == 'zoom')
                                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-video text-blue-600 text-sm"></i>
                                    </div>
                                @elseif($lesson->lesson_type->value == 'quiz')
                                    <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-question-circle text-yellow-600 text-sm"></i>
                                    </div>
                                @elseif($lesson->lesson_type->value == 'assignment')
                                    <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-tasks text-indigo-600 text-sm"></i>
                                    </div>
                                @elseif($lesson->lesson_type->value == 'past_papers')
                                    <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-file-archive text-orange-600 text-sm"></i>
                                    </div>
                                @else
                                    <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-file text-gray-600 text-sm"></i>
                                    </div>
                                @endif
                            </div>

                            <!-- Lesson Details -->
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center space-x-2">
                                    <span
                                        class="text-gray-700 font-medium lesson-title cursor-pointer hover:text-blue-600 transition-colors truncate"
                                        data-lesson-id="{{ $lesson->id }}"
                                        onclick="LessonBuilder.loadLesson({{ $lesson->id }})">
                                        {{ $lesson->title }}
                                    </span>

                                </div>

                                <div class="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                    @if ($lesson->type == 'video')
                                        <span class="flex items-center">
                                            <i class="fas fa-eye mr-1"></i>
                                            {{ rand(50, 200) }} views
                                        </span>
                                    @endif
                                </div>
                            </div>
                        </div>

                        <!-- Lesson Actions -->
                        <div
                            class="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-all duration-200">
                            <button
                                class="edit-lesson-btn p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg focus:outline-none transition-all duration-200"
                                data-lesson-id="{{ $lesson->id }}" title="Edit lesson">
                                <i class="fas fa-edit text-sm"></i>
                            </button>
                            <button
                                class="delete-lesson-btn p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg focus:outline-none transition-all duration-200"
                                data-lesson-id="{{ $lesson->id }}" title="Delete lesson">
                                <i class="fas fa-times text-sm"></i>
                            </button>
                        </div>
                    </div>
                @endforeach


                   <button
                    class="add-lesson-btn flex items-center text-blue-500 mt-6 py-2 px-4 w-full hover:bg-blue-50 rounded-md"
                    data-section-id="{{ $section->id }}">
                    <i class="fas fa-plus-circle mr-2"></i>
                    <span>Add a lesson</span>
                </button>

            </div>
        </div>
    @endforeach

    <!-- New Section Button -->
    <div class="px-6 mt-4 mb-6">
        <button id="new-section-btn"
            class="flex items-center justify-center w-full bg-white text-blue-500 border border-blue-500 py-2 px-4 rounded-md hover:bg-blue-50">
            <i class="fas fa-plus-circle mr-2"></i>
            <span>New section</span>
        </button>
    </div>
</div>

<!-- Add Lesson Modal -->
<div id="add-lesson-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="flex justify-between items-center border-b pb-3">
            <h3 class="text-lg font-medium text-gray-900">Select lesson type</h3>
            <button id="close-lesson-modal" class="text-gray-400 hover:text-gray-500">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <div class="mt-4">
            <p class="text-sm text-gray-500">Select material type to continue</p>

            <div class="mt-4">
                <h4 class="text-xs font-medium text-gray-500 mb-2">LEARNING CONTENT</h4>
                <div class="grid grid-cols-2 gap-4">
                    <!-- Text Lesson Option -->
                    <button
                        class="lesson-type-btn border rounded-md p-4 flex flex-col items-center justify-center hover:border-blue-500 focus:outline-none"
                        data-type="text">
                        <div class="text-blue-500 mb-2">
                            <i class="far fa-file-alt text-3xl"></i>
                        </div>
                        <span class="text-gray-800">Text lesson</span>
                    </button>

                    <!-- Video Lesson Option -->
                    <button
                        class="lesson-type-btn border rounded-md p-4 flex flex-col items-center justify-center hover:border-blue-500 focus:outline-none"
                        data-type="video">
                        <div class="text-blue-500 mb-2">
                            <i class="fas fa-play-circle text-3xl"></i>
                        </div>
                        <span class="text-gray-800">Video lesson</span>
                    </button>

                    <!-- Stream Lesson Option -->
                    <button
                        class="lesson-type-btn border rounded-md p-4 flex flex-col items-center justify-center hover:border-blue-500 focus:outline-none"
                        data-type="stream">
                        <div class="text-blue-500 mb-2">
                            <i class="fas fa-broadcast-tower text-3xl"></i>
                        </div>
                        <span class="text-gray-800">Stream lesson</span>
                    </button>

                    <!-- Past Papers Option -->
                    <button
                        class="lesson-type-btn border rounded-md p-4 flex flex-col items-center justify-center hover:border-blue-500 focus:outline-none"
                        data-type="past_papers">
                        <div class="text-blue-500 mb-2">
                            <i class="fas fa-file-archive text-3xl"></i>
                        </div>
                        <span class="text-gray-800">Past Papers</span>
                    </button>
                </div>

                <h4 class="text-xs font-medium text-gray-500 mt-6 mb-2">EXAM STUDENTS</h4>
                <div class="grid grid-cols-2 gap-4">
                    <!-- Quiz Option -->
                    <button
                        class="lesson-type-btn border rounded-md p-4 flex flex-col items-center justify-center hover:border-blue-500 focus:outline-none"
                        data-type="quiz">
                        <div class="text-blue-500 mb-2">
                            <i class="fas fa-question-circle text-3xl"></i>
                        </div>
                        <span class="text-gray-800">Quiz</span>
                    </button>

                    <!-- Assignment Option -->
                    <button
                        class="lesson-type-btn border rounded-md p-4 flex flex-col items-center justify-center hover:border-blue-500 focus:outline-none"
                        data-type="assignment">
                        <div class="text-blue-500 mb-2">
                            <i class="fas fa-tasks text-3xl"></i>
                        </div>
                        <span class="text-gray-800">Assignment</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Delete Section Confirmation Modal -->
<div id="delete-section-modal"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <i class="fas fa-exclamation-triangle text-red-500"></i>
            </div>
            <h3 class="text-lg leading-6 font-medium text-gray-900 mt-2">Delete section</h3>
            <div class="mt-2 px-7 py-3">
                <p class="text-sm text-gray-500">
                    Are you sure you want to delete this section? This action cannot be undone.
                </p>
            </div>
            <div class="items-center px-4 py-3">
                <input type="hidden" id="delete-section-id" value="">
                <button id="cancel-delete-section"
                    class="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none">
                    Cancel
                </button>
                <button id="confirm-delete-section"
                    class="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-600 focus:outline-none ml-2">
                    Delete
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Add New Section Modal -->
<div id="new-section-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="flex justify-between items-center border-b pb-3">
            <h3 class="text-lg font-medium text-gray-900">Add new section</h3>
            <button id="close-new-section-modal" class="text-gray-400 hover:text-gray-500">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <div class="mt-4">
            <label for="new-section-title" class="block text-sm font-medium text-gray-700">Section Title</label>
            <input type="text" id="new-section-title"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">

            <div class="mt-6 flex justify-end">
                <button id="cancel-new-section"
                    class="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none">
                    Cancel
                </button>
                <button id="save-new-section"
                    class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none ml-2">
                    Save
                </button>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        let currentSectionId = null;

        // Add click handlers to existing lesson titles
        document.querySelectorAll('.lesson-title').forEach(lessonTitle => {
            lessonTitle.addEventListener('click', function() {
                const lessonId = this.getAttribute('data-lesson-id');
                if (typeof LessonBuilder !== 'undefined') {
                    LessonBuilder.loadLesson(lessonId);
                } else {
                    console.error('LessonBuilder not available');
                }
            });
        });

        // Add click handlers to existing edit buttons
        document.querySelectorAll('.edit-lesson-btn').forEach(editBtn => {
            editBtn.addEventListener('click', function() {
                const lessonId = this.getAttribute('data-lesson-id');
                const studyMaterialId = getCurrentCourseId();
                window.location.href = `/teacher/study-materials/${studyMaterialId}/lessons/${lessonId}/edit`;
            });
        });

        // Add click handlers to existing delete buttons
        document.querySelectorAll('.delete-lesson-btn').forEach(deleteBtn => {
            deleteBtn.addEventListener('click', function() {
                const lessonId = this.getAttribute('data-lesson-id');
                if (confirm('Are you sure you want to delete this lesson?')) {
                    deleteLessonFromSidebar(lessonId);
                }
            });
        });

        document.querySelectorAll('.toggle-section').forEach(button => {
            button.addEventListener('click', function() {
                const sectionContent = this.closest('div.mb-4').querySelector(
                    '.section-content');
                const icon = this.querySelector('i');

                if (sectionContent.style.display === 'none') {
                    sectionContent.style.display = 'block';
                } else {
                    sectionContent.style.display = 'none';
                }
            });
        });

        const addLessonModal = document.getElementById('add-lesson-modal');

        document.querySelectorAll('.add-lesson-btn').forEach(button => {
            button.addEventListener('click', function() {
                currentSectionId = this.getAttribute('data-section-id');
                addLessonModal.classList.remove('hidden');
            });
        });

        // Close Add Lesson Modal
        document.getElementById('close-lesson-modal').addEventListener('click', function() {
            addLessonModal.classList.add('hidden');
        });

        document.querySelectorAll('.lesson-type-btn').forEach(button => {
            button.addEventListener('click', function() {
                const lessonType = this.getAttribute('data-type');

                // Close the modal
                addLessonModal.classList.add('hidden');

                // Use the LessonBuilder to create a new lesson
                if (typeof LessonBuilder !== 'undefined') {
                    LessonBuilder.createNewLesson(lessonType, currentSectionId);
                } else {
                    console.error('LessonBuilder not available');
                    alert('Lesson builder not available. Please refresh the page.');
                }
            });
        });

        // Edit Section Title
        document.querySelectorAll('.edit-section-btn').forEach(button => {
            button.addEventListener('click', function() {
                const sectionContainer = this.closest('div.group');
                const titleSpan = sectionContainer.querySelector('.section-title');
                const titleInput = sectionContainer.querySelector('.section-title-input');

                titleSpan.classList.add('hidden');
                titleInput.classList.remove('hidden');
                titleInput.focus();
            });
        });

        // Save Section Title on Blur or Enter
        document.querySelectorAll('.section-title-input').forEach(input => {
            input.addEventListener('blur', saveSectionTitle);
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    saveSectionTitle.call(this);
                }
            });
        });

        function saveSectionTitle() {
            const sectionId = this.getAttribute('data-section-id');
            const newTitle = this.value.trim();
            const titleSpan = this.closest('.section-title-container').querySelector('.section-title');
            const studyMaterialId = getCurrentCourseId();

            if (newTitle !== '') {
                titleSpan.textContent = newTitle;

                fetch(`/teacher/study-materials/${studyMaterialId}/sections/${sectionId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify({
                        title: newTitle
                    })
                });

            }

            this.classList.add('hidden');
            titleSpan.classList.remove('hidden');
        }

        const deleteSectionModal = document.getElementById('delete-section-modal');
        const deleteSectionIdInput = document.getElementById('delete-section-id');

        // Open Delete Section Modal
        document.querySelectorAll('.delete-section-btn').forEach(button => {
            button.addEventListener('click', function() {
                const sectionId = this.getAttribute('data-section-id');
                deleteSectionIdInput.value = sectionId;
                deleteSectionModal.classList.remove('hidden');
            });
        });

        // Close Delete Section Modal
        document.getElementById('cancel-delete-section').addEventListener('click', function() {
            deleteSectionModal.classList.add('hidden');
        });

        document.getElementById('confirm-delete-section').addEventListener('click', function() {
            const sectionId = deleteSectionIdInput.value;
            const studyMaterialId = getCurrentCourseId();


            fetch(`/teacher/study-materials/${studyMaterialId}/sections/${sectionId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById(`section-${sectionId}`).remove();
                    }
                });


            // For demonstration, we'll just hide the section
            document.getElementById(`section-${sectionId}`).style.display = 'none';
            deleteSectionModal.classList.add('hidden');
        });

        // New Section Modal
        const newSectionModal = document.getElementById('new-section-modal');

        // Open New Section Modal
        document.getElementById('new-section-btn').addEventListener('click', function() {
            newSectionModal.classList.remove('hidden');
        });

        // Close New Section Modal
        document.getElementById('close-new-section-modal').addEventListener('click', function() {
            newSectionModal.classList.add('hidden');
        });

        document.getElementById('cancel-new-section').addEventListener('click', function() {
            newSectionModal.classList.add('hidden');
        });

        // Save New Section
        document.getElementById('save-new-section').addEventListener('click', function() {
            const saveButton = this;
            const newSectionTitle = document.getElementById('new-section-title').value.trim();
            const studyMaterialId = getCurrentCourseId();

            if (!newSectionTitle) {
                alert('Please enter a section title');
                return;
            }

            saveButton.disabled = true;
            saveButton.textContent = 'Saving...';

            fetch(`/teacher/study-materials/${studyMaterialId}/sections`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        title: newSectionTitle,
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    newSectionModal.classList.add('hidden');

                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        appendNewSectionToSidebar(data.section);

                        document.getElementById('new-section-title').value = '';
                        newSectionModal.classList.add('hidden');

                    } else {
                        throw new Error(data.message || 'Failed to create section');
                    }
                    document.getElementById('new-section-title').value = '';

                })
                .catch(error => {
                    console.error('Error:', error);
                })
                .finally(() => {
                    saveButton.disabled = false;
                    saveButton.textContent = 'Save';
                });
        });

        window.addEventListener('click', function(e) {
            if (e.target === addLessonModal) {
                addLessonModal.classList.add('hidden');
            }
            if (e.target === deleteSectionModal) {
                deleteSectionModal.classList.add('hidden');
            }
            if (e.target === newSectionModal) {
                newSectionModal.classList.add('hidden');
            }
        });
    });


    // Function to get current course ID
    function getCurrentCourseId() {
        // Method 1: From a global JavaScript variable (set in your blade template)
        if (typeof window.studyMaterialId !== 'undefined') {
            return window.studyMaterialId;
        }
        
        // Method 2: From a data attribute (you can add this to your blade template)
        const studyMaterialIdElement = document.querySelector('[data-study-material-id]');
        if (studyMaterialIdElement) {
            return studyMaterialIdElement.getAttribute('data-study-material-id');
        }
        
        // Method 3: From URL (assuming URL pattern like /study-materials/{id}/...)
        const pathParts = window.location.pathname.split('/');
        const studyMaterialsIndex = pathParts.indexOf('study-materials');
        if (studyMaterialsIndex !== -1 && pathParts[studyMaterialsIndex + 1]) {
            return pathParts[studyMaterialsIndex + 1];
        }
        
        // Fallback to courseId for backward compatibility
        if (typeof window.courseId !== 'undefined') {
            return window.courseId;
        }
        
        throw new Error('Could not determine study material ID');
    }

    function appendNewSectionToSidebar(section) {
        const sectionsContainer = document.querySelector('.p-8').parentNode;
        const newSectionButton = document.getElementById('new-section-btn').closest('.px-6');

        // Create new section HTML
        const newSectionHTML = `
    <div class="mb-4" id="section-${section.id}">
        <div class="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer group">
            <div class="flex items-center w-full">
                <button class="toggle-section mr-2 text-gray-500 focus:outline-none">
                    <i class="fas fa-grip-vertical text-sm"></i>
                </button>
                
                <div class="section-title-container w-full">
                    <span class="font-medium section-title">${section.title}</span>
                    <input type="text" 
                        class="font-medium w-full border border-blue-300 rounded px-2 py-1 hidden section-title-input" 
                        value="${section.title}" 
                        data-section-id="${section.id}">
                </div>
            </div>
            
            <div class="invisible group-hover:visible flex items-center">
                <button class="edit-section-btn p-1 text-gray-500 hover:text-blue-500 focus:outline-none" title="Edit section">
                    <i class="fas fa-pencil-alt text-xs"></i>
                </button>
                <button class="delete-section-btn p-1 text-gray-500 hover:text-red-500 focus:outline-none" 
                    data-section-id="${section.id}" title="Delete section">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
        </div>
        
        <div class="section-content pl-4">
            <button class="add-lesson-btn flex items-center text-blue-500 py-2 px-4 w-full hover:bg-blue-50 rounded-md"
                data-section-id="${section.id}">
                <i class="fas fa-plus-circle mr-2"></i>
                <span>Add a lesson</span>
            </button>
        </div>
    </div>`;

        // Insert the new section before the "New section" button
        newSectionButton.insertAdjacentHTML('beforebegin', newSectionHTML);

        // Attach event listeners to the new section
        attachEventListenersToNewSection(section.id);
    }

    // Function to attach event listeners to newly created section
    function attachEventListenersToNewSection(sectionId) {
        const newSection = document.getElementById(`section-${sectionId}`);

        // Toggle section content
        const toggleButton = newSection.querySelector('.toggle-section');
        toggleButton.addEventListener('click', function() {
            const sectionContent = this.closest('div.mb-4').querySelector('.section-content');
            const icon = this.querySelector('i');

            if (sectionContent.style.display === 'none') {
                sectionContent.style.display = 'block';
            } else {
                sectionContent.style.display = 'none';
            }
        });

        // Add lesson button
        const addLessonBtn = newSection.querySelector('.add-lesson-btn');
        addLessonBtn.addEventListener('click', function() {
            currentSectionId = this.getAttribute('data-section-id');
            document.getElementById('add-lesson-modal').classList.remove('hidden');
        });

        // Edit section button
        const editSectionBtn = newSection.querySelector('.edit-section-btn');
        editSectionBtn.addEventListener('click', function() {
            const sectionContainer = this.closest('div.group');
            const titleSpan = sectionContainer.querySelector('.section-title');
            const titleInput = sectionContainer.querySelector('.section-title-input');

            titleSpan.classList.add('hidden');
            titleInput.classList.remove('hidden');
            titleInput.focus();
        });

        // Section title input events
        const titleInput = newSection.querySelector('.section-title-input');
        titleInput.addEventListener('blur', saveSectionTitle);
        titleInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveSectionTitle.call(this);
            }
        });

        // Delete section button
        const deleteSectionBtn = newSection.querySelector('.delete-section-btn');
        deleteSectionBtn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section-id');
            document.getElementById('delete-section-id').value = sectionId;
            document.getElementById('delete-section-modal').classList.remove('hidden');
        });
    }

    // Function to show success message
    function showSuccessMessage(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);

        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    // Function to add a lesson to the sidebar
    // Fix indentation issues with this function 
const addLessonToSidebar = function(sectionId, lesson) {
        const section = document.getElementById(`section-${sectionId}`);
        if (!section) return;

        const sectionContent = section.querySelector('.section-content');
        if (!sectionContent) return;
        
        const addLessonBtn = sectionContent.querySelector('.add-lesson-btn');
        if (!addLessonBtn) return;

        // Determine icon and background color based on lesson type
        let iconClass = 'fas fa-file-alt';
        let bgColor = 'bg-green-100';
        let textColor = 'text-green-600';
        
        if (lesson.lesson_type && lesson.lesson_type.value) {
            switch(lesson.lesson_type.value) {
                case 'text':
                    iconClass = 'fas fa-file-alt';
                    bgColor = 'bg-green-100';
                    textColor = 'text-green-600';
                    break;
                case 'video':
                    iconClass = 'fas fa-play-circle';
                    bgColor = 'bg-red-100';
                    textColor = 'text-red-600';
                    break;
                case 'stream':
                    iconClass = 'fas fa-broadcast-tower';
                    bgColor = 'bg-purple-100';
                    textColor = 'text-purple-600';
                    break;
                case 'zoom':
                    iconClass = 'fas fa-video';
                    bgColor = 'bg-blue-100';
                    textColor = 'text-blue-600';
                    break;
                case 'quiz':
                    iconClass = 'fas fa-question-circle';
                    bgColor = 'bg-yellow-100';
                    textColor = 'text-yellow-600';
                    break;
                case 'assignment':
                    iconClass = 'fas fa-tasks';
                    bgColor = 'bg-indigo-100';
                    textColor = 'text-indigo-600';
                    break;
                case 'past_papers':
                    iconClass = 'fas fa-file-archive';
                    bgColor = 'bg-orange-100';
                    textColor = 'text-orange-600';
                    break;
                default:
                    iconClass = 'fas fa-file';
                    bgColor = 'bg-gray-100';
                    textColor = 'text-gray-600';
            }
        }

        // Create lesson HTML with matching styling
        const lessonHTML = `
            <div class="flex items-center justify-between py-2.5 px-3 hover:bg-blue-50 rounded-md group lesson-item transition-colors duration-200 mb-1 border border-transparent hover:border-blue-100" data-lesson-id="${lesson.id}">
                <div class="flex items-center truncate">
                    <div class="w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center mr-3">
                        <i class="${iconClass} ${textColor} text-sm"></i>
                    </div>
                    <span class="text-gray-700 cursor-pointer lesson-title truncate hover:text-blue-600 transition-colors duration-200" 
                          data-lesson-id="${lesson.id}">
                        ${lesson.title}
                    </span>
                </div>

                <div class="flex items-center">
                    ${lesson.status == 'draft' ? 
                        `<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center mr-2">
                            <i class="fas fa-pencil-alt mr-1 text-xs"></i> DRAFT
                        </span>` : ''
                    }
                    
                    ${lesson.is_preview ? 
                        `<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center mr-2">
                            <i class="fas fa-eye mr-1 text-xs"></i> PREVIEW
                        </span>` : ''
                    }

                    <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button class="edit-lesson-btn p-1.5 text-gray-500 hover:text-blue-600 focus:outline-none transition-colors duration-200 rounded-full hover:bg-blue-100"
                            data-lesson-id="${lesson.id}" title="Edit lesson">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button class="delete-lesson-btn p-1.5 text-gray-500 hover:text-red-600 focus:outline-none transition-colors duration-200 rounded-full hover:bg-red-100"
                            data-lesson-id="${lesson.id}" title="Delete lesson">
                            <i class="fas fa-trash-alt text-sm"></i>
                        </button>
                        <button class="drag-handle p-1.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-move transition-colors duration-200 rounded-full hover:bg-gray-100"
                            title="Reorder lesson">
                            <i class="fas fa-grip-vertical text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>`;

        // Insert before the add lesson button
        addLessonBtn.insertAdjacentHTML('beforebegin', lessonHTML);

        // Add event listeners to the new lesson
        attachEventListenersToNewLesson(lesson.id);
    }

    // Function to attach event listeners to newly created lesson
    function attachEventListenersToNewLesson(lessonId) {
        const lessonElement = document.querySelector(`[data-lesson-id="${lessonId}"]`);
        if (!lessonElement) return;

        // Make the lesson title clickable to load in builder
        const lessonTitle = lessonElement.querySelector('.lesson-title');
        if (lessonTitle) {
            lessonTitle.style.cursor = 'pointer';
            lessonTitle.addEventListener('click', function() {
                loadLessonInBuilder(lessonId);
            });
        }

        // Edit lesson button
        const editBtn = lessonElement.querySelector('.edit-lesson-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                const studyMaterialId = getCurrentCourseId();
                window.location.href = `/teacher/study-materials/${studyMaterialId}/lessons/${lessonId}/edit`;
            });
        }

        // Delete lesson button
        const deleteBtn = lessonElement.querySelector('.delete-lesson-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to delete this lesson?')) {
                    deleteLessonFromSidebar(lessonId);
                }
            });
        }
    }

    // Function to load lesson in builder (placeholder for now)
    function loadLessonInBuilder(lessonId) {
        // If LessonBuilder is available, use it to load the lesson
        if (typeof LessonBuilder !== 'undefined' && LessonBuilder.loadLesson) {
            LessonBuilder.loadLesson(lessonId);
            return;
        }
        
        // Fallback: Redirect to edit page
        const studyMaterialId = getCurrentCourseId();
        window.location.href = `/teacher/study-materials/${studyMaterialId}/lessons/${lessonId}/edit`;
    }

    // Function to delete lesson from sidebar
    function deleteLessonFromSidebar(lessonId) {
        const studyMaterialId = getCurrentCourseId();

        fetch(`/teacher/study-materials/${studyMaterialId}/lessons/${lessonId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const lessonElement = document.querySelector(`[data-lesson-id="${lessonId}"]`);
                    if (lessonElement) {
                        lessonElement.remove();
                    }
                    showSuccessMessage('Lesson deleted successfully!');
                } else {
                    console.error('Failed to delete lesson:', data.message);
                    alert('Failed to delete lesson: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error deleting lesson: ' + error.message);
            });
    }
</script>
