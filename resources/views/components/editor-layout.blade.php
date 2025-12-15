@props(['course'])

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#ffffff">

    <title>{{ $course->title ?? config('app.name', 'LMS') }} | Course Editor</title>

    <link rel="icon" href="{{ asset('favicon.ico') }}">

    <link rel="stylesheet" href="{{ asset('css/vendors.css') }}?v={{ time() }}">
    <link rel="stylesheet" href="{{ asset('css/main.css') }}?v={{ time() }}">
    <link rel="stylesheet" href="{{ asset('css/course-editor.css') }}?v={{ time() }}">
    <link rel="stylesheet" href="{{ asset('css/editor-styles.css') }}?v={{ time() }}">

    <style>
        .builder-container {
            min-height: 90vh;
            background-color: #f8fafc;
            padding: 1.5rem;
            border-radius: 0.5rem;
        }

        .course-section {
            background-color: #fff;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 1.5rem;
            overflow: hidden;
        }

        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.5rem;
            background-color: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }

        .section-title {
            font-weight: 600;
            margin: 0;
            color: #1e293b;
            font-size: 1.125rem;
        }

        .section-actions {
            display: flex;
            gap: 0.5rem;
        }

        .section-content {
            padding: 1rem;
        }

        .section-content-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .content-item {
            display: flex;
            align-items: center;
            padding: 0.875rem;
            border-radius: 0.375rem;
            background-color: #fff;
            border: 1px solid #e9ecef;
            margin-bottom: 0.5rem;
        }

        .add-section-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 1.5rem;
            background-color: #f1f5f9;
            border: 1px dashed #cbd5e1;
            border-radius: 0.5rem;
            color: #0d6efd;
            font-weight: 500;
            cursor: pointer;
            width: 100%;
            margin-bottom: 1.5rem;
        }

        .modal.fade .modal-dialog {
            transition: transform 0.3s ease-out;
        }

        @media (min-width: 576px) {
            .modal-dialog {
                max-width: 500px;
                margin: 1.75rem auto;
            }
        }
    </style>

    <style>
        .editor-layout {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background-color: #f8f9fa;
        }

        .editor-nav {
            background-color: white;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            z-index: 1030;
        }

        .course-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #374151;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 300px;
            margin-right: 2rem;
        }

        .editor-tabs {
            display: flex;
            flex-grow: 1;
        }

        .editor-tabs .nav-pills .nav-link {
            color: #4B5563;
            border-radius: 6px;
            padding: 0.5rem 1rem;
            margin-right: 0.5rem;
            font-weight: 500;
        }

        .editor-tabs .nav-pills .nav-link.active {
            background-color: #3E7BFA;
            color: white;
        }

        .editor-tabs .nav-pills .nav-link:hover:not(.active) {
            background-color: #F3F4F6;
        }

        .editor-content {
            display: flex;
            flex: 1;
            overflow: hidden;
            height: calc(100vh - 80px);
            /* Adjust based on nav height */
        }

        .editor-sidebar {
            width: 350px;
            height: 100%;
            background-color: #F5F7FA;
            overflow-y: auto;
            overflow-x: hidden;
            border-right: 1px solid #E5E7EB;
            padding-bottom: 2rem;
        }

        .editor-main-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            background-color: #F5F7FA;
            height: 100%;
            padding-bottom: 2rem;
        }

        /* Curriculum section styles matching second image */
        .curriculum-heading {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 1rem;
            padding: 0 1rem;
            position: sticky;
            top: 0;
            background-color: #F5F7FA;
            z-index: 10;
        }

        .curriculum-section {
            margin-bottom: 1.5rem;
        }

        .curriculum-section-header {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            cursor: pointer;
            border-bottom: 1px solid #E5E7EB;
            background-color: white;
        }

        .curriculum-section-header .section-drag-handle {
            color: #9CA3AF;
            margin-right: 0.5rem;
            font-size: 1rem;
        }

        .curriculum-section-header .section-title {
            font-weight: 500;
            font-size: 0.95rem;
            margin: 0;
            flex-grow: 1;
        }

        .curriculum-section-header .section-toggle {
            color: #9CA3AF;
            font-size: 0.875rem;
        }

        .curriculum-content-list {
            list-style: none;
            padding: 0.5rem 1rem;
            margin: 0;
            background-color: white;
        }

        .curriculum-content-item {
            display: flex;
            align-items: center;
            padding: 0.625rem 0.5rem;
            margin-bottom: 0.5rem;
            border-radius: 0.25rem;
            cursor: pointer;
        }

        .curriculum-content-item .content-drag-handle {
            color: #D1D5DB;
            margin-right: 0.5rem;
            font-size: 0.875rem;
        }

        .curriculum-content-item .content-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 50%;
            margin-right: 0.75rem;
            color: white;
            font-size: 0.75rem;
        }

        .curriculum-content-item .content-icon.video {
            background-color: #F97316;
        }

        .curriculum-content-item .content-icon.document {
            background-color: #10B981;
        }

        .curriculum-content-item .content-icon.quiz {
            background-color: #8B5CF6;
        }

        .curriculum-content-item .content-title {
            font-size: 0.875rem;
            color: #4B5563;
            flex-grow: 1;
            margin: 0;
        }

        .curriculum-section-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            background-color: white;
            border-top: 1px solid #F3F4F6;
        }

        .add-lesson-btn {
            display: flex;
            align-items: center;
            padding: 0.5rem 1rem;
            background-color: #F3F4F6;
            border-radius: 0.25rem;
            color: #4B5563;
            font-size: 0.875rem;
            font-weight: 500;
            border: none;
            cursor: pointer;
        }

        .add-lesson-btn:hover {
            background-color: #E5E7EB;
        }

        .add-lesson-btn i {
            margin-right: 0.5rem;
            font-size: 0.75rem;
        }

        /* Custom scrollbar styles */
        .editor-sidebar::-webkit-scrollbar,
        .editor-main-content::-webkit-scrollbar {
            width: 6px;
        }

        .editor-sidebar::-webkit-scrollbar-track,
        .editor-main-content::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
        }

        .editor-sidebar::-webkit-scrollbar-thumb,
        .editor-main-content::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
        }

        .editor-sidebar::-webkit-scrollbar-thumb:hover,
        .editor-main-content::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
        }

        /* Ensure smooth scrolling */
        .editor-sidebar,
        .editor-main-content {
            scroll-behavior: smooth;
        }

        .search-materials-btn {
            display: flex;
            align-items: center;
            padding: 0.5rem 1rem;
            background-color: white;
            border: 1px solid #E5E7EB;
            border-radius: 0.25rem;
            color: #6B7280;
            font-size: 0.875rem;
            cursor: pointer;
        }

        .search-materials-btn i {
            margin-right: 0.5rem;
            font-size: 0.75rem;
        }

        .new-section-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem;
            margin: 1rem;
            background-color: white;
            border: 1px solid #E5E7EB;
            border-radius: 0.375rem;
            color: #3E7BFA;
            font-weight: 500;
            font-size: 0.875rem;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .new-section-btn i {
            margin-right: 0.5rem;
            font-size: 0.75rem;
        }

        /* Empty state styling */
        .empty-state-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            max-width: 500px;
            margin: 0 auto;
        }

        .empty-state-icon {
            width: 100px;
            height: 100px;
            margin-bottom: 1.5rem;
        }

        .empty-state-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 1rem;
        }

        .empty-state-text {
            font-size: 1rem;
            color: #64748b;
            margin-bottom: 2rem;
            line-height: 1.5;
        }

        .empty-state-button {
            display: flex;
            align-items: center;
            padding: 0.75rem 1.5rem;
            background-color: #3E7BFA;
            border-radius: 0.375rem;
            color: white;
            font-weight: 500;
            border: none;
            cursor: pointer;
        }

        .empty-state-button i {
            margin-right: 0.75rem;
        }

        /* Responsive Styles */
        @media (max-width: 992px) {
            .course-title {
                max-width: 200px;
            }

            .editor-tabs .nav-pills .nav-link {
                padding: 0.4rem 0.75rem;
                font-size: 0.9rem;
            }
        }

        @media (max-width: 768px) {
            .course-title {
                max-width: 150px;
            }

            .editor-content {
                flex-direction: column;
                height: calc(100vh - 100px);
                /* Adjust for mobile nav height */
            }

            .editor-sidebar {
                width: 100%;
                height: auto;
                max-height: 40vh;
                min-height: 200px;
                border-right: none;
                border-bottom: 1px solid #E5E7EB;
                overflow-y: auto;
                flex-shrink: 0;
            }

            .editor-main-content {
                flex: 1;
                height: auto;
                min-height: 0;
                overflow-y: auto;
            }

            .editor-tabs .nav {
                overflow-x: auto;
                flex-wrap: nowrap;
                padding-bottom: 0.5rem;
            }

            .editor-tabs .nav-item {
                white-space: nowrap;
            }

            .empty-state-container {
                padding: 1rem;
            }
        }

        @media (max-width: 576px) {
            .editor-nav .d-flex {
                flex-wrap: wrap;
                padding: 0.5rem 0;
            }

            .course-title {
                font-size: 1rem;
                margin-top: 0.5rem;
                margin-bottom: 0.5rem;
                max-width: 100%;
                width: 100%;
            }

            .editor-tabs {
                width: 100%;
                overflow-x: auto;
            }

            .empty-state-icon {
                width: 80px;
                height: 80px;
            }

            .empty-state-title {
                font-size: 1.25rem;
            }

            .empty-state-text {
                font-size: 0.875rem;
            }
        }
    </style>

    {{ $styles ?? '' }}
</head>

<body class="preloader-visible" data-barba="wrapper">
    <!-- preloader start -->
    <div class="preloader js-preloader">
        <div class="preloader__bg"></div>
    </div>
    <!-- preloader end -->

    <div class="editor-layout">
        <!-- Top Navigation Bar with Integrated Editor Tabs -->
        <div class="editor-nav">
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center py-3">
                    <div class="d-flex align-items-center flex-grow-1">
                        <a href="{{ route('teacher.courses.index') }}" class="btn btn-outline-secondary btn-sm me-3">
                            <i class="fas fa-arrow-left me-1"></i> Back to Courses
                        </a>
                        <h4 class="mb-0 course-title">{{ $course->title }}</h4>

                        <!-- Editor Tabs - Integrated into the top navigation -->
                        <div class="editor-tabs">
                            <ul class="nav nav-pills">
                                <li class="nav-item">
                                    <a class="nav-link {{ request()->routeIs('teacher.courses.builder', $course) ? 'active' : '' }}"
                                        href="{{ route('teacher.courses.builder', $course) }}">
                                        <i class="fas fa-book me-1"></i> Curriculum
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link {{ request()->routeIs('teacher.courses.pricing', $course) ? 'active' : '' }}"
                                        href="{{ route('teacher.courses.pricing', $course) }}">
                                        <i class="fas fa-tag me-1"></i> Pricing
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link {{ request()->routeIs('teacher.courses.faq', $course) ? 'active' : '' }}"
                                        href="{{ route('teacher.courses.faq', $course) }}">
                                        <i class="fas fa-question-circle me-1"></i> FAQ
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link {{ request()->routeIs('teacher.courses.notices', $course) ? 'active' : '' }}"
                                        href="{{ route('teacher.courses.notices', $course) }}">
                                        <i class="fas fa-bullhorn me-1"></i> Notice
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    {{-- Start of new top-right actions --}}
                    <div class="d-flex align-items-center editor-top-actions">
                        {{-- Direct submission button without modal --}}
                        <button id="submit-course-btn" class="btn btn-primary btn-sm me-2" type="button">
                            <i class="fas fa-paper-plane me-1"></i> Submit for Approval
                        </button>

                        {{-- View Button --}}
                        <a href="{{ route('teacher.courses.preview', $course) }}" target="_blank" class="btn btn-outline-secondary btn-sm">
                            <i class="fas fa-eye me-1"></i> View
                        </a>
                    </div>
                    {{-- End of new top-right actions --}}
                </div>
            </div>
        </div>

        <!-- Main Content Area with Sidebar and Content -->
        <div class="editor-content">
            @if ($sidebar != '')
                <div class="editor-sidebar">
                    {{ $sidebar }}
                </div>
            @endif

            <div class="editor-main-content">
                {{ $slot }}
            </div>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous">
    </script>
    <script src="{{ asset('js/vendors.js') }}?v={{ time() }}"></script>
    <script src="{{ asset('js/main.js') }}?v={{ time() }}"></script>

    <!-- Bootstrap component initializations -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize Bootstrap tooltips
            if (typeof bootstrap !== 'undefined' && typeof bootstrap.Tooltip !== 'undefined') {
                const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
                if (tooltipTriggerList.length > 0) {
                    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
                }
            }

            // Initialize Bootstrap modals
            if (typeof bootstrap !== 'undefined' && typeof bootstrap.Modal !== 'undefined') {
                const modalTriggerList = document.querySelectorAll('[data-bs-toggle="modal"]');
                if (modalTriggerList.length > 0) {
                    [...modalTriggerList].map(modalTriggerEl => {
                        const modalId = modalTriggerEl.getAttribute('data-bs-target');
                        const modalElement = document.querySelector(modalId);
                        if (modalElement) {
                            new bootstrap.Modal(modalElement);
                        }
                    });
                }
            }

            // Initialize Bootstrap tabs
            if (typeof bootstrap !== 'undefined' && typeof bootstrap.Tab !== 'undefined') {
                const tabTriggerList = document.querySelectorAll('[data-bs-toggle="tab"]');
                if (tabTriggerList.length > 0) {
                    [...tabTriggerList].map(tabTriggerEl => new bootstrap.Tab(tabTriggerEl));
                }
            }
        });
    </script>

    <!-- Mobile sidebar toggle & other page-specific scripts -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const createToggleButton = () => {
                if (window.innerWidth <= 768 && !document.getElementById('sidebarToggle')) {
                    const sidebar = document.querySelector('.editor-sidebar');
                    if (!sidebar) {
                        console.warn('Editor sidebar not found for toggle button.');
                        return;
                    }

                    const toggleBtn = document.createElement('button');
                    toggleBtn.id = 'sidebarToggle';
                    toggleBtn.className = 'btn btn-sm btn-primary sidebar-toggle';
                    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
                    Object.assign(toggleBtn.style, {
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        zIndex: '1040',
                        borderRadius: '50%',
                        width: '45px',
                        height: '45px',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
                    });

                    toggleBtn.addEventListener('click', function() {
                        sidebar.style.maxHeight = (sidebar.style.maxHeight === '40vh' || sidebar.style
                            .maxHeight === '') ? '80vh' : '40vh';
                    });
                    document.body.appendChild(toggleBtn);
                } else if (window.innerWidth > 768) {
                    const existingToggle = document.getElementById('sidebarToggle');
                    if (existingToggle) existingToggle.remove();
                }
            };

            createToggleButton(); // Initial call
            window.addEventListener('resize', createToggleButton);
        });
    </script>

    {{ $scripts ?? '' }}

    <!-- Direct submission script -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const submitBtn = document.getElementById('submit-course-btn');
            
            if (!submitBtn) {
                return;
            }
            
            submitBtn.addEventListener('click', function() {
                if (!confirm("Are you sure you want to submit this course for approval?")) {
                    return;
                }
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Submitting...';
                
                const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                if (!csrfToken) {
                    alert('CSRF token not found. Please refresh the page and try again.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane me-1"></i> Submit for Approval';
                    return;
                }
                
                const submitUrl = "{{ route('teacher.courses.submit', $course) }}";
                
                fetch(submitUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: JSON.stringify({ action: 'submit' })
                })
                .then(response => {
                    if (response.ok) {
                        return response.json()
                            .then(data => {
                                return { success: true, data: data };
                            })
                            .catch(error => {
                                return { 
                                    success: true, 
                                    data: { message: 'Course submitted successfully' } 
                                };
                            });
                    } else {
                        return response.text()
                            .then(text => {
                                try {
                                    const data = JSON.parse(text);
                                    return { 
                                        success: false, 
                                        error: data.message || `Error ${response.status}` 
                                    };
                                } catch (e) {
                                    return { 
                                        success: false, 
                                        error: `Server error (${response.status})` 
                                    };
                                }
                            });
                    }
                })
                .then(result => {
                    if (result.success) {
                        alert(result.data.message || 'Course submitted successfully!');
                        
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        alert('Error: ' + result.error);
                    }
                })
                .catch(error => {
                    alert('Network error occurred. Please try again.');
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane me-1"></i> Submit for Approval';
                });
            });
        });
    </script>
</body>

</html>
