<style>
        /* Add any custom styles needed */
    </style>

<div id="pricingTab">
    <div class="card border-0 shadow-sm mb-4">
        <div class="card-header bg-white py-3">
            <h5 class="card-title mb-0">@lmsterm('Study Material') Pricing</h5>
        </div>
        <div class="card-body">
            <form action="{{ route('teacher.courses.pricing.update', $course) }}" method="POST">
                @csrf
                @method('PUT')
                
                <div class="row">
                    <div class="col-lg-8">
                        <div class="card -dark-bg-light-1 mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Pricing Options</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-4">
                                    <div class="form-check form-check-inline mb-3">
                                        <input class="form-check-input" type="radio" name="pricing_type" id="pricing_free" value="free" 
                                              {{ (!$course->price && !$course->subscription_required) ? 'checked' : '' }}>
                                        <label class="form-check-label" for="pricing_free">Free @lmsterm('Study Material')</label>
                                    </div>
                                    <div class="form-check form-check-inline mb-3">
                                        <input class="form-check-input" type="radio" name="pricing_type" id="pricing_paid" value="paid" 
                                              {{ ($course->price > 0) ? 'checked' : '' }}>
                                        <label class="form-check-label" for="pricing_paid">Paid @lmsterm('Study Material')</label>
                                    </div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input" type="radio" name="pricing_type" id="pricing_subscription" value="subscription" 
                                              {{ $course->subscription_required ? 'checked' : '' }}>
                                        <label class="form-check-label" for="pricing_subscription">Subscription Only</label>
                                    </div>
                                </div>

                                <!-- Paid Course Options -->
                                <div id="paidCourseOptions" class="pricing-options mt-4 pb-3 border-bottom" 
                                    style="display: {{ ($course->price > 0) ? 'block' : 'none' }};">
                                    <h6 class="mb-3">Paid @lmsterm('Study Material') Settings</h6>
                                    
                                    <div class="mb-3">
                                        <label for="price" class="form-label">@lmsterm('Study Material') Price <span class="text-danger">*</span></label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control @error('price') is-invalid @enderror" id="price" name="price" 
                                                  min="0" step="0.01" value="{{ old('price', $course->price) }}">
                                        </div>
                                        <small class="text-muted">Set the price students must pay for one-time access to this @lmsterm('study material').</small>
                                        @error('price')
                                            <div class="invalid-feedback d-block">{{ $message }}</div>
                                        @enderror
                                    </div>
                                    
                                    <div class="mb-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="also_allow_subscription" name="also_allow_subscription" 
                                                  value="1" {{ $course->price > 0 && $course->subscription_required ? 'checked' : '' }}>
                                            <label class="form-check-label" for="also_allow_subscription">
                                                Also allow access via subscription
                                            </label>
                                        </div>
                                        <small class="text-muted">If checked, students can access this @lmsterm('study material') either by direct purchase or via subscription.</small>
                                    </div>
                                </div>

                                <!-- Subscription Options -->
                                <div id="subscriptionOptions" class="pricing-options mt-4" 
                                    style="display: {{ ($course->subscription_required || ($course->price > 0 && $course->subscription_required)) ? 'block' : 'none' }};">
                                    <h6 class="mb-3">Subscription Settings</h6>
                                    
                                    <div class="mb-3">
                                        <label for="required_subscription_tier_id" class="form-label">Required Subscription Tier <span class="text-danger">*</span></label>
                                        <select class="form-select @error('required_subscription_tier_id') is-invalid @enderror" 
                                                id="required_subscription_tier_id" name="required_subscription_tier_id">
                                            <option value="">Select Subscription Tier</option>
                                            @foreach ($subscriptionTiers as $tier)
                                                <option value="{{ $tier->id }}" 
                                                        {{ old('required_subscription_tier_id', $course->required_subscription_tier_id) == $tier->id ? 'selected' : '' }}>
                                                    {{ $tier->name }} (${{ $tier->price }}/{{ $tier->billing_cycle }})
                                                </option>
                                            @endforeach
                                        </select>
                                        <small class="text-muted">Minimum subscription tier required to access this @lmsterm('study material').</small>
                                        @error('required_subscription_tier_id')
                                            <div class="invalid-feedback d-block">{{ $message }}</div>
                                        @enderror
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card -dark-bg-light-1 mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Promotional Options</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="enable_coupon" name="enable_coupon" 
                                              value="1" {{ old('enable_coupon', $course->enable_coupon) ? 'checked' : '' }}>
                                        <label class="form-check-label" for="enable_coupon">Allow Coupon Codes</label>
                                    </div>
                                    <small class="text-muted">If enabled, students can apply coupon codes to this @lmsterm('study material').</small>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="sale_price" class="form-label">Sale Price (Optional)</label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input type="number" class="form-control @error('sale_price') is-invalid @enderror" id="sale_price" name="sale_price" 
                                              min="0" step="0.01" value="{{ old('sale_price', $course->sale_price) }}">
                                    </div>
                                    <small class="text-muted">Special promotional price. Leave blank for no sale price.</small>
                                    @error('sale_price')
                                        <div class="invalid-feedback d-block">{{ $message }}</div>
                                    @enderror
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="sale_start_date" class="form-label">Sale Start Date (Optional)</label>
                                            <input type="datetime-local" class="form-control @error('sale_start_date') is-invalid @enderror" 
                                                  id="sale_start_date" name="sale_start_date" 
                                                  value="{{ old('sale_start_date', $course->sale_start_date ? $course->sale_start_date->format('Y-m-d\TH:i') : '') }}">
                                            @error('sale_start_date')
                                                <div class="invalid-feedback">{{ $message }}</div>
                                            @enderror
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="sale_end_date" class="form-label">Sale End Date (Optional)</label>
                                            <input type="datetime-local" class="form-control @error('sale_end_date') is-invalid @enderror" 
                                                  id="sale_end_date" name="sale_end_date" 
                                                  value="{{ old('sale_end_date', $course->sale_end_date ? $course->sale_end_date->format('Y-m-d\TH:i') : '') }}">
                                            @error('sale_end_date')
                                                <div class="invalid-feedback">{{ $message }}</div>
                                            @enderror
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4">
                        <div class="card -dark-bg-light-1 mb-4">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Purchase Options</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="enable_bulk_purchase" name="enable_bulk_purchase" 
                                              value="1" {{ old('enable_bulk_purchase', $course->enable_bulk_purchase) ? 'checked' : '' }}>
                                        <label class="form-check-label" for="enable_bulk_purchase">Enable Bulk Purchases</label>
                                    </div>
                                    <small class="text-muted">Allow organizations to purchase multiple licenses for this @lmsterm('study material').</small>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="enable_gift_option" name="enable_gift_option" 
                                              value="1" {{ old('enable_gift_option', $course->enable_gift_option) ? 'checked' : '' }}>
                                        <label class="form-check-label" for="enable_gift_option">Enable Gift Option</label>
                                    </div>
                                    <small class="text-muted">Allow users to purchase this @lmsterm('study material') as a gift for others.</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="text-end">
                            <button type="submit" class="button -md -blue-1 text-white">Save Pricing Options</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const pricingTypeRadios = document.querySelectorAll('input[name="pricing_type"]');
        const paidOptions = document.getElementById('paidCourseOptions');
        const subscriptionOptions = document.getElementById('subscriptionOptions');
        const alsoSubscriptionCheckbox = document.getElementById('also_allow_subscription');
        
        // Function to toggle pricing options visibility
        function updatePricingOptions() {
            const selectedValue = document.querySelector('input[name="pricing_type"]:checked').value;
            
            // Hide all options first
            paidOptions.style.display = 'none';
            subscriptionOptions.style.display = 'none';
            
            // Show relevant options based on selection
            if (selectedValue === 'paid') {
                paidOptions.style.display = 'block';
                if (alsoSubscriptionCheckbox.checked) {
                    subscriptionOptions.style.display = 'block';
                }
            } else if (selectedValue === 'subscription') {
                subscriptionOptions.style.display = 'block';
            }
        }
        
        // Initial call to set state correctly on page load
        updatePricingOptions();
        
        // Add event listeners
        pricingTypeRadios.forEach(radio => {
            radio.addEventListener('change', updatePricingOptions);
        });
        
        if (alsoSubscriptionCheckbox) {
            alsoSubscriptionCheckbox.addEventListener('change', function() {
                if (document.getElementById('pricing_paid').checked) {
                    subscriptionOptions.style.display = this.checked ? 'block' : 'none';
                }
            });
        }
    });
</script> 