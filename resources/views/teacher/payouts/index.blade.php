<x-dashboard-layout title="Teacher Earnings & Payouts">
    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>
    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Earnings & Payouts</h1>
                <div class="mt-10">View your earnings and payout history</div>
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
        
        <!-- Pending Payouts -->
        <div class="row y-gap-30 mb-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Pending Payouts</h2>
                    </div>
                    <div class="py-30 px-30">
                        @if($pendingPayouts->count() > 0)
                            <div class="overflow-x-auto">
                                <table class="table w-1/1">
                                    <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                        <tr>
                                            <th class="p-10">Period</th>
                                            <th class="p-10 text-right">Amount</th>
                                            <th class="p-10">Status</th>
                                            <th class="p-10">Created</th>
                                            <th class="p-10 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="text-14">
                                        @foreach($pendingPayouts as $payout)
                                            <tr class="border-bottom-light">
                                                <td class="p-10">
                                                    {{ $payout->period_start->format('M d, Y') }} - {{ $payout->period_end->format('M d, Y') }}
                                                </td>
                                                <td class="p-10 text-right fw-500">
                                                    {{ number_format($payout->amount, 2) }} UGX
                                                </td>
                                                <td class="p-10">
                                                    @if($payout->isPending())
                                                        <span class="badge bg-orange-1 text-white">Pending</span>
                                                    @elseif($payout->isProcessing())
                                                        <span class="badge bg-blue-1 text-white">Processing</span>
                                                    @endif
                                                </td>
                                                <td class="p-10">
                                                    {{ $payout->created_at->format('M d, Y') }}
                                                </td>
                                                <td class="p-10 text-center">
                                                    <a href="{{ route('teacher.payouts.show', $payout) }}" class="text-purple-1">
                                                        View Details
                                                    </a>
                                                </td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                        @else
                            <div class="text-center py-40">
                                <div class="icon-empty-state mb-20">
                                    <i class="icon-wallet text-60 text-light-1"></i>
                                </div>
                                <h4 class="text-18 fw-500 mb-10">No Pending Payouts</h4>
                                <p class="text-14">You don't have any pending payouts at the moment.</p>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Completed Payouts -->
        <div class="row y-gap-30 mb-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Completed Payouts</h2>
                    </div>
                    <div class="py-30 px-30">
                        @if($completedPayouts->count() > 0)
                            <div class="overflow-x-auto">
                                <table class="table w-1/1">
                                    <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                        <tr>
                                            <th class="p-10">Period</th>
                                            <th class="p-10 text-right">Amount</th>
                                            <th class="p-10">Reference</th>
                                            <th class="p-10">Paid Date</th>
                                            <th class="p-10 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="text-14">
                                        @foreach($completedPayouts as $payout)
                                            <tr class="border-bottom-light">
                                                <td class="p-10">
                                                    {{ $payout->period_start->format('M d, Y') }} - {{ $payout->period_end->format('M d, Y') }}
                                                </td>
                                                <td class="p-10 text-right fw-500">
                                                    {{ number_format($payout->amount, 2) }} UGX
                                                </td>
                                                <td class="p-10">
                                                    {{ $payout->reference ?? 'N/A' }}
                                                </td>
                                                <td class="p-10">
                                                    {{ $payout->processed_at ? $payout->processed_at->format('M d, Y') : 'N/A' }}
                                                </td>
                                                <td class="p-10 text-center">
                                                    <a href="{{ route('teacher.payouts.show', $payout) }}" class="text-purple-1">
                                                        View Details
                                                    </a>
                                                </td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="d-flex justify-center mt-30">
                                {{ $completedPayouts->links() }}
                            </div>
                        @else
                            <div class="text-center py-40">
                                <div class="icon-empty-state mb-20">
                                    <i class="icon-receipt text-60 text-light-1"></i>
                                </div>
                                <h4 class="text-18 fw-500 mb-10">No Completed Payouts</h4>
                                <p class="text-14">You don't have any completed payouts in your history yet.</p>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Failed/Cancelled Payouts (if any) -->
        @if($failedPayouts->count() > 0)
            <div class="row y-gap-30">
                <div class="col-12">
                    <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                        <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                            <h2 class="text-17 lh-1 fw-500">Failed/Cancelled Payouts</h2>
                        </div>
                        <div class="py-30 px-30">
                            <div class="overflow-x-auto">
                                <table class="table w-1/1">
                                    <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                        <tr>
                                            <th class="p-10">Period</th>
                                            <th class="p-10 text-right">Amount</th>
                                            <th class="p-10">Status</th>
                                            <th class="p-10">Notes</th>
                                            <th class="p-10 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="text-14">
                                        @foreach($failedPayouts as $payout)
                                            <tr class="border-bottom-light">
                                                <td class="p-10">
                                                    {{ $payout->period_start->format('M d, Y') }} - {{ $payout->period_end->format('M d, Y') }}
                                                </td>
                                                <td class="p-10 text-right fw-500">
                                                    {{ number_format($payout->amount, 2) }} UGX
                                                </td>
                                                <td class="p-10">
                                                    @if($payout->isFailed())
                                                        <span class="badge bg-red-1 text-white">Failed</span>
                                                    @elseif($payout->isCancelled())
                                                        <span class="badge bg-light-7 -dark-bg-dark-3 text-dark-1 -dark-text-white">Cancelled</span>
                                                    @endif
                                                </td>
                                                <td class="p-10">
                                                    {{ \Illuminate\Support\Str::limit($payout->notes, 50) }}
                                                </td>
                                                <td class="p-10 text-center">
                                                    <a href="{{ route('teacher.payouts.show', $payout) }}" class="text-purple-1">
                                                        View Details
                                                    </a>
                                                </td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="d-flex justify-center mt-30">
                                {{ $failedPayouts->links() }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        @endif
    </div>
</x-dashboard-layout> 