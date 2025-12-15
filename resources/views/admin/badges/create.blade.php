<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4 py-30 px-30">
        <div class="row y-gap-20 justify-between items-end pb-30">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Create New Badge</h1>
                <div class="mt-10">Add a new achievement badge to recognize user accomplishments.</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.badges.index') }}" class="button -md -outline-purple-1 text-purple-1">
                    <i class="icon-arrow-left mr-10"></i>
                    Back to Badges
                </a>
            </div>
        </div>

        <div class="row">
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <form action="{{ route('admin.badges.store') }}" method="POST" enctype="multipart/form-data">
                        @csrf

                        <div class="row y-gap-30">
                            <div class="col-md-8">
                                <div class="row y-gap-20">
                                    <div class="col-12">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="name">Badge Name *</label>
                                        <input type="text" name="name" id="name" value="{{ old('name') }}" class="form-control @error('name') is-invalid @enderror" required>
                                        @error('name')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>

                                    <div class="col-12">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="slug">Slug</label>
                                        <input type="text" name="slug" id="slug" value="{{ old('slug') }}" class="form-control @error('slug') is-invalid @enderror">
                                        <div class="text-14 lh-1 mt-10 text-light-1">Leave empty to auto-generate from name</div>
                                        @error('slug')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>

                                    <div class="col-12">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="description">Description *</label>
                                        <textarea name="description" id="description" rows="4" class="form-control @error('description') is-invalid @enderror" required>{{ old('description') }}</textarea>
                                        @error('description')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>

                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="points">Points *</label>
                                        <input type="number" name="points" id="points" value="{{ old('points', 0) }}" min="0" class="form-control @error('points') is-invalid @enderror" required>
                                        @error('points')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>

                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="criteria_type">Criteria Type</label>
                                        <select name="criteria_type" id="criteria_type" class="form-select @error('criteria_type') is-invalid @enderror">
                                            <option value="">Select Criteria Type</option>
                                            <option value="course_completion" {{ old('criteria_type') == 'course_completion' ? 'selected' : '' }}>@lmsterm('Study Material') Completion</option>
                                            <option value="quiz_score" {{ old('criteria_type') == 'quiz_score' ? 'selected' : '' }}>Quiz Score</option>
                                            <option value="forum_posts" {{ old('criteria_type') == 'forum_posts' ? 'selected' : '' }}>Forum Posts</option>
                                            <option value="manual" {{ old('criteria_type') == 'manual' ? 'selected' : '' }}>Manual Award</option>
                                        </select>
                                        @error('criteria_type')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>

                                    <div class="col-md-6">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="criteria_value">Criteria Value</label>
                                        <input type="text" name="criteria_value" id="criteria_value" value="{{ old('criteria_value') }}" class="form-control @error('criteria_value') is-invalid @enderror">
                                        <div class="text-14 lh-1 mt-10 text-light-1">E.g., number of @lmsterm('study materials'), minimum score</div>
                                        @error('criteria_value')
                                            <div class="text-red-1 mt-1">{{ $message }}</div>
                                        @enderror
                                    </div>

                                    <div class="col-md-6">
                                        <div class="form-switch d-flex items-center mt-20">
                                            <div class="switch">
                                                <input type="checkbox" name="is_active" id="is_active" value="1" {{ old('is_active', true) ? 'checked' : '' }}>
                                                <label for="is_active"></label>
                                            </div>
                                            <div class="text-16 lh-1 fw-500 text-dark-1 ml-10">Active</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-4">
                                <div class="d-flex flex-column items-center">
                                    <label class="text-16 lh-1 fw-500 text-dark-1 mb-15" for="icon">Badge Icon</label>
                                    <div class="badge-preview size-120 rounded-16 bg-light-4 mb-15 d-flex justify-center items-center">
                                        <i class="icon-award text-30 text-purple-1"></i>
                                    </div>
                                    <input type="file" name="icon" id="icon" class="form-control @error('icon') is-invalid @enderror" accept="image/*">
                                    <div class="text-14 lh-1 mt-10 text-light-1">Recommended: 200x200px PNG</div>
                                    @error('icon')
                                        <div class="text-red-1 mt-1">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>

                        <div class="row y-gap-20 justify-between pt-30">
                            <div class="col-auto">
                                <button type="submit" class="button -md -purple-1 text-white">Create Badge</button>
                            </div>

                            <div class="col-auto">
                                <a href="{{ route('admin.badges.index') }}" class="button -md -outline-red-1 text-red-1">Cancel</a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const nameInput = document.getElementById('name');
            const slugInput = document.getElementById('slug');
            
            if (nameInput && slugInput) {
                nameInput.addEventListener('input', function() {
                    // Only auto-generate slug if the slug field is empty or hasn't been manually edited
                    if (!slugInput.value || slugInput.dataset.autoGenerated === 'true') {
                        const slugValue = this.value
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/-+/g, '-');
                        
                        slugInput.value = slugValue;
                        slugInput.dataset.autoGenerated = 'true';
                    }
                });
                
                // Mark as manually edited when user types in slug field
                slugInput.addEventListener('input', function() {
                    slugInput.dataset.autoGenerated = 'false';
                });
            }
            
            // Preview uploaded badge icon
            const iconInput = document.getElementById('icon');
            const previewContainer = document.querySelector('.badge-preview');
            
            if (iconInput && previewContainer) {
                iconInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    
                    if (file && file.type.match('image.*')) {
                        const reader = new FileReader();
                        
                        reader.onload = function(e) {
                            // Replace the placeholder icon with the uploaded image
                            previewContainer.innerHTML = '';
                            const img = document.createElement('img');
                            img.src = e.target.result;
                            img.className = 'size-100 rounded-8 object-cover';
                            previewContainer.appendChild(img);
                        };
                        
                        reader.readAsDataURL(file);
                    }
                });
            }
        });
    </script>
    @endpush
</x-dashboard-layout> 