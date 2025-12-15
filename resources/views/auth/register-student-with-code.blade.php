<x-auth-layout>
    <x-slot name="title">Student Registration - {{ config('app.name', 'Laravel') }}</x-slot>

    <h3 class="text-30 lh-13">{{ __('Student Registration with Code') }}</h3>
    <p class="mt-10">{{ __('Please enter your classroom code and set a password.') }}</p>

    <x-auth-session-status class="mb-30" :status="session('status')" />

    <form method="POST" action="{{ route('register.student.store') }}" class="contact-form respondForm__form row y-gap-20 pt-30">
        @csrf

        <!-- Classroom Code -->
        <div class="col-12">
            <label for="classroom_code" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Classroom Code') }}</label>
            <input id="classroom_code" type="text" name="classroom_code" value="{{ old('classroom_code') }}" required autofocus placeholder="{{ __('Enter your classroom code') }}">
            <x-input-error :messages="$errors->get('classroom_code')" class="mt-5" />
        </div>

        <!-- Password -->
        <div class="col-12">
            <label for="password" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Password') }}</label>
            <input id="password" type="password" name="password" required autocomplete="new-password" placeholder="{{ __('Your Password') }}">
            <x-input-error :messages="$errors->get('password')" class="mt-5" />
        </div>

        <!-- Confirm Password -->
        <div class="col-12">
            <label for="password_confirmation" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Confirm Password') }}</label>
            <input id="password_confirmation" type="password" name="password_confirmation" required autocomplete="new-password" placeholder="{{ __('Confirm Your Password') }}">
            <x-input-error :messages="$errors->get('password_confirmation')" class="mt-5" />
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
            <a href="{{ route('register.student.code-check') }}" class="text-14 lh-12 text-purple-1">
                <i class="icon-arrow-left text-13 mr-8"></i>
                {{ __('Back') }}
            </a>
        </div>
    </form>
</x-auth-layout> 