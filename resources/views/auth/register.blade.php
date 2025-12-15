<x-dashboard-layout title="Sign Up">
    <div class="dashboard__content bg-light-4">
        <div class="form-page__content py-50">
            <div class="container">
                <div class="row justify-center items-center">
                    <div class="col-xl-6 col-lg-7 col-md-9">
                        <div class="px-50 py-50 md:px-25 md:py-25 bg-white -dark-bg-dark-1 shadow-4 rounded-16">
                            <h3 class="text-30 lh-13 fw-500 text-center">{{ __('Sign Up') }}</h3>
                            <p class="mt-10 text-center">{{ __('Already have an account?') }} <a href="{{ route('login') }}" class="text-purple-1 fw-500">{{ __('Log in') }}</a></p>

                            <form method="POST" action="{{ route('register') }}" class="contact-form respondForm__form row y-gap-20 pt-30">
                                @csrf

                                <div class="col-lg-6">
                                    <label for="first_name" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('First Name') }} <span class="text-red-1">*</span></label>
                                    <input id="first_name" type="text" name="first_name" value="{{ old('first_name') }}" required autofocus autocomplete="given-name" placeholder="{{ __('First Name') }}">
                                    @error('first_name')
                                        <span class="text-red-1 text-12 mt-5 d-block">{{ $message }}</span>
                                    @enderror
                                </div>

                                <div class="col-lg-6">
                                    <label for="last_name" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Last Name') }} <span class="text-red-1">*</span></label>
                                    <input id="last_name" type="text" name="last_name" value="{{ old('last_name') }}" required autocomplete="family-name" placeholder="{{ __('Last Name') }}">
                                    @error('last_name')
                                        <span class="text-red-1 text-12 mt-5 d-block">{{ $message }}</span>
                                    @enderror
                                </div>

                                <div class="col-12">
                                    <label for="email" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Email Address') }} <span class="text-red-1">*</span></label>
                                    <input id="email" type="email" name="email" value="{{ old('email') }}" required autocomplete="username" placeholder="{{ __('your-email@domain.com') }}">
                                    @error('email')
                                        <span class="text-red-1 text-12 mt-5 d-block">{{ $message }}</span>
                                    @enderror
                                </div>

                                <div class="col-12">
                                    <label for="role" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('I am a') }} <span class="text-red-1">*</span></label>
                                    <select id="role" name="role" class="selectize-singular" required>
                                        <option value="" disabled {{ old('role') ? '' : 'selected' }}>{{ __('Select your role') }}</option>
                                        <option value="student" {{ old('role') == 'student' ? 'selected' : '' }}>{{ __('Student') }}</option>
                                        <option value="teacher" {{ old('role') == 'teacher' ? 'selected' : '' }}>{{ __('Teacher') }}</option>
                                        <option value="parent" {{ old('role') == 'parent' ? 'selected' : '' }}>{{ __('Parent') }}</option>
                                    </select>
                                    @error('role')
                                        <span class="text-red-1 text-12 mt-5 d-block">{{ $message }}</span>
                                    @enderror
                                </div>

                                <div class="col-lg-6">
                                    <label for="password" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Password') }} <span class="text-red-1">*</span></label>
                                    <input id="password" type="password" name="password" required autocomplete="new-password" placeholder="{{ __('Min. 8 characters') }}">
                                    @error('password')
                                        <span class="text-red-1 text-12 mt-5 d-block">{{ $message }}</span>
                                    @enderror
                                </div>

                                <div class="col-lg-6">
                                    <label for="password_confirmation" class="text-16 lh-1 fw-500 text-dark-1 mb-10">{{ __('Confirm Password') }} <span class="text-red-1">*</span></label>
                                    <input id="password_confirmation" type="password" name="password_confirmation" required autocomplete="new-password" placeholder="{{ __('Confirm Password') }}">
                                    @error('password_confirmation')
                                        <span class="text-red-1 text-12 mt-5 d-block">{{ $message }}</span>
                                    @enderror
                                </div>

                                <div class="col-12 mt-30">
                                    <button type="submit" class="button -md -purple-1 text-white fw-500 w-1/1">
                                        {{ __('Sign Up') }}
                                    </button>
                                </div>
                            </form>

                            <div class="lh-12 text-dark-1 fw-500 text-center mt-30">{{ __('Or sign up using') }}</div>

                            <div class="row x-gap-20 y-gap-20 items-center justify-center pt-20">
                                <div class="col-auto">
                                    <button class="button -md px-24 py-20 -outline-blue-1 text-blue-1 text-14 w-1/1">
                                        <i class="icon-facebook text-16 mr-10"></i>
                                        {{ __('Facebook') }}
                                    </button>
                                </div>
                                <div class="col-auto">
                                    <button class="button -md px-24 py-20 -outline-red-1 text-red-1 text-14 w-1/1">
                                        <i class="icon-google text-16 mr-10"></i>
                                        {{ __('Google') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-dashboard-layout>