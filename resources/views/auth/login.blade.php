<x-auth-layout>
    <x-slot name="title">Login - {{ config('app.name', 'Laravel') }}</x-slot>

    <h3 class="text-30 lh-13">{{ __('Login') }}</h3>
    <p class="mt-10">{{ __("Don't have an account yet?") }} <a href="{{ route('register') }}" class="text-purple-1">{{ __('Sign up for free') }}</a></p>

    <!-- Session Status -->
    <x-auth-session-status class="mb-30" :status="session('status')" />

    <form method="POST" action="{{ route('login') }}" class="contact-form respondForm__form row y-gap-20 pt-30">
        @csrf

        <!-- Email Address -->
        <div class="col-12">
            <label for="email" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Email') }}</label>
            <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="username" placeholder="{{ __('Your Email') }}">
            <x-input-error :messages="$errors->get('email')" class="mt-5" />
        </div>

        <!-- Password -->
        <div class="col-12">
            <label for="password" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Password') }}</label>
            <input id="password" type="password" name="password" required autocomplete="current-password" placeholder="{{ __('Your Password') }}">
            <x-input-error :messages="$errors->get('password')" class="mt-5" />
        </div>

        <!-- Remember Me & Forgot Password -->
        <div class="col-12">
            <div class="d-flex justify-between items-center">
                <div class="form-checkbox">
                    <input type="checkbox" name="remember" id="remember_me">
                    <div class="form-checkbox__mark">
                        <div class="form-checkbox__icon icon-check"></div>
                    </div>
                    <label for="remember_me" class="text-14 lh-12 text-dark-1">{{ __('Remember me') }}</label>
                </div>
                @if (Route::has('password.request'))
                    <a class="text-14 lh-12 text-purple-1" href="{{ route('password.request') }}">
                        {{ __('Forgot your password?') }}
                    </a>
                @endif
            </div>
        </div>

        <div class="col-12">
            <button type="submit" class="button -md -green-1 text-dark-1 fw-500 w-1/1">
                {{ __('Log in') }}
            </button>
        </div>
    </form>

    <div class="lh-12 text-dark-1 fw-500 text-center mt-20">{{ __('Or sign in using') }}</div>

    <div class="d-flex x-gap-20 items-center justify-between pt-20">
        <div><button class="button -sm px-24 py-20 -outline-blue-3 text-blue-3 text-14">{{ __('Log In via Facebook') }}</button></div>
        <div><button class="button -sm px-24 py-20 -outline-red-3 text-red-3 text-14">{{ __('Log In via Google') }}</button></div>
    </div>
</x-auth-layout>