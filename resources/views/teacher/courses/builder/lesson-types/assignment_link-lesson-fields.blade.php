{{-- Enhanced Assignment Lesson Fields Component --}}
<div id="assignment-fields" class="space-y-6">
    <div class="border-b border-gray-200 pb-4">
        <h3 class="text-lg font-medium text-gray-900 flex items-center">
            <i class="fas fa-tasks mr-2 text-green-500"></i> Create New Assignment
        </h3>
        <p class="text-sm text-gray-500 mt-1">Design a new assignment for your students</p>
    </div>
    
    {{-- Optional: Select Existing Assignment (Collapsible) --}}
    <div class="bg-green-50 border border-green-200 rounded-md">
        <button type="button" id="toggle-existing-assignment" class="w-full px-4 py-3 text-left text-sm font-medium text-green-900 hover:bg-green-100 focus:outline-none flex items-center justify-between">
            <span class="flex items-center">
                <i class="fas fa-folder-open mr-2"></i>
                Or select an existing assignment
            </span>
            <i class="fas fa-chevron-down transition-transform duration-200"></i>
        </button>
        <div id="existing-assignment-section" class="hidden px-4 pb-4">
            <div class="mt-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Select Existing Assignment</label>
                <select id="assignment-selection" name="assignment_id" 
                    class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Choose an existing assignment...</option>
                    @if(isset($assignments))
                        @foreach($assignments as $assignment)
                            <option value="{{ $assignment['id'] }}" 
                                data-max-points="{{ $assignment['max_points'] }}"
                                data-submission-type="{{ $assignment['submission_type'] }}">
                                {{ $assignment['title'] }} ({{ $assignment['max_points'] }} points)
                            </option>
                        @endforeach
                    @endif
                </select>
                <p class="text-xs text-gray-500 mt-1">Select this if you want to reuse an existing assignment from your course sections</p>
            </div>
        </div>
    </div>
    
    {{-- Main Assignment Creation Form --}}
    <div id="assignment-creation-form">
        <div class="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
            <h4 class="text-sm font-medium text-gray-900 mb-3">Assignment Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Assignment Title</label>
                    <input type="text" id="new-assignment-title" name="new_assignment_title" 
                        placeholder="Enter assignment title..."
                        class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Assignment Description</label>
                    <textarea id="new-assignment-description" name="new_assignment_description" rows="4" 
                        placeholder="Detailed description of what students need to do..."
                        class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Maximum Points</label>
                    <input type="number" id="new-assignment-max-points" name="new_assignment_max_points" min="1" value="100"
                        class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
                    <select id="new-assignment-type" name="new_assignment_type" 
                        class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="project">Project Assignment</option>
                        <option value="essay">Essay/Report</option>
                        <option value="research">Research Assignment</option>
                        <option value="presentation">Presentation</option>
                        <option value="portfolio">Portfolio</option>
                        <option value="practical">Practical Exercise</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>
        </div>
        
        {{-- Assignment Requirements Section --}}
        <div class="bg-white border border-gray-200 rounded-md p-4 mb-4">
            <h4 class="text-sm font-medium text-gray-900 mb-3">Assignment Requirements</h4>
            
            <div id="requirements-container" class="space-y-3 mb-4">
                <div class="requirement-item flex items-center space-x-2">
                    <span class="text-sm text-gray-500 w-20">Req 1:</span>
                    <input type="text" name="assignment_requirements[0]" placeholder="Enter assignment requirement..." 
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <button type="button" class="remove-requirement-btn text-red-500 hover:text-red-700 p-1" disabled>
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <button type="button" id="add-requirement-btn" 
                class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200">
                <i class="fas fa-plus mr-1"></i> Add Requirement
            </button>
        </div>
        
        {{-- Grading Criteria Section --}}
        <div class="bg-white border border-gray-200 rounded-md p-4 mb-4">
            <h4 class="text-sm font-medium text-gray-900 mb-3">Grading Criteria</h4>
            
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Grading Method</label>
                <div class="space-y-2">
                    <div class="flex items-center">
                        <input type="radio" id="grading-points" name="grading_method" value="points" checked
                            class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300">
                        <label for="grading-points" class="ml-2 block text-sm text-gray-700">
                            Points-based grading (0-{{ 100 }} points)
                        </label>
                    </div>
                    <div class="flex items-center">
                        <input type="radio" id="grading-rubric" name="grading_method" value="rubric"
                            class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300">
                        <label for="grading-rubric" class="ml-2 block text-sm text-gray-700">
                            Rubric-based grading
                        </label>
                    </div>
                </div>
            </div>
            
            {{-- Rubric Criteria (hidden by default) --}}
            <div id="rubric-criteria" class="hidden">
                <h5 class="text-sm font-medium text-gray-700 mb-3">Rubric Criteria</h5>
                <div id="criteria-container" class="space-y-3 mb-4">
                    <div class="criteria-item border border-gray-200 rounded-md p-3">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Criteria Name</label>
                                <input type="text" name="rubric_criteria[0][name]" placeholder="e.g., Content Quality" 
                                    class="block w-full px-2 py-1 border border-gray-300 rounded text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Max Points</label>
                                <input type="number" name="rubric_criteria[0][points]" min="1" value="25" 
                                    class="block w-full px-2 py-1 border border-gray-300 rounded text-sm">
                            </div>
                            <div class="flex items-end">
                                <button type="button" class="remove-criteria-btn text-red-500 hover:text-red-700 p-1 text-sm">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                        <div class="mt-2">
                            <label class="block text-xs font-medium text-gray-700 mb-1">Description</label>
                            <textarea name="rubric_criteria[0][description]" rows="2" 
                                placeholder="Describe what this criteria evaluates..."
                                class="block w-full px-2 py-1 border border-gray-300 rounded text-sm"></textarea>
                        </div>
                    </div>
                </div>
                
                <button type="button" id="add-criteria-btn" 
                    class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200">
                    <i class="fas fa-plus mr-1"></i> Add Criteria
                </button>
            </div>
        </div>
        
        {{-- Submission Settings --}}
        <div class="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
            <h4 class="text-sm font-medium text-gray-900 mb-3">Submission Settings</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Submission Type</label>
                    <select id="submission-type" name="submission_type"
                        class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="file">File Upload Only</option>
                        <option value="text">Text Entry Only</option>
                        <option value="link">URL/Link Submission</option>
                        <option value="both">File Upload + Text Entry</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input type="datetime-local" id="assignment-due-date" name="assignment_due_date"
                        class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                </div>
            </div>
        </div>
        
        {{-- File Upload Settings (conditional) --}}
        <div id="file-upload-settings" class="bg-blue-50 p-4 rounded-md border border-blue-200 mb-4">
            <h4 class="text-sm font-medium text-blue-900 mb-3">File Upload Settings</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Maximum File Size (MB)</label>
                    <input type="number" id="max-file-size" name="max_file_size" min="1" max="100" value="10"
                        class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <p class="text-xs text-gray-500 mt-1">Maximum file size allowed per upload</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Allowed File Types</label>
                    <div class="space-y-2">
                        <div class="flex items-center">
                            <input type="checkbox" id="file-type-pdf" name="allowed_file_types[]" value="pdf" checked
                                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                            <label for="file-type-pdf" class="ml-2 block text-sm text-gray-700">PDF Documents</label>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="file-type-docx" name="allowed_file_types[]" value="docx" checked
                                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                            <label for="file-type-docx" class="ml-2 block text-sm text-gray-700">Word Documents</label>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="file-type-images" name="allowed_file_types[]" value="images"
                                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                            <label for="file-type-images" class="ml-2 block text-sm text-gray-700">Images (JPG, PNG, GIF)</label>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="file-type-videos" name="allowed_file_types[]" value="videos"
                                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                            <label for="file-type-videos" class="ml-2 block text-sm text-gray-700">Videos (MP4, AVI, MOV)</label>
                        </div>
                        <div class="flex items-center">
                            <input type="checkbox" id="file-type-zip" name="allowed_file_types[]" value="zip"
                                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                            <label for="file-type-zip" class="ml-2 block text-sm text-gray-700">ZIP Archives</label>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-3">
                <div class="flex items-center">
                    <input type="checkbox" id="allow-multiple-files" name="allow_multiple_files" value="1"
                        class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                    <label for="allow-multiple-files" class="ml-2 block text-sm text-gray-700">
                        Allow students to upload multiple files
                    </label>
                </div>
            </div>
        </div>
        
        {{-- Late Submission and Grading --}}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Late Submission Policy</label>
                <select id="late-submission-policy" name="late_submission_policy"
                    class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="not_allowed">Not Allowed</option>
                    <option value="penalty" selected>Allowed with Penalty</option>
                    <option value="no_penalty">Allowed without Penalty</option>
                </select>
            </div>
            
            <div id="late-penalty-field">
                <label class="block text-sm font-medium text-gray-700 mb-1">Late Penalty (% per day)</label>
                <input type="number" id="late-penalty" name="late_penalty" min="0" max="100" value="10"
                    class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                <p class="text-xs text-gray-500 mt-1">Percentage deducted per day late</p>
            </div>
        </div>
        
        {{-- Grading Options --}}
        <div class="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
            <h4 class="text-sm font-medium text-gray-900 mb-3">Grading Options</h4>
            <div class="space-y-3">
                <div class="flex items-center">
                    <input type="checkbox" id="auto-assign-points" name="auto_assign_points" value="1"
                        class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                    <label for="auto-assign-points" class="ml-2 block text-sm text-gray-700">
                        Auto-assign full points upon submission
                    </label>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" id="allow-resubmission" name="allow_resubmission" value="1" checked
                        class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                    <label for="allow-resubmission" class="ml-2 block text-sm text-gray-700">
                        Allow students to resubmit before due date
                    </label>
                </div>
                <div class="flex items-center">
                    <input type="checkbox" id="peer-review" name="peer_review" value="1"
                        class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                    <label for="peer-review" class="ml-2 block text-sm text-gray-700">
                        Enable peer review after submission
                    </label>
                </div>
            </div>
        </div>
    </div>
    
    {{-- Instructions for Students --}}
    <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Instructions for Students</label>
        <textarea id="assignment-instructions" name="assignment_instructions" rows="4" 
            placeholder="Provide detailed instructions for completing this assignment..."
            class="block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
    </div>
</div>

{{-- Simplified Assignment JavaScript Handler --}}
<script>
(function() {
    document.getElementById('toggle-existing-assignment')?.addEventListener('click', function() {
        const section = document.getElementById('existing-assignment-section');
        const icon = this.querySelector('i.fa-chevron-down');
        
        if (section.classList.contains('hidden')) {
            section.classList.remove('hidden');
            icon.style.transform = 'rotate(180deg)';
        } else {
            section.classList.add('hidden');
            icon.style.transform = 'rotate(0deg)';
        }
    });
    
    document.getElementById('assignment-selection')?.addEventListener('change', function() {
        const creationForm = document.getElementById('assignment-creation-form');
        if (this.value) {
            // Hide creation form when existing assignment is selected
            creationForm.style.opacity = '0.5';
            creationForm.style.pointerEvents = 'none';
        } else {
            // Show creation form when no existing assignment is selected
            creationForm.style.opacity = '1';
            creationForm.style.pointerEvents = 'auto';
        }
    });
    
    document.querySelectorAll('input[name="grading_method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const rubricCriteria = document.getElementById('rubric-criteria');
            if (this.value === 'rubric') {
                rubricCriteria.classList.remove('hidden');
            } else {
                rubricCriteria.classList.add('hidden');
            }
        });
    });
    
    document.getElementById('submission-type')?.addEventListener('change', function() {
        const fileSettings = document.getElementById('file-upload-settings');
        if (this.value === 'file' || this.value === 'both') {
            fileSettings.classList.remove('hidden');
        } else {
            fileSettings.classList.add('hidden');
        }
    });
    
    document.getElementById('late-submission-policy')?.addEventListener('change', function() {
        const penaltyField = document.getElementById('late-penalty-field');
        if (this.value === 'penalty') {
            penaltyField.style.display = 'block';
        } else {
            penaltyField.style.display = 'none';
        }
    });
    
    document.getElementById('add-requirement-btn')?.addEventListener('click', function() {
        
    });
    
    document.getElementById('add-criteria-btn')?.addEventListener('click', function() {
        
    });
})();

// Simplified AssignmentLessonHandler
window.AssignmentLessonHandler = {
    validateFields() {
        const errors = [];
        const existingAssignmentId = document.getElementById('assignment-selection')?.value;
        
        if (existingAssignmentId) {
            return errors;
        }
        const title = document.getElementById('new-assignment-title')?.value;
        if (!title || title.trim() === '') {
            errors.push('Assignment title is required.');
        }
        
        const requirements = document.querySelectorAll('.requirement-item input');
        let hasValidRequirement = false;
        requirements.forEach(req => {
            if (req.value.trim() !== '') {
                hasValidRequirement = true;
            }
        });
        
        if (!hasValidRequirement) {
            errors.push('Please add at least one assignment requirement.');
        }
        

        const submissionType = document.getElementById('submission-type')?.value;
        if (submissionType === 'file' || submissionType === 'both') {
            const selectedFileTypes = document.querySelectorAll('input[name="allowed_file_types[]"]:checked');
            if (selectedFileTypes.length === 0) {
                errors.push('Please select at least one allowed file type for file submissions.');
            }
        }
        
        return errors;
    },
    
    clearFields() {
        document.querySelectorAll('#assignment-fields input, #assignment-fields select, #assignment-fields textarea').forEach(field => {
            if (field.type === 'checkbox') {
                field.checked = false;
            } else {
                field.value = '';
            }
        });
        
        document.getElementById('existing-assignment-section')?.classList.add('hidden');
        document.getElementById('assignment-creation-form').style.opacity = '1';
        document.getElementById('assignment-creation-form').style.pointerEvents = 'auto';
    }
};
</script>

<style>
.hidden {
    display: none !important;
}

#assignment-creation-form {
    transition: opacity 0.3s ease, pointer-events 0.3s ease;
}

#toggle-existing-assignment i {
    transition: transform 0.2s ease;
}

#late-penalty-field {
    display: block;
}
</style> 