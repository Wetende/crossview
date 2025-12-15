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
            <h1 class="text-30 lh-12 fw-700">Payment Details Review</h1>
            <div class="mt-10">Review and verify teacher payment details</div>
        </div>
        <div class="col-auto">
            <a href="{{ route('admin.teacher-payment-verification.index') }}" class="button -icon -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                <i class="icon-arrow-left mr-15"></i>
                Back to List
            </a>
        </div>
    </div>

    <div class="row y-gap-30">
        <!-- Teacher Information Card -->
        <div class="col-lg-4 col-md-6">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                    <h2 class="text-17 lh-1 fw-500">Teacher Information</h2>
                </div>
                <div class="py-30 px-30">
                    <div class="d-flex items-center justify-center mb-20">
                        <div class="size-80 rounded-full d-flex justify-center items-center bg-light-7 -dark-bg-dark-3">
                            @if($paymentDetail->user->profile_picture_path)
                                <img src="{{ asset('storage/' . $paymentDetail->user->profile_picture_path) }}" alt="{{ $paymentDetail->user->name }}" class="size-80 object-cover rounded-full">
                            @else
                                <div class="text-26 fw-600">{{ substr($paymentDetail->user->name, 0, 2) }}</div>
                            @endif
                        </div>
                    </div>
                    
                    <div class="text-center mb-30">
                        <h3 class="text-18 fw-500">{{ $paymentDetail->user->name }}</h3>
                        <div class="text-14 text-light-1 mt-5">{{ $paymentDetail->user->email }}</div>
                    </div>
                    
                    <div class="row y-gap-20">
                        <div class="col-12">
                            <div class="d-flex items-center justify-between">
                                <div class="text-14 text-light-1">Payment Method:</div>
                                <div class="text-14 fw-500">{{ ucfirst(str_replace('_', ' ', $paymentDetail->payment_method)) }}</div>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="d-flex items-center justify-between">
                                <div class="text-14 text-light-1">Submission Date:</div>
                                <div class="text-14 fw-500">{{ $paymentDetail->created_at->format('M d, Y') }}</div>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="d-flex items-center justify-between">
                                <div class="text-14 text-light-1">Status:</div>
                                <div>
                                    <span class="badge {{ $paymentDetail->isPending() ? 'bg-orange-1' : ($paymentDetail->isVerified() ? 'bg-green-1' : 'bg-red-1') }} text-white">
                                        {{ ucfirst($paymentDetail->status) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Account Details Card -->
        <div class="col-lg-8 col-md-6">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                    <h2 class="text-17 lh-1 fw-500">Payment Account Details</h2>
                </div>
                <div class="py-30 px-30">
                    @php $details = json_decode($paymentDetail->account_details, true) ?: []; @endphp
                    
                    @if($paymentDetail->payment_method === 'bank_transfer')
                        <div class="row y-gap-20">
                            <div class="col-lg-6">
                                <div class="py-30 px-30 rounded-8 bg-light-6 -dark-bg-dark-2 h-100">
                                    <h4 class="text-16 fw-500 mb-15">Bank Information</h4>
                                    <div class="mt-15">
                                        <div class="text-14 text-light-1">Bank Name:</div>
                                        <div class="text-16 fw-500 mt-5">{{ $details['bank_name'] ?? 'N/A' }}</div>
                                    </div>
                                    <div class="mt-15">
                                        <div class="text-14 text-light-1">Bank/Branch Code:</div>
                                        <div class="text-16 fw-500 mt-5">{{ $details['bank_code'] ?? 'N/A' }}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="py-30 px-30 rounded-8 bg-light-6 -dark-bg-dark-2 h-100">
                                    <h4 class="text-16 fw-500 mb-15">Account Information</h4>
                                    <div class="mt-15">
                                        <div class="text-14 text-light-1">Account Number:</div>
                                        <div class="text-16 fw-500 mt-5">{{ $details['account_number'] ?? 'N/A' }}</div>
                                    </div>
                                    <div class="mt-15">
                                        <div class="text-14 text-light-1">Account Holder Name:</div>
                                        <div class="text-16 fw-500 mt-5">
                                            {{ $details['account_holder_name'] ?? 'N/A' }}
                                            @if(isset($details['warning']))
                                                <span class="badge bg-orange-1 text-white ml-10">Warning</span>
                                            @endif
                                        </div>
                                    </div>
                                    @if(isset($details['warning']))
                                        <div class="mt-15 alert -warning py-10">
                                            <div class="alert__content text-14">{{ $details['warning'] }}</div>
                                        </div>
                                    @endif
                                </div>
                            </div>
                        </div>
                    @elseif($paymentDetail->payment_method === 'mobile_money')
                        <div class="row y-gap-20">
                            <div class="col-lg-6">
                                <div class="py-30 px-30 rounded-8 bg-light-6 -dark-bg-dark-2 h-100">
                                    <h4 class="text-16 fw-500 mb-15">Mobile Money Information</h4>
                                    <div class="mt-15">
                                        <div class="text-14 text-light-1">Provider:</div>
                                        <div class="text-16 fw-500 mt-5">{{ ucfirst($details['provider'] ?? 'N/A') }}</div>
                                    </div>
                                    <div class="mt-15">
                                        <div class="text-14 text-light-1">Phone Number:</div>
                                        <div class="text-16 fw-500 mt-5">{{ $details['phone_number'] ?? 'N/A' }}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="py-30 px-30 rounded-8 bg-light-6 -dark-bg-dark-2 h-100">
                                    <h4 class="text-16 fw-500 mb-15">Account Information</h4>
                                    <div class="mt-15">
                                        <div class="text-14 text-light-1">Account Name:</div>
                                        <div class="text-16 fw-500 mt-5">
                                            {{ $details['account_name'] ?? 'N/A' }}
                                            @if(isset($details['warning']))
                                                <span class="badge bg-orange-1 text-white ml-10">Warning</span>
                                            @endif
                                        </div>
                                    </div>
                                    @if(isset($details['warning']))
                                        <div class="mt-15 alert -warning py-10">
                                            <div class="alert__content text-14">{{ $details['warning'] }}</div>
                                        </div>
                                    @endif
                                </div>
                            </div>
                        </div>
                    @elseif($paymentDetail->payment_method === 'paypal')
                        <div class="row y-gap-20">
                            <div class="col-lg-6">
                                <div class="py-30 px-30 rounded-8 bg-light-6 -dark-bg-dark-2 h-100">
                                    <h4 class="text-16 fw-500 mb-15">PayPal Information</h4>
                                    <div class="mt-15">
                                        <div class="text-14 text-light-1">PayPal Email:</div>
                                        <div class="text-16 fw-500 mt-5">{{ $details['paypal_email'] ?? 'N/A' }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    @endif
                    
                    @if($paymentDetail->isPending())
                        <!-- Verification Form -->
                        <div class="mt-30 pt-30 border-top-light">
                            <h3 class="text-16 fw-500 mb-15">Verification Action</h3>
                            
                            <form action="{{ route('admin.teacher-payment-verification.status.update', $paymentDetail) }}" method="POST">
                                @csrf
                                @method('PUT')
                                
                                <div class="row y-gap-20">
                                    <div class="col-12">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Verification Decision</label>
                                        <div class="d-flex y-gap-10 flex-wrap">
                                            <div class="radio-button mr-30">
                                                <input type="radio" name="status" id="verified" value="verified" checked>
                                                <label for="verified">Verify Payment Details</label>
                                            </div>
                                            <div class="radio-button">
                                                <input type="radio" name="status" id="rejected" value="rejected">
                                                <label for="rejected">Reject Payment Details</label>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="col-12">
                                        <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="admin_notes">Notes <span class="text-light-1">(Optional)</span></label>
                                        <textarea id="admin_notes" name="admin_notes" class="form-control" rows="4" placeholder="Add notes, especially if rejecting the payment details"></textarea>
                                    </div>
                                    
                                    <div class="col-12 mt-20">
                                        <button type="submit" class="button -md -dark-1 text-white">Submit Decision</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    @elseif(!$paymentDetail->isPending() && isset($details['admin_notes']))
                        <!-- Admin Notes -->
                        <div class="mt-30 pt-30 border-top-light">
                            <h3 class="text-16 fw-500 mb-15">Admin Notes</h3>
                            <div class="py-20 px-30 bg-light-4 -dark-bg-dark-2 rounded-8">
                                <p class="text-14">{{ $details['admin_notes'] }}</p>
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
</x-dashboard-layout> 