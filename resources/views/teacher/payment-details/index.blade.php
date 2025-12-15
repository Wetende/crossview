<x-dashboard-layout title="Teacher Payment Details">
    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>
    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Payment Details</h1>
                <div class="mt-10">Manage your payment information for receiving payouts</div>
            </div>
        </div>

        @if(session('success'))
            <div class="alert -success mb-30">
                <div class="alert__content">{{ session('success') }}</div>
            </div>
        @endif
        
        <div class="row y-gap-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">
                            @if($paymentDetail)
                                Update Payment Details
                                <span class="badge {{ $paymentDetail->isPending() ? 'bg-orange-1' : ($paymentDetail->isVerified() ? 'bg-green-1' : 'bg-red-1') }} text-white ml-10">
                                    {{ ucfirst($paymentDetail->status) }}
                                </span>
                            @else
                                Add Payment Details
                            @endif
                        </h2>
                    </div>
                    <div class="py-30 px-30">
                        @if($paymentDetail && $paymentDetail->isRejected())
                            <div class="alert -danger mb-30">
                                <div class="alert__content">
                                    <p>Your payment details have been rejected. Please review admin notes (if available) and update your information.</p>
                                    @php $details = json_decode($paymentDetail->account_details, true); @endphp
                                    @if(isset($details['admin_notes']))
                                        <p class="mt-10 fw-500">Admin Notes: {{ $details['admin_notes'] }}</p>
                                    @endif
                                </div>
                            </div>
                        @endif
                        
                        <form action="{{ $paymentDetail ? route('teacher.payment-details.update', $paymentDetail) : route('teacher.payment-details.store') }}" 
                              method="POST" 
                              id="paymentDetailsForm">
                            @csrf
                            @if($paymentDetail)
                                @method('PUT')
                            @endif
                            
                            <div class="row y-gap-20">
                                <div class="col-12">
                                    <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Payment Method</label>
                                    <div class="d-flex y-gap-10 flex-wrap">
                                        <div class="radio-button mr-20">
                                            <input type="radio" name="payment_method" id="bank_transfer" value="bank_transfer" 
                                                {{ !$paymentDetail || ($paymentDetail && $paymentDetail->payment_method === 'bank_transfer') ? 'checked' : '' }}>
                                            <label for="bank_transfer">Bank Transfer</label>
                                        </div>
                                        <div class="radio-button mr-20">
                                            <input type="radio" name="payment_method" id="mobile_money" value="mobile_money" 
                                                {{ $paymentDetail && $paymentDetail->payment_method === 'mobile_money' ? 'checked' : '' }}>
                                            <label for="mobile_money">Mobile Money</label>
                                        </div>
                                        <div class="radio-button">
                                            <input type="radio" name="payment_method" id="paypal" value="paypal" 
                                                {{ $paymentDetail && $paymentDetail->payment_method === 'paypal' ? 'checked' : '' }}>
                                            <label for="paypal">PayPal</label>
                                        </div>
                                    </div>
                                    @error('payment_method')
                                        <div class="text-red-1 mt-1">{{ $message }}</div>
                                    @enderror
                                </div>
                                
                                <!-- Bank Transfer Fields -->
                                <div id="bank_transfer_fields" class="payment-fields col-12 {{ !$paymentDetail || ($paymentDetail && $paymentDetail->payment_method === 'bank_transfer') ? '' : 'd-none' }}">
                                    <div class="row y-gap-20">
                                        <div class="col-lg-6">
                                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="bank_name">Bank Name</label>
                                            <input type="text" id="bank_name" name="bank_name" class="form-control" 
                                                value="{{ $paymentDetail && $paymentDetail->payment_method === 'bank_transfer' ? $paymentDetail->getAccountDetail('bank_name') : old('bank_name') }}">
                                            @error('bank_name')
                                                <div class="text-red-1 mt-1">{{ $message }}</div>
                                            @enderror
                                        </div>
                                        <div class="col-lg-6">
                                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="bank_code">Bank/Branch Code</label>
                                            <input type="text" id="bank_code" name="bank_code" class="form-control" 
                                                value="{{ $paymentDetail && $paymentDetail->payment_method === 'bank_transfer' ? $paymentDetail->getAccountDetail('bank_code') : old('bank_code') }}">
                                            @error('bank_code')
                                                <div class="text-red-1 mt-1">{{ $message }}</div>
                                            @enderror
                                        </div>
                                        <div class="col-lg-6">
                                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="account_number">Account Number</label>
                                            <input type="text" id="account_number" name="account_number" class="form-control" 
                                                value="{{ $paymentDetail && $paymentDetail->payment_method === 'bank_transfer' ? $paymentDetail->getAccountDetail('account_number') : old('account_number') }}">
                                            @error('account_number')
                                                <div class="text-red-1 mt-1">{{ $message }}</div>
                                            @enderror
                                        </div>
                                        <div class="col-lg-6">
                                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="account_holder_name">Account Holder Name</label>
                                            <input type="text" id="account_holder_name" name="account_holder_name" class="form-control" 
                                                value="{{ $paymentDetail && $paymentDetail->payment_method === 'bank_transfer' ? $paymentDetail->getAccountDetail('account_holder_name') : old('account_holder_name') }}">
                                            <div class="text-14 mt-5">Should match your profile name</div>
                                            @error('account_holder_name')
                                                <div class="text-red-1 mt-1">{{ $message }}</div>
                                            @enderror
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Mobile Money Fields -->
                                <div id="mobile_money_fields" class="payment-fields col-12 {{ $paymentDetail && $paymentDetail->payment_method === 'mobile_money' ? '' : 'd-none' }}">
                                    <div class="row y-gap-20">
                                        <div class="col-lg-6">
                                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="provider">Provider</label>
                                            <select id="provider" name="provider" class="form-select">
                                                <option value="">Select Provider</option>
                                                <option value="mtn" {{ $paymentDetail && $paymentDetail->payment_method === 'mobile_money' && $paymentDetail->getAccountDetail('provider') === 'mtn' ? 'selected' : '' }}>MTN Mobile Money</option>
                                                <option value="airtel" {{ $paymentDetail && $paymentDetail->payment_method === 'mobile_money' && $paymentDetail->getAccountDetail('provider') === 'airtel' ? 'selected' : '' }}>Airtel Money</option>
                                            </select>
                                            @error('provider')
                                                <div class="text-red-1 mt-1">{{ $message }}</div>
                                            @enderror
                                        </div>
                                        <div class="col-lg-6">
                                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="phone_number">Phone Number</label>
                                            <input type="text" id="phone_number" name="phone_number" class="form-control" placeholder="+256XXXXXXXXX" 
                                                value="{{ $paymentDetail && $paymentDetail->payment_method === 'mobile_money' ? $paymentDetail->getAccountDetail('phone_number') : old('phone_number') }}">
                                            <div class="text-14 mt-5">Format: +256XXXXXXXXX</div>
                                            @error('phone_number')
                                                <div class="text-red-1 mt-1">{{ $message }}</div>
                                            @enderror
                                        </div>
                                        <div class="col-lg-6">
                                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="account_name">Account Name</label>
                                            <input type="text" id="account_name" name="account_name" class="form-control" 
                                                value="{{ $paymentDetail && $paymentDetail->payment_method === 'mobile_money' ? $paymentDetail->getAccountDetail('account_name') : old('account_name') }}">
                                            <div class="text-14 mt-5">Should match your profile name</div>
                                            @error('account_name')
                                                <div class="text-red-1 mt-1">{{ $message }}</div>
                                            @enderror
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- PayPal Fields -->
                                <div id="paypal_fields" class="payment-fields col-12 {{ $paymentDetail && $paymentDetail->payment_method === 'paypal' ? '' : 'd-none' }}">
                                    <div class="row y-gap-20">
                                        <div class="col-lg-6">
                                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="paypal_email">PayPal Email</label>
                                            <input type="email" id="paypal_email" name="paypal_email" class="form-control" 
                                                value="{{ $paymentDetail && $paymentDetail->payment_method === 'paypal' ? $paymentDetail->getAccountDetail('paypal_email') : old('paypal_email') }}">
                                            @error('paypal_email')
                                                <div class="text-red-1 mt-1">{{ $message }}</div>
                                            @enderror
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-12 border-top-light pt-20">
                                    <button type="submit" class="button -md -purple-1 text-white">
                                        {{ $paymentDetail ? 'Update Payment Details' : 'Save Payment Details' }}
                                    </button>
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
            const paymentMethodRadios = document.querySelectorAll('input[name="payment_method"]');
            const paymentFields = document.querySelectorAll('.payment-fields');
            
            paymentMethodRadios.forEach(radio => {
                radio.addEventListener('change', function() {
                    // Hide all payment fields
                    paymentFields.forEach(field => {
                        field.classList.add('d-none');
                    });
                    
                    // Show only the selected payment fields
                    const selected = this.value;
                    document.getElementById(`${selected}_fields`).classList.remove('d-none');
                });
            });
        });
    </script>
    @endpush
</x-dashboard-layout> 