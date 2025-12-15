<x-auth-layout>
    <x-slot name="title">Forgot Password - {{ config('app.name', 'Laravel') }}</x-slot>

    <h3 class="text-30 lh-13">{{ __('Forgot Password') }}</h3>
    <p class="mt-10">{{ __('Forgot your password? No problem. Just let us know your email address and we will email you a password reset link that will allow you to choose a new one.') }}</p>

    <!-- Session Status -->
    <x-auth-session-status class="mb-30" :status="session('status')" />

    <form method="POST" action="{{ route('password.email') }}" class="contact-form respondForm__form row y-gap-20 pt-30">
        @csrf

        <!-- Email Address -->
        <div class="col-12">
            <label for="email" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Email') }}</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus placeholder="{{ __('Your Email') }}">
            <x-input-error :messages="$errors->get('email')" class="mt-5" />
        </div>

        <div class="col-12">
            <button type="submit" class="button -md -green-1 text-dark-1 fw-500 w-1/1">
                {{ __('Email Password Reset Link') }}
            </button>
        </div>

        <div class="col-12 text-center">
            <a href="{{ route('login') }}" class="text-14 lh-12 text-purple-1">
                <i class="icon-arrow-left text-13 mr-8"></i>
                {{ __('Back to Login') }}
            </a>
        </div>
    </form>
</x-auth-layout>
