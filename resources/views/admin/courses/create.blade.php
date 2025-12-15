<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Create New @lmsterm('Study Material')</h1>
                <div class="mt-10">Create a new @lmsterm('study material') and assign it to a teacher.</div>
            </div>
        </div>

        <div class="row y-gap-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="py-30 px-30">
                        <form action="{{ route('admin.courses.store') }}" method="POST" enctype="multipart/form-data">
                            @csrf

                            <!-- Teacher Selection -->
                            <div class="row y-gap-20 mb-20">
                                <div class="col-12">
                                    <div class="text-16 fw-500 mb-10">Teacher Assignment</div>
                                    <div class="border-light rounded-8 p-20 bg-light-3 -dark-bg-dark-2">
                                        <div class="row y-gap-20">
                                            <div class="col-12">
                                                <label class="text-14 lh-1 fw-500 text-dark-1 mb-10" for="teacher_id">Assign to Teacher<span class="text-red-1">*</span></label>
                                                <select name="teacher_id" id="teacher_id" class="form-control js-selectize-single">
                                                    <option value="">Select a Teacher</option>
                                                    @foreach($teachers as $teacher)
                                                        <option value="{{ $teacher->id }}" {{ old('teacher_id') == $teacher->id ? 'selected' : '' }}>
                                                            {{ $teacher->name }} ({{ $teacher->email }})
                                                        </option>
                                                    @endforeach
                                                </select>
                                                @error('teacher_id')
                                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Basic Information -->
                            <div class="row y-gap-20 mb-20">
                                <div class="col-12">
                                    <div class="text-16 fw-500 mb-10">Basic Information</div>
                                    <div class="border-light rounded-8 p-20">
                                        <div class="row y-gap-20">
                                            <div class="col-12">
                                                <label class="text-14 lh-1 fw-500 text-dark-1 mb-10" for="title">@lmsterm('Study Material') Title<span class="text-red-1">*</span></label>
                                                <input type="text" name="title" id="title" class="form-control" value="{{ old('title') }}" required>
                                                @error('title')
                                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                            
                                            <div class="col-12">
                                                <label class="text-14 lh-1 fw-500 text-dark-1 mb-10" for="short_description">Short Description</label>
                                                <textarea name="short_description" id="short_description" class="form-control" rows="3">{{ old('short_description') }}</textarea>
                                                @error('short_description')
                                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                            
                                            <div class="col-12">
                                                <label class="text-14 lh-1 fw-500 text-dark-1 mb-10" for="description">Full Description<span class="text-red-1">*</span></label>
                                                <textarea name="description" id="description" class="form-control js-tinymce" rows="6">{{ old('description') }}</textarea>
                                                @error('description')
                                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Categorization -->
                            <div class="row y-gap-20 mb-20">
                                <div class="col-12">
                                    <div class="text-16 fw-500 mb-10">Categorization</div>
                                    <div class="border-light rounded-8 p-20">
                                        <div class="row y-gap-20">
                                            <div class="col-md-4">
                                                <label class="text-14 lh-1 fw-500 text-dark-1 mb-10" for="category_id">Category<span class="text-red-1">*</span></label>
                                                <select name="category_id" id="category_id" class="form-control js-selectize-single" required>
                                                    <option value="">Select Category</option>
                                                    @foreach($categories as $category)
                                                        <option value="{{ $category->id }}" {{ old('category_id') == $category->id ? 'selected' : '' }}>
                                                            {{ $category->name }}
                                                        </option>
                                                    @endforeach
                                                </select>
                                                @error('category_id')
                                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                            
                                            <div class="col-md-4">
                                                <label class="text-14 lh-1 fw-500 text-dark-1 mb-10" for="subject_id">Subject</label>
                                                <select name="subject_id" id="subject_id" class="form-control js-selectize-single">
                                                    <option value="">Select Subject</option>
                                                    @foreach($subjects as $subject)
                                                        <option value="{{ $subject->id }}" {{ old('subject_id') == $subject->id ? 'selected' : '' }}>
                                                            {{ $subject->name }}
                                                        </option>
                                                    @endforeach
                                                </select>
                                                @error('subject_id')
                                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                            
                                            <div class="col-md-4">
                                                <label class="text-14 lh-1 fw-500 text-dark-1 mb-10" for="grade_level_id">Grade Level<span class="text-red-1">*</span></label>
                                                <select name="grade_level_id" id="grade_level_id" class="form-control js-selectize-single" required>
                                                    <option value="">Select Grade Level</option>
                                                    @foreach($gradeLevels as $gradeLevel)
                                                        <option value="{{ $gradeLevel->id }}" {{ old('grade_level_id') == $gradeLevel->id ? 'selected' : '' }}>
                                                            {{ $gradeLevel->name }}
                                                        </option>
                                                    @endforeach
                                                </select>
                                                @error('grade_level_id')
                                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Media & Language -->
                            <div class="row y-gap-20 mb-20">
                                <div class="col-12">
                                    <div class="text-16 fw-500 mb-10">Media & Language</div>
                                    <div class="border-light rounded-8 p-20">
                                        <div class="row y-gap-20">
                                            <div class="col-md-6">
                                                <label class="text-14 lh-1 fw-500 text-dark-1 mb-10" for="thumbnail_path">Thumbnail Image</label>
                                                <input type="file" name="thumbnail_path" id="thumbnail_path" class="form-control" accept="image/jpeg,image/png,image/jpg">
                                                <div class="text-12 lh-1 mt-10">Recommended size: 700x450px (max 5MB)</div>
                                                @error('thumbnail_path')
                                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                            
                                            <div class="col-md-6">
                                                <label class="text-14 lh-1 fw-500 text-dark-1 mb-10" for="language">Language<span class="text-red-1">*</span></label>
                                                <select name="language" id="language" class="form-control js-selectize-single" required>
                                                    <option value="">Select Language</option>
                                                    <option value="en" {{ old('language') == 'en' ? 'selected' : '' }}>English</option>
                                                    <option value="sw" {{ old('language') == 'sw' ? 'selected' : '' }}>Swahili</option>
                                                    <option value="lg" {{ old('language') == 'lg' ? 'selected' : '' }}>Luganda</option>
                                                    <option value="fr" {{ old('language') == 'fr' ? 'selected' : '' }}>French</option>
                                                </select>
                                                @error('language')
                                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                                @enderror
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Submit Buttons -->
                            <div class="row y-gap-20 justify-between pt-30">
                                <div class="col-auto">
                                    <a href="{{ route('admin.courses.index') }}" class="button -md -outline-blue-1 text-blue-1">Cancel</a>
                                </div>
                                <div class="col-auto">
                                    <button type="submit" class="button -md -blue-1 text-white">Create @lmsterm('Study Material')</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                // Initialize TinyMCE
                if (typeof tinymce !== 'undefined') {
                    tinymce.init({
                        selector: '.js-tinymce',
                        height: 300,
                        menubar: false,
                        plugins: [
                            'advlist autolink lists link image charmap print preview anchor',
                            'searchreplace visualblocks code fullscreen',
                            'insertdatetime media table paste code help wordcount'
                        ],
                        toolbar: 'undo redo | formatselect | bold italic backcolor | \
                                alignleft aligncenter alignright alignjustify | \
                                bullist numlist outdent indent | removeformat | help'
                    });
                }

                // Initialize Selectize
                $('.js-selectize-single').selectize({
                    create: false,
                    sortField: 'text'
                });
            });
        </script>
    @endpush
</x-dashboard-layout> 