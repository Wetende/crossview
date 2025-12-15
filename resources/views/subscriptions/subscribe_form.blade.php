<x-dashboard-layout :title="'Confirm Subscription: ' . $subscriptionTier->name">
    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Confirm Subscription</h1>
            </div>
            <div class="col-auto">
                <a href="{{ route('pricing.index') }}" class="button -md -light-3 text-dark-1">
                    <i class="icon-arrow-left mr-10"></i>Back to Pricing Plans
                </a>
            </div>
        </div>

        <div class="row justify-center">
            <div class="col-xl-7 col-lg-8">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="text-center mb-20">
                        <h2 class="text-24 lh-1 fw-500">{{ $subscriptionTier->name }}</h2>
                        <p class="text-15 lh-17 text-light-1 mt-10">{{ $subscriptionTier->description }}</p>
                    </div>
                    
                    <div class="pt-20 pb-20 border-top-light border-bottom-light">
                        <h4 class="text-18 lh-1 fw-500 mb-15">Plan Details:</h4>
                        <div class="row y-gap-10">
                            <div class="col-12 d-flex justify-between">
                                <span class="text-15 text-dark-1">Price:</span>
                                <span class="text-15 fw-500 text-dark-1">{{ config('app.currency_symbol','$') }}{{ number_format($subscriptionTier->price, 2) }}</span>
                            </div>
                            <div class="col-12 d-flex justify-between">
                                <span class="text-15 text-dark-1">Duration:</span>
                                <span class="text-15 fw-500 text-dark-1">{{ $subscriptionTier->duration_days > 0 ? $subscriptionTier->duration_days . ' days' : 'Lifetime' }}</span>
                            </div>
                            <div class="col-12 d-flex justify-between">
                                <span class="text-15 text-dark-1">Max Courses:</span>
                                <span class="text-15 fw-500 text-dark-1">{{ $subscriptionTier->max_courses ?? 'Unlimited' }}</span>
                            </div>
                        </div>
                    </div>

                    @if($subscriptionTier->features && is_array($subscriptionTier->features) && count($subscriptionTier->features) > 0)
                        <div class="pt-20 pb-10">
                            <h5 class="text-18 lh-1 fw-500 mb-15">Features Included:</h5>
                            <ul class="list-disc text-15 lh-17 pl-20 y-gap-10">
                                @foreach ($subscriptionTier->features as $feature)
                                    <li>{{ $feature }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    <form action="{{ route('subscriptions.process', $subscriptionTier->id) }}" method="POST" class="mt-30">
                        @csrf
                        <button type="submit" class="button -md -purple-1 text-white w-1/1">
                            Proceed to Payment Simulation
                        </button>
                    </form>
                    <div class="text-center mt-20">
                         <a href="{{ route('pricing.index') }}" class="text-14 text-purple-1 underline">Choose a different plan</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout> 