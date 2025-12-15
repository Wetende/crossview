<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">Generate Payouts</h1>
                <div class="mt-10">Generate new payouts for teachers</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('admin.payouts.index') }}" class="button -md -outline-purple-1 text-purple-1">
                    <i class="icon-arrow-left mr-10"></i>
                    Back to Payouts
                </a>
            </div>
        </div>

        @if(session('success'))
            <div class="alert -success mb-30">
                <div class="alert__content">{{ session('success') }}</div>
            </div>
        @endif

        @if(session('error'))
            <div class="alert -danger mb-30">
                <div class="alert__content">{{ session('error') }}</div>
            </div>
        @endif
        
        <div class="row y-gap-30">
            <div class="col-12">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex justify-between items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Payout Generation</h2>
                    </div>
                    <div class="py-30 px-30">
                        <form action="{{ route('admin.payouts.generate') }}" method="POST">
                            @csrf
                            
                            <div class="row y-gap-20">
                                <div class="col-12">
                                    <div class="alert -info-light mb-30">
                                        <div class="alert__content">
                                            <p>Generate payouts for all eligible teachers or for a specific teacher. Payouts will be calculated based on course purchases and subscription enrollments within the specified period.</p>
                                            <p class="mt-10">Only teachers with verified payment details will receive payouts.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="period_start">Payout Period Start</label>
                                    <input type="date" id="period_start" name="period_start" class="form-control" value="{{ old('period_start', now()->startOfMonth()->format('Y-m-d')) }}" required>
                                    @error('period_start')
                                        <div class="text-red-1 mt-1">{{ $message }}</div>
                                    @enderror
                                </div>
                                
                                <div class="col-md-6">
                                    <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="period_end">Payout Period End</label>
                                    <input type="date" id="period_end" name="period_end" class="form-control" value="{{ old('period_end', now()->endOfMonth()->format('Y-m-d')) }}" required>
                                    @error('period_end')
                                        <div class="text-red-1 mt-1">{{ $message }}</div>
                                    @enderror
                                </div>
                                
                                <div class="col-12">
                                    <div class="form-switch d-flex items-center">
                                        <div class="switch">
                                            <input type="checkbox" id="specific_teacher_toggle">
                                            <label for="specific_teacher_toggle"></label>
                                        </div>
                                        <div class="text-15 text-dark-1 ml-10">Generate for a specific teacher</div>
                                    </div>
                                </div>
                                
                                <div class="col-md-6 specific-teacher-select d-none">
                                    <label class="text-16 lh-1 fw-500 text-dark-1 mb-10" for="teacher_id">Select Teacher</label>
                                    <select id="teacher_id" name="teacher_id" class="form-select">
                                        <option value="">-- Select Teacher --</option>
                                        @foreach($teachers as $teacher)
                                            <option value="{{ $teacher->id }}">{{ $teacher->name }}</option>
                                        @endforeach
                                    </select>
                                    @error('teacher_id')
                                        <div class="text-red-1 mt-1">{{ $message }}</div>
                                    @enderror
                                </div>
                                
                                <div class="col-12 border-top-light mt-30 pt-30">
                                    <button type="submit" class="button -md -purple-1 text-white">
                                        Generate Payouts
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const specificTeacherToggle = document.getElementById('specific_teacher_toggle');
            const specificTeacherSelect = document.querySelector('.specific-teacher-select');
            const teacherIdSelect = document.getElementById('teacher_id');
            
            specificTeacherToggle.addEventListener('change', function() {
                specificTeacherSelect.classList.toggle('d-none', !this.checked);
                
                if (this.checked) {
                    // Set teacher_id as required when the toggle is checked
                    teacherIdSelect.setAttribute('required', 'required');
                } else {
                    // Remove required attribute when the toggle is unchecked
                    teacherIdSelect.removeAttribute('required');
                    teacherIdSelect.value = ''; // Reset the select value
                }
            });
        });
    </script>
    @endpush
</x-dashboard-layout> 