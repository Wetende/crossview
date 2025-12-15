<div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
    <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
        <div class="col-auto">
            <h1 class="text-30 lh-12 fw-700">@lmsterm('Study Material') Settings</h1>
            <div class="text-15 lh-12 fw-500 text-dark-1 mt-5">Configure your @lmsterm('study material') details and publishing requirements</div>
        </div>
        <div class="col-auto">
            <div class="d-flex x-gap-15">
                <div>
                    <button type="button" class="button -md -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white" onclick="previewCourse()">
                        <i class="icon-eye text-16 mr-10"></i>
                        Preview @lmsterm('Study Material')
                    </button>
                </div>
                <div>
                    <div class="form-switch d-flex items-center">
                        <div class="switch" data-switch-target="#publishToggle">
                            <input type="checkbox" id="publishToggle" name="is_published" 
                                   {{ $course->is_published ? 'checked' : '' }}
                                   onchange="handlePublishToggle(this)">
                            <span class="switch__slider"></span>
                        </div>
                        <div class="text-15 lh-1 text-dark-1 ml-10">
                            <span id="publishLabel">{{ $course->is_published ? 'Published' : 'Draft' }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @if(session('success'))
        <div class="alert -success mb-30">
            <div class="alert__content">{{ session('success') }}</div>
        </div>
    @endif

    @if(session('error'))
        <div class="alert -danger mb-30">
            <div class="alert__content">{{ session('error') }}</div>
        </div>
    @endif

    <div class="row">
        <div class="col-lg-8">
            <!-- Settings Form Content -->
    <form action="{{ route('teacher.courses.settings.update', $course) }}" method="POST" enctype="multipart/form-data" class="course-settings-form">
        @csrf
        @method('PUT')

        <div class="tabs -active-purple-2 js-tabs">
            <div class="tabs__controls d-flex x-gap-30 y-gap-20 pb-30 js-tabs-controls">
                <button class="tabs__button text-light-1 js-tabs-button is-active" data-tab-target=".-tab-item-1" type="button">
                    Basic Information
                </button>
                <button class="tabs__button text-light-1 js-tabs-button" data-tab-target=".-tab-item-2" type="button">
                    Media & Images
                </button>
                <button class="tabs__button text-light-1 js-tabs-button" data-tab-target=".-tab-item-3" type="button">
                    SEO & Marketing
                </button>
                <button class="tabs__button text-light-1 js-tabs-button" data-tab-target=".-tab-item-4" type="button">
                    Advanced Settings
                </button>
            </div>

            <div class="tabs__content js-tabs-content">
                <!-- Basic Information Tab -->
                <div class="tabs__pane -tab-item-1 is-active">
                    <div class="row y-gap-30">
                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">@lmsterm('Study Material') Title *</label>
                            <input type="text" name="title" placeholder="Enter @lmsterm('study material') title" 
                                   value="{{ old('title', $course->title) }}" required
                                   class="form-control {{ !empty($course->title) ? 'border-green-1' : 'border-red-1' }}">
                            @error('title')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">@lmsterm('Study Material') Slug *</label>
                            <input type="text" name="slug" placeholder="study-material-url-slug" 
                                   value="{{ old('slug', $course->slug) }}" required
                                   class="form-control">
                            <div class="text-12 text-light-1 mt-5">This will be used in the @lmsterm('study material') URL</div>
                            @error('slug')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Short Description *</label>
                            <textarea name="short_description" placeholder="Brief description for @lmsterm('study material') cards" rows="3" 
                                      maxlength="500" required
                                      class="form-control">{{ old('short_description', $course->short_description) }}</textarea>
                            <div class="text-12 text-light-1 mt-5">Maximum 500 characters</div>
                            @error('short_description')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">@lmsterm('Study Material') Description *</label>
                            <textarea name="description" rows="8" required
                                      class="form-control {{ !empty($course->description) && strlen($course->description) >= 50 ? 'border-green-1' : 'border-red-1' }}"
                                      placeholder="Detailed @lmsterm('study material') description (minimum 50 characters)">{{ old('description', $course->description) }}</textarea>
                            <div class="text-12 text-light-1 mt-5">
                                Minimum 50 characters. Current: <span id="descriptionCount">{{ strlen($course->description ?? '') }}</span>
                            </div>
                            @error('description')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="col-md-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Category *</label>
                            <select name="category_id" required class="form-control selectize-singular">
                                <option value="">Select Category</option>
                                @foreach($categories ?? [] as $category)
                                    <option value="{{ $category->id }}" 
                                            {{ old('category_id', $course->category_id) == $category->id ? 'selected' : '' }}>
                                        {{ $category->name }}
                                    </option>
                                @endforeach
                            </select>
                            @error('category_id')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="col-md-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Subject *</label>
                            <select name="subject_id" required class="form-control selectize-singular">
                                <option value="">Select Subject</option>
                                @foreach($subjects ?? [] as $subject)
                                    <option value="{{ $subject->id }}" 
                                            {{ old('subject_id', $course->subject_id) == $subject->id ? 'selected' : '' }}>
                                        {{ $subject->name }}
                                    </option>
                                @endforeach
                            </select>
                            @error('subject_id')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="col-md-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Grade Level *</label>
                            <select name="grade_level_id" required class="form-control selectize-singular">
                                <option value="">Select Grade Level</option>
                                @foreach($gradeLevels ?? [] as $gradeLevel)
                                    <option value="{{ $gradeLevel->id }}" 
                                            {{ old('grade_level_id', $course->grade_level_id) == $gradeLevel->id ? 'selected' : '' }}>
                                        {{ $gradeLevel->name }}
                                    </option>
                                @endforeach
                            </select>
                            @error('grade_level_id')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="col-md-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Language</label>
                            <select name="language" class="form-control selectize-singular">
                                <option value="">Select Language</option>
                                <option value="en" {{ old('language', $course->language) === 'en' ? 'selected' : '' }}>English</option>
                                <option value="sw" {{ old('language', $course->language) === 'sw' ? 'selected' : '' }}>Swahili</option>
                                <option value="lg" {{ old('language', $course->language) === 'lg' ? 'selected' : '' }}>Luganda</option>
                                <option value="fr" {{ old('language', $course->language) === 'fr' ? 'selected' : '' }}>French</option>
                            </select>
                            @error('language')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>
                    </div>
                </div>

                <!-- Media & Images Tab -->
                <div class="tabs__pane -tab-item-2">
                    <div class="row y-gap-30">
                        <div class="col-12">
                            <h3 class="text-20 fw-500 mb-20">@lmsterm('Study Material') Thumbnail *</h3>
                            
                            <div class="upload-area {{ !empty($course->thumbnail_path) ? 'border-green-1' : 'border-red-1' }}" 
                                 style="border: 2px dashed; padding: 30px; text-align: center; border-radius: 8px;">
                                @if($course->thumbnail_path)
                                    <div class="current-thumbnail mb-20">
                                        <img src="{{ Storage::disk('public')->url($course->thumbnail_path) }}" 
                                             alt="@lmsterm('Study Material') Thumbnail" 
                                             style="max-width: 300px; max-height: 200px; border-radius: 8px;">
                                    </div>
                                @endif
                                
                                <input type="file" name="thumbnail_path" id="thumbnailInput" 
                                       accept="image/*" style="display: none;"
                                       onchange="handleThumbnailPreview(this)">
                                
                                <label for="thumbnailInput" class="button -md -purple-1 text-white cursor-pointer">
                                    <i class="icon-upload text-16 mr-10"></i>
                                    {{ $course->thumbnail_path ? 'Change Thumbnail' : 'Upload Thumbnail' }}
                                </label>
                                
                                <div class="text-12 text-light-1 mt-10">
                                    Recommended size: 1280x720px. Max file size: 5MB. Formats: JPG, PNG
                                </div>
                            </div>
                            @error('thumbnail_path')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>
                    </div>
                </div>

                <!-- SEO & Marketing Tab -->
                <div class="tabs__pane -tab-item-3">
                    <div class="row y-gap-30">
                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Tags</label>
                            <input type="text" name="tags" placeholder="Enter tags separated by commas" 
                                   value="{{ old('tags', is_array($course->tags) ? implode(', ', $course->tags) : $course->tags) }}"
                                   class="form-control">
                            <div class="text-12 text-light-1 mt-5">Separate tags with commas</div>
                            @error('tags')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">What You Will Learn</label>
                            <div id="learningOutcomes">
                                @php $learningOutcomes = old('what_you_will_learn', $course->what_you_will_learn ?? []); @endphp
                                @if(is_array($learningOutcomes) && count($learningOutcomes) > 0)
                                    @foreach($learningOutcomes as $index => $outcome)
                                        <div class="d-flex items-center mb-10 learning-outcome-item">
                                            <input type="text" name="what_you_will_learn[]" 
                                                   value="{{ $outcome }}" placeholder="Learning outcome"
                                                   class="form-control mr-10">
                                            <button type="button" class="button -sm -red-1 text-white remove-outcome">
                                                <i class="icon-trash"></i>
                                            </button>
                                        </div>
                                    @endforeach
                                @else
                                    <div class="d-flex items-center mb-10 learning-outcome-item">
                                        <input type="text" name="what_you_will_learn[]" 
                                               placeholder="Learning outcome" class="form-control mr-10">
                                        <button type="button" class="button -sm -red-1 text-white remove-outcome">
                                            <i class="icon-trash"></i>
                                        </button>
                                    </div>
                                @endif
                            </div>
                            <button type="button" class="button -sm -purple-1 text-white" onclick="addLearningOutcome()">
                                <i class="icon-plus text-12 mr-5"></i>
                                Add Learning Outcome
                            </button>
                        </div>

                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Requirements</label>
                            <div id="requirements">
                                @php $requirements = old('requirements', $course->requirements ?? []); @endphp
                                @if(is_array($requirements) && count($requirements) > 0)
                                    @foreach($requirements as $index => $requirement)
                                        <div class="d-flex items-center mb-10 requirement-item">
                                            <input type="text" name="requirements[]" 
                                                   value="{{ $requirement }}" placeholder="Course requirement"
                                                   class="form-control mr-10">
                                            <button type="button" class="button -sm -red-1 text-white remove-requirement">
                                                <i class="icon-trash"></i>
                                            </button>
                                        </div>
                                    @endforeach
                                @else
                                    <div class="d-flex items-center mb-10 requirement-item">
                                        <input type="text" name="requirements[]" 
                                               placeholder="Course requirement" class="form-control mr-10">
                                        <button type="button" class="button -sm -red-1 text-white remove-requirement">
                                            <i class="icon-trash"></i>
                                        </button>
                                    </div>
                                @endif
                            </div>
                            <button type="button" class="button -sm -purple-1 text-white" onclick="addRequirement()">
                                <i class="icon-plus text-12 mr-5"></i>
                                Add Requirement
                            </button>
                        </div>

                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">SEO Title</label>
                            <input type="text" name="meta_title" placeholder="SEO title for search engines" 
                                   value="{{ old('meta_title', $course->meta_title) }}" maxlength="60"
                                   class="form-control">
                            <div class="text-12 text-light-1 mt-5">Maximum 60 characters for optimal SEO</div>
                            @error('meta_title')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">SEO Description</label>
                            <textarea name="meta_description" placeholder="Meta description for search engines" 
                                      rows="3" maxlength="160" 
                                      class="form-control">{{ old('meta_description', $course->meta_description) }}</textarea>
                            <div class="text-12 text-light-1 mt-5">Maximum 160 characters for optimal SEO</div>
                            @error('meta_description')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">SEO Keywords</label>
                            <input type="text" name="meta_keywords" placeholder="Keywords separated by commas" 
                                   value="{{ old('meta_keywords', $course->meta_keywords) }}"
                                   class="form-control">
                            @error('meta_keywords')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>
                    </div>
                </div>

                <!-- Advanced Settings Tab -->
                <div class="tabs__pane -tab-item-4">
                    <div class="row y-gap-30">
                        <div class="col-12">
                            <h3 class="text-20 fw-500 mb-20">Course Features</h3>
                        </div>

                        <div class="col-md-6">
                            <div class="form-switch d-flex items-center">
                                <div class="switch">
                                    <input type="checkbox" name="is_featured" value="1" 
                                           {{ old('is_featured', $course->is_featured) ? 'checked' : '' }}>
                                    <span class="switch__slider"></span>
                                </div>
                                <div class="text-15 lh-1 text-dark-1 ml-10">Featured Course</div>
                            </div>
                            <div class="text-12 text-light-1 mt-5">Display prominently on homepage</div>
                        </div>

                        <div class="col-md-6">
                            <div class="form-switch d-flex items-center">
                                <div class="switch">
                                    <input type="checkbox" name="is_recommended" value="1" 
                                           {{ old('is_recommended', $course->is_recommended) ? 'checked' : '' }}>
                                    <span class="switch__slider"></span>
                                </div>
                                <div class="text-15 lh-1 text-dark-1 ml-10">Recommended Course</div>
                            </div>
                            <div class="text-12 text-light-1 mt-5">Show in recommended section</div>
                        </div>

                        <div class="col-md-6">
                            <div class="form-switch d-flex items-center">
                                <div class="switch">
                                    <input type="checkbox" name="allow_certificate" value="1" 
                                           {{ old('allow_certificate', $course->allow_certificate) ? 'checked' : '' }}>
                                    <span class="switch__slider"></span>
                                </div>
                                <div class="text-15 lh-1 text-dark-1 ml-10">Enable Certificates</div>
                            </div>
                            <div class="text-12 text-light-1 mt-5">Award certificates upon completion</div>
                        </div>

                        <div class="col-12" id="certificateTemplateSection" style="display: none;">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Certificate Template</label>
                            <select name="certificate_template_id" class="form-control selectize-singular">
                                <option value="">Select Template</option>
                                @foreach($certificateTemplates ?? [] as $template)
                                    <option value="{{ $template->id }}" 
                                            {{ old('certificate_template_id', $course->certificate_template_id) == $template->id ? 'selected' : '' }}>
                                        {{ $template->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>

                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Instructor Information</label>
                            <textarea name="instructor_info" rows="4" 
                                      class="form-control {{ !empty($course->instructor_info) ? 'border-green-1' : 'border-red-1' }}"
                                      placeholder="Information about the course instructor">{{ old('instructor_info', $course->instructor_info) }}</textarea>
                            <div class="text-12 text-light-1 mt-5">This information will be displayed on the course page</div>
                            @error('instructor_info')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                        </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-lg-4">
            <!-- Settings Sidebar Content -->
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 p-0 mb-30">
                <div class="d-flex justify-content-between border-bottom-light p-20">
                    <h4 class="text-18 lh-1 fw-500 mb-0">Course Details</h4>
                </div>
                <div class="p-20">
                    <div class="d-flex items-center flex-wrap y-gap-10 justify-between">
                        <div class="text-14">
                            <span class="text-dark-1 fw-500">Course ID:</span>
                            {{ $course->id }}
                        </div>
                        @if($course->published_at)
                            <div class="text-14">
                                <span class="text-dark-1 fw-500">Published:</span>
                                {{ $course->published_at->format('M d, Y') }}
                            </div>
                        @endif
                    </div>
                    
                    <div class="mt-20">
                        <div class="text-14">
                            <span class="text-dark-1 fw-500">Status:</span>
                            @if($course->approval_status === 'draft')
                                <span class="badge bg-light-4 text-dark-1">Draft</span>
                            @elseif($course->approval_status === 'submitted')
                                <span class="badge bg-warning text-white">Pending Approval</span>
                            @elseif($course->approval_status === 'approved')
                                <span class="badge bg-success text-white">Approved</span>
                            @elseif($course->approval_status === 'rejected')
                                <span class="badge bg-danger text-white">Rejected</span>
                            @endif
                        </div>
                    </div>
                    
                    <div class="mt-20">
                        <div class="text-14">
                            <span class="text-dark-1 fw-500">Last Updated:</span>
                            {{ $course->updated_at->format('M d, Y H:i') }}
                    </div>
                </div>
                </div>
            </div>
            
            <!-- Other sidebar components -->
            </div>
        </div>

        <div class="row y-gap-20 justify-between pt-30">
            <div class="col-auto">
                <button type="button" class="button -md -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white" 
                        onclick="window.location.href='{{ route('teacher.courses.builder', $course) }}'">
                    Back to Builder
                </button>
            </div>
            <div class="col-auto">
                <div class="d-flex x-gap-15">
                    <button type="button" class="button -md -outline-purple-1 text-purple-1" onclick="saveDraft()">
                        Save as Draft
                    </button>
                    <button type="submit" class="button -md -purple-1 text-white">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    </form>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    let autoSaveTimeout;
    
    // Auto-save functionality
    function setupAutoSave() {
        const form = document.getElementById('courseSettingsForm');
        if (!form) return;
        
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="url"], textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                clearTimeout(autoSaveTimeout);
                showSaveIndicator('saving');
                
                autoSaveTimeout = setTimeout(() => {
                    saveFormData();
                }, 2000); // Auto-save after 2 seconds of inactivity
            });
        });
    }
    
    // Show save status indicator
    function showSaveIndicator(status) {
        let indicator = document.getElementById('save-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'save-indicator';
            indicator.className = 'fixed-bottom-right';
            indicator.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 10px 15px; border-radius: 6px; font-size: 14px; z-index: 1050; transition: all 0.3s ease;';
            document.body.appendChild(indicator);
        }
        
        switch (status) {
            case 'saving':
                indicator.innerHTML = '<i class="icon-loading mr-5"></i>Saving...';
                indicator.className = 'fixed-bottom-right bg-blue-1 text-white';
                indicator.style.opacity = '1';
                break;
            case 'saved':
                indicator.innerHTML = '<i class="icon-check mr-5"></i>Saved';
                indicator.className = 'fixed-bottom-right bg-green-1 text-white';
                indicator.style.opacity = '1';
                setTimeout(() => {
                    indicator.style.opacity = '0';
                }, 2000);
                break;
            case 'error':
                indicator.innerHTML = '<i class="icon-close mr-5"></i>Save Failed';
                indicator.className = 'fixed-bottom-right bg-red-1 text-white';
                indicator.style.opacity = '1';
                setTimeout(() => {
                    indicator.style.opacity = '0';
                }, 3000);
                break;
        }
    }
    
    // Auto-save form data
    async function saveFormData() {
        const form = document.getElementById('courseSettingsForm');
        if (!form) return;
        
        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                }
            });
            
            if (response.ok) {
                showSaveIndicator('saved');
            } else {
                showSaveIndicator('error');
            }
        } catch (error) {
            console.error('Auto-save error:', error);
            showSaveIndicator('error');
        }
    }
    
    // Dynamic form element handling for what you will learn
    window.addLearningOutcome = function() {
        const container = document.getElementById('learningOutcomes');
        const template = `
            <div class="d-flex items-center mb-10 learning-outcome-item">
                <input type="text" name="what_you_will_learn[]" placeholder="Learning outcome" class="form-control mr-10">
                <button type="button" class="button -sm -red-1 text-white remove-outcome">
                    <i class="icon-trash"></i>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', template);
        
        // Attach event listener to the new remove button
        const newItem = container.lastElementChild;
        newItem.querySelector('.remove-outcome').addEventListener('click', function() {
            newItem.remove();
        });
    };
    
    // Initialize remove buttons for learning outcomes
    document.querySelectorAll('#learningOutcomes .remove-outcome').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.learning-outcome-item').remove();
        });
    });
    
    // Dynamic form element handling for requirements
    window.addRequirement = function() {
        const container = document.getElementById('requirements');
        const template = `
            <div class="d-flex items-center mb-10 requirement-item">
                <input type="text" name="requirements[]" placeholder="Course requirement" class="form-control mr-10">
                <button type="button" class="button -sm -red-1 text-white remove-requirement">
                    <i class="icon-trash"></i>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', template);
        
        // Attach event listener to the new remove button
        const newItem = container.lastElementChild;
        newItem.querySelector('.remove-requirement').addEventListener('click', function() {
            newItem.remove();
        });
    };
    
    // Initialize remove buttons for requirements
    document.querySelectorAll('#requirements .remove-requirement').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.requirement-item').remove();
        });
    });
    
    // Handle certificate template section visibility
    const certificateCheckbox = document.querySelector('input[name="allow_certificate"]');
    const certificateTemplateSection = document.getElementById('certificateTemplateSection');
    
    if (certificateCheckbox && certificateTemplateSection) {
        // Set initial state
        certificateTemplateSection.style.display = certificateCheckbox.checked ? 'block' : 'none';
        
        // Handle change event
        certificateCheckbox.addEventListener('change', function() {
            certificateTemplateSection.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // Character counter for description
    const descriptionTextarea = document.querySelector('textarea[name="description"]');
    const descriptionCount = document.getElementById('descriptionCount');
    
    if (descriptionTextarea && descriptionCount) {
        descriptionTextarea.addEventListener('input', function() {
            descriptionCount.textContent = this.value.length;
        });
    }
    
    // Save draft function
    window.saveDraft = function() {
        saveFormData();
        showNotification('success', 'Study Material saved as draft');
    };
    
    // Show notification
    function showNotification(type, message) {
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 15px 20px; border-radius: 6px; font-size: 14px; z-index: 1060; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        
        if (type === 'success') {
            notification.className = 'bg-green-1 text-white';
            notification.innerHTML = `<i class="icon-check mr-10"></i>${message}`;
        } else {
            notification.className = 'bg-red-1 text-white';
            notification.innerHTML = `<i class="icon-close mr-10"></i>${message}`;
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
    
    // Initialize thumbnail preview
    window.handleThumbnailPreview = function(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                let currentThumbnail = document.querySelector('.current-thumbnail');
                
                if (!currentThumbnail) {
                    currentThumbnail = document.createElement('div');
                    currentThumbnail.className = 'current-thumbnail mb-20';
                    input.parentNode.insertBefore(currentThumbnail, input);
                }
                
                currentThumbnail.innerHTML = `
                    <img src="${e.target.result}" alt="@lmsterm('Study Material') Thumbnail" 
                         style="max-width: 300px; max-height: 200px; border-radius: 8px;">
                `;
            };
            
            reader.readAsDataURL(input.files[0]);
        }
    };
    
    // Initialize everything
    setupAutoSave();
});
</script>

<style>
.requirement-icon {
    transition: all 0.3s ease;
}

.requirement-item {
    transition: all 0.2s ease;
    padding: 8px;
    border-radius: 6px;
}

.requirement-item:hover {
    background-color: #f8f9fa;
}

.progress-bar {
    background-color: #e9ecef;
    overflow: hidden;
}

#progress-fill {
    background: linear-gradient(90deg, #3E7BFA 0%, #8B5CF6 100%);
    transition: width 0.5s ease;
}

.fixed-bottom-right {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1050;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.icon-loading {
    animation: spin 1s linear infinite;
}
</style>
