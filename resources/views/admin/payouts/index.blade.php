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
                <h1 class="text-30 lh-12 fw-700">Teacher Payouts</h1>
                <div class="mt-10">Manage payouts to teachers</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.payouts.create') }}" class="button -md -purple-1 text-white">
                    <i class="icon-plus mr-10"></i>
                    Generate New Payouts
                </a>
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
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="tabs -active-purple-2 js-tabs">
                        <div class="tabs__controls d-flex x-gap-30 y-gap-20 px-30 pt-30 js-tabs-controls">
                            <button class="tabs__button text-light-1 js-tabs-button is-active" data-tab-target=".-tab-item-1" type="button">
                                Pending
                                @if($pendingPayouts->total() > 0)
                                    <span class="badge bg-orange-1 text-white ml-5">{{ $pendingPayouts->total() }}</span>
                                @endif
                            </button>
                            <button class="tabs__button text-light-1 js-tabs-button" data-tab-target=".-tab-item-2" type="button">
                                Processing
                                @if($processingPayouts->total() > 0)
                                    <span class="badge bg-blue-1 text-white ml-5">{{ $processingPayouts->total() }}</span>
                                @endif
                            </button>
                            <button class="tabs__button text-light-1 js-tabs-button" data-tab-target=".-tab-item-3" type="button">
                                Completed
                                @if($completedPayouts->total() > 0)
                                    <span class="badge bg-green-1 text-white ml-5">{{ $completedPayouts->total() }}</span>
                                @endif
                            </button>
                            <button class="tabs__button text-light-1 js-tabs-button" data-tab-target=".-tab-item-4" type="button">
                                Failed/Cancelled
                                @if($failedPayouts->total() > 0)
                                    <span class="badge bg-red-1 text-white ml-5">{{ $failedPayouts->total() }}</span>
                                @endif
                            </button>
                        </div>
                        
                        <div class="tabs__content py-30 px-30 js-tabs-content">
                            <!-- Pending Payouts Tab -->
                            <div class="tabs__pane -tab-item-1 is-active">
                                @if($pendingPayouts->count() > 0)
                                    <div class="overflow-x-auto">
                                        <table class="table w-1/1">
                                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                                <tr>
                                                    <th class="p-10">ID</th>
                                                    <th class="p-10">Teacher</th>
                                                    <th class="p-10">Period</th>
                                                    <th class="p-10 text-right">Amount</th>
                                                    <th class="p-10">Created</th>
                                                    <th class="p-10 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody class="text-14">
                                                @foreach($pendingPayouts as $payout)
                                                    <tr class="border-bottom-light">
                                                        <td class="p-10">{{ $payout->id }}</td>
                                                        <td class="p-10">{{ $payout->teacher->name }}</td>
                                                        <td class="p-10">
                                                            {{ $payout->period_start->format('M d, Y') }} - {{ $payout->period_end->format('M d, Y') }}
                                                        </td>
                                                        <td class="p-10 text-right fw-500">
                                                            {{ number_format($payout->amount, 2) }} UGX
                                                        </td>
                                                        <td class="p-10">
                                                            {{ $payout->created_at->format('M d, Y') }}
                                                        </td>
                                                        <td class="p-10 text-center">
                                                            <div class="d-flex items-center justify-center">
                                                                <a href="{{ route('admin.payouts.show', $payout) }}" class="button -icon -info-light text-light-1 size-35 rounded-8 mr-10">
                                                                    <i class="icon-eye text-15"></i>
                                                                </a>
                                                                <a href="{{ route('admin.payouts.edit', $payout) }}" class="button -icon -purple-light text-purple-1 size-35 rounded-8">
                                                                    <i class="icon-edit text-15"></i>
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div class="d-flex justify-center mt-30">
                                        {{ $pendingPayouts->appends(['processing_page' => $processingPayouts->currentPage(), 'completed_page' => $completedPayouts->currentPage(), 'failed_page' => $failedPayouts->currentPage()])->links() }}
                                    </div>
                                @else
                                    <div class="text-center py-40">
                                        <div class="icon-empty-state mb-20">
                                            <i class="icon-wallet text-60 text-light-1"></i>
                                        </div>
                                        <h4 class="text-18 fw-500 mb-10">No Pending Payouts</h4>
                                        <p class="text-14">There are no pending payouts at the moment.</p>
                                    </div>
                                @endif
                            </div>
                            
                            <!-- Processing Payouts Tab -->
                            <div class="tabs__pane -tab-item-2">
                                @if($processingPayouts->count() > 0)
                                    <div class="overflow-x-auto">
                                        <table class="table w-1/1">
                                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                                <tr>
                                                    <th class="p-10">ID</th>
                                                    <th class="p-10">Teacher</th>
                                                    <th class="p-10">Period</th>
                                                    <th class="p-10 text-right">Amount</th>
                                                    <th class="p-10">Process Date</th>
                                                    <th class="p-10 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody class="text-14">
                                                @foreach($processingPayouts as $payout)
                                                    <tr class="border-bottom-light">
                                                        <td class="p-10">{{ $payout->id }}</td>
                                                        <td class="p-10">{{ $payout->teacher->name }}</td>
                                                        <td class="p-10">
                                                            {{ $payout->period_start->format('M d, Y') }} - {{ $payout->period_end->format('M d, Y') }}
                                                        </td>
                                                        <td class="p-10 text-right fw-500">
                                                            {{ number_format($payout->amount, 2) }} UGX
                                                        </td>
                                                        <td class="p-10">
                                                            {{ $payout->processed_at ? $payout->processed_at->format('M d, Y') : 'N/A' }}
                                                        </td>
                                                        <td class="p-10 text-center">
                                                            <div class="d-flex items-center justify-center">
                                                                <a href="{{ route('admin.payouts.show', $payout) }}" class="button -icon -info-light text-light-1 size-35 rounded-8 mr-10">
                                                                    <i class="icon-eye text-15"></i>
                                                                </a>
                                                                <a href="{{ route('admin.payouts.edit', $payout) }}" class="button -icon -purple-light text-purple-1 size-35 rounded-8">
                                                                    <i class="icon-edit text-15"></i>
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div class="d-flex justify-center mt-30">
                                        {{ $processingPayouts->appends(['pending_page' => $pendingPayouts->currentPage(), 'completed_page' => $completedPayouts->currentPage(), 'failed_page' => $failedPayouts->currentPage()])->links() }}
                                    </div>
                                @else
                                    <div class="text-center py-40">
                                        <div class="icon-empty-state mb-20">
                                            <i class="icon-refresh text-60 text-light-1"></i>
                                        </div>
                                        <h4 class="text-18 fw-500 mb-10">No Processing Payouts</h4>
                                        <p class="text-14">There are no payouts currently being processed.</p>
                                    </div>
                                @endif
                            </div>
                            
                            <!-- Completed Payouts Tab -->
                            <div class="tabs__pane -tab-item-3">
                                @if($completedPayouts->count() > 0)
                                    <div class="overflow-x-auto">
                                        <table class="table w-1/1">
                                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                                <tr>
                                                    <th class="p-10">ID</th>
                                                    <th class="p-10">Teacher</th>
                                                    <th class="p-10">Period</th>
                                                    <th class="p-10 text-right">Amount</th>
                                                    <th class="p-10">Paid Date</th>
                                                    <th class="p-10">Reference</th>
                                                    <th class="p-10 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody class="text-14">
                                                @foreach($completedPayouts as $payout)
                                                    <tr class="border-bottom-light">
                                                        <td class="p-10">{{ $payout->id }}</td>
                                                        <td class="p-10">{{ $payout->teacher->name }}</td>
                                                        <td class="p-10">
                                                            {{ $payout->period_start->format('M d, Y') }} - {{ $payout->period_end->format('M d, Y') }}
                                                        </td>
                                                        <td class="p-10 text-right fw-500">
                                                            {{ number_format($payout->amount, 2) }} UGX
                                                        </td>
                                                        <td class="p-10">
                                                            {{ $payout->processed_at ? $payout->processed_at->format('M d, Y') : 'N/A' }}
                                                        </td>
                                                        <td class="p-10">
                                                            {{ $payout->reference ?? 'N/A' }}
                                                        </td>
                                                        <td class="p-10 text-center">
                                                            <a href="{{ route('admin.payouts.show', $payout) }}" class="button -icon -info-light text-light-1 size-35 rounded-8">
                                                                <i class="icon-eye text-15"></i>
                                                            </a>
                                                        </td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div class="d-flex justify-center mt-30">
                                        {{ $completedPayouts->appends(['pending_page' => $pendingPayouts->currentPage(), 'processing_page' => $processingPayouts->currentPage(), 'failed_page' => $failedPayouts->currentPage()])->links() }}
                                    </div>
                                @else
                                    <div class="text-center py-40">
                                        <div class="icon-empty-state mb-20">
                                            <i class="icon-check text-60 text-light-1"></i>
                                        </div>
                                        <h4 class="text-18 fw-500 mb-10">No Completed Payouts</h4>
                                        <p class="text-14">There are no completed payouts yet.</p>
                                    </div>
                                @endif
                            </div>
                            
                            <!-- Failed/Cancelled Payouts Tab -->
                            <div class="tabs__pane -tab-item-4">
                                @if($failedPayouts->count() > 0)
                                    <div class="overflow-x-auto">
                                        <table class="table w-1/1">
                                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                                <tr>
                                                    <th class="p-10">ID</th>
                                                    <th class="p-10">Teacher</th>
                                                    <th class="p-10">Period</th>
                                                    <th class="p-10 text-right">Amount</th>
                                                    <th class="p-10">Status</th>
                                                    <th class="p-10">Updated</th>
                                                    <th class="p-10 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody class="text-14">
                                                @foreach($failedPayouts as $payout)
                                                    <tr class="border-bottom-light">
                                                        <td class="p-10">{{ $payout->id }}</td>
                                                        <td class="p-10">{{ $payout->teacher->name }}</td>
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
                                                            {{ $payout->updated_at->format('M d, Y') }}
                                                        </td>
                                                        <td class="p-10 text-center">
                                                            <div class="d-flex items-center justify-center">
                                                                <a href="{{ route('admin.payouts.show', $payout) }}" class="button -icon -info-light text-light-1 size-35 rounded-8 mr-10">
                                                                    <i class="icon-eye text-15"></i>
                                                                </a>
                                                                <a href="{{ route('admin.payouts.edit', $payout) }}" class="button -icon -purple-light text-purple-1 size-35 rounded-8">
                                                                    <i class="icon-edit text-15"></i>
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div class="d-flex justify-center mt-30">
                                        {{ $failedPayouts->appends(['pending_page' => $pendingPayouts->currentPage(), 'processing_page' => $processingPayouts->currentPage(), 'completed_page' => $completedPayouts->currentPage()])->links() }}
                                    </div>
                                @else
                                    <div class="text-center py-40">
                                        <div class="icon-empty-state mb-20">
                                            <i class="icon-close text-60 text-light-1"></i>
                                        </div>
                                        <h4 class="text-18 fw-500 mb-10">No Failed/Cancelled Payouts</h4>
                                        <p class="text-14">There are no failed or cancelled payouts.</p>
                                    </div>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script>
        // Tabs functionality
        document.addEventListener('DOMContentLoaded', function() {
            const tabButtons = document.querySelectorAll('.js-tabs-button');
            const tabContents = document.querySelectorAll('.tabs__pane');
            
            tabButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const targetClass = this.getAttribute('data-tab-target');
                    
                    // Remove active class from all buttons and contents
                    tabButtons.forEach(btn => btn.classList.remove('is-active'));
                    tabContents.forEach(content => content.classList.remove('is-active'));
                    
                    // Add active class to clicked button and corresponding content
                    this.classList.add('is-active');
                    document.querySelector(targetClass).classList.add('is-active');
                });
            });
        });
    </script>
    @endpush
</x-dashboard-layout> 