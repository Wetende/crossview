<x-auth-layout>
    <x-slot name="title">Reset Password - {{ config('app.name', 'Laravel') }}</x-slot>

    <h3 class="text-30 lh-13">{{ __('Reset Password') }}</h3>
    <p class="mt-10">{{ __('Please enter your new password.') }}</p>

    <form method="POST" action="{{ route('password.store') }}" class="contact-form respondForm__form row y-gap-20 pt-30">
        @csrf

        <!-- Password Reset Token -->
        <input type="hidden" name="token" value="{{ $request->route('token') }}">

        <!-- Email Address -->
        <div class="col-12">
            <label for="email" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Email') }}</label>
            <input id="email" type="email" name="email" value="{{ old('email', $request->email) }}" required autofocus autocomplete="username" placeholder="{{ __('Your Email') }}">
            <x-input-error :messages="$errors->get('email')" class="mt-5" />
        </div>

        <!-- Password -->
        <div class="col-12">
            <label for="password" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Password') }}</label>
            <input id="password" type="password" name="password" required autocomplete="new-password" placeholder="{{ __('Your New Password') }}">
            <x-input-error :messages="$errors->get('password')" class="mt-5" />
        </div>

        <!-- Confirm Password -->
        <div class="col-12">
            <label for="password_confirmation" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Confirm Password') }}</label>
            <input id="password_confirmation" type="password" name="password_confirmation" required autocomplete="new-password" placeholder="{{ __('Confirm Your New Password') }}">
            <x-input-error :messages="$errors->get('password_confirmation')" class="mt-5" />
        </div>

        <div class="col-12">
            <button type="submit" class="button -md -green-1 text-dark-1 fw-500 w-1/1">
                {{ __('Reset Password') }}
            </button>
        </div>
    </form>
</x-auth-layout>
