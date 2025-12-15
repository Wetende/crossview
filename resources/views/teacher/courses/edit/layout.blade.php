<x-dashboard-layout>
    <x-slot name="header">
        @include('layouts.partials.teacher.header')
    </x-slot>

    <x-slot name="title">Edit Course: {{ $course->title }}</x-slot>
    
    <x-slot name="styles">
        @stack('styles')
    </x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <div class="page-content">
        <div class="container-fluid">
            <!-- start page title -->
            <div class="row">
                <div class="col-12">
                    <div class="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 class="mb-sm-0 fw-700 text-dark-1">Edit Course: {{ $course->title }}</h4>
                        <div class="page-title-right">
                            <ol class="breadcrumb m-0">
                                <li class="breadcrumb-item"><a href="{{ route('teacher.overview') }}">Dashboard</a></li>
                                <li class="breadcrumb-item"><a href="{{ route('teacher.courses.index') }}">My Courses</a></li>
                                <li class="breadcrumb-item active">Edit Course</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
            <!-- end page title -->

            <div class="row">
                <div class="col-lg-12">
                    <div class="card -dark-bg-light-1">
                        <div class="card-header">
                            <ul class="nav nav-tabs-custom rounded card-header-tabs border-bottom-0" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link {{ request()->routeIs('teacher.courses.edit', $course->id) || request()->routeIs('teacher.courses.curriculum', $course->id) || request()->routeIs('teacher.courses.builder', $course->id) ? 'active' : '' }}" 
                                       href="{{ route('teacher.courses.builder', $course->id) }}" 
                                       role="tab" aria-selected="{{ request()->routeIs('teacher.courses.edit', $course->id) || request()->routeIs('teacher.courses.curriculum', $course->id) || request()->routeIs('teacher.courses.builder', $course->id) ? 'true' : 'false' }}">
                                        Builder
                                    </a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link {{-- Add active class logic --}}" 
                                       href="{{-- route('teacher.courses.settings', $course->id) --}}" {{-- Placeholder --}}
                                       role="tab" aria-selected="false">
                                        Settings
                                    </a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link {{-- Add active class logic --}}" 
                                       href="{{-- route('teacher.courses.pricing', $course->id) --}}" {{-- Placeholder --}}
                                       role="tab" aria-selected="false">
                                        Pricing
                                    </a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link {{-- Add active class logic --}}" 
                                       href="{{-- route('teacher.courses.drip', $course->id) --}}" {{-- Placeholder --}}
                                       role="tab" aria-selected="false">
                                        Drip
                                    </a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link {{-- Add active class logic --}}" 
                                       href="{{-- route('teacher.courses.faq', $course->id) --}}" {{-- Placeholder --}}
                                       role="tab" aria-selected="false">
                                        FAQ
                                    </a>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <a class="nav-link {{-- Add active class logic --}}" 
                                       href="{{-- route('teacher.courses.notices', $course->id) --}}" {{-- Placeholder --}}
                                       role="tab" aria-selected="false">
                                        Notices
                                    </a>
                                </li>
                                <!-- Add other tabs as per plan/phase-3-course-management.md -->
                            </ul>
                        </div>
                        <div class="card-body p-4">
                            <div class="tab-content">
                                <div class="tab-pane active" id="curriculumTabPane" role="tabpanel">
                                    @yield('tab-content')
                                </div>
                                <!-- Add other tab panes here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <x-slot name="scripts">
        <!-- Rich Text Editor -->
        <script src="{{ asset('assets/js/tinymce/tinymce.min.js') }}"></script>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                tinymce.init({
                    selector: '.rich-editor',
                    plugins: 'lists link image media table code',
                    toolbar: 'formatselect | bold italic | bullist numlist | link image | table | code',
                    height: 300,
                    images_upload_url: '{{ route("teacher.upload.image") }}',
                    images_upload_credentials: true
                });
            });
        </script>
        
        <!-- Sortable.js for drag & drop -->
        <script src="{{ asset('assets/js/sortable.min.js') }}"></script>
        
        <!-- Course Thumbnail Upload -->
        <script src="{{ asset('js/course-thumbnail-upload.js') }}"></script>
        
        @stack('tab-scripts')
    </x-slot>
</x-dashboard-layout> 