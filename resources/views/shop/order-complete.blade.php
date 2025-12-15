@extends('layouts.x-dashboard-layout')

@section('content')
<div class="dashboard__content bg-light-4">
    <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
        <div class="col-auto">
            <h1 class="text-30 lh-12 fw-700">Order Complete</h1>
            <div class="mt-10">Thank you for your purchase!</div>
        </div>
    </div>

    <div class="row y-gap-30">
        <div class="col-12">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 p-30">
                <div class="d-flex items-center justify-between border-bottom-light pb-20">
                    <h2 class="text-20 lh-1 fw-500">Order Details</h2>
                    <div class="d-flex items-center">
                        <div class="badge {{ $order->payment_status === 'completed' ? 'bg-green-1 text-white' : ($order->payment_status === 'pending' ? 'bg-orange-1 text-white' : 'bg-red-1 text-white') }}">
                            {{ ucfirst($order->payment_status) }}
                        </div>
                    </div>
                </div>

                <div class="row y-gap-30 pt-20">
                    <div class="col-md-6">
                        <div class="text-16 fw-500 text-dark-1 mb-10">Order Information</div>
                        <div class="d-flex justify-between mb-8">
                            <div class="text-light-1">Order Number:</div>
                            <div class="text-dark-1 fw-500">{{ $order->reference_number }}</div>
                        </div>
                        <div class="d-flex justify-between mb-8">
                            <div class="text-light-1">Date:</div>
                            <div class="text-dark-1">{{ $order->created_at->format('M d, Y, H:i') }}</div>
                        </div>
                        <div class="d-flex justify-between mb-8">
                            <div class="text-light-1">Total:</div>
                            <div class="text-dark-1 fw-500">{{ config('services.dpo.currency', 'ZAR') }} {{ number_format($order->total_amount, 2) }}</div>
                        </div>
                        <div class="d-flex justify-between">
                            <div class="text-light-1">Payment Method:</div>
                            <div class="text-dark-1">{{ ucfirst($order->payment_method) }}</div>
                        </div>
                    </div>

                    <div class="col-md-6">
                        <div class="text-16 fw-500 text-dark-1 mb-10">Billing Information</div>
                        <div class="text-15">
                            <div class="fw-500">{{ $order->billing_first_name }} {{ $order->billing_last_name }}</div>
                            <div>{{ $order->billing_email }}</div>
                            <div>{{ $order->billing_phone }}</div>
                            <div>{{ $order->billing_address }}</div>
                            <div>{{ $order->billing_city }}, {{ $order->billing_state }} {{ $order->billing_postal_code }}</div>
                            <div>{{ $order->billing_country }}</div>
                        </div>
                    </div>
                </div>

                <div class="border-top-light pt-20 mt-20">
                    <div class="text-18 fw-500 text-dark-1 mb-15">Order Items</div>
                    
                    <div class="table-responsive">
                        <table class="table w-1/1">
                            <thead class="text-14 fw-500 bg-light-3 -dark-bg-dark-2">
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody class="text-14">
                                @foreach($courses as $course)
                                    <tr class="border-bottom-light">
                                        <td class="p-10">
                                            <div class="d-flex items-center">
                                                @if($course->thumbnail)
                                                    <div class="size-60 rounded-8 mr-20 overflow-hidden">
                                                        <img src="{{ asset('storage/' . $course->thumbnail) }}" alt="{{ $course->title }}" class="size-60 object-cover">
                                                    </div>
                                                @endif
                                                <div>
                                                    <div class="text-dark-1 fw-500">{{ $course->title }}</div>
                                                    @if($course->instructor)
                                                        <div class="text-14 lh-1 mt-5">by {{ $course->instructor->name }}</div>
                                                    @endif
                                                </div>
                                            </div>
                                        </td>
                                        <td class="p-10">{{ config('services.dpo.currency', 'ZAR') }} {{ number_format($course->price, 2) }}</td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="row y-gap-20 justify-between pt-30">
                    <div class="col-auto">
                        <a href="{{ route('student.courses') }}" class="button -md -purple-1 text-white">
                            Go to My @lmsterm('Study Materials')
                        </a>
                    </div>
                    <div class="col-auto">
                        <a href="{{ route('shop.index') }}" class="button -md -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                            Continue Shopping
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection 