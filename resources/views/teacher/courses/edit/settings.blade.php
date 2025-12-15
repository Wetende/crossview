<div id="settingsTab">
    <h4 class="text-dark-1 mb-4">@lmsterm('Study Material') Settings</h4>
    
    <form action="{{ route('teacher.courses.update', $course) }}" method="POST" enctype="multipart/form-data">
        @csrf
        @method('PUT')
        <input type="hidden" name="tab" value="settings">

        <div class="row">
            <!-- Course Basic Info -->
            <div class="col-lg-8">
                <div class="card -dark-bg-light-1 mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Basic Information</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="title" class="form-label">@lmsterm('Study Material') Title <span class="text-danger">*</span></label>
                            <input type="text" class="form-control @error('title') is-invalid @enderror" id="title" name="title" value="{{ old('title', $course->title) }}" required>
                            @error('title')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="mb-3">
                            <label for="slug" class="form-label">@lmsterm('Study Material') Slug <span class="text-danger">*</span></label>
                            <input type="text" class="form-control @error('slug') is-invalid @enderror" id="slug" name="slug" value="{{ old('slug', $course->slug) }}" required>
                            <small class="text-muted">URL-friendly name for your @lmsterm('study material').</small>
                            @error('slug')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="mb-3">
                            <label for="short_description" class="form-label">Short Description <span class="text-danger">*</span></label>
                            <textarea class="form-control @error('short_description') is-invalid @enderror" id="short_description" name="short_description" rows="3" required>{{ old('short_description', $course->short_description) }}</textarea>
                            <small class="text-muted">Brief summary of your @lmsterm('study material') (150-200 characters).</small>
                            @error('short_description')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="mb-3">
                            <label for="description" class="form-label">Full Description <span class="text-danger">*</span></label>
                            <textarea class="form-control rich-editor @error('description') is-invalid @enderror" id="description" name="description" rows="8" required>{{ old('description', $course->description) }}</textarea>
                            @error('description')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                    </div>
                </div>
                
                <!-- Course Classification -->
                <div class="card -dark-bg-light-1 mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Classification</h5>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <label for="category_id" class="form-label">Category <span class="text-danger">*</span></label>
                                <select class="form-select @error('category_id') is-invalid @enderror" id="category_id" name="category_id" required>
                                    <option value="">Select Category</option>
                                    @foreach ($categories as $category)
                                        <option value="{{ $category->id }}" {{ old('category_id', $course->category_id) == $category->id ? 'selected' : '' }}>
                                            {{ $category->name }}
                                        </option>
                                    @endforeach
                                </select>
                                @error('category_id')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                            <div class="col-md-4">
                                <label for="subject_id" class="form-label">Subject <span class="text-danger">*</span></label>
                                <select class="form-select @error('subject_id') is-invalid @enderror" id="subject_id" name="subject_id" required>
                                    <option value="">Select Subject</option>
                                    @foreach ($subjects as $subject)
                                        <option value="{{ $subject->id }}" {{ old('subject_id', $course->subject_id) == $subject->id ? 'selected' : '' }}>
                                            {{ $subject->name }}
                                        </option>
                                    @endforeach
                                </select>
                                @error('subject_id')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                            <div class="col-md-4">
                                <label for="grade_level_id" class="form-label">Grade Level <span class="text-danger">*</span></label>
                                <select class="form-select @error('grade_level_id') is-invalid @enderror" id="grade_level_id" name="grade_level_id" required>
                                    <option value="">Select Grade Level</option>
                                    @foreach ($gradeLevels as $gradeLevel)
                                        <option value="{{ $gradeLevel->id }}" {{ old('grade_level_id', $course->grade_level_id) == $gradeLevel->id ? 'selected' : '' }}>
                                            {{ $gradeLevel->name }}
                                        </option>
                                    @endforeach
                                </select>
                                @error('grade_level_id')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="language" class="form-label">@lmsterm('Study Material') Language</label>
                            <select class="form-select @error('language') is-invalid @enderror" id="language" name="language">
                                <option value="">Select Language</option>
                                <option value="en" {{ old('language', $course->language) == 'en' ? 'selected' : '' }}>English</option>
                                <option value="fr" {{ old('language', $course->language) == 'fr' ? 'selected' : '' }}>French</option>
                                <option value="es" {{ old('language', $course->language) == 'es' ? 'selected' : '' }}>Spanish</option>
                                <option value="de" {{ old('language', $course->language) == 'de' ? 'selected' : '' }}>German</option>
                                <!-- Add more languages as needed -->
                            </select>
                            @error('language')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="mb-3">
                            <label for="tags" class="form-label">Tags</label>
                            <input type="text" class="form-control @error('tags') is-invalid @enderror" id="tags" name="tags" value="{{ old('tags', $course->tags) }}">
                            <small class="text-muted">Comma-separated list of tags (e.g., algebra, mathematics, calculus).</small>
                            @error('tags')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                    </div>
                </div>
                
                <!-- Course Details -->
                <div class="card -dark-bg-light-1 mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">@lmsterm('Study Material') Details</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="what_you_will_learn" class="form-label">What You Will Learn</label>
                            <textarea class="form-control rich-editor @error('what_you_will_learn') is-invalid @enderror" id="what_you_will_learn" name="what_you_will_learn" rows="5">{{ old('what_you_will_learn', $course->what_you_will_learn) }}</textarea>
                            <small class="text-muted">List key learning outcomes for students.</small>
                            @error('what_you_will_learn')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="mb-3">
                            <label for="requirements" class="form-label">Prerequisites</label>
                            <textarea class="form-control rich-editor @error('requirements') is-invalid @enderror" id="requirements" name="requirements" rows="5">{{ old('requirements', $course->requirements) }}</textarea>
                            <small class="text-muted">List any prior knowledge or requirements for this @lmsterm('study material').</small>
                            @error('requirements')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="mb-3">
                            <label for="instructor_info" class="form-label">Instructor Info</label>
                            <textarea class="form-control rich-editor @error('instructor_info') is-invalid @enderror" id="instructor_info" name="instructor_info" rows="5">{{ old('instructor_info', $course->instructor_info) }}</textarea>
                            <small class="text-muted">Provide additional information about yourself specific to this @lmsterm('study material') (optional).</small>
                            @error('instructor_info')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Sidebar -->
            <div class="col-lg-4">
                <!-- Course Status -->
                <div class="card -dark-bg-light-1 mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Status</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label d-block">@lmsterm('Study Material') Status</label>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="is_published" id="status_draft" value="0" {{ old('is_published', $course->is_published) ? '' : 'checked' }}>
                                <label class="form-check-label" for="status_draft">Draft</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" name="is_published" id="status_published" value="1" {{ old('is_published', $course->is_published) ? 'checked' : '' }}>
                                <label class="form-check-label" for="status_published">Published</label>
                            </div>
                        </div>
                    </div>
                </div>
            
                <!-- Course Thumbnail -->
                <div class="card -dark-bg-light-1 mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">@lmsterm('Study Material') Thumbnail</h5>
                    </div>
                    <div class="card-body">
                        <div id="thumbnail-uploader" data-course-id="{{ $course->id }}">
                            <div id="thumbnail-preview" class="mb-3">
                                @if ($course->thumbnail_url)
                                    <img src="{{ $course->thumbnail_url }}" alt="@lmsterm('Study Material') Thumbnail" class="img-fluid rounded mb-2 border course-thumbnail-display">
                                @elseif ($course->thumbnail_path)
                                    <img src="{{ asset('storage/' . $course->thumbnail_path) }}" alt="@lmsterm('Study Material') Thumbnail" class="img-fluid rounded mb-2 border course-thumbnail-display">
                                @else
                                    <div class="bg-light d-flex align-items-center justify-content-center rounded border" style="height: 180px;">
                                        <div class="text-center text-muted">
                                            <i class="fas fa-image fa-3x mb-2"></i>
                                            <p>No thumbnail uploaded</p>
                                        </div>
                                    </div>
                                @endif
                            </div>
                            
                            <div class="mb-3">
                                <label for="thumbnail" class="form-label">@lmsterm('Study Material') Thumbnail</label>
                                <input type="file" class="form-control @error('thumbnail') is-invalid @enderror" id="thumbnail" name="thumbnail" accept="image/*">
                                <small class="text-muted d-block mt-1">Recommended size: 1280x720 pixels (16:9 ratio)</small>
                                @error('thumbnail')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                            
                            <div class="progress mb-3 d-none">
                                <div id="thumbnail-upload-progress" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Additional Settings -->
                <div class="card -dark-bg-light-1 mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Additional Settings</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="is_featured" name="is_featured" value="1" {{ old('is_featured', $course->is_featured) ? 'checked' : '' }}>
                                <label class="form-check-label" for="is_featured">Featured @lmsterm('Study Material')</label>
                            </div>
                            <small class="text-muted">Featured @lmsterm('study materials') are displayed prominently.</small>
                        </div>
                        
                        <div class="mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="is_recommended" name="is_recommended" value="1" {{ old('is_recommended', $course->is_recommended) ? 'checked' : '' }}>
                                <label class="form-check-label" for="is_recommended">Recommended @lmsterm('Study Material')</label>
                            </div>
                            <small class="text-muted">Recommended @lmsterm('study materials') appear in "Recommended" sections.</small>
                        </div>
                        
                        <div class="mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="allow_certificate" name="allow_certificate" value="1" {{ old('allow_certificate', $course->allow_certificate) ? 'checked' : '' }}>
                                <label class="form-check-label" for="allow_certificate">Enable Certificate</label>
                            </div>
                            <small class="text-muted">Allow students to receive a certificate upon @lmsterm('study material') completion.</small>
                        </div>
                        
                        <div class="mb-3">
                            <label for="certificate_template_id" class="form-label">Certificate Template</label>
                            <select class="form-select @error('certificate_template_id') is-invalid @enderror" id="certificate_template_id" name="certificate_template_id" {{ old('allow_certificate', $course->allow_certificate) ? '' : 'disabled' }}>
                                <option value="">Default Template</option>
                                @foreach ($certificateTemplates as $template)
                                    <option value="{{ $template->id }}" {{ old('certificate_template_id', $course->certificate_template_id) == $template->id ? 'selected' : '' }}>
                                        {{ $template->name }}
                                    </option>
                                @endforeach
                            </select>
                            @error('certificate_template_id')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                    </div>
                </div>

                <div class="card -dark-bg-light-1 mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">SEO Settings</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="meta_title" class="form-label">Meta Title</label>
                            <input type="text" class="form-control @error('meta_title') is-invalid @enderror" id="meta_title" name="meta_title" value="{{ old('meta_title', $course->meta_title) }}">
                            <small class="text-muted">Override the default page title for SEO purposes (leave blank to use @lmsterm('study material') title).</small>
                            @error('meta_title')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="mb-3">
                            <label for="meta_description" class="form-label">Meta Description</label>
                            <textarea class="form-control @error('meta_description') is-invalid @enderror" id="meta_description" name="meta_description" rows="3">{{ old('meta_description', $course->meta_description) }}</textarea>
                            <small class="text-muted">Recommended length: 150-160 characters maximum. Leave blank to use short description.</small>
                            @error('meta_description')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="mb-3">
                            <label for="meta_keywords" class="form-label">Meta Keywords</label>
                            <input type="text" class="form-control @error('meta_keywords') is-invalid @enderror" id="meta_keywords" name="meta_keywords" value="{{ old('meta_keywords', $course->meta_keywords) }}">
                            <small class="text-muted">Comma-separated list of keywords (optional).</small>
                            @error('meta_keywords')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-12">
                <div class="text-end">
                    <button type="submit" class="button -md -blue-1 text-white">Save Changes</button>
                </div>
            </div>
        </div>
    </form>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize rich text editors
        if (typeof tinymce !== 'undefined') {
            tinymce.init({
                selector: '.rich-editor',
                height: 300,
                menubar: false,
                plugins: [
                    'advlist autolink lists link image charmap print preview anchor',
                    'searchreplace visualblocks code fullscreen',
                    'insertdatetime media table paste code help wordcount'
                ],
                toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }'
            });
        }
        
        // Auto-generate slug from title
        const titleInput = document.getElementById('title');
        const slugInput = document.getElementById('slug');
        
        titleInput.addEventListener('blur', function() {
            if (!slugInput.value.trim()) {
                slugInput.value = titleInput.value
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/[\s_-]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }
        });
        
        // Enable/disable certificate template based on certificate checkbox
        const certificateCheckbox = document.getElementById('allow_certificate');
        const templateSelect = document.getElementById('certificate_template_id');
        
        certificateCheckbox.addEventListener('change', function() {
            templateSelect.disabled = !this.checked;
        });
    });
</script>