<x-auth-layout>
    <x-slot name="title">Student Registration - {{ config('app.name', 'Laravel') }}</x-slot>

    <h3 class="text-30 lh-13">{{ __('Student Signup') }}</h3>
    <p class="mt-10">{{ __('Do you have a code to join the classroom?') }}</p>

    <x-auth-session-status class="mb-30" :status="session('status')" />
    <x-input-error :messages="$errors->get('has_code')" class="mb-30 text-error-1 text-center" />

    <form id="codeCheckForm" method="POST" action="{{ route('register.student.handle-code-check') }}" class="pt-30">
        @csrf
        <input type="hidden" name="has_code" id="hasCodeValue">

        <div class="row y-gap-20 justify-between">
            <!-- Yes, I have a code Card -->
            <div class="col-lg-6">
                <div onclick="submitCodeCheck('yes')" class="border-light rounded-16 px-20 py-30 shadow-1 hover:shadow-2 cursor-pointer h-100">
                    <div class="d-flex flex-column justify-between h-100">
                        <div>
                            <div class="d-flex justify-center">
                                <img src="{{ asset('img/auth/happy-baby-elephant.jpg') }}" alt="Yes" class="rounded-8" style="width: 100%; height: 250px; object-fit: cover;">
                            </div>
                            <h3 class="text-20 lh-15 text-green-1 fw-500 text-center mt-20">{{ __('Yes') }}</h3>
                            <p class="text-center mt-10 text-14 lh-15">{{ __('I have a classroom code!') }}</p>
                        </div>
                        <div class="d-flex justify-center mt-20">
                            <div class="button -sm -outline-green-1 text-green-1 px-25">{{ __('Continue') }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- No, I don't have a code Card -->
            <div class="col-lg-6">
                <div onclick="submitCodeCheck('no')" class="border-light rounded-16 px-20 py-30 shadow-1 hover:shadow-2 cursor-pointer h-100">
                    <div class="d-flex flex-column justify-between h-100">
                        <div>
                            <div class="d-flex justify-center">
                                <img src="{{ asset('img/auth/baby-elephant.jpg') }}" alt="No" class="rounded-8" style="width: 100%; height: 250px; object-fit: cover;">
                            </div>
                            <h3 class="text-20 lh-15 text-red-1 fw-500 text-center mt-20">{{ __('No') }}</h3>
                            <p class="text-center mt-10 text-14 lh-15">{{ __('I did not receive a code.') }}</p>
                        </div>
                        <div class="d-flex justify-center mt-20">
                            <div class="button -sm -outline-red-1 text-red-1 px-25">{{ __('Continue') }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>

    <div class="mt-30 text-center">
        <p class="text-15 lh-1">
            {{ __('Already have an account?') }}
            <a href="{{ route('login') }}" class="text-purple-1">{{ __('Sign in instead') }}</a>
        </p>
    </div>

    <div class="mt-15 text-center">
        <a href="{{ route('register') }}" class="text-14 lh-12 text-purple-1">
            <i class="icon-arrow-left text-13 mr-8"></i>
            {{ __('Back to role selection') }}
        </a>
    </div>

    <script>
        function submitCodeCheck(value) {
            document.getElementById('hasCodeValue').value = value;
            document.getElementById('codeCheckForm').submit();
        }
    </script>
</x-auth-layout> 