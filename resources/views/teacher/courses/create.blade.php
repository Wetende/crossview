<x-dashboard-layout title="Teacher Dashboard - Create New Course">
    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>
    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <div class="bg-gray-50 min-h-screen p-6">
        {{-- Profile Completion Check --}}
        @php
            $user = Auth::user();
            $teacherProfile = $user->teacherProfile;
            $hasMinimumInfo = $teacherProfile ? $teacherProfile->hasMinimumInfoForPublishing() : false;
        @endphp
        
        @if(!$hasMinimumInfo)
            <div class="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-orange-800">Complete Your Profile to Publish Courses</h3>
                        <div class="mt-2 text-sm text-orange-700">
                            <p>To create and publish courses, please complete your teacher profile with either:</p>
                            <ul class="mt-1 ml-4 list-disc">
                                <li>A comprehensive bio (at least 50 characters), OR</li>
                                <li>Your position/title AND school affiliation</li>
                            </ul>
                        </div>
                        <div class="mt-3">
                            <a href="{{ route('teacher.settings') }}" class="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-md hover:bg-orange-200 transition-colors">
                                Complete Profile Now
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        @endif

        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800">Create New Course</h1>
            <p class="text-gray-600 mt-2">Fill in the details below to add a new course to the platform.</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm">
            <div x-data="{
                step: 1,
                totalSteps: 3,
                formData: {
                    title: '',
                    short_description: '',
                    description: '',
                    language: 'en',
                    category_id: '',
                    subject_id: '',
                    grade_level_id: '',
                    tags: [],
                    what_you_will_learn: [''],
                    requirements: ['']
                },
                tagInput: '',
                nextStep() {
                    if (this.validateCurrentStep()) {
                        this.step = Math.min(this.totalSteps, this.step + 1);
                        window.scrollTo(0, 0);
                    }
                },
                prevStep() {
                    this.step = Math.max(1, this.step - 1);
                    window.scrollTo(0, 0);
                },
                validateCurrentStep() {
                    const errors = [];
                    
                    if (this.step === 1) {
                        if (this.formData.title.length < 3) {
                            errors.push('Course title must be at least 3 characters long');
                        }
                        if (this.formData.description.length === 0) {
                            errors.push('Course description is required');
                        }
                        if (!this.formData.language) {
                            errors.push('Language selection is required');
                        }
                    } else if (this.step === 2) {
                        if (!this.formData.category_id) {
                            errors.push('Category selection is required');
                        }
                        if (!this.formData.grade_level_id) {
                            errors.push('Grade level selection is required');
                        }
                    }
                    
                    if (errors.length > 0) {
                        // Show alert with all errors
                        alert('Please fix the following errors:\n\n• ' + errors.join('\n• '));
                        return false;
                    }
                    
                    return true;
                },
                addItem(array) {
                    this.formData[array].push('');
                },
                removeItem(array, index) {
                    this.formData[array].splice(index, 1);
                },
                addTag() {
                    if (this.tagInput.trim() && !this.formData.tags.includes(this.tagInput.trim())) {
                        this.formData.tags.push(this.tagInput.trim());
                        this.tagInput = '';
                    }
                },
                removeTag(index) {
                    this.formData.tags.splice(index, 1);
                }
            }">
                <!-- Progress Stepper -->
                <div class="border-b border-gray-200 px-6 py-4">
                    <div class="flex items-center justify-between max-w-3xl mx-auto">
                        <template x-for="i in totalSteps" :key="i">
                            <div class="flex items-center flex-1">
                                <!-- Step Circle -->
                                <div class="flex items-center justify-center w-10 h-10 rounded-full"
                                    :class="i <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'">
                                    <span x-text="i" class="font-medium"></span>
                                </div>

                                <!-- Step Label -->
                                <div class="ml-3" :class="i <= step ? 'text-blue-600' : 'text-gray-500'">
                                    <div class="text-sm font-medium"
                                        x-text="['Basic Information', 'Categorization', 'Learning Outcomes'][i-1]">
                                    </div>
                                </div>

                                <!-- Connector Line -->
                                <template x-if="i < totalSteps">
                                    <div class="flex-1 mx-4 h-1" :class="i < step ? 'bg-blue-600' : 'bg-gray-200'">
                                    </div>
                                </template>
                            </div>
                        </template>
                    </div>
                </div>

                <form class="p-6" 
                    action="{{ request()->is('admin/*') ? route('admin.courses.store') : route('teacher.courses.store') }}" 
                    method="POST" enctype="multipart/form-data">
                    @csrf

                    <!-- Step 1: Basic Information -->
                    <div class="p-6" x-show="step === 1">
                        <div class="max-w-5xl mx-auto space-y-2">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2" for="title">Course
                                    Title<span class="text-red-500">*</span></label>
                                <input type="text" id="title" name="title" placeholder="Enter course title"
                                    x-model="formData.title" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    :class="{'border-red-500 ring-red-500': formData.title.length > 0 && formData.title.length < 3}"
                                    maxlength="255">

                                @error('title')
                                    <div class="text-red-500 text-sm mt-1">{{ $message }}</div>
                                @enderror
                                <div x-show="formData.title.length > 0 && formData.title.length < 3" class="text-red-500 text-sm mt-1">
                                    Title must be at least 3 characters long
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2"
                                    for="short_description">Short Description</label>
                                <textarea id="short_description" name="short_description" placeholder="Enter a brief description (max 500 characters)"
                                    x-model="formData.short_description" rows="3"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    maxlength="500"></textarea>
                                <div class="text-xs text-gray-500 mt-1">Provide a concise overview of your course</div>
                                @error('short_description')
                                    <div class="text-red-500 text-sm mt-1">{{ $message }}</div>
                                @enderror
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2" for="description">Full
                                    Description<span class="text-red-500">*</span></label>
                                <textarea id="description" name="description" placeholder="Enter the full course description"
                                    x-model="formData.description" rows="6" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    :class="{'border-red-500 ring-red-500': formData.description.length === 0}"></textarea>
                                @error('description')
                                    <div class="text-red-500 text-sm mt-1">{{ $message }}</div>
                                @enderror
                                <div x-show="formData.description.length === 0" class="text-red-500 text-sm mt-1">
                                    Course description is required
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2"
                                        for="thumbnail_path">Course Thumbnail Image</label>
                                    <div class="flex items-center">
                                        <input type="file" id="thumbnail_path" name="thumbnail_path"
                                            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                                            accept="image/jpeg,image/png,image/jpg">
                                    </div>
                                    <div class="text-xs text-gray-500 mt-1">Upload a .jpg or .png image. Recommended
                                        dimensions: 700x450 (max 5MB).</div>
                                    @error('thumbnail_path')
                                        <div class="text-red-500 text-sm mt-1">{{ $message }}</div>
                                    @enderror
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2"
                                        for="language">Language<span class="text-red-500">*</span></label>
                                    <select id="language" name="language"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                                        :class="{'border-red-500 ring-red-500': !formData.language}"
                                        x-model="formData.language" required>
                                        <option value="">Select Language</option>
                                        <option value="en">English</option>
                                        <option value="sw">Swahili</option>
                                        <option value="lg">Luganda</option>
                                        <option value="fr">French</option>
                                    </select>
                                    @error('language')
                                        <div class="text-red-500 text-sm mt-1">{{ $message }}</div>
                                    @enderror
                                    <div x-show="!formData.language && formData.language !== null" class="text-red-500 text-sm mt-1">
                                        Language is required
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: Categorization -->
                    <div class="p-6" x-show="step === 2">
                        <div class="max-w-3xl mx-auto space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2"
                                        for="category_id">Category<span class="text-red-500">*</span></label>
                                    <select id="category_id" name="category_id"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                                        :class="{'border-red-500 ring-red-500': !formData.category_id}"
                                        x-model="formData.category_id" required>
                                        <option value="">Select Category</option>
                                        @foreach ($categories as $category)
                                            <option value="{{ $category->id }}">{{ $category->name }}</option>
                                        @endforeach
                                    </select>
                                    @error('category_id')
                                        <div class="text-red-500 text-sm mt-1">{{ $message }}</div>
                                    @enderror
                                    <div x-show="!formData.category_id && formData.category_id !== null" class="text-red-500 text-sm mt-1">
                                        Category is required
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2"
                                        for="subject_id">Subject</label>
                                    <select id="subject_id" name="subject_id"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                                        x-model="formData.subject_id">
                                        <option value="">Select Subject</option>
                                        @foreach ($subjects as $subject)
                                            <option value="{{ $subject->id }}">{{ $subject->name }}</option>
                                        @endforeach
                                    </select>
                                    @error('subject_id')
                                        <div class="text-red-500 text-sm mt-1">{{ $message }}</div>
                                    @enderror
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2"
                                        for="grade_level_id">Grade Level<span class="text-red-500">*</span></label>
                                    <select id="grade_level_id" name="grade_level_id"
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                                        :class="{'border-red-500 ring-red-500': !formData.grade_level_id}"
                                        x-model="formData.grade_level_id" required>
                                        <option value="">Select Grade Level</option>
                                        @foreach ($gradeLevels as $gradeLevel)
                                            <option value="{{ $gradeLevel->id }}">{{ $gradeLevel->name }}</option>
                                        @endforeach
                                    </select>
                                    @error('grade_level_id')
                                        <div class="text-red-500 text-sm mt-1">{{ $message }}</div>
                                    @enderror
                                    <div x-show="!formData.grade_level_id && formData.grade_level_id !== null" class="text-red-500 text-sm mt-1">
                                        Grade level is required
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2"
                                    for="tags">Tags</label>
                                <div class="flex flex-wrap gap-2 mb-3">
                                    <template x-for="(tag, index) in formData.tags" :key="index">
                                        <div class="px-3 py-1 bg-gray-100 rounded-full flex items-center">
                                            <span x-text="tag" class="text-sm text-gray-800"></span>
                                            <button type="button" class="ml-2 text-gray-500 hover:text-red-500"
                                                @click="removeTag(index)">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4"
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </template>
                                </div>
                                <div class="flex">
                                    <input type="text" id="tagInput" placeholder="Enter a tag"
                                        x-model="tagInput" @keydown.enter.prevent="addTag"
                                        class="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                                    <button type="button"
                                        class="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                        @click="addTag">Add</button>
                                </div>
                                <div class="text-xs text-gray-500 mt-1">Press Enter or click Add to add a tag.</div>
                                <template x-for="(tag, index) in formData.tags" :key="index">
                                    <input type="hidden" :name="'tags[' + index + ']'" :value="tag">
                                </template>
                                @error('tags')
                                    <div class="text-red-500 text-sm mt-1">{{ $message }}</div>
                                @enderror
                            </div>
                        </div>
                    </div>

                    <!-- Step 3: Learning Outcomes & Requirements -->
                    <div class="p-6" x-show="step === 3">
                        <div class="max-w-3xl mx-auto space-y-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">What You Will Learn</label>
                                <div class="space-y-3 mb-3">
                                    <template x-for="(item, index) in formData.what_you_will_learn"
                                        :key="index">
                                        <div class="flex gap-2">
                                            <input type="text"
                                                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                :name="'what_you_will_learn[' + index + ']'"
                                                x-model="formData.what_you_will_learn[index]"
                                                placeholder="Learners will be able to...">
                                            <button type="button"
                                                class="px-3 py-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                @click="removeItem('what_you_will_learn', index)"
                                                :disabled="formData.what_you_will_learn.length === 1">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </template>
                                </div>
                                <button type="button"
                                    class="flex items-center px-3 py-2 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                    @click="addItem('what_you_will_learn')">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Learning Outcome
                                </button>
                                @error('what_you_will_learn')
                                    <div class="text-red-500 text-sm mt-1">{{ $message }}</div>
                                @enderror
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                                <div class="space-y-3 mb-3">
                                    <template x-for="(item, index) in formData.requirements" :key="index">
                                        <div class="flex gap-2">
                                            <input type="text"
                                                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                :name="'requirements[' + index + ']'"
                                                x-model="formData.requirements[index]"
                                                placeholder="Prior knowledge or preparations needed...">
                                            <button type="button"
                                                class="px-3 py-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                @click="removeItem('requirements', index)"
                                                :disabled="formData.requirements.length === 1">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5"
                                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </template>
                                </div>
                                <button type="button"
                                    class="flex items-center px-3 py-2 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                    @click="addItem('requirements')">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Requirement
                                </button>
                                @error('requirements')
                                    <div class="text-red-500 text-sm mt-1">{{ $message }}</div>
                                @enderror
                            </div>
                        </div>
                    </div>

                    <!-- Navigation Buttons -->
                    <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                        <div class="flex justify-between items-center">
                            <div>
                                <button type="button"
                                    class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                    x-show="step > 1" @click="prevStep">
                                    <span class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Previous
                                    </span>
                                </button>
                            </div>
                            <div class="flex space-x-3">
                                <a href="{{ route('teacher.courses.index') }}"
                                    class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                                    Cancel
                                </a>
                                <button type="button"
                                    class="px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                    x-show="step < totalSteps" @click="nextStep">
                                    <span class="flex items-center">
                                        Next
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 5l7 7-7 7" />
                                        </svg>
                                    </span>
                                </button>
                                <button type="submit"
                                    class="px-4 py-2 bg-green-600 border border-transparent rounded-lg text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                    x-show="step === totalSteps">
                                    <span class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M5 13l4 4L19 7" />
                                        </svg>
                                        Create Course
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</x-dashboard-layout>
