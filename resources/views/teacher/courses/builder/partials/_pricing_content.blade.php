<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Pricing Form</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<script src="https://cdn.ckeditor.com/4.16.2/standard/ckeditor.js"></script>

<div class="fixed inset-0 flex items-center justify-center p-4 bg-gray-100 bg-opacity-50">
    <div class="relative max-w-lg w-full bg-white rounded-lg shadow-lg">
        <!-- Close button (optional) -->
        <button type="button" class="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none"
                onclick="window.location.href='{{ route('teacher.courses.builder', $course) }}'">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Course Pricing</h3>
            <p class="text-sm text-gray-500 mt-1">Configure how students can access your course</p>
        </div>

        <!-- Pricing Form -->
        <form action="{{ route('teacher.courses.pricing.update', $course) }}" method="POST" class="pricing-form">
            @csrf
            @method('PUT')

            <div class="px-6 py-4 space-y-6 max-h-96 overflow-y-auto">
                
                <!-- Success/Error Messages -->
                @if(session('success'))
                    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                        <span class="block sm:inline">{{ session('success') }}</span>
                    </div>
                @endif

                @if(session('error'))
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span class="block sm:inline">{{ session('error') }}</span>
                    </div>
                @endif

                <!-- Pricing Type Selection -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-3">
                        Pricing Type <span class="text-red-500">*</span>
                    </label>
                    <div class="space-y-3">
                        <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="pricing_type" value="free" 
                                   class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                   {{ old('pricing_type', $course->pricing_type ?? 'free') === 'free' ? 'checked' : '' }}
                                   onchange="handlePricingTypeChange()">
                            <div class="ml-3">
                                <div class="text-sm font-medium text-gray-900">Free Course</div>
                                <div class="text-xs text-gray-500">Anyone can access this course without payment</div>
                            </div>
                        </label>

                        <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="pricing_type" value="purchase" 
                                   class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                   {{ old('pricing_type', $course->pricing_type) === 'purchase' ? 'checked' : '' }}
                                   onchange="handlePricingTypeChange()">
                            <div class="ml-3">
                                <div class="text-sm font-medium text-gray-900">One-time Purchase</div>
                                <div class="text-xs text-gray-500">Students pay once to access forever</div>
                            </div>
                        </label>

                        <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="pricing_type" value="subscription" 
                                   class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                   {{ old('pricing_type', $course->pricing_type) === 'subscription' ? 'checked' : '' }}
                                   onchange="handlePricingTypeChange()">
                            <div class="ml-3">
                                <div class="text-sm font-medium text-gray-900">Subscription Only</div>
                                <div class="text-xs text-gray-500">Access via subscription tier membership</div>
                            </div>
                        </label>

                        <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="pricing_type" value="both" 
                                   class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                   {{ old('pricing_type', $course->pricing_type) === 'both' ? 'checked' : '' }}
                                   onchange="handlePricingTypeChange()">
                            <div class="ml-3">
                                <div class="text-sm font-medium text-gray-900">Purchase OR Subscription</div>
                                <div class="text-xs text-gray-500">Students can either buy or access via subscription</div>
                            </div>
                        </label>
                    </div>
                    @error('pricing_type')
                        <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Purchase Price Settings -->
                <div id="purchaseSettings" class="mb-6" style="display: none;">
                    <h4 class="text-md font-medium text-gray-900 mb-4">Purchase Settings</h4>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="price" class="block text-sm font-medium text-gray-700 mb-2">
                                Course Price <span class="text-red-500">*</span>
                            </label>
                            <div class="relative">
                                <span class="absolute left-3 top-2 text-gray-500">UGX</span>
                                <input type="number" name="price" id="price" min="0" step="1000"
                                       value="{{ old('price', $course->price) }}" 
                                       placeholder="50000"
                                       class="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            </div>
                            @error('price')
                                <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label for="sale_price" class="block text-sm font-medium text-gray-700 mb-2">
                                Sale Price (Optional)
                            </label>
                            <div class="relative">
                                <span class="absolute left-3 top-2 text-gray-500">UGX</span>
                                <input type="number" name="sale_price" id="sale_price" min="0" step="1000"
                                       value="{{ old('sale_price', $course->sale_price) }}" 
                                       placeholder="40000"
                                       class="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            </div>
                            @error('sale_price')
                                <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                            @enderror
                        </div>
                    </div>

                    <!-- Sale Period -->
                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label for="sale_start_date" class="block text-sm font-medium text-gray-700 mb-2">
                                Sale Start Date
                            </label>
                            <input type="date" name="sale_start_date" id="sale_start_date"
                                   value="{{ old('sale_start_date', $course->sale_start_date ? $course->sale_start_date->format('Y-m-d') : '') }}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            @error('sale_start_date')
                                <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label for="sale_end_date" class="block text-sm font-medium text-gray-700 mb-2">
                                Sale End Date
                            </label>
                            <input type="date" name="sale_end_date" id="sale_end_date"
                                   value="{{ old('sale_end_date', $course->sale_end_date ? $course->sale_end_date->format('Y-m-d') : '') }}"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            @error('sale_end_date')
                                <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                            @enderror
                        </div>
                    </div>
                </div>

                <!-- Subscription Settings -->
                <div id="subscriptionSettings" class="mb-6" style="display: none;">
                    <h4 class="text-md font-medium text-gray-900 mb-4">Subscription Settings</h4>
                    
                    <div>
                        <label for="required_subscription_tier_id" class="block text-sm font-medium text-gray-700 mb-2">
                            Required Subscription Tier <span class="text-red-500">*</span>
                        </label>
                        <select name="required_subscription_tier_id" id="required_subscription_tier_id"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">Select subscription tier</option>
                            @foreach($subscriptionTiers ?? [] as $tier)
                                <option value="{{ $tier->id }}" 
                                        {{ old('required_subscription_tier_id', $course->required_subscription_tier_id) == $tier->id ? 'selected' : '' }}>
                                    {{ $tier->name }} 
                                    @if($tier->price > 0)
                                        (UGX {{ number_format($tier->price) }}/{{ $tier->billing_interval }})
                                    @else
                                        (Free)
                                    @endif
                                </option>
                            @endforeach
                        </select>
                        <p class="text-xs text-gray-500 mt-1">
                            Students with this subscription tier or higher can access the course
                        </p>
                        @error('required_subscription_tier_id')
                            <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                        @enderror
                    </div>

                <!-- Additional Options -->
                <div class="mb-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Additional Options</h3>
                    
                    <div class="space-y-4">
                        <label class="flex items-center">
                            <input type="checkbox" name="enable_coupon" value="1" 
                                   class="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                                   {{ old('enable_coupon', $course->enable_coupon ?? false) ? 'checked' : '' }}>
                            <span class="ml-3 text-sm text-gray-600">Enable coupon codes</span>
                        </label>

                        <label class="flex items-center">
                            <input type="checkbox" name="enable_bulk_purchase" value="1" 
                                   class="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                                   {{ old('enable_bulk_purchase', $course->enable_bulk_purchase ?? false) ? 'checked' : '' }}>
                            <span class="ml-3 text-sm text-gray-600">Enable bulk purchase</span>
                        </label>

                        <label class="flex items-center">
                            <input type="checkbox" name="enable_gift_option" value="1" 
                                   class="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                                   {{ old('enable_gift_option', $course->enable_gift_option ?? false) ? 'checked' : '' }}>
                            <span class="ml-3 text-sm text-gray-600">Enable gift purchase</span>
                        </label>
                    </div>
                </div>

                <div class="mb-4">
                    <label for="course_points" class="block text-sm font-medium text-gray-700 mb-2">
                        Course Points (Optional)
                    </label>
                    <input type="number" name="course_points" id="course_points" min="0"
                           value="{{ old('course_points', $course->course_points) }}" 
                           placeholder="100"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Points awarded to students upon course completion</p>
                    @error('course_points')
                        <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <div class="mb-4">
                    <label for="price_info" class="block text-sm font-medium text-gray-700 mb-2">
                        Pricing Information (Optional)
                    </label>
                    <textarea name="price_info" id="price_info" rows="3" 
                              placeholder="Additional information about course pricing, payment terms, etc."
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">{{ old('price_info', $course->price_info) }}</textarea>
                    <p class="text-xs text-gray-500 mt-1">This information will be displayed to students on the course page</p>
                    @error('price_info')
                        <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                    @enderror
                </div>

                <!-- Pricing Preview -->
                <div id="pricingPreview" class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 class="text-sm font-medium text-gray-900 mb-2">Pricing Preview</h4>
                    <div id="previewContent" class="text-sm text-gray-600">
                        Select a pricing type to see the preview
                    </div>
                </div>
            </div>

            <!-- Form Actions -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <button type="button" 
                        onclick="window.location.href='{{ route('teacher.courses.builder', $course) }}'"
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Cancel
                </button>
                <div class="flex space-x-3">
                    <button type="button" id="saveDraftBtn"
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Save as Draft
                    </button>
                    <button type="submit" 
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Save Pricing
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialize pricing type display
    handlePricingTypeChange();
    
    // Initialize pricing preview
    updatePricingPreview();
    
    // Add event listeners for real-time preview updates
    const form = document.querySelector('.pricing-form');
    if (form) {
        form.addEventListener('input', updatePricingPreview);
        form.addEventListener('change', updatePricingPreview);
    }
    
    // Save as draft functionality
    document.getElementById('saveDraftBtn').addEventListener('click', function() {
        const form = document.querySelector('.pricing-form');
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'save_as_draft';
        hiddenInput.value = '1';
        form.appendChild(hiddenInput);
        form.submit();
    });
});

function handlePricingTypeChange() {
    const pricingType = document.querySelector('input[name="pricing_type"]:checked');
    const purchaseSettings = document.getElementById('purchaseSettings');
    const subscriptionSettings = document.getElementById('subscriptionSettings');
    const priceInput = document.getElementById('price');
    const subscriptionSelect = document.getElementById('required_subscription_tier_id');
    
    if (!pricingType) return;
    
    // Hide all sections first
    purchaseSettings.style.display = 'none';
    subscriptionSettings.style.display = 'none';
    
    // Remove required attributes
    priceInput.removeAttribute('required');
    subscriptionSelect.removeAttribute('required');
    
    switch (pricingType.value) {
        case 'free':
            // No additional settings needed
            break;
            
        case 'purchase':
            purchaseSettings.style.display = 'block';
            priceInput.setAttribute('required', 'required');
            break;
            
        case 'subscription':
            subscriptionSettings.style.display = 'block';
            subscriptionSelect.setAttribute('required', 'required');
            break;
            
        case 'both':
            purchaseSettings.style.display = 'block';
            subscriptionSettings.style.display = 'block';
            priceInput.setAttribute('required', 'required');
            subscriptionSelect.setAttribute('required', 'required');
            break;
    }
    
    updatePricingPreview();
}

function updatePricingPreview() {
    const pricingType = document.querySelector('input[name="pricing_type"]:checked');
    const price = document.getElementById('price').value;
    const salePrice = document.getElementById('sale_price').value;
    const subscriptionTier = document.getElementById('required_subscription_tier_id');
    const previewContent = document.getElementById('previewContent');
    
    if (!pricingType) {
        previewContent.innerHTML = 'Select a pricing type to see the preview';
        return;
    }
    
    let preview = '';
    
    switch (pricingType.value) {
        case 'free':
            preview = '<span class="text-green-600 font-medium">FREE COURSE</span><br>Students can access this course without any payment.';
            break;
            
        case 'purchase':
            if (price) {
                const displayPrice = salePrice && parseFloat(salePrice) < parseFloat(price) ? salePrice : price;
                preview = `<span class="text-blue-600 font-medium">UGX ${parseInt(displayPrice).toLocaleString()}</span>`;
                
                if (salePrice && parseFloat(salePrice) < parseFloat(price)) {
                    preview += ` <span class="line-through text-gray-500">UGX ${parseInt(price).toLocaleString()}</span>`;
                }
                
                preview += '<br>One-time purchase gives lifetime access.';
            } else {
                preview = 'Enter a price to see the preview';
            }
            break;
            
        case 'subscription':
            if (subscriptionTier.value) {
                const selectedOption = subscriptionTier.options[subscriptionTier.selectedIndex];
                preview = `<span class="text-purple-600 font-medium">SUBSCRIPTION REQUIRED</span><br>Requires: ${selectedOption.text}`;
            } else {
                preview = 'Select a subscription tier to see the preview';
            }
            break;
            
        case 'both':
            let bothPreview = '';
            
            if (price) {
                const displayPrice = salePrice && parseFloat(salePrice) < parseFloat(price) ? salePrice : price;
                bothPreview += `<span class="text-blue-600 font-medium">UGX ${parseInt(displayPrice).toLocaleString()}</span>`;
                
                if (salePrice && parseFloat(salePrice) < parseFloat(price)) {
                    bothPreview += ` <span class="line-through text-gray-500">UGX ${parseInt(price).toLocaleString()}</span>`;
                }
                
                bothPreview += ' (One-time purchase)';
            }
            
            if (subscriptionTier.value) {
                const selectedOption = subscriptionTier.options[subscriptionTier.selectedIndex];
                if (bothPreview) bothPreview += '<br>OR<br>';
                bothPreview += `<span class="text-purple-600 font-medium">${selectedOption.text}</span>`;
            }
            
            if (bothPreview) {
                preview = bothPreview + '<br><small class="text-gray-500">Students can choose either option</small>';
            } else {
                preview = 'Configure both price and subscription tier to see the preview';
            }
            break;
    }
    
    previewContent.innerHTML = preview;
}

// Form validation
document.querySelector('.pricing-form').addEventListener('submit', function(e) {
    const pricingType = document.querySelector('input[name="pricing_type"]:checked');
    
    if (!pricingType) {
        e.preventDefault();
        alert('Please select a pricing type');
        return;
    }
    
    const price = document.getElementById('price').value;
    const subscriptionTier = document.getElementById('required_subscription_tier_id').value;
    
    if ((pricingType.value === 'purchase' || pricingType.value === 'both') && (!price || parseFloat(price) <= 0)) {
        e.preventDefault();
        alert('Please enter a valid price for purchase options');
        return;
    }
    
    if ((pricingType.value === 'subscription' || pricingType.value === 'both') && !subscriptionTier) {
        e.preventDefault();
        alert('Please select a subscription tier for subscription options');
        return;
    }
});
</script>
</body>
</html>