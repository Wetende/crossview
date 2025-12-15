<div class="container-fluid px-0">
    <!-- Assignment header with title and back button -->
    <div class="d-flex justify-content-between align-items-center mb-30">
        <h4 class="fw-700 text-dark-1">{{ $assignment->title }}</h4>
        <a href="{{ route('teacher.courses.builder', $course->id) }}" class="button -sm -outline-dark-1 text-dark-1">
            <i class="feather-arrow-left me-1"></i>{{ __('Back to Builder') }}
        </a>
    </div>

    <div class="row">
        <div class="col-lg-8">
            <div class="card -dark-bg-light-1">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0 text-dark-1">{{ __('Assignment Details') }}</h5>
                    <div>
                        <a href="{{ route('teacher.courses.sections.assignments.edit', [$course, $section, $assignment]) }}" class="button -sm -blue-1 text-white me-2">
                            <i class="feather-edit me-1"></i>{{ __('Edit') }}
                        </a>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Description -->
                    <div class="mb-4">
                        <h5 class="fw-500 text-dark-1">{{ __('Description') }}</h5>
                        <div class="border rounded p-3 bg-white">
                            {!! $assignment->description !!}
                        </div>
                    </div>
                    
                    <!-- Instructions -->
                    @if($assignment->instructions)
                    <div class="mb-4">
                        <h5 class="fw-500 text-dark-1">{{ __('Instructions') }}</h5>
                        <div class="border rounded p-3 bg-white">
                            {!! $assignment->instructions !!}
                        </div>
                    </div>
                    @endif
                    
                    <!-- Allowed Submission Types -->
                    <div class="mb-4">
                        <h5 class="fw-500 text-dark-1">{{ __('Allowed Submission Types') }}</h5>
                        <div class="border rounded p-3 bg-white">
                            @if(is_array($assignment->allowed_submission_types) && count($assignment->allowed_submission_types) > 0)
                                <div class="d-flex flex-wrap gap-2">
                                @foreach($assignment->allowed_submission_types as $type)
                                    <span class="badge bg-primary text-white rounded-pill px-3 py-2 text-13">
                                        @switch($type)
                                            @case('pdf')
                                                <i class="fas fa-file-pdf me-1"></i> {{ __('PDF') }}
                                                @break
                                            @case('docx')
                                                <i class="fas fa-file-word me-1"></i> {{ __('Word Document') }}
                                                @break
                                            @case('txt')
                                                <i class="fas fa-file-alt me-1"></i> {{ __('Text File') }}
                                                @break
                                            @case('zip')
                                                <i class="fas fa-file-archive me-1"></i> {{ __('ZIP Archive') }}
                                                @break
                                            @case('image')
                                                <i class="fas fa-file-image me-1"></i> {{ __('Image') }}
                                                @break
                                            @case('link')
                                                <i class="fas fa-link me-1"></i> {{ __('URL Link') }}
                                                @break
                                            @case('text')
                                                <i class="fas fa-keyboard me-1"></i> {{ __('Online Text Entry') }}
                                                @break
                                            @default
                                                <i class="fas fa-file me-1"></i> {{ ucfirst($type) }}
                                        @endswitch
                                    </span>
                                @endforeach
                                </div>
                            @else
                                <p class="text-dark-1">{{ __('No submission types specified.') }}</p>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="col-lg-4">
            <div class="card -dark-bg-light-1">
                <div class="card-header">
                    <h5 class="card-title mb-0 text-dark-1">{{ __('Assignment Information') }}</h5>
                </div>
                <div class="card-body">
                    <ul class="list-group list-group-flush">
                        <!-- Points Possible -->
                        <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                            <span class="fw-500 text-dark-1">{{ __('Points Possible') }}</span>
                            <span class="badge bg-secondary rounded-pill">{{ $assignment->points_possible ?? 'N/A' }}</span>
                        </li>
                        
                        <!-- Due Date -->
                        <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                            <span class="fw-500 text-dark-1">{{ __('Due Date') }}</span>
                            <span>{{ $assignment->due_date ? $assignment->due_date->format('M d, Y g:i A') : __('No due date') }}</span>
                        </li>
                        
                        <!-- Unlock Date -->
                        <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                            <span class="fw-500 text-dark-1">{{ __('Available From') }}</span>
                            <span>{{ $assignment->unlock_date ? $assignment->unlock_date->format('M d, Y g:i A') : __('Immediately') }}</span>
                        </li>
                        
                        <!-- Section -->
                        <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                            <span class="fw-500 text-dark-1">{{ __('Section') }}</span>
                            <span>{{ $section->title }}</span>
                        </li>
                        
                        <!-- Created Date -->
                        <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                            <span class="fw-500 text-dark-1">{{ __('Created') }}</span>
                            <span>{{ $assignment->created_at->format('M d, Y') }}</span>
                        </li>
                        
                        <!-- Last Updated -->
                        <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                            <span class="fw-500 text-dark-1">{{ __('Last Updated') }}</span>
                            <span>{{ $assignment->updated_at->format('M d, Y') }}</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <!-- Submissions Card -->
            <div class="card -dark-bg-light-1 mt-4">
                <div class="card-header">
                    <h5 class="card-title mb-0 text-dark-1">{{ __('Submissions') }}</h5>
                </div>
                <div class="card-body">
                    <div class="d-grid gap-2">
                        <a href="{{ route('teacher.courses.sections.assignments.submissions', [$course, $section, $assignment]) }}" class="button -md -blue-1 text-white w-100">
                            <i class="feather-inbox me-2"></i>{{ __('View All Submissions') }}
                        </a>
                    </div>
                    
                    <!-- Submission Stats -->
                    <div class="mt-4">
                        <h6 class="fw-500 text-dark-1 mb-3">{{ __('Submission Statistics') }}</h6>
                        @php
                        $submissionCount = $assignment->submissions()->count();
                        $gradedCount = $assignment->submissions()->whereNotNull('graded_at')->count();
                        $percentage = $submissionCount > 0 ? ($gradedCount / $submissionCount) * 100 : 0;
                        @endphp
                        <div class="progress mb-3">
                            <div class="progress-bar bg-success" role="progressbar" style="width: {{ $percentage }}%" aria-valuenow="{{ $percentage }}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        
                        <div class="d-flex justify-content-between text-13">
                            <span>{{ __('Submitted') }}: <strong>{{ $submissionCount }}</strong></span>
                            <span>{{ __('Graded') }}: <strong>{{ $gradedCount }}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div> 