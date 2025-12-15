<x-slot name="header">
    @include('layouts.partials.teacher.header')
</x-slot>

<x-dashboard-layout>
    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Payout Details</h1>
                <div class="mt-10">Details for payout #{{ $payout->id }}</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('teacher.payouts.index') }}" class="button -md -outline-purple-1 text-purple-1">
                    <i class="icon-arrow-left mr-10"></i>
                    Back to Payouts
                </a>
            </div>
        </div>

        <div class="row y-gap-30">
            <div class="col-12">
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
                            
                            <div class="col-12 mt-20">
                                <h3 class="text-18 fw-500 mb-15">Breakdown</h3>
                                <div class="bg-light-4 -dark-bg-dark-2 rounded-8 p-20">
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
    </div>
</x-dashboard-layout> 