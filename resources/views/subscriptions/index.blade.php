<x-dashboard-layout title="Our Pricing Plans">
    <x-slot name="sidebar">
        @include('layouts.partials.student.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.student.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Our Pricing Plans</h1>
                <div class="mt-10">Choose the plan that best fits your learning needs.</div>
            </div>
        </div>

        <div class="row y-gap-30">
            @forelse ($tiers as $tier)
                <div class="col-lg-4 col-md-6">
                    <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 hover-shadow-5 transition-all-300 {{ $tier->level == 0 ? 'border-purple-1' : '' }}" style="height: 100%;">
                        <div class="text-center">
                            <h3 class="text-20 lh-1 fw-500">{{ $tier->name }}</h3>
                            <div class="text-30 lh-1 fw-700 mt-15 {{ $tier->price == 0 ? 'text-green-1' : 'text-purple-1' }}">
                                {{ config('app.currency_symbol','$') }}{{ number_format($tier->price, 2) }}
                            </div>
                            <div class="text-14 text-light-1 mt-5">{{ $tier->duration_days > 0 ? '/ ' . $tier->duration_days . ' days' : '/ Lifetime' }}</div>
                        </div>

                        <p class="text-15 lh-17 mt-20 text-center">{{ $tier->description }}</p>
                        
                        @if($tier->features && is_array($tier->features) && count($tier->features) > 0)
                            <ul class="list-disc text-14 lh-17 pl-20 mt-20 y-gap-10">
                                @foreach ($tier->features as $feature)
                                    <li>{{ $feature }}</li>
                                @endforeach
                            </ul>
                        @else
                            <p class="text-14 text-light-1 text-center mt-20">No specific features listed.</p>
                        @endif

                        <div class="mt-20 text-center">
                             <p class="text-14 text-light-1">Max Courses: {{ $tier->max_courses ?? 'Unlimited' }}</p>
                        </div>
                        
                        <div class="mt-30">
                            <a href="{{ route('subscriptions.showSubscribeForm', $tier->id) }}" 
                               class="button -md w-1/1 {{ $tier->price == 0 ? '-green-1 text-white' : '-purple-1 text-white' }}">
                               {{ $tier->price == 0 ? 'Get Started' : 'Choose Plan' }}
                            </a>
                        </div>
                    </div>
                </div>
            @empty
                <div class="col-12">
                    <div class="py-50 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4 text-center">
                         <img src="{{ asset('img/dashboard/empty-state/empty-pricing.svg') }}" alt="Empty State" style="max-width: 200px;" class="mb-20">
                        <h4 class="text-18 fw-500 mb-10">No Plans Available</h4>
                        <p class="text-14 text-light-1">No subscription plans are currently available. Please check back later.</p>
                    </div>
                </div>
            @endforelse
        </div>
    </div>

    @push('styles')
    <style>
        .hover-shadow-5:hover {
            box-shadow: var(--shadow-5);
        }
        .transition-all-300 {
            transition: all 0.3s ease;
        }
        .border-purple-1 {
            border: 1px solid var(--color-purple-1) !important;
        }
    </style>
    @endpush
</x-dashboard-layout> 