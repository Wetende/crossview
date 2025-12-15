<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>
    
    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Edit Subscription Tier</h1>
                <div class="mt-10">Update this subscription tier's details and features</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.subscription-tiers.index') }}" class="button -icon -purple-1 text-white">
                    <i class="icon-arrow-left text-13 mr-10"></i>
                    Back to Tiers
                </a>
            </div>
        </div>

        <div class="row">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 p-20 mb-30">
                    <form action="{{ route('admin.subscription-tiers.update', $subscriptionTier) }}" method="POST">
                        @csrf
                        @method('PUT')
                        
                        <div class="row y-gap-30 pt-20">
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Tier Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control @error('name') is-invalid @enderror" id="name" name="name" value="{{ old('name', $subscriptionTier->name) }}" required>
                                @error('name')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                            
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Price (UGX) <span class="text-danger">*</span></label>
                                <input type="number" step="0.01" min="0" class="form-control @error('price') is-invalid @enderror" id="price" name="price" value="{{ old('price', $subscriptionTier->price) }}" required>
                                @error('price')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>

                            <div class="col-md-4">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Level <span class="text-danger">*</span></label>
                                <input type="number" min="0" class="form-control @error('level') is-invalid @enderror" id="level" name="level" value="{{ old('level', $subscriptionTier->level) }}" required>
                                <div class="mt-5 text-14 lh-1 text-light-1">Higher levels have more access permissions. 0 is lowest (free).</div>
                                @error('level')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                            
                            <div class="col-md-4">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Duration (Days) <span class="text-danger">*</span></label>
                                <input type="number" min="0" class="form-control @error('duration_days') is-invalid @enderror" id="duration_days" name="duration_days" value="{{ old('duration_days', $subscriptionTier->duration_days) }}" required>
                                <div class="mt-5 text-14 lh-1 text-light-1">Enter 0 for unlimited/lifetime access.</div>
                                @error('duration_days')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                            
                            <div class="col-md-4">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Max Courses</label>
                                <input type="number" min="0" class="form-control @error('max_courses') is-invalid @enderror" id="max_courses" name="max_courses" value="{{ old('max_courses', $subscriptionTier->max_courses) }}">
                                <div class="mt-5 text-14 lh-1 text-light-1">Leave empty for unlimited courses.</div>
                                @error('max_courses')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>

                            <div class="col-12">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Description</label>
                                <textarea class="form-control @error('description') is-invalid @enderror" id="description" name="description" rows="4">{{ old('description', $subscriptionTier->description) }}</textarea>
                                @error('description')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>

                            <div class="col-12">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Features <span class="text-14 lh-1 text-light-1">(bullet points shown to users)</span></label>
                                
                                <div class="mt-15" id="features-container">
                                    @if(old('features'))
                                        @foreach(old('features') as $index => $feature)
                                            <div class="feature-row d-flex items-center mb-10">
                                                <div class="d-flex flex-grow-1 rounded-8 border-light overflow-hidden">
                                                    <div class="bg-light-3 p-10 d-flex justify-center items-center">
                                                        <i class="icon-check text-14 text-purple-1"></i>
                                                    </div>
                                                    <input type="text" class="form-control border-0 rounded-0" name="features[]" value="{{ $feature }}" placeholder="e.g., Access to all courses">
                                                </div>
                                                @if($index === 0)
                                                    <button type="button" class="button -sm -light-3 text-purple-1 ml-10 add-feature"><i class="icon-plus"></i></button>
                                                @else
                                                    <button type="button" class="button -sm -light-3 text-red-1 ml-10 remove-feature"><i class="icon-minus"></i></button>
                                                @endif
                                            </div>
                                        @endforeach
                                    @else
                                        @forelse($subscriptionTier->features ?? [] as $index => $feature)
                                            <div class="feature-row d-flex items-center mb-10">
                                                <div class="d-flex flex-grow-1 rounded-8 border-light overflow-hidden">
                                                    <div class="bg-light-3 p-10 d-flex justify-center items-center">
                                                        <i class="icon-check text-14 text-purple-1"></i>
                                                    </div>
                                                    <input type="text" class="form-control border-0 rounded-0" name="features[]" value="{{ $feature }}" placeholder="e.g., Access to all courses">
                                                </div>
                                                @if($index === 0)
                                                    <button type="button" class="button -sm -light-3 text-purple-1 ml-10 add-feature"><i class="icon-plus"></i></button>
                                                @else
                                                    <button type="button" class="button -sm -light-3 text-red-1 ml-10 remove-feature"><i class="icon-minus"></i></button>
                                                @endif
                                            </div>
                                        @empty
                                            <div class="feature-row d-flex items-center mb-10">
                                                <div class="d-flex flex-grow-1 rounded-8 border-light overflow-hidden">
                                                    <div class="bg-light-3 p-10 d-flex justify-center items-center">
                                                        <i class="icon-check text-14 text-purple-1"></i>
                                                    </div>
                                                    <input type="text" class="form-control border-0 rounded-0" name="features[]" placeholder="e.g., Access to all courses">
                                                </div>
                                                <button type="button" class="button -sm -light-3 text-purple-1 ml-10 add-feature"><i class="icon-plus"></i></button>
                                            </div>
                                        @endforelse
                                    @endif
                                </div>
                            </div>

                            <div class="col-12">
                                <div class="form-switch d-flex items-center">
                                    <div class="switch">
                                        <input type="checkbox" id="is_active" name="is_active" value="1" {{ old('is_active', $subscriptionTier->is_active) ? 'checked' : '' }}>
                                        <span class="switch__slider"></span>
                                    </div>
                                    <label class="text-16 lh-1 fw-500 text-dark-1 ml-10" for="is_active">Active</label>
                                </div>
                                <div class="mt-5 text-14 lh-1 text-light-1">Inactive tiers will not be visible to users.</div>
                            </div>

                            <div class="col-12 d-flex justify-end">
                                <a href="{{ route('admin.subscription-tiers.index') }}" class="button -md -outline-purple-1 text-purple-1 mr-10">Cancel</a>
                                <button type="submit" class="button -md -purple-1 text-white">Update Subscription Tier</button>
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
            const featuresContainer = document.getElementById('features-container');
            
            // Add new feature field
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('add-feature') || e.target.parentElement.classList.contains('add-feature')) {
                    const featureRow = document.createElement('div');
                    featureRow.className = 'feature-row d-flex items-center mb-10';
                    featureRow.innerHTML = `
                        <div class="d-flex flex-grow-1 rounded-8 border-light overflow-hidden">
                            <div class="bg-light-3 p-10 d-flex justify-center items-center">
                                <i class="icon-check text-14 text-purple-1"></i>
                            </div>
                            <input type="text" class="form-control border-0 rounded-0" name="features[]" placeholder="e.g., Access to all courses">
                        </div>
                        <button type="button" class="button -sm -light-3 text-red-1 ml-10 remove-feature"><i class="icon-minus"></i></button>
                    `;
                    featuresContainer.appendChild(featureRow);
                }
            });
            
            // Remove feature field
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('remove-feature') || e.target.parentElement.classList.contains('remove-feature')) {
                    const button = e.target.closest('.remove-feature');
                    const featureRow = button.closest('.feature-row');
                    featureRow.remove();
                }
            });
        });
    </script>
    @endpush
</x-dashboard-layout> 