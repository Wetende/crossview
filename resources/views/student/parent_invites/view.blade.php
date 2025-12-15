<x-dashboard-layout :title="__('Parent Connection Invite Code')">
    <x-slot name="header">
        @include('layouts.partials.student.header')
    </x-slot>

    <x-slot name="sidebar">
        {{-- Assuming student sidebar exists at layouts.partials.student.sidebar --}}
        @include('layouts.partials.student.sidebar') 
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">{{ __('Parent Connection Invite Code') }}</h1>
                <div class="mt-10">{{ __('Share this code with your parent to allow them to link to your account.') }}</div>
            </div>
        </div>

        <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
            @if(session('success'))
                <div class="col-12 mb-20">
                    <div class="notice success">
                        <p>{{ session('success') }}</p>
                    </div>
                </div>
            @endif

            @if ($activeCode)
                <div class="mb-20">
                    <h2 class="text-20 lh-1 fw-500">{{ __('Your Active Invite Code') }}</h2>
                    <p class="text-24 fw-700 text-purple-1 mt-10">{{ $activeCode->code }}</p>
                    <p class="text-14 text-light-1 mt-5">{{ __('This code will expire on: :date', ['date' => $activeCode->expires_at->format('F j, Y, g:i a')]) }}</p>
                    <p class="text-14 text-light-1 mt-5">{{ __('Sharing this code will allow your parent to view your progress and activity.') }}</p>
                </div>
                <hr class="my-20">
            @else
                <div class="mb-20">
                    <p>{{ __('You do not have an active invite code.') }}</p>
                </div>
            @endif

            <form method="GET" action="{{ route('student.parent_invite.generate') }}">
                <button type="submit" class="button -md -purple-1 text-white">
                    {{ $activeCode ? __('Generate New Code (Invalidates Old One)') : __('Generate Invite Code') }}
                </button>
            </form>
        </div>
    </div>
</x-dashboard-layout> 