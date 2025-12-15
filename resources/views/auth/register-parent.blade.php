<x-auth-layout>
    <x-slot name="title">Parent Registration - {{ config('app.name', 'Laravel') }}</x-slot>

    <h3 class="text-30 lh-13">{{ __('Parent Registration') }}</h3>
    <p class="mt-10">{{ __('Create your parent account.') }}</p>

    <x-auth-session-status class="mb-30" :status="session('status')" />

    <form method="POST" action="{{ route('register.parent.store') }}" class="contact-form respondForm__form row y-gap-20 pt-30">
        @csrf

        <!-- Email Address -->
        <div class="col-12">
            <label for="email" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Email') }}</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required autocomplete="username" placeholder="{{ __('Your Email') }}">
            <x-input-error :messages="$errors->get('email')" class="mt-5" />
        </div>

        <!-- First Name and Last Name -->
        <div class="col-12">
            <div class="row x-gap-20 y-gap-20">
                <div class="col-md-6">
                    <label for="first_name" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('First Name') }}</label>
                    <input id="first_name" type="text" name="first_name" value="{{ old('first_name') }}" required autofocus autocomplete="given-name" placeholder="{{ __('Your First Name') }}">
                    <x-input-error :messages="$errors->get('first_name')" class="mt-5" />
                </div>
                <div class="col-md-6">
                    <label for="last_name" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Last Name') }}</label>
                    <input id="last_name" type="text" name="last_name" value="{{ old('last_name') }}" required autocomplete="family-name" placeholder="{{ __('Your Last Name') }}">
                    <x-input-error :messages="$errors->get('last_name')" class="mt-5" />
                </div>
            </div>
        </div>

        <!-- Password and Confirm Password -->
        <div class="col-12">
            <div class="row x-gap-20 y-gap-20">
                <div class="col-md-6">
                    <label for="password" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Password') }}</label>
                    <input id="password" type="password" name="password" required autocomplete="new-password" placeholder="{{ __('Your Password') }}">
                    <x-input-error :messages="$errors->get('password')" class="mt-5" />
                </div>
                <div class="col-md-6">
                    <label for="password_confirmation" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Confirm Password') }}</label>
                    <input id="password_confirmation" type="password" name="password_confirmation" required autocomplete="new-password" placeholder="{{ __('Confirm Your Password') }}">
                    <x-input-error :messages="$errors->get('password_confirmation')" class="mt-5" />
                </div>
            </div>
        </div>

        <div class="col-12">
            <button type="submit" class="button -md -green-1 text-dark-1 fw-500 w-1/1">
                {{ __('Register') }}
            </button>
        </div>

        <div class="mt-20 text-center col-12">
            <p class="text-15 lh-1">
                {{ __('Already have an account?') }}
                <a href="{{ route('login') }}" class="text-purple-1">{{ __('Log In') }}</a>
            </p>
        </div>

        <div class="col-12 text-center mt-10">
            <a href="{{ route('register') }}" class="text-14 lh-12 text-purple-1">
                 <i class="icon-arrow-left text-13 mr-8"></i>
                {{ __('Back to role selection') }}
            </a>
        </div>
    </form>
</x-auth-layout> 