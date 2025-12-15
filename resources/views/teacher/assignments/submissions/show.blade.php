<x-dashboard-layout title="{{ __('View Submission') }}">
    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <div class="page-content">
        <div class="container-fluid">
            <!-- start page title -->
            <div class="row">
                <div class="col-12">
                    <div class="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 class="mb-sm-0 fw-700 text-dark-1">{{ __('Submission') }}: {{ $assignment->title }}</h4>
                        <div class="page-title-right">
                            <ol class="breadcrumb m-0">
                                <li class="breadcrumb-item"><a href="{{ route('teacher.overview') }}">{{ __('Dashboard') }}</a></li>
                                <li class="breadcrumb-item"><a href="{{ route('teacher.courses.curriculum', $course->id) }}">{{ $course->title }}</a></li>
                                <li class="breadcrumb-item"><a href="{{ route('teacher.courses.sections.assignments.show', [$course, $section, $assignment]) }}">{{ $assignment->title }}</a></li>
                                <li class="breadcrumb-item"><a href="{{ route('teacher.courses.sections.assignments.submissions', [$course, $section, $assignment]) }}">{{ __('Submissions') }}</a></li>
                                <li class="breadcrumb-item active">{{ __('View Submission') }}</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
            <!-- end page title -->

            <div class="row">
                <!-- Submission Information -->
                <div class="col-md-4">
                    <div class="card -dark-bg-light-1 mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0 text-dark-1">{{ __('Submission Details') }}</h5>
                        </div>
                        <div class="card-body">
                            <!-- Student Information -->
                            <div class="mb-4 text-center">
                                <div class="avatar-md mx-auto mb-3">
                                    @if($submission->user->profile_photo_path)
                                        <img src="{{ Storage::url($submission->user->profile_photo_path) }}" alt="Avatar" class="rounded-circle img-thumbnail">
                                    @else
                                        <div class="avatar-initials rounded-circle bg-primary text-white">
                                            {{ substr($submission->user->name, 0, 1) }}
                                        </div>
                                    @endif
                                </div>
                                <h5 class="fw-500 text-dark-1">{{ $submission->user->name }}</h5>
                                <p class="text-muted mb-0">{{ $submission->user->email }}</p>
                            </div>
                            
                            <ul class="list-group list-group-flush">
                                <!-- Submission Date -->
                                <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                    <span class="fw-500 text-dark-1">{{ __('Submitted On') }}</span>
                                    <span>{{ $submission->submitted_at->format('M d, Y g:i A') }}</span>
                                </li>
                                
                                <!-- Late Status -->
                                <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                    <span class="fw-500 text-dark-1">{{ __('Status') }}</span>
                                    <span>
                                        @if($submission->is_late)
                                            <span class="badge bg-warning text-dark">{{ __('Late') }}</span>
                                        @else
                                            <span class="badge bg-success">{{ __('On Time') }}</span>
                                        @endif
                                    </span>
                                </li>
                                
                                <!-- Grading Status -->
                                <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                    <span class="fw-500 text-dark-1">{{ __('Grading Status') }}</span>
                                    <span>
                                        @if($submission->graded_at)
                                            <span class="badge bg-success">{{ __('Graded') }}</span>
                                        @else
                                            <span class="badge bg-info">{{ __('Pending') }}</span>
                                        @endif
                                    </span>
                                </li>
                                
                                <!-- Grade (if graded) -->
                                @if($submission->graded_at)
                                <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                    <span class="fw-500 text-dark-1">{{ __('Grade') }}</span>
                                    <span>
                                        <span class="badge bg-primary rounded-pill">{{ $submission->grade }}</span> / {{ $assignment->points_possible }}
                                    </span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                    <span class="fw-500 text-dark-1">{{ __('Percentage') }}</span>
                                    <span>{{ number_format(($submission->grade / $assignment->points_possible) * 100, 1) }}%</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                    <span class="fw-500 text-dark-1">{{ __('Graded By') }}</span>
                                    <span>{{ $submission->gradingTeacher->name ?? 'N/A' }}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                    <span class="fw-500 text-dark-1">{{ __('Graded On') }}</span>
                                    <span>{{ $submission->graded_at->format('M d, Y') }}</span>
                                </li>
                                @endif
                            </ul>
                        </div>
                    </div>
                    
                    <!-- Back Button -->
                    <div class="d-grid gap-2 mb-4">
                        <a href="{{ route('teacher.courses.sections.assignments.submissions', [$course, $section, $assignment]) }}" class="button -md -outline-dark-1 text-dark-1">
                            <i class="feather-arrow-left me-2"></i>{{ __('Back to Submissions') }}
                        </a>
                    </div>
                </div>
                
                <!-- Submission Content and Grading -->
                <div class="col-md-8">
                    <!-- Submission Content -->
                    <div class="card -dark-bg-light-1 mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0 text-dark-1">{{ __('Submission Content') }}</h5>
                        </div>
                        <div class="card-body">
                            @php
                                $submissionType = $submission->submission_type ?? 'file';
                                $fileExtension = $submission->file_path ? pathinfo($submission->file_path, PATHINFO_EXTENSION) : '';
                            @endphp
                            
                            @if($submissionType === 'text')
                                <!-- Text Submission -->
                                <div class="border rounded p-3 bg-white">
                                    {!! $submission->text_content !!}
                                </div>
                            @elseif($submissionType === 'link')
                                <!-- Link Submission -->
                                <div class="border rounded p-3 bg-white">
                                    <p class="mb-2">{{ __('Submitted URL:') }}</p>
                                    <a href="{{ $submission->url }}" target="_blank" class="d-block mb-2 text-break">
                                        <i class="feather-external-link me-1"></i>{{ $submission->url }}
                                    </a>
                                    
                                    <div class="alert alert-info mt-3">
                                        <i class="feather-info me-2"></i>
                                        {{ __('Click the link above to open the submitted URL in a new tab.') }}
                                    </div>
                                </div>
                            @elseif($submission->file_path)
                                <!-- File Submission -->
                                <div class="border rounded p-3 bg-white">
                                    @if(in_array($fileExtension, ['jpg', 'jpeg', 'png', 'gif']))
                                        <!-- Image Preview -->
                                        <div class="text-center mb-3">
                                            <img src="{{ Storage::url($submission->file_path) }}" alt="Submission" class="img-fluid rounded" style="max-height: 500px;">
                                        </div>
                                    @elseif($fileExtension === 'pdf')
                                        <!-- PDF Embed -->
                                        <div class="ratio ratio-16x9 mb-3">
                                            <iframe src="{{ Storage::url($submission->file_path) }}" allowfullscreen></iframe>
                                        </div>
                                    @else
                                        <!-- Other File Types -->
                                        <div class="text-center py-5">
                                            <i class="fas fa-file-{{ $fileExtension === 'docx' ? 'word' : ($fileExtension === 'xlsx' ? 'excel' : 'alt') }} text-primary" style="font-size: 64px;"></i>
                                            <h5 class="mt-3">{{ basename($submission->file_path) }}</h5>
                                            <p class="text-muted">{{ strtoupper($fileExtension) }} {{ __('File') }}</p>
                                        </div>
                                    @endif
                                    
                                    <div class="d-grid">
                                        <a href="{{ Storage::url($submission->file_path) }}" class="button -md -blue-1 text-white" download>
                                            <i class="feather-download me-2"></i>{{ __('Download File') }}
                                        </a>
                                    </div>
                                </div>
                            @else
                                <!-- No Submission Content -->
                                <div class="text-center py-5">
                                    <i class="feather-file-minus text-muted" style="font-size: 64px;"></i>
                                    <p class="mt-3 text-dark-1">{{ __('No submission content available.') }}</p>
                                </div>
                            @endif
                        </div>
                    </div>
                    
                    <!-- Grading Form -->
                    <div class="card -dark-bg-light-1">
                        <div class="card-header">
                            <h5 class="card-title mb-0 text-dark-1">{{ __('Grade Submission') }}</h5>
                        </div>
                        <div class="card-body">
                            <form action="{{ route('teacher.courses.sections.assignments.submissions.grade', [$course, $section, $assignment, $submission]) }}" method="POST">
                                @csrf
                                @method('PUT')
                                
                                <div class="row g-3">
                                    <!-- Grade Input -->
                                    <div class="col-md-12 form-group">
                                        <label for="grade" class="form-label fw-500 text-dark-1">{{ __('Points') }} (0-{{ $assignment->points_possible }})</label>
                                        <input type="number" id="grade" name="grade" class="form-control" value="{{ old('grade', $submission->grade) }}" min="0" max="{{ $assignment->points_possible }}" step="0.1" required>
                                        <div class="form-text">{{ __('Enter a value between 0 and') }} {{ $assignment->points_possible }}</div>
                                        @error('grade') <div class="text-danger mt-1">{{ $message }}</div> @enderror
                                    </div>
                                    
                                    <!-- Feedback -->
                                    <div class="col-md-12 form-group">
                                        <label for="teacher_feedback" class="form-label fw-500 text-dark-1">{{ __('Feedback to Student') }}</label>
                                        <textarea id="teacher_feedback" name="teacher_feedback" class="form-control rich-text-editor" rows="5">{{ old('teacher_feedback', $submission->teacher_feedback) }}</textarea>
                                        <div class="form-text">{{ __('Provide constructive feedback to the student about their submission.') }}</div>
                                        @error('teacher_feedback') <div class="text-danger mt-1">{{ $message }}</div> @enderror
                                    </div>
                                    
                                    <div class="col-12 mt-4">
                                        <button type="submit" class="button -md -blue-1 text-white">
                                            @if($submission->graded_at)
                                                <i class="feather-check-circle me-2"></i>{{ __('Update Grade') }}
                                            @else
                                                <i class="feather-check-circle me-2"></i>{{ __('Submit Grade') }}
                                            @endif
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('styles')
    <style>
        .avatar-md {
            width: 100px;
            height: 100px;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .avatar-initials {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 48px;
        }
    </style>
    @endpush

    @push('scripts')
    <!-- TinyMCE -->
    <script src="{{ asset('assets/js/tinymce/tinymce.min.js') }}"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize TinyMCE for the feedback field
            tinymce.init({
                selector: '.rich-text-editor',
                height: 300,
                menubar: false,
                plugins: [
                    'advlist autolink lists link image charmap print preview anchor',
                    'searchreplace visualblocks code fullscreen',
                    'insertdatetime media table paste code help wordcount'
                ],
                toolbar: 'undo redo | formatselect | ' +
                    'bold italic backcolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | link | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            });
        });
    </script>
    @endpush
</x-dashboard-layout> 