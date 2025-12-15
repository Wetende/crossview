@extends('layouts.app')

@section('title', 'Payment Status')

@section('content')
<x-dashboard-layout title="Payment Status">
    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Payment Status</h1>
            </div>
        </div>

        <div class="row justify-center">
            <div class="col-xl-6 col-lg-7">
                <div class="py-50 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 text-center">
                    @if ($status === 'success')
                        <div class="mb-30">
                            <i class="icon-check text-80 text-green-1"></i>
                        </div>
                        <h2 class="text-24 lh-1 fw-500 text-green-1">Payment Successful!</h2>
                        <p class="text-16 lh-17 mt-10">Your payment has been processed successfully.</p>
                        @if ($payment)
                            <p class="text-15 mt-10">Your Subscription for <strong>{{ $payment->payable->name ?? 'the selected tier' }}</strong> should be active shortly.</p>
                            <p class="text-14 text-light-1 mt-5">Payment ID: {{ $payment->id }} | Transaction ID: {{ $payment->gateway_reference_id }}</p>
                        @endif
                        <div class="mt-30">
                            <a href="{{ route('dashboard') }}" class="button -md -green-1 text-white">Go to Dashboard</a>
                        </div>
                    @elseif ($status === 'failure')
                        <div class="mb-30">
                            <i class="icon-close text-80 text-red-1"></i>
                        </div>
                        <h2 class="text-24 lh-1 fw-500 text-red-1">Payment Failed</h2>
                        <p class="text-16 lh-17 mt-10">Unfortunately, your payment could not be processed at this time.</p>
                        @if ($payment)
                            <p class="text-14 text-light-1 mt-5">Payment ID: {{ $payment->id }} | Transaction ID: {{ $payment->gateway_reference_id }}</p>
                        @endif
                        <p class="text-15 mt-10">Please try again or contact support if the issue persists.</p>
                        <div class="mt-30 d-flex justify-center x-gap-20">
                            <a href="{{ route('pricing.index') }}" class="button -md -orange-1 text-white">Try Another Plan</a>
                            <a href="{{ route('dashboard') }}" class="button -md -light-3 text-dark-1">Go to Dashboard</a>
                        </div>
                    @else
                        <div class="mb-30">
                            <i class="icon-help-circle text-80 text-orange-1"></i>
                        </div>
                        <h2 class="text-24 lh-1 fw-500">Unknown Payment Status</h2>
                        <p class="text-16 lh-17 mt-10">We could not determine the status of your payment.</p>
                        <p class="text-15 mt-10">Please check your dashboard or contact support.</p>
                        <div class="mt-30">
                            <a href="{{ route('dashboard') }}" class="button -md -blue-1 text-white">Go to Dashboard</a>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout>
@endsection 