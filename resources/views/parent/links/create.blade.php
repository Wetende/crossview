<x-dashboard-layout :title="__('Link Child Account')">
    <x-slot name="header">
        @include('layouts.partials.parent.header')
    </x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.parent.sidebar')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">{{ __('Link Child Account') }}</h1>
                <div class="mt-10">{{ __('Connect with your child using their 8-character invite code.') }}</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('parent.overview') }}" class="button -md -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">
                    <i class="icon-arrow-left mr-8"></i>
                    {{ __('Back to Dashboard') }}
                </a>
            </div>
        </div>

        @if(session('success'))
            <div class="row mb-20">
                <div class="col-12">
                    <div class="notice success">
                        <p>{{ session('success') }}</p>
                    </div>
                </div>
            </div>
        @endif

        @if(session('error'))
            <div class="row mb-20">
                <div class="col-12">
                    <div class="notice error">
                        <p>{{ session('error') }}</p>
                    </div>
                </div>
            </div>
        @endif

        @if(session('info'))
            <div class="row mb-20">
                <div class="col-12">
                    <div class="notice info">
                        <p>{{ session('info') }}</p>
                    </div>
                </div>
            </div>
        @endif

        <div class="row justify-center">
            <div class="col-xl-6 col-lg-8 col-md-10">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <!-- Instructions Section -->
                    <div class="text-center mb-30">
                        <div class="size-80 rounded-full d-flex justify-center items-center bg-purple-3 mx-auto mb-20">
                            <i class="icon-ticket text-purple-1 text-30"></i>
                        </div>
                        <h2 class="text-24 lh-1 fw-500 mb-15">{{ __('Enter Invite Code') }}</h2>
                        <p class="text-16 text-light-1">{{ __('Ask your child to generate an invite code from their account settings and enter it below.') }}</p>
                    </div>

                    <!-- Form -->
                    <form action="{{ route('parent.link.store.invite_code') }}" method="POST">
                        @csrf
                        <div class="row y-gap-20">
                            <div class="col-12">
                                <label for="invite_code" class="text-16 lh-1 fw-500 text-dark-1 mb-10 d-block">
                                    {{ __('8-Character Invite Code') }}
                                </label>
                                <input 
                                    type="text" 
                                    name="invite_code" 
                                    id="invite_code" 
                                    placeholder="{{ __('Enter code (e.g., ABC12XYZ)') }}" 
                                    class="form-control @error('invite_code') is-invalid @enderror"
                                    value="{{ old('invite_code') }}"
                                    maxlength="8"
                                    style="text-transform: uppercase;"
                                    autocomplete="off"
                                    required
                                >
                                @error('invite_code')
                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                @enderror
                                <div class="text-14 text-light-1 mt-5">
                                    {{ __('The code is case-insensitive and expires after 7 days.') }}
                                </div>
                            </div>

                            <div class="col-12">
                                <button type="submit" class="button -md -purple-1 text-white w-1/1">
                                    <i class="icon-link text-16 mr-10"></i>
                                    {{ __('Link Account') }}
                                </button>
                            </div>
                        </div>
                    </form>

                    <!-- Help Section -->
                    <div class="mt-30 pt-30 border-top-light">
                        <h3 class="text-18 fw-500 mb-15">{{ __('How to Get an Invite Code') }}</h3>
                        <div class="row y-gap-15">
                            <div class="col-12">
                                <div class="d-flex items-start">
                                    <div class="size-24 rounded-full d-flex justify-center items-center bg-purple-3 mr-15 mt-2" style="min-width: 24px;">
                                        <span class="text-12 fw-500 text-purple-1">1</span>
                                    </div>
                                    <div>
                                        <p class="text-15">{{ __('Ask your child to log into their ' . config('app.short_name', 'Crossview College') . ' account.') }}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="d-flex items-start">
                                    <div class="size-24 rounded-full d-flex justify-center items-center bg-purple-3 mr-15 mt-2" style="min-width: 24px;">
                                        <span class="text-12 fw-500 text-purple-1">2</span>
                                    </div>
                                    <div>
                                        <p class="text-15">{{ __('They should go to Settings > Parent Invites.') }}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="d-flex items-start">
                                    <div class="size-24 rounded-full d-flex justify-center items-center bg-purple-3 mr-15 mt-2" style="min-width: 24px;">
                                        <span class="text-12 fw-500 text-purple-1">3</span>
                                    </div>
                                    <div>
                                        <p class="text-15">{{ __('They can generate a new invite code and share it with you.') }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Alternative Connection Method -->
                    <div class="mt-30 pt-30 border-top-light text-center">
                        <h3 class="text-18 fw-500 mb-15">{{ __('Alternative Connection Method') }}</h3>
                        <p class="text-15 text-light-1 mb-20">{{ __('If your child doesn\'t have access to their account, you can send a connection request via email.') }}</p>
                        <a href="{{ route('parent.connections.create') }}" class="button -md -outline-purple-1 text-purple-1">
                            <i class="icon-send text-16 mr-10"></i>
                            {{ __('Request via Email') }}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script>
        document.getElementById('invite_code').addEventListener('input', function(e) {
            // Convert to uppercase and remove non-alphanumeric characters
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
    </script>
    @endpush
</x-dashboard-layout> 