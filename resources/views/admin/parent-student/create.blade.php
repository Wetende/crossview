<x-dashboard-layout>
    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <div class="dashboard__content bg-light-4 py-30 px-30">
        {{-- Display validation errors --}}
        @if($errors->any())
            <div class="row mb-20">
                <div class="col-12">
                    <div class="alert alert-error bg-light-8 border-red-3 text-red-3">
                        <ul class="list-disc pl-20">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                </div>
            </div>
        @endif

        {{-- Display success/error messages --}}
        @if(session('success'))
            <div class="row mb-20">
                <div class="col-12">
                    <div class="alert alert-success bg-light-9 border-success-3 text-success-3">
                        {{ session('success') }}
                    </div>
                </div>
            </div>
        @endif

        @if(session('error'))
            <div class="row mb-20">
                <div class="col-12">
                    <div class="alert alert-error bg-light-8 border-red-3 text-red-3">
                        {{ session('error') }}
                    </div>
                </div>
            </div>
        @endif

        <div class="row">
            <div class="col-lg-10 offset-lg-1">
                <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <h2 class="text-20 lh-1 fw-500 mb-30">Link a Parent to a Student</h2>
                    
                    <form action="{{ route('admin.parent-student.store') }}" method="POST" class="contact-form row y-gap-30">
                        @csrf
                        
                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Select Parent</label>
                            <select name="parent_id" id="parent_id" class="js-parent-select form-control" required>
                                <option value="">-- Select a Parent --</option>
                                @foreach($parents as $parent)
                                    <option value="{{ $parent->id }}" {{ old('parent_id') == $parent->id ? 'selected' : '' }}>
                                        {{ $parent->name }} ({{ $parent->email }})
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        
                        <div class="col-12">
                            <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Select Student</label>
                            <select name="student_id" id="student_id" class="js-student-select form-control" required>
                                <option value="">-- Select a Student --</option>
                                @foreach($students as $student)
                                    <option value="{{ $student->id }}" {{ old('student_id') == $student->id ? 'selected' : '' }}>
                                        {{ $student->name }} ({{ $student->email }})
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        
                        <div class="col-12 mt-20">
                            <button type="submit" class="button -md -purple-1 text-white">Create Connection</button>
                            <a href="{{ route('admin.parent-student.index') }}" class="button -md -light-3 -dark-bg-dark-3 text-dark-1 -dark-text-white">Cancel</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize selectize for better user experience
            if (typeof $.fn.selectize !== 'undefined') {
                $('.js-parent-select').selectize({
                    placeholder: 'Search for a parent...',
                    create: false,
                    sortField: 'text'
                });
                
                $('.js-student-select').selectize({
                    placeholder: 'Search for a student...',
                    create: false,
                    sortField: 'text'
                });
            }
        });
    </script>
    @endpush
</x-dashboard-layout> 