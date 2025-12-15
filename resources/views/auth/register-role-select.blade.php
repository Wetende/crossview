<x-auth-layout>
    <x-slot name="title">Select Role - {{ config('app.name', 'Laravel') }}</x-slot>

    <div class="text-center">
        <h1 class="text-30 lh-13 text-dark-1">Who are you?</h1>
        <p class="mt-10">Start your free trial today!</p>
    </div>

    <x-auth-session-status class="mb-30" :status="session('status')" />
    <x-input-error :messages="$errors->get('role')" class="mb-30 text-error-1 text-center" />

    <form id="roleSelectionForm" method="POST" action="{{ route('register.select-role') }}">
        @csrf
        <input type="hidden" name="role" id="selectedRole">

        <div class="row y-gap-20 justify-between">
            <!-- Student Card -->
            <div class="col-lg-4 col-md-6">
                <div onclick="submitRole('student')" class="border-light rounded-16 px-20 py-30 shadow-1 hover:shadow-2 cursor-pointer h-100 d-flex flex-column">
                    <div class="d-flex flex-column justify-between h-100">
                        <div>
                            <div class="d-flex justify-center">
                                <img src="{{ asset('img/auth/student.jpg') }}" alt="Student" class="rounded-8" style="width: 100%; height: 200px; object-fit: cover;">
                            </div>
                            <h3 class="text-20 lh-15 text-dark-1 fw-500 text-center mt-20">Student</h3>
                            <p class="text-center mt-10 text-14 lh-15">Join your classmates in smart learning!</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Teacher Card -->
            <div class="col-lg-4 col-md-6">
                <div onclick="submitRole('teacher')" class="border-light rounded-16 px-20 py-30 shadow-1 hover:shadow-2 cursor-pointer h-100 d-flex flex-column">
                    <div class="d-flex flex-column justify-between h-100">
                        <div>
                            <div class="d-flex justify-center">
                                <img src="{{ asset('img/auth/teacher.jpeg') }}" alt="Teacher" class="rounded-8" style="width: 100%; height: 200px; object-fit: cover;">
                            </div>
                            <h3 class="text-20 lh-15 text-dark-1 fw-500 text-center mt-20">Teacher</h3>
                            <p class="text-center mt-10 text-14 lh-15">For educators in a school setting!</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Parent Card -->
            <div class="col-lg-4 col-md-6">
                <div onclick="submitRole('parent')" class="border-light rounded-16 px-20 py-30 shadow-1 hover:shadow-2 cursor-pointer h-100 d-flex flex-column">
                    <div class="d-flex flex-column justify-between h-100">
                        <div>
                            <div class="d-flex justify-center">
                                <img src="{{ asset('img/auth/parent.jpg') }}" alt="Parent" class="rounded-8" style="width: 100%; height: 200px; object-fit: cover;">
                            </div>
                            <h3 class="text-20 lh-15 text-dark-1 fw-500 text-center mt-20">Parent</h3>
                            <p class="text-center mt-10 text-14 lh-15">Register your child and track progress!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>

    <div class="mt-30 text-center">
        <p class="text-15 lh-1">
            Already a member? 
            <a href="{{ route('login') }}" class="text-purple-1">Log in to your account</a>
        </p>
    </div>

    <script>
        function submitRole(role) {
            document.getElementById('selectedRole').value = role;
            document.getElementById('roleSelectionForm').submit();
        }
    </script>
</x-auth-layout> 