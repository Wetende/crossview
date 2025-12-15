<x-dashboard-layout>
    <x-slot name="title">My Subscriptions</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.parent.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.parent.header')
        <h1 class="text-30 lh-12 fw-700">My Subscriptions</h1>
        <div class="breadcrumbs mt-10 pt-0 pb-0">
            <div class="breadcrumbs__content">
                <div class="breadcrumbs__item">
                    <a href="{{ route('home') }}">Home</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('parent.overview') }}">Dashboard</a>
                </div>
                <div class="breadcrumbs__item">
                    <a href="{{ route('parent.subscriptions') }}">Subscriptions</a>
                </div>
            </div>
        </div>
    </x-slot>

    <div class="row y-gap-30">
        {{-- Section for Current Subscriptions --}}
        <div class="col-12">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                <div class="d-flex items-center py-20 px-30 border-bottom-light">
                    <h2 class="text-17 lh-1 fw-500">Active Subscriptions</h2>
                </div>
                <div class="py-30 px-30">
                    <div class="row y-gap-30">
                        {{-- Example Active Subscription Item --}}
                        <div class="col-md-6">
                            <div class="rounded-8 border-light -dark-border-dark-2 p-20">
                                <h4 class="text-16 lh-15 fw-500 text-dark-1">Premium Plan - [Child's Name]</h4>
                                <div class="text-14 lh-1 text-light-1 mt-5">Renews on: 2024-01-15</div>
                                <div class="text-14 lh-1 text-light-1 mt-5">Price: $49.99/month</div>
                                <div class="mt-15">
                                    <a href="#" class="button -sm -outline-purple-1 text-purple-1 mr-10">Change Plan</a>
                                    <a href="#" class="button -sm -outline-red-1 text-red-1">Cancel Subscription</a>
                                </div>
                            </div>
                        </div>
                        {{-- End Example --}}
                        <div class="col-12 text-center pt-10">
                             <p>No active subscriptions found.</p> {{-- Show if no active subscriptions --}}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {{-- Section for Payment History (Adapted from invoice.html) --}}
        <div class="col-12">
            <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100 mt-30">
                <div class="d-flex items-center py-20 px-30 border-bottom-light">
                    <h2 class="text-17 lh-1 fw-500">Payment History</h2>
                </div>
                <div class="py-30 px-30">
                    <div class="py-25 px-md-40 px-20 bg-light-3 -dark-bg-dark-2 rounded-8">
                        <div class="row items-center text-center text-left-md">
                            <div class="col-md-4">
                                <div class="text-14 lh-1 fw-500 text-purple-1">Date</div>
                            </div>
                            <div class="col-md-4">
                                <div class="text-14 lh-1 fw-500 text-purple-1 mt-10 mt-md-0">Description</div>
                            </div>
                            <div class="col-md-2">
                                <div class="text-14 lh-1 fw-500 text-purple-1 mt-10 mt-md-0">Amount</div>
                            </div>
                            <div class="col-md-2">
                                <div class="text-14 lh-1 fw-500 text-purple-1 mt-10 mt-md-0">Status</div>
                            </div>
                        </div>
                    </div>

                    {{-- Example Payment History Item --}}
                    <div class="py-25 px-md-40 px-20 border-top-light">
                        <div class="row items-center text-center text-left-md">
                            <div class="col-md-4">
                                <div class="text-14 lh-1">2023-11-15</div>
                            </div>
                            <div class="col-md-4">
                                <div class="text-14 lh-1 mt-10 mt-md-0">Premium Plan Renewal - [Child's Name]</div>
                            </div>
                            <div class="col-md-2">
                                <div class="text-14 lh-1 mt-10 mt-md-0">$49.99</div>
                            </div>
                            <div class="col-md-2">
                                <div class="text-14 lh-1 mt-10 mt-md-0 text-green-1">Paid</div>
                            </div>
                        </div>
                    </div>
                    <div class="py-25 px-md-40 px-20 border-top-light">
                        <div class="row items-center text-center text-left-md">
                            <div class="col-md-4">
                                <div class="text-14 lh-1">2023-10-15</div>
                            </div>
                            <div class="col-md-4">
                                <div class="text-14 lh-1 mt-10 mt-md-0">Premium Plan Renewal - [Child's Name]</div>
                            </div>
                            <div class="col-md-2">
                                <div class="text-14 lh-1 mt-10 mt-md-0">$49.99</div>
                            </div>
                            <div class="col-md-2">
                                <div class="text-14 lh-1 mt-10 mt-md-0 text-green-1">Paid</div>
                            </div>
                        </div>
                    </div>
                    {{-- End Example --}}

                    <div class="col-12 text-center pt-30">
                         <p>No payment history found.</p> {{-- Show if no payment history --}}
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 