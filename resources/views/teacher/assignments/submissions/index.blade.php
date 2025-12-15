<x-dashboard-layout title="{{ __('Assignment Submissions') }}">
    <x-slot name="sidebar">
        @include('layouts.partials.teacher.sidebar')
    </x-slot>

    <div class="page-content">
        <div class="container-fluid">
            <!-- start page title -->
            <div class="row">
                <div class="col-12">
                    <div class="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 class="mb-sm-0 fw-700 text-dark-1">{{ __('Submissions') }}: {{ $assignment->title }}</h4>
                        <div class="page-title-right">
                            <ol class="breadcrumb m-0">
                                <li class="breadcrumb-item"><a href="{{ route('teacher.overview') }}">{{ __('Dashboard') }}</a></li>
                                <li class="breadcrumb-item"><a href="{{ route('teacher.courses.curriculum', $course->id) }}">{{ $course->title }}</a></li>
                                <li class="breadcrumb-item"><a href="{{ route('teacher.courses.sections.assignments.show', [$course, $section, $assignment]) }}">{{ $assignment->title }}</a></li>
                                <li class="breadcrumb-item active">{{ __('Submissions') }}</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
            <!-- end page title -->

            <div class="row">
                <div class="col-lg-12">
                    <div class="card -dark-bg-light-1">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0 text-dark-1">{{ __('Student Submissions') }}</h5>
                            <a href="{{ route('teacher.courses.sections.assignments.show', [$course, $section, $assignment]) }}" class="button -sm -outline-dark-1 text-dark-1">
                                <i class="feather-arrow-left me-1"></i>{{ __('Back to Assignment') }}
                            </a>
                        </div>
                        <div class="card-body">
                            <!-- Assignment Details Summary -->
                            <div class="row mb-4">
                                <div class="col-md-4">
                                    <div class="border rounded p-3 bg-white h-100">
                                        <h6 class="fw-500 text-dark-1 mb-2">{{ __('Assignment Details') }}</h6>
                                        <p class="mb-1"><strong>{{ __('Points Possible') }}:</strong> {{ $assignment->points_possible ?? 'N/A' }}</p>
                                        <p class="mb-1"><strong>{{ __('Due Date') }}:</strong> {{ $assignment->due_date ? $assignment->due_date->format('M d, Y g:i A') : __('No due date') }}</p>
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <div class="border rounded p-3 bg-white h-100">
                                        <h6 class="fw-500 text-dark-1 mb-2">{{ __('Submission Statistics') }}</h6>
                                        <div class="row">
                                            @php
                                                $submissionCount = $submissions->total();
                                                $gradedCount = $assignment->submissions()->whereNotNull('graded_at')->count();
                                                $lateCount = $assignment->submissions()->where('is_late', true)->count();
                                                $avgScore = $gradedCount > 0 ? $assignment->submissions()->whereNotNull('grade')->avg('grade') : 0;
                                            @endphp
                                            <div class="col-md-3 text-center">
                                                <div class="border rounded py-2 px-3">
                                                    <h3 class="text-dark-1 mb-0">{{ $submissionCount }}</h3>
                                                    <small class="text-muted">{{ __('Total Submissions') }}</small>
                                                </div>
                                            </div>
                                            <div class="col-md-3 text-center">
                                                <div class="border rounded py-2 px-3">
                                                    <h3 class="text-dark-1 mb-0">{{ $gradedCount }}</h3>
                                                    <small class="text-muted">{{ __('Graded') }}</small>
                                                </div>
                                            </div>
                                            <div class="col-md-3 text-center">
                                                <div class="border rounded py-2 px-3">
                                                    <h3 class="text-dark-1 mb-0">{{ $lateCount }}</h3>
                                                    <small class="text-muted">{{ __('Late Submissions') }}</small>
                                                </div>
                                            </div>
                                            <div class="col-md-3 text-center">
                                                <div class="border rounded py-2 px-3">
                                                    <h3 class="text-dark-1 mb-0">{{ number_format($avgScore, 1) }}</h3>
                                                    <small class="text-muted">{{ __('Average Score') }}</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Submissions Table -->
                            <div class="table-responsive">
                                <table class="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th>{{ __('Student') }}</th>
                                            <th>{{ __('Submission Date') }}</th>
                                            <th>{{ __('Status') }}</th>
                                            <th>{{ __('Grade') }}</th>
                                            <th>{{ __('Actions') }}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @forelse($submissions as $submission)
                                            <tr>
                                                <!-- Student -->
                                                <td>
                                                    <div class="d-flex align-items-center">
                                                        <div class="avatar-xs me-2">
                                                            @if($submission->user->profile_photo_path)
                                                                <img src="{{ Storage::url($submission->user->profile_photo_path) }}" alt="Avatar" class="rounded-circle">
                                                            @else
                                                                <div class="avatar-initials rounded-circle bg-primary text-white">
                                                                    {{ substr($submission->user->name, 0, 1) }}
                                                                </div>
                                                            @endif
                                                        </div>
                                                        <div>
                                                            <h6 class="mb-0 text-dark-1">{{ $submission->user->name }}</h6>
                                                            <small class="text-muted">{{ $submission->user->email }}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                
                                                <!-- Submission Date -->
                                                <td>
                                                    {{ $submission->submitted_at->format('M d, Y g:i A') }}
                                                    @if($submission->is_late)
                                                        <span class="badge bg-warning text-dark ms-1">{{ __('Late') }}</span>
                                                    @endif
                                                </td>
                                                
                                                <!-- Status -->
                                                <td>
                                                    @if($submission->graded_at)
                                                        <span class="badge bg-success">{{ __('Graded') }}</span>
                                                    @else
                                                        <span class="badge bg-info">{{ __('Submitted') }}</span>
                                                    @endif
                                                </td>
                                                
                                                <!-- Grade -->
                                                <td>
                                                    @if($submission->graded_at)
                                                        <span class="fw-500">{{ $submission->grade }}</span> / {{ $assignment->points_possible }}
                                                        <small class="d-block text-muted">
                                                            {{ number_format(($submission->grade / $assignment->points_possible) * 100, 1) }}%
                                                        </small>
                                                    @else
                                                        <span class="text-muted">{{ __('Not graded') }}</span>
                                                    @endif
                                                </td>
                                                
                                                <!-- Actions -->
                                                <td>
                                                    <a href="{{ route('teacher.courses.sections.assignments.submissions.show', [$course, $section, $assignment, $submission]) }}" class="button -sm -blue-1 text-white">
                                                        <i class="feather-eye me-1"></i>{{ __('View') }}
                                                    </a>
                                                </td>
                                            </tr>
                                        @empty
                                            <tr>
                                                <td colspan="5" class="text-center py-4">
                                                    <div class="empty-state">
                                                        <i class="feather-inbox text-muted" style="font-size: 48px;"></i>
                                                        <p class="mt-2 text-dark-1">{{ __('No submissions yet.') }}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        @endforelse
                                    </tbody>
                                </table>
                            </div>
                            
                            <!-- Pagination -->
                            <div class="d-flex justify-content-center mt-4">
                                {{ $submissions->links() }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('styles')
    <style>
        .avatar-xs {
            width: 32px;
            height: 32px;
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
        }
        
        .empty-state {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }
    </style>
    @endpush
</x-dashboard-layout> 