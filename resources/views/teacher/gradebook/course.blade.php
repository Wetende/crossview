<x-dashboard-layout>
    <x-slot name="title">Gradebook - {{ $course->name }}</x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <div class="dashboard__main">
        <div class="dashboard__content bg-light-4">
            <div class="row pb-50 mb-10">
                <div class="col-auto">
                    <h1 class="text-30 lh-12 fw-700">Gradebook: {{ $course->name }}</h1>
                    <div class="mt-10">
                        <a href="{{ route('teacher.gradebook.index') }}" class="text-purple-1 underline">Back to Course Selection</a>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                        <div class="d-flex items-center py-20 px-30 border-bottom-light">
                            <h2 class="text-17 lh-1 fw-500">Grades</h2>
                            {{-- Potential place for global actions like "Export Grades" --}}
                        </div>

                        <div class="py-30 px-30">
                            {{-- Filters (like the A-Z first name filter) can be added here if desired --}}
                            {{-- <div class="row y-gap-20 x-gap-20 items-center pb-30"> --}}
                            {{-- ... A-Z filter buttons from dshb-grades.html if needed ... --}}
                            {{-- </div> --}}
                            
                            @if($students->isEmpty())
                                <div class="text-center py-40">
                                    <i class="icon-users text-60 lh-1 text-light-5"></i>
                                    <h4 class="text-17 fw-500 mt-20">No students enrolled.</h4>
                                    <p class="mt-5">There are no students currently enrolled in this course to display in the gradebook.</p>
                                </div>
                            @elseif($gradableItems->isEmpty())
                                <div class="text-center py-40">
                                    <i class="icon-list text-60 lh-1 text-light-5"></i>
                                    <h4 class="text-17 fw-500 mt-20">No gradable items.</h4>
                                    <p class="mt-5">This course does not have any gradable items (like assignments or quizzes) defined yet.</p>
                                    {{-- Link to add assignments/quizzes could be here --}}
                                </div>
                            @else
                                <div class="py-25 px-30 bg-light-7 -dark-bg-dark-2 rounded-8">
                                    <div class="row y-gap-20 justify-between items-center scroll-responsive"> {{-- Added scroll-responsive for wider tables --}}
                                        <div class="col-xl-3 col-lg-3 col-md-4 col-sm-6"> <!-- Adjusted column for student name -->
                                            <div class="text-purple-1 fw-500">First name / Surname</div>
                                        </div>
                                        {{-- Dynamically generate headers for each gradable item --}}
                                        @foreach($gradableItems as $item)
                                            <div class="col-xl-auto col-lg-auto col-md-auto col-sm-3"> {{-- Auto width for items --}}
                                                <div class="d-flex justify-between items-center">
                                                    <div class="text-purple-1 fw-500">{{ $item['title'] ?? 'Unnamed Item' }}</div>
                                                    <div class="d-flex y-gap-5 x-gap-10 items-center pl-10">
                                                        <a href="{{ route($item['edit_route_name'], $item['edit_route_params']) }}" title="Edit {{ $item['title'] }}"><i class="icon-edit text-16 text-purple-1"></i></a>
                                                        @php
                                                            $linkSortDirection = 'asc';
                                                            if ($current_sort_item_key == $item['item_key']) {
                                                                if ($current_sort_direction == 'asc') {
                                                                    $linkSortDirection = 'desc';
                                                                }
                                                            }
                                                        @endphp
                                                        <a href="{{ route('teacher.gradebook.course', ['course' => $course->id, 'sort_by_item_key' => $item['item_key'], 'sort_direction' => $linkSortDirection]) }}" 
                                                           title="Sort by {{ $item['title'] }}">
                                                            <i class="icon-up_down text-20 text-purple-1 @if($current_sort_item_key == $item['item_key']) fw-bold @endif"></i>
                                                            {{-- Add visual indicator for sort direction e.g. an up/down arrow next to icon-up_down or different icons --}}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        @endforeach
                                        <div class="col-xl-auto col-lg-auto col-md-auto col-sm-3"> {{-- Auto width for course total --}}
                                            <div class="d-flex justify-between items-center">
                                                <div class="text-purple-1 fw-500">Course total</div>
                                                {{-- Icons for edit/sort --}}
                                            </div>
                                        </div>
                                        <div class="col-xl-auto col-lg-auto col-md-auto col-sm-2"> {{-- Actions column --}}
                                            <div class="text-purple-1 fw-500">Actions</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mt-10"> {{-- Wrapper for student rows --}}
                                    @foreach($students as $studentDataItem) {{-- Renamed to avoid conflict --}}
                                        @php $student = $studentDataItem['student']; $studentGrades = $studentDataItem['grades']; @endphp
                                        <div class="border-light-bottom py-20 px-30">
                                            <div class="row y-gap-20 justify-between items-center scroll-responsive">
                                                <div class="col-xl-3 col-lg-3 col-md-4 col-sm-6">
                                                    <div class="d-flex items-center">
                                                        <img src="{{ $student->profile_picture_path ? asset('storage/' . $student->profile_picture_path) : asset('img/avatars/user-MALE-1@2x.png') }}" alt="student avatar" class="size-40 rounded-full">
                                                        <div class="text-dark-1 ml-10">{{ $student->name }} <br> <span class="text-13 text-light-1">{{$student->email}}</span></div>
                                                    </div>
                                                </div>

                                                @foreach($gradableItems as $item)
                                                    <div class="col-xl-auto col-lg-auto col-md-auto col-sm-3">
                                                        <div class="d-flex justify-center"> {{-- Centering grade input --}}
                                                            <form action="{{ route('teacher.gradebook.grade.update', ['course' => $course->id, 'student' => $student->id]) }}" method="POST" class="d-inline-flex align-items-center grade-update-form">
                                                                @csrf
                                                                <input type="hidden" name="item_id" value="{{ $item['id'] }}">
                                                                <input type="hidden" name="item_type" value="{{ $item['type'] }}">
                                                                <input type="hidden" name="current_sort_item_key" value="{{ $current_sort_item_key }}"> {{-- Preserve sort --}}
                                                                <input type="hidden" name="current_sort_direction" value="{{ $current_sort_direction }}"> {{-- Preserve sort --}}
                                                                <input type="text" 
                                                                       name="score" 
                                                                       class="form-control text-center size-50" 
                                                                       value="{{ $studentGrades[$item['item_key']] ?? '' }}" 
                                                                       placeholder="-">
                                                                {{-- <button type="submit" class="btn btn-link text-purple-1 p-0 ml-5"><i class="icon-save text-16"></i></button> --}}
                                                            </form>
                                                        </div>
                                                    </div>
                                                @endforeach

                                                <div class="col-xl-auto col-lg-auto col-md-auto col-sm-3">
                                                    <div class="d-flex justify-center">
                                                        {{-- Calculate and display course total for student --}}
                                                        <span class="text-dark-1 fw-500">--</span> {{-- Placeholder for total --}}
                                                    </div>
                                                </div>
                                                <div class="col-xl-auto col-lg-auto col-md-auto col-sm-2">
                                                     <div class="d-flex justify-center">
                                                        {{-- <a href="#" class="text-purple-1"><i class="icon-zoom-in text-20"></i></a> --}}
                                                        {{-- Action for student report/details --}}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                                <div class="py-20 px-30">
                                     {{-- Add a "Save All Changes" button here if individual save buttons are removed from grade inputs --}}
                                     {{-- <button type="button" id="saveAllGradesBtn" class="button -md -purple-1 text-white">Save All Changes</button> --}}
                                </div>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    @push('scripts')
    <script>
        // Add JS for features like inline editing save, or "Save All Changes"
        document.addEventListener('DOMContentLoaded', function() {
            // Example: Autosave on input change (if desired, can be complex with many inputs)
            const gradeForms = document.querySelectorAll('.grade-update-form');
            gradeForms.forEach(form => {
                const input = form.querySelector('input[name="score"]');
                if (input) {
                    input.addEventListener('change', function() {
                        // Could submit the form via AJAX here for a smoother experience
                        // form.submit(); // Traditional submit

                        // Implement AJAX submission for better UX
                    });
                }
            });
        });
    </script>
    @endpush
</x-dashboard-layout> 