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
                <h1 class="text-30 lh-12 fw-700">Add Performance Level</h1>
                <div class="mt-10">Create a new performance level indicator</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.performance.levels.index') }}" class="button -sm -light-3 text-dark-1">
                    <i class="icon-arrow-left mr-10"></i>
                    Back to Levels
                </a>
            </div>
        </div>

        <!-- Create Form Card -->
        <div class="row y-gap-30">
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <h2 class="text-20 lh-1 fw-500 mb-30">Level Information</h2>
                    
                    <form action="{{ route('admin.performance.levels.store') }}" method="POST" class="row y-gap-20">
                        @csrf
                        
                        <div class="col-lg-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="name">Level Name*</label>
                            <input type="text" name="name" id="name" class="form-control @error('name') is-invalid @enderror" value="{{ old('name') }}" required placeholder="e.g., Distinction">
                            @error('name')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="col-lg-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="color_code">Color Code*</label>
                            <div class="d-flex items-center">
                                <input type="color" id="color_picker" class="form-control-color mr-10" value="{{ old('color_code', '#00A44B') }}" onchange="document.getElementById('color_code').value = this.value;">
                                <input type="text" name="color_code" id="color_code" class="form-control @error('color_code') is-invalid @enderror" value="{{ old('color_code', '#00A44B') }}" required placeholder="e.g., #00A44B">
                            </div>
                            @error('color_code')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                            <div class="mt-5 text-14 lh-1 text-light-1">Hex color code (e.g., #00A44B for green)</div>
                        </div>
                        
                        <div class="col-lg-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="min_score">Minimum Score (%)*</label>
                            <input type="number" name="min_score" id="min_score" step="0.01" min="0" max="100" class="form-control @error('min_score') is-invalid @enderror" value="{{ old('min_score') }}" required placeholder="e.g., 80">
                            @error('min_score')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="col-lg-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="max_score">Maximum Score (%)*</label>
                            <input type="number" name="max_score" id="max_score" step="0.01" min="0" max="100" class="form-control @error('max_score') is-invalid @enderror" value="{{ old('max_score') }}" required placeholder="e.g., 100">
                            @error('max_score')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="description">Description</label>
                            <textarea name="description" id="description" rows="4" class="form-control @error('description') is-invalid @enderror" placeholder="Detailed description of this performance level">{{ old('description') }}</textarea>
                            @error('description')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="display_order">Display Order</label>
                            <input type="number" name="display_order" id="display_order" class="form-control @error('display_order') is-invalid @enderror" value="{{ old('display_order', '1') }}" min="1">
                            @error('display_order')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                            <div class="mt-5 text-14 lh-1 text-light-1">Order in which the level appears in listings.</div>
                        </div>
                        
                        <!-- Preview -->
                        <div class="col-12 mt-20">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Preview</label>
                            <div class="py-15 px-20 rounded-8 border-light" id="level_preview" style="border-left: 4px solid #00A44B; background-color: #00A44B10;">
                                <div id="preview_name" class="text-16 fw-500" style="color: #00A44B">Level Name</div>
                                <div class="d-flex items-center mt-5">
                                    <div class="text-14 mr-10">Score Range:</div>
                                    <div class="text-14 fw-500" id="preview_range">0 - 0</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-12 mt-20">
                            <div class="line-border-b-1 mb-30"></div>
                            <div class="d-flex items-center justify-end">
                                <a href="{{ route('admin.performance.levels.index') }}" class="button -md -light-3 text-dark-1 mr-10">Cancel</a>
                                <button type="submit" class="button -md -purple-1 text-white">Create Level</button>
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
            const colorPicker = document.getElementById('color_picker');
            const colorInput = document.getElementById('color_code');
            const minScore = document.getElementById('min_score');
            const maxScore = document.getElementById('max_score');
            const preview = document.getElementById('level_preview');
            const previewName = document.getElementById('preview_name');
            const previewRange = document.getElementById('preview_range');
            
            function updatePreview() {
                const name = nameInput.value || 'Level Name';
                const color = colorInput.value || '#00A44B';
                const min = minScore.value || '0';
                const max = maxScore.value || '0';
                
                preview.style.borderLeftColor = color;
                preview.style.backgroundColor = color + '10';
                previewName.style.color = color;
                previewName.textContent = name;
                previewRange.textContent = min + ' - ' + max;
            }
            
            // Add event listeners
            nameInput.addEventListener('input', updatePreview);
            colorPicker.addEventListener('input', function() {
                colorInput.value = this.value;
                updatePreview();
            });
            colorInput.addEventListener('input', function() {
                colorPicker.value = this.value;
                updatePreview();
            });
            minScore.addEventListener('input', updatePreview);
            maxScore.addEventListener('input', updatePreview);
            
            // Initialize preview
            updatePreview();
        });
    </script>
    @endpush
</x-dashboard-layout> 