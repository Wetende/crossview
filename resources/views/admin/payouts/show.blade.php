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
                <h1 class="text-30 lh-12 fw-700">Payout Details</h1>
                <div class="mt-10">Details for payout #{{ $payout->id }}</div>
            </div>
            <div class="col-auto d-flex flex-wrap">
                <a href="{{ route('admin.payouts.index') }}" class="button -md -outline-purple-1 text-purple-1 mr-10">
                    <i class="icon-arrow-left mr-10"></i>
                    Back to Payouts
                </a>
                
                @if($payout->isPending() || $payout->isProcessing())
                    <a href="{{ route('admin.payouts.edit', $payout) }}" class="button -md -purple-1 text-white">
                        <i class="icon-edit mr-10"></i>
                        Update Status
                    </a>
                @endif
            </div>
        </div>

        @if(session('success'))
            <div class="alert -success mb-30">
                <div class="alert__content">{{ session('success') }}</div>
            </div>
        @endif

        @if(session('error'))
            <div class="alert -danger mb-30">
                <div class="alert__content">{{ session('error') }}</div>
            </div>
        @endif
        
        <div class="row y-gap-30">
            <div class="col-lg-8">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Payout Information</h2>
                        <div>
                            @if($payout->isPending())
                                <span class="badge bg-orange-1 text-white">Pending</span>
                            @elseif($payout->isProcessing())
                                <span class="badge bg-blue-1 text-white">Processing</span>
                            @elseif($payout->isPaid())
                                <span class="badge bg-green-1 text-white">Paid</span>
                            @elseif($payout->isFailed())
                                <span class="badge bg-red-1 text-white">Failed</span>
                            @elseif($payout->isCancelled())
                                <span class="badge bg-light-7 -dark-bg-dark-3 text-dark-1 -dark-text-white">Cancelled</span>
                            @endif
                        </div>
                    </div>
                    <div class="py-30 px-30">
                        <div class="row y-gap-20">
                            <div class="col-md-6">
                                <div class="d-flex justify-between items-center">
                                    <div class="text-light-1">Payout Amount:</div>
                                    <div class="text-18 fw-500">{{ number_format($payout->amount, 2) }} UGX</div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="d-flex justify-between items-center">
                                    <div class="text-light-1">Status:</div>
                                    <div>
                                        @if($payout->isPending())
                                            <span class="badge bg-orange-1 text-white">Pending</span>
                                        @elseif($payout->isProcessing())
                                            <span class="badge bg-blue-1 text-white">Processing</span>
                                        @elseif($payout->isPaid())
                                            <span class="badge bg-green-1 text-white">Paid</span>
                                        @elseif($payout->isFailed())
                                            <span class="badge bg-red-1 text-white">Failed</span>
                                        @elseif($payout->isCancelled())
                                            <span class="badge bg-light-7 -dark-bg-dark-3 text-dark-1 -dark-text-white">Cancelled</span>
                                        @endif
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="d-flex justify-between items-center">
                                    <div class="text-light-1">Payout Period:</div>
                                    <div>{{ $payout->period_start->format('M d, Y') }} - {{ $payout->period_end->format('M d, Y') }}</div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="d-flex justify-between items-center">
                                    <div class="text-light-1">Created Date:</div>
                                    <div>{{ $payout->created_at->format('M d, Y') }}</div>
                                </div>
                            </div>
                            
                            @if($payout->isPaid() || $payout->isProcessing())
                                <div class="col-md-6">
                                    <div class="d-flex justify-between items-center">
                                        <div class="text-light-1">Processed Date:</div>
                                        <div>{{ $payout->processed_at ? $payout->processed_at->format('M d, Y') : 'N/A' }}</div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="d-flex justify-between items-center">
                                        <div class="text-light-1">Reference Number:</div>
                                        <div>{{ $payout->reference ?? 'N/A' }}</div>
                                    </div>
                                </div>
                            @endif
                            
                            @if($payout->isPaid() || $payout->isProcessing())
                                <div class="col-md-6">
                                    <div class="d-flex justify-between items-center">
                                        <div class="text-light-1">Processed By:</div>
                                        <div>{{ $payout->processedBy ? $payout->processedBy->name : 'N/A' }}</div>
                                    </div>
                                </div>
                            @endif
                            
                            @if($payout->isFailed() || $payout->isCancelled())
                                <div class="col-12">
                                    <div class="d-flex flex-column">
                                        <div class="text-light-1 mb-10">Reason:</div>
                                        <div class="bg-light-3 -dark-bg-dark-3 rounded-8 p-20">
                                            {{ $payout->notes ?? 'No reason provided.' }}
                                        </div>
                                    </div>
                                </div>
                            @endif
                            
                            @if(!empty($payout->payment_details_snapshot))
                                <div class="col-12 mt-20">
                                    <h3 class="text-18 fw-500 mb-15">Payment Details Used</h3>
                                    <div class="bg-light-4 -dark-bg-dark-2 rounded-8 p-20">
                                        @php $details = is_array($payout->payment_details_snapshot) ? $payout->payment_details_snapshot : json_decode($payout->payment_details_snapshot, true); @endphp
                                        
                                        <div class="mb-10">
                                            <span class="fw-500">Payment Method:</span> 
                                            {{ ucfirst(str_replace('_', ' ', $details['payment_method'] ?? 'Unknown')) }}
                                        </div>
                                        
                                        @if(isset($details['account_details']))
                                            @php $accountDetails = is_array($details['account_details']) ? $details['account_details'] : json_decode($details['account_details'], true); @endphp
                                            
                                            @if($details['payment_method'] === 'bank_transfer')
                                                <div class="mb-5">
                                                    <span class="fw-500">Bank Name:</span> 
                                                    {{ $accountDetails['bank_name'] ?? 'N/A' }}
                                                </div>
                                                <div class="mb-5">
                                                    <span class="fw-500">Account Number:</span> 
                                                    {{ $accountDetails['account_number'] ?? 'N/A' }}
                                                </div>
                                                <div>
                                                    <span class="fw-500">Account Holder:</span> 
                                                    {{ $accountDetails['account_holder_name'] ?? 'N/A' }}
                                                </div>
                                            @elseif($details['payment_method'] === 'mobile_money')
                                                <div class="mb-5">
                                                    <span class="fw-500">Provider:</span> 
                                                    {{ ucfirst($accountDetails['provider'] ?? 'N/A') }}
                                                </div>
                                                <div class="mb-5">
                                                    <span class="fw-500">Phone Number:</span> 
                                                    {{ $accountDetails['phone_number'] ?? 'N/A' }}
                                                </div>
                                                <div>
                                                    <span class="fw-500">Account Name:</span> 
                                                    {{ $accountDetails['account_name'] ?? 'N/A' }}
                                                </div>
                                            @elseif($details['payment_method'] === 'paypal')
                                                <div>
                                                    <span class="fw-500">PayPal Email:</span> 
                                                    {{ $accountDetails['paypal_email'] ?? 'N/A' }}
                                                </div>
                                            @endif
                                        @endif
                                    </div>
                                </div>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4">
                <div class="row y-gap-30">
                    <div class="col-12">
                        <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                            <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                                <h2 class="text-17 lh-1 fw-500">Teacher Information</h2>
                            </div>
                            <div class="py-30 px-30">
                                <div class="d-flex items-center">
                                    <div class="size-50 rounded-full bg-image js-lazy" data-bg="{{ asset('img/avatars/default.jpg') }}"></div>
                                    <div class="ml-15">
                                        <h5 class="text-16 fw-500 lh-14">{{ $payout->teacher->name }}</h5>
                                        <div class="text-14 lh-12 mt-5">{{ $payout->teacher->email }}</div>
                                    </div>
                                </div>
                                
                                <div class="mt-20">
                                    <a href="{{ route('admin.users.show', $payout->teacher) }}" class="button -sm -outline-purple-1 text-purple-1 w-1/1">
                                        View Teacher Profile
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-12">
                        <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                            <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                                <h2 class="text-17 lh-1 fw-500">Payout Breakdown</h2>
                            </div>
                            <div class="py-30 px-30">
                                @php
                                    // Parse the notes field to get the breakdown if available
                                    $breakdown = [];
                                    if (preg_match('/Direct purchases: ([0-9.]+), Subscriptions: ([0-9.]+)/', $payout->notes, $matches)) {
                                        $breakdown = [
                                            'direct_purchases' => floatval($matches[1]),
                                            'subscriptions' => floatval($matches[2])
                                        ];
                                    }
                                @endphp
                                
                                @if(!empty($breakdown))
                                    <div class="d-flex justify-between mb-10">
                                        <div>Direct Course Purchases</div>
                                        <div class="fw-500">{{ number_format($breakdown['direct_purchases'], 2) }} UGX</div>
                                    </div>
                                    <div class="d-flex justify-between mb-10">
                                        <div>Subscription Revenue</div>
                                        <div class="fw-500">{{ number_format($breakdown['subscriptions'], 2) }} UGX</div>
                                    </div>
                                    <div class="border-top-light pt-10 mt-10">
                                        <div class="d-flex justify-between">
                                            <div class="fw-500">Total</div>
                                            <div class="fw-500">{{ number_format($payout->amount, 2) }} UGX</div>
                                        </div>
                                    </div>
                                @else
                                    <div class="text-center py-10">
                                        <p>Detailed breakdown not available.</p>
                                    </div>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 