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
                <h1 class="text-30 lh-12 fw-700">Edit Performance Metric</h1>
                <div class="mt-10">Update details for "{{ $metric->name }}"</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.performance.metrics.index') }}" class="button -sm -light-3 text-dark-1">
                    <i class="icon-arrow-left mr-10"></i>
                    Back to Metrics
                </a>
            </div>
        </div>

        <!-- Edit Form Card -->
        <div class="row y-gap-30">
            <div class="col-12">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <h2 class="text-20 lh-1 fw-500 mb-30">Metric Information</h2>
                    
                    <form action="{{ route('admin.performance.metrics.update', $metric) }}" method="POST" class="row y-gap-20">
                        @csrf
                        @method('PUT')
                        
                        <div class="col-lg-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="name">Metric Name*</label>
                            <input type="text" name="name" id="name" class="form-control @error('name') is-invalid @enderror" value="{{ old('name', $metric->name) }}" required>
                            @error('name')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="col-lg-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="key">Metric Key*</label>
                            <input type="text" name="key" id="key" class="form-control @error('key') is-invalid @enderror" value="{{ old('key', $metric->key) }}" required>
                            @error('key')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                            <div class="mt-5 text-14 lh-1 text-light-1">Unique identifier used in calculations.</div>
                        </div>
                        
                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="description">Description</label>
                            <textarea name="description" id="description" rows="4" class="form-control @error('description') is-invalid @enderror">{{ old('description', $metric->description) }}</textarea>
                            @error('description')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="col-lg-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="weight">Weight*</label>
                            <input type="number" name="weight" id="weight" step="0.01" min="0" max="1" class="form-control @error('weight') is-invalid @enderror" value="{{ old('weight', $metric->weight) }}" required>
                            @error('weight')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                            <div class="mt-5 text-14 lh-1 text-light-1">Value between 0 and 1 indicating the importance of this metric in overall calculations.</div>
                        </div>
                        
                        <div class="col-lg-6">
                            <div class="text-16 lh-1 fw-500 text-dark-1 mb-10">Metric Type*</div>
                            <div class="form-switch d-flex items-center">
                                <input type="checkbox" name="is_subject_specific" id="is_subject_specific" class="form-check-input @error('is_subject_specific') is-invalid @enderror" value="1" {{ old('is_subject_specific', $metric->is_subject_specific) ? 'checked' : '' }}>
                                <label class="form-check-label text-16 ml-10" for="is_subject_specific">Subject Specific</label>
                            </div>
                            @error('is_subject_specific')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                            @enderror
                            <div class="mt-5 text-14 lh-1 text-light-1">Enable if this metric is specific to individual subjects (e.g., Math Quiz Score).</div>
                        </div>
                        
                        <div class="col-lg-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="calculation_formula">Calculation Formula</label>
                            <input type="text" name="calculation_formula" id="calculation_formula" class="form-control @error('calculation_formula') is-invalid @enderror" value="{{ old('calculation_formula', $metric->calculation_formula) }}">
                            @error('calculation_formula')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                            <div class="mt-5 text-14 lh-1 text-light-1">Optional formula used to calculate this metric.</div>
                        </div>
                        
                        <div class="col-lg-6">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="display_order">Display Order</label>
                            <input type="number" name="display_order" id="display_order" class="form-control @error('display_order') is-invalid @enderror" value="{{ old('display_order', $metric->display_order) }}" min="1">
                            @error('display_order')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                            <div class="mt-5 text-14 lh-1 text-light-1">Order in which the metric appears in listings.</div>
                        </div>
                        
                        <div class="col-12 mt-20">
                            <div class="line-border-b-1 mb-30"></div>
                            <div class="d-flex items-center justify-end">
                                <a href="{{ route('admin.performance.metrics.index') }}" class="button -md -light-3 text-dark-1 mr-10">Cancel</a>
                                <button type="submit" class="button -md -purple-1 text-white">Update Metric</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 