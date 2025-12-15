<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>
    
    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row pb-50 mb-10">
            <div class="col-12">
                <h1 class="text-30 lh-12 fw-700">Create Subscription Tier</h1>
                <p class="mt-10">Add a new subscription tier with features and pricing.</p>
            </div>
        </div>

        <div class="row justify-content-center">
            <div class="col-xl-10">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Subscription Information</h2>
                        <a href="{{ route('admin.subscription-tiers.index') }}" class="button -sm -outline-purple-1 text-purple-1">
                            <i class="icon-arrow-left text-13 mr-10"></i>
                            Back to Tiers
                        </a>
                    </div>

                    <form action="{{ route('admin.subscription-tiers.store') }}" method="POST" class="py-30 px-30">
                        @csrf
                        
                        <div class="row y-gap-30">
                            <!-- Tier Name -->
                            <div class="col-12">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="name">Tier Name <span class="text-red-1">*</span></label>
                                <div class="relative">
                                    <input type="text" class="w-full h-[50px] px-4 py-3 rounded-lg border border-light-5 focus:border-purple-1 focus:ring-2 focus:ring-purple-1/20 transition-all @error('name') border-red-1 @enderror" 
                                        id="name" name="name" value="{{ old('name') }}" 
                                        placeholder="Enter tier name (e.g. Basic, Premium, Pro)" required>
                                    @error('name')
                                        <div class="text-red-1 mt-2 text-sm">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>

                            <!-- Level and Duration in two columns -->
                            <div class="col-lg-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="level">Level <span class="text-red-1">*</span></label>
                                <div class="relative">
                                    <input type="number" class="w-full h-[50px] px-4 py-3 rounded-lg border border-light-5 focus:border-purple-1 focus:ring-2 focus:ring-purple-1/20 transition-all @error('level') border-red-1 @enderror" 
                                        id="level" name="level" value="{{ old('level', 1) }}" min="0" step="1" required>
                                    <div class="mt-2 text-14 lh-1 text-light-1">Higher levels have more access permissions. 0 is lowest (free).</div>
                                    @error('level')
                                        <div class="text-red-1 mt-2 text-sm">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>

                            <div class="col-lg-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="duration_days">Duration (Days) <span class="text-red-1">*</span></label>
                                <div class="relative">
                                    <input type="number" class="w-full h-[50px] px-4 py-3 rounded-lg border border-light-5 focus:border-purple-1 focus:ring-2 focus:ring-purple-1/20 transition-all @error('duration_days') border-red-1 @enderror" 
                                        id="duration_days" name="duration_days" value="{{ old('duration_days', 30) }}" 
                                        min="0" step="1" required>
                                    <div class="mt-2 text-14 lh-1 text-light-1">Enter 0 for unlimited/lifetime access.</div>
                                    @error('duration_days')
                                        <div class="text-red-1 mt-2 text-sm">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>

                            <!-- Price and Max Courses in two columns -->
                            <div class="col-lg-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="price">Price (UGX) <span class="text-red-1">*</span></label>
                                <div class="relative">
                                    <input type="number" class="w-full h-[50px] px-4 py-3 rounded-lg border border-light-5 focus:border-purple-1 focus:ring-2 focus:ring-purple-1/20 transition-all @error('price') border-red-1 @enderror" 
                                        id="price" name="price" value="{{ old('price') }}" 
                                        step="0.01" min="0" required>
                                    @error('price')
                                        <div class="text-red-1 mt-2 text-sm">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>

                            <div class="col-lg-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="max_courses">Max Courses</label>
                                <div class="relative">
                                    <input type="number" class="w-full h-[50px] px-4 py-3 rounded-lg border border-light-5 focus:border-purple-1 focus:ring-2 focus:ring-purple-1/20 transition-all @error('max_courses') border-red-1 @enderror" 
                                        id="max_courses" name="max_courses" value="{{ old('max_courses') }}" 
                                        min="0" step="1" placeholder="Leave empty for unlimited">
                                    <div class="mt-2 text-14 lh-1 text-light-1">Leave empty for unlimited courses.</div>
                                    @error('max_courses')
                                        <div class="text-red-1 mt-2 text-sm">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>

                            <!-- Description - Full width -->
                            <div class="col-12">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="description">Description</label>
                                <div class="relative">
                                    <textarea class="w-full px-4 py-3 rounded-lg border border-light-5 focus:border-purple-1 focus:ring-2 focus:ring-purple-1/20 transition-all min-h-[120px] @error('description') border-red-1 @enderror" 
                                        id="description" name="description" rows="3" 
                                        placeholder="Enter a brief description of this tier...">{{ old('description') }}</textarea>
                                    @error('description')
                                        <div class="text-red-1 mt-2 text-sm">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>

                            <!-- Features Section with Header -->
                            <div class="col-12">
                                <div class="mb-20 border-top-light pt-20">
                                    <h3 class="text-16 lh-1 fw-500 text-dark-1 mb-10">Features <span class="text-14 lh-1 text-light-1">(bullet points shown to users)</span></h3>
                                </div>
                                
                                <div id="features-container">
                                    <!-- Initial Feature Row -->
                                    <div class="feature-row flex items-center mb-4">
                                        <div class="flex-grow flex rounded-lg border border-light-5 overflow-hidden">
                                            <div class="bg-light-3 -dark-bg-dark-2 px-4 flex items-center justify-center">
                                                <i class="icon-check text-14 text-purple-1"></i>
                                            </div>
                                            <input type="text" class="flex-grow px-4 py-3 border-0 focus:ring-0 focus:outline-none" 
                                                name="features[]" value="{{ old('features.0') }}" 
                                                placeholder="e.g., Access to all courses">
                                        </div>
                                        <button type="button" class="ml-3 p-2 rounded-lg bg-light-3 hover:bg-light-4 text-purple-1 transition-colors add-feature" title="Add Feature">
                                            <i class="icon-plus"></i>
                                        </button>
                                    </div>
                                    
                                    <!-- Dynamically added for old input, excluding the first one -->
                                    @if(is_array(old('features')) && count(old('features')) > 1)
                                        @foreach(array_slice(old('features'), 1) as $featureText)
                                        <div class="feature-row flex items-center mb-4">
                                            <div class="flex-grow flex rounded-lg border border-light-5 overflow-hidden">
                                                <div class="bg-light-3 -dark-bg-dark-2 px-4 flex items-center justify-center">
                                                    <i class="icon-check text-14 text-purple-1"></i>
                                                </div>
                                                <input type="text" class="flex-grow px-4 py-3 border-0 focus:ring-0 focus:outline-none" 
                                                    name="features[]" value="{{ $featureText }}" 
                                                    placeholder="e.g., Access to all courses">
                                            </div>
                                            <button type="button" class="ml-3 p-2 rounded-lg bg-light-3 hover:bg-light-4 text-red-1 transition-colors remove-feature" title="Remove Feature">
                                                <i class="icon-minus"></i>
                                            </button>
                                        </div>
                                        @endforeach
                                    @endif
                                </div>
                                @error('features')
                                    <div class="text-red-1 mt-2 text-sm">{{ $message }}</div>
                                @enderror
                                @error('features.*')
                                    <div class="text-red-1 mt-2 text-sm">{{ $message }}</div>
                                @enderror
                            </div>

                            <!-- Active Status Toggle -->
                            <div class="col-12 border-top-light pt-20">
                                <div class="form-switch d-flex items-center">
                                    <div class="switch">
                                        <input type="checkbox" id="is_active" name="is_active" value="1" {{ old('is_active', true) ? 'checked' : '' }}>
                                        <span class="switch__slider"></span>
                                    </div>
                                    <label class="text-16 lh-1 fw-500 text-dark-1 ml-10" for="is_active">Active Tier</label>
                                </div>
                                <div class="mt-2 text-14 lh-1 text-light-1">Inactive tiers will not be visible to users on the pricing page.</div>
                            </div>

                            <!-- Form Actions -->
                            <div class="col-12 flex justify-end items-center pt-20 border-top-light mt-20">
                                <a href="{{ route('admin.subscription-tiers.index') }}" class="button -md -outline-purple-1 text-purple-1 mr-20">
                                    Cancel
                                </a>
                                <button type="submit" class="button -md -purple-1 text-white">
                                    Create Subscription Tier
                                </button>
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

            function createFeatureRow(value = '') {
                const featureRow = document.createElement('div');
                featureRow.className = 'feature-row flex items-center mb-4';
                featureRow.innerHTML = `
                    <div class="flex-grow flex rounded-lg border border-light-5 overflow-hidden">
                        <div class="bg-light-3 -dark-bg-dark-2 px-4 flex items-center justify-center">
                            <i class="icon-check text-14 text-purple-1"></i>
                        </div>
                        <input type="text" class="flex-grow px-4 py-3 border-0 focus:ring-0 focus:outline-none" 
                            name="features[]" placeholder="e.g., Access to all courses" value="${value}">
                    </div>
                    <button type="button" class="ml-3 p-2 rounded-lg bg-light-3 hover:bg-light-4 text-red-1 transition-colors remove-feature" title="Remove Feature">
                        <i class="icon-minus"></i>
                    </button>
                `;
                return featureRow;
            }
            
            document.addEventListener('click', function(e) {
                const addButton = e.target.closest('.add-feature');
                const removeButton = e.target.closest('.remove-feature');

                if (addButton) {
                    featuresContainer.appendChild(createFeatureRow());
                }

                if (removeButton) {
                    const featureRows = featuresContainer.querySelectorAll('.feature-row');
                    if (featureRows.length > 1 || (featureRows.length === 1 && featureRows[0].querySelector('input[name="features[]"]').value !== '')) {
                         removeButton.closest('.feature-row').remove();
                    } else if (featureRows.length === 1 && featureRows[0].querySelector('input[name="features[]"]').value !== '') {
                        featureRows[0].querySelector('input[name="features[]"]').value = '';
                    } 
                }
            });

            const currentFeatureInputs = featuresContainer.querySelectorAll('input[name="features[]"]').length;
            if (currentFeatureInputs === 0) {
                 featuresContainer.appendChild(createFeatureRow('{{ old("features.0", "") }}'));
            }
        });
    </script>
    @endpush
</x-dashboard-layout>
