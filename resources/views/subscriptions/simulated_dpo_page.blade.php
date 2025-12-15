<x-dashboard-layout title="Simulated Payment Page">
    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Simulated DPO Payment Gateway</h1>
            </div>
        </div>

        <div class="row justify-center">
            <div class="col-xl-6 col-lg-7">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 text-center">
                    <i class="icon-credit-card text-60 text-purple-1 mb-20"></i>
                    <p class="text-18 lh-17 text-dark-1">This is a simulated payment page for testing purposes.</p>
                    
                    <div class="mt-30 mb-30 py-20 border-top-light border-bottom-light">
                        <h5 class="text-18 lh-1 fw-500 mb-15">Payment Details:</h5>
                        <ul class="list-none text-15 lh-17 y-gap-10">
                            <li><strong>Payment ID:</strong> {{ $payment->id }}</li>
                            <li><strong>Amount:</strong> {{ $payment->currency }} {{ number_format($payment->amount, 2) }}</li>
                            <li><strong>Gateway Reference:</strong> {{ $payment->gateway_reference_id }}</li>
                            <li><strong>Status:</strong> <span class="badge bg-orange-1 text-white text-uppercase">{{ $payment->status }}</span></li>
                        </ul>
                    </div>

                    <p class="text-16 text-dark-1 mb-20">Please choose an outcome for this simulated payment:</p>

                    <div class="row y-gap-20 x-gap-20">
                        <div class="col-md-6">
                            <form action="{{ route('subscriptions.paymentCallback') }}" method="GET">
                                <input type="hidden" name="payment_id" value="{{ $payment->id }}">
                                <input type="hidden" name="status" value="success">
                                <input type="hidden" name="transaction_id" value="DPO_SIM_SUCCESS_{{ strtoupper(Str::random(10)) }}">
                                <button type="submit" class="button -md -green-1 text-white w-1/1">Simulate Payment Success</button>
                            </form>
                        </div>
                        <div class="col-md-6">
                            <form action="{{ route('subscriptions.paymentCallback') }}" method="GET">
                                <input type="hidden" name="payment_id" value="{{ $payment->id }}">
                                <input type="hidden" name="status" value="failure">
                                <input type="hidden" name="transaction_id" value="DPO_SIM_FAILURE_{{ strtoupper(Str::random(10)) }}">
                                <button type="submit" class="button -md -red-1 text-white w-1/1">Simulate Payment Failure</button>
                            </form>
                        </div>
                    </div>

                    <p class="mt-30 text-14 text-light-1">
                        In a real scenario, you would be redirected to the DPO Global Payment page. 
                        After payment, DPO would redirect back to our site (callback URL) with the transaction status.
                    </p>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 