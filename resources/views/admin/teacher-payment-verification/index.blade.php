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
            <h1 class="text-30 lh-12 fw-700">Teacher Payment Verification</h1>
            <div class="mt-10">Verify teacher payment details for payout eligibility</div>
        </div>
    </div>

    @if(session('success'))
        <div class="alert -success mb-30">
            <div class="alert__content">{{ session('success') }}</div>
        </div>
    @endif
    
    <!-- Tabs -->
    <div class="tabs -active-purple-2 js-tabs mb-30">
        <div class="tabs__controls d-flex x-gap-30 y-gap-20 px-30 pt-30 js-tabs-controls">
            <button class="tabs__button text-light-1 js-tabs-button is-active" data-tab-target=".js-tabs-pane-1">
                Pending ({{ $pendingDetails->total() }})
            </button>
            <button class="tabs__button text-light-1 js-tabs-button" data-tab-target=".js-tabs-pane-2">
                Verified ({{ $verifiedDetails->total() }})
            </button>
            <button class="tabs__button text-light-1 js-tabs-button" data-tab-target=".js-tabs-pane-3">
                Rejected ({{ $rejectedDetails->total() }})
            </button>
        </div>
        
        <div class="tabs__content js-tabs-content">
            <!-- Pending Payment Details -->
            <div class="tabs__pane is-active js-tabs-pane-1">
                <div class="py-30 px-30">
                    <div class="row y-gap-30">
                        <div class="col-12">
                            @if($pendingDetails->count() > 0)
                                <div class="table-responsive">
                                    <table class="table w-1/1">
                                        <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                            <tr>
                                                <th class="p-10">Teacher</th>
                                                <th class="p-10">Payment Method</th>
                                                <th class="p-10">Submission Date</th>
                                                <th class="p-10 text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody class="text-14">
                                            @foreach($pendingDetails as $payment)
                                                <tr class="border-bottom-light">
                                                    <td class="p-10">
                                                        <div class="d-flex items-center">
                                                            <div class="size-40 rounded-8 d-flex justify-center items-center bg-light-7 -dark-bg-dark-3 mr-10">
                                                                @if($payment->user->profile_picture_path)
                                                                    <img src="{{ asset('storage/' . $payment->user->profile_picture_path) }}" alt="{{ $payment->user->name }}" class="size-40 object-cover rounded-8">
                                                                @else
                                                                    <div class="text-16 fw-500">{{ substr($payment->user->name, 0, 2) }}</div>
                                                                @endif
                                                            </div>
                                                            <div>
                                                                <div class="text-14 fw-500">{{ $payment->user->name }}</div>
                                                                <div class="text-light-1 mt-5">{{ $payment->user->email }}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="p-10">
                                                        <div class="badge bg-light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                                                            {{ ucfirst(str_replace('_', ' ', $payment->payment_method)) }}
                                                        </div>
                                                    </td>
                                                    <td class="p-10">{{ $payment->created_at->format('M d, Y') }}</td>
                                                    <td class="p-10 text-end">
                                                        <a href="{{ route('admin.teacher-payment-verification.show', $payment) }}" class="button -sm -purple-1 text-white">
                                                            Review
                                                        </a>
                                                    </td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="mt-20">
                                    {{ $pendingDetails->links() }}
                                </div>
                            @else
                                <div class="text-center py-40">
                                    <img src="{{ asset('img/dashboard/empty-state/no-data.svg') }}" alt="No Pending Submissions" style="max-width: 200px;" class="mb-20">
                                    <h4 class="text-18 fw-500 mb-10">No Pending Submissions</h4>
                                    <p class="text-14 mb-20">There are no payment details pending verification at this time.</p>
                                </div>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Verified Payment Details -->
            <div class="tabs__pane js-tabs-pane-2">
                <div class="py-30 px-30">
                    <div class="row y-gap-30">
                        <div class="col-12">
                            @if($verifiedDetails->count() > 0)
                                <div class="table-responsive">
                                    <table class="table w-1/1">
                                        <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                            <tr>
                                                <th class="p-10">Teacher</th>
                                                <th class="p-10">Payment Method</th>
                                                <th class="p-10">Verification Date</th>
                                                <th class="p-10 text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody class="text-14">
                                            @foreach($verifiedDetails as $payment)
                                                <tr class="border-bottom-light">
                                                    <td class="p-10">
                                                        <div class="d-flex items-center">
                                                            <div class="size-40 rounded-8 d-flex justify-center items-center bg-light-7 -dark-bg-dark-3 mr-10">
                                                                @if($payment->user->profile_picture_path)
                                                                    <img src="{{ asset('storage/' . $payment->user->profile_picture_path) }}" alt="{{ $payment->user->name }}" class="size-40 object-cover rounded-8">
                                                                @else
                                                                    <div class="text-16 fw-500">{{ substr($payment->user->name, 0, 2) }}</div>
                                                                @endif
                                                            </div>
                                                            <div>
                                                                <div class="text-14 fw-500">{{ $payment->user->name }}</div>
                                                                <div class="text-light-1 mt-5">{{ $payment->user->email }}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="p-10">
                                                        <div class="badge bg-light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                                                            {{ ucfirst(str_replace('_', ' ', $payment->payment_method)) }}
                                                        </div>
                                                    </td>
                                                    <td class="p-10">{{ $payment->updated_at->format('M d, Y') }}</td>
                                                    <td class="p-10 text-end">
                                                        <a href="{{ route('admin.teacher-payment-verification.show', $payment) }}" class="button -sm -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                                                            View
                                                        </a>
                                                    </td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="mt-20">
                                    {{ $verifiedDetails->links() }}
                                </div>
                            @else
                                <div class="text-center py-40">
                                    <img src="{{ asset('img/dashboard/empty-state/no-data.svg') }}" alt="No Verified Details" style="max-width: 200px;" class="mb-20">
                                    <h4 class="text-18 fw-500 mb-10">No Verified Payment Details</h4>
                                    <p class="text-14 mb-20">No teacher payment details have been verified yet.</p>
                                </div>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Rejected Payment Details -->
            <div class="tabs__pane js-tabs-pane-3">
                <div class="py-30 px-30">
                    <div class="row y-gap-30">
                        <div class="col-12">
                            @if($rejectedDetails->count() > 0)
                                <div class="table-responsive">
                                    <table class="table w-1/1">
                                        <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                            <tr>
                                                <th class="p-10">Teacher</th>
                                                <th class="p-10">Payment Method</th>
                                                <th class="p-10">Rejection Date</th>
                                                <th class="p-10 text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody class="text-14">
                                            @foreach($rejectedDetails as $payment)
                                                <tr class="border-bottom-light">
                                                    <td class="p-10">
                                                        <div class="d-flex items-center">
                                                            <div class="size-40 rounded-8 d-flex justify-center items-center bg-light-7 -dark-bg-dark-3 mr-10">
                                                                @if($payment->user->profile_picture_path)
                                                                    <img src="{{ asset('storage/' . $payment->user->profile_picture_path) }}" alt="{{ $payment->user->name }}" class="size-40 object-cover rounded-8">
                                                                @else
                                                                    <div class="text-16 fw-500">{{ substr($payment->user->name, 0, 2) }}</div>
                                                                @endif
                                                            </div>
                                                            <div>
                                                                <div class="text-14 fw-500">{{ $payment->user->name }}</div>
                                                                <div class="text-light-1 mt-5">{{ $payment->user->email }}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="p-10">
                                                        <div class="badge bg-light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                                                            {{ ucfirst(str_replace('_', ' ', $payment->payment_method)) }}
                                                        </div>
                                                    </td>
                                                    <td class="p-10">{{ $payment->updated_at->format('M d, Y') }}</td>
                                                    <td class="p-10 text-end">
                                                        <a href="{{ route('admin.teacher-payment-verification.show', $payment) }}" class="button -sm -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                                                            View
                                                        </a>
                                                    </td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="mt-20">
                                    {{ $rejectedDetails->links() }}
                                </div>
                            @else
                                <div class="text-center py-40">
                                    <img src="{{ asset('img/dashboard/empty-state/no-data.svg') }}" alt="No Rejected Details" style="max-width: 200px;" class="mb-20">
                                    <h4 class="text-18 fw-500 mb-10">No Rejected Payment Details</h4>
                                    <p class="text-14 mb-20">No teacher payment details have been rejected.</p>
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