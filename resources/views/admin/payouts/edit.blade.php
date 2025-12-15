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
                <h1 class="text-30 lh-12 fw-700">Update Payout Status</h1>
                <div class="mt-10">Update status for payout #{{ $payout->id }}</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.payouts.index') }}" class="button -md -outline-purple-1 text-purple-1">
                    <i class="icon-arrow-left mr-10"></i>
                    Back to Payouts
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
            <div class="col-md-8">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Update Payout Status</h2>
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
                        <form action="{{ route('admin.payouts.update', $payout) }}" method="POST">
                            @csrf
                            @method('PUT')
                            
                            <div class="row y-gap-20">
                                <div class="col-12">
                                    <div class="alert -info-light mb-30">
                                        <div class="alert__content">
                                            <p>You are updating the status for a payout of <strong>{{ number_format($payout->amount, 2) }} UGX</strong> to {{ $payout->teacher->name }}.</p>
                                            <p class="mt-10">Period: {{ $payout->period_start->format('M d, Y') }} - {{ $payout->period_end->format('M d, Y') }}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-12">
                                    <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="status">Status</label>
                                    <select id="status" name="status" class="form-select" required>
                                        <option value="processing" @if($payout->isProcessing()) selected @endif>Processing</option>
                                        <option value="paid" @if($payout->isPaid()) selected @endif>Paid</option>
                                        <option value="failed" @if($payout->isFailed()) selected @endif>Failed</option>
                                        <option value="cancelled" @if($payout->isCancelled()) selected @endif>Cancelled</option>
                                    </select>
                                    @error('status')
                                        <div class="text-red-1 mt-1">{{ $message }}</div>
                                    @enderror
                                </div>
                                
                                <div class="col-12 reference-field @if(!$payout->isPaid() && $payout->status !== 'paid') d-none @endif">
                                    <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="reference">Reference Number</label>
                                    <input type="text" id="reference" name="reference" class="form-control" value="{{ old('reference', $payout->reference) }}">
                                    <div class="text-14 mt-5">Transaction reference number for the payout</div>
                                    @error('reference')
                                        <div class="text-red-1 mt-1">{{ $message }}</div>
                                    @enderror
                                </div>
                                
                                <div class="col-12 notes-field @if(!$payout->isFailed() && !$payout->isCancelled() && $payout->status !== 'failed' && $payout->status !== 'cancelled') d-none @endif">
                                    <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="notes">Notes</label>
                                    <textarea id="notes" name="notes" class="form-control" rows="4">{{ old('notes', $payout->notes) }}</textarea>
                                    <div class="text-14 mt-5">Reason for failure or cancellation</div>
                                    @error('notes')
                                        <div class="text-red-1 mt-1">{{ $message }}</div>
                                    @enderror
                                </div>
                                
                                <div class="col-12 border-top-light mt-30 pt-30">
                                    <button type="submit" class="button -md -purple-1 text-white">
                                        Update Payout Status
                                    </button>
                                    
                                    <a href="{{ route('admin.payouts.index') }}" class="button -md -outline-purple-1 text-purple-1 ml-10">
                                        Cancel
                                    </a>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Teacher Information</h2>
                    </div>
                    <div class="py-30 px-30">
                        <div class="row y-gap-20">
                            <div class="col-12">
                                <div class="d-flex items-center">
                                    <div class="size-50 rounded-full bg-image js-lazy" data-bg="{{ asset('img/avatars/default.jpg') }}"></div>
                                    <div class="ml-15">
                                        <h5 class="text-16 fw-500 lh-14">{{ $payout->teacher->name }}</h5>
                                        <div class="text-14 lh-12 mt-5">{{ $payout->teacher->email }}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="border-top-light pt-20 mt-20">
                                    <div class="text-14 text-light-1 mb-10">Payment Method:</div>
                                    @php
                                        $paymentDetails = $payout->teacher->paymentDetails()->where('status', 'verified')->first();
                                    @endphp
                                    
                                    @if($paymentDetails)
                                        <div class="fw-500">
                                            {{ ucfirst(str_replace('_', ' ', $paymentDetails->payment_method)) }}
                                        </div>
                                        
                                        @php $details = json_decode($paymentDetails->account_details, true); @endphp
                                        
                                        @if($paymentDetails->payment_method === 'bank_transfer')
                                            <div class="text-15 mt-10">
                                                <div class="d-flex justify-between mb-5">
                                                    <div class="text-light-1">Bank:</div>
                                                    <div>{{ $details['bank_name'] ?? 'N/A' }}</div>
                                                </div>
                                                <div class="d-flex justify-between">
                                                    <div class="text-light-1">Account:</div>
                                                    <div>{{ $details['account_number'] ?? 'N/A' }}</div>
                                                </div>
                                            </div>
                                        @elseif($paymentDetails->payment_method === 'mobile_money')
                                            <div class="text-15 mt-10">
                                                <div class="d-flex justify-between mb-5">
                                                    <div class="text-light-1">Provider:</div>
                                                    <div>{{ ucfirst($details['provider'] ?? 'N/A') }}</div>
                                                </div>
                                                <div class="d-flex justify-between">
                                                    <div class="text-light-1">Phone:</div>
                                                    <div>{{ $details['phone_number'] ?? 'N/A' }}</div>
                                                </div>
                                            </div>
                                        @elseif($paymentDetails->payment_method === 'paypal')
                                            <div class="text-15 mt-10">
                                                <div class="d-flex justify-between">
                                                    <div class="text-light-1">Email:</div>
                                                    <div>{{ $details['paypal_email'] ?? 'N/A' }}</div>
                                                </div>
                                            </div>
                                        @endif
                                    @else
                                        <div class="text-15">No verified payment details available</div>
                                    @endif
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const statusSelect = document.getElementById('status');
            const referenceField = document.querySelector('.reference-field');
            const notesField = document.querySelector('.notes-field');
            const referenceInput = document.getElementById('reference');
            
            statusSelect.addEventListener('change', function() {
                if (this.value === 'paid') {
                    referenceField.classList.remove('d-none');
                    notesField.classList.add('d-none');
                    referenceInput.setAttribute('required', 'required');
                } else if (this.value === 'failed' || this.value === 'cancelled') {
                    referenceField.classList.add('d-none');
                    notesField.classList.remove('d-none');
                    referenceInput.removeAttribute('required');
                } else {
                    referenceField.classList.add('d-none');
                    notesField.classList.add('d-none');
                    referenceInput.removeAttribute('required');
                }
            });
        });
    </script>
    @endpush
</x-dashboard-layout> 