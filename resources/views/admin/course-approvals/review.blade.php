<x-dashboard-layout title="Review @lmsterm('Study Material') - {{ $course->title }}">
    <x-slot name="header">
        @include('layouts.partials.admin.header')
    </x-slot>

    <x-slot name="sidebar">
        @include('layouts.partials.admin.sidebar')
    </x-slot>

    <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
        <div class="col-auto">
            <h1 class="text-30 lh-12 fw-700">Review @lmsterm('Study Material')</h1>
            <div class="mt-10">
                <a href="{{ route('admin.course-approvals.index') }}" class="text-purple-1">
                    <i class="icon-arrow-left mr-10"></i>
                    Back to @lmsterm('Study Material') Approvals
                </a>
            </div>
        </div>
        
        <div class="col-auto">
            <div class="d-flex x-gap-15">
                <a href="{{ route('admin.courses.builder', $course) }}" class="button -md -purple-1 text-white">
                    <i class="icon-edit mr-10"></i>
                    View Builder
                </a>
                <button class="button -md -green-1 text-white" onclick="showApproveModal()">
                    <i class="icon-check mr-10"></i>
                    Approve @lmsterm('Study Material')
                </button>
                <button class="button -md -red-1 text-white" onclick="showRejectModal()">
                    <i class="icon-close mr-10"></i>
                    Reject @lmsterm('Study Material')
                </button>
            </div>
        </div>
    </div>

    <div class="row y-gap-30">
        <!-- Course Information -->
        <div class="col-12">
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <h2 class="text-20 lh-1 fw-500 mb-30">@lmsterm('Study Material') Information</h2>
                
                <div class="row y-gap-20">
                    <div class="col-lg-8">
                        <div class="d-flex items-start">
                            @if($course->thumbnail_path)
                                <img src="{{ Storage::url($course->thumbnail_path) }}" 
                                     alt="{{ $course->title }}" 
                                     class="size-80 rounded-16 mr-20">
                            @else
                                <div class="size-80 bg-light-3 rounded-16 mr-20 d-flex items-center justify-center">
                                    <i class="icon-play text-light-1 text-24"></i>
                                </div>
                            @endif
                            <div class="flex-1">
                                <h3 class="text-24 fw-700 text-dark-1 mb-10">{{ $course->title }}</h3>
                                <div class="text-16 text-light-1 mb-15">{{ $course->description }}</div>
                                <div class="d-flex flex-wrap x-gap-20 y-gap-10">
                                    <div class="d-flex items-center">
                                        <i class="icon-user text-purple-1 mr-10"></i>
                                        <span class="text-14">{{ $course->teacher->name }}</span>
                                    </div>
                                    <div class="d-flex items-center">
                                        <i class="icon-folder text-purple-1 mr-10"></i>
                                        <span class="text-14">{{ $course->category->name ?? 'Uncategorized' }}</span>
                                    </div>
                                    @if($course->gradeLevel)
                                        <div class="d-flex items-center">
                                            <i class="icon-graduation text-purple-1 mr-10"></i>
                                            <span class="text-14">{{ $course->gradeLevel->name }}</span>
                                        </div>
                                    @endif
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4">
                        <div class="bg-light-3 -dark-bg-dark-2 rounded-16 p-20">
                            <h4 class="text-16 fw-500 mb-15">Submission Details</h4>
                            <div class="y-gap-10">
                                <div class="d-flex justify-between">
                                    <span class="text-14 text-light-1">Submitted:</span>
                                    <span class="text-14 fw-500">{{ $course->submitted_at->format('M d, Y h:i A') }}</span>
                                </div>
                                <div class="d-flex justify-between">
                                    <span class="text-14 text-light-1">Status:</span>
                                    <span class="badge bg-orange-1 text-white">Pending Review</span>
                                </div>
                                <div class="d-flex justify-between">
                                    <span class="text-14 text-light-1">Pricing:</span>
                                    <span class="text-14 fw-500">
                                        @if($course->pricing_type === 'free')
                                            Free
                                        @elseif($course->pricing_type === 'purchase')
                                            ${{ number_format($course->price, 2) }}
                                        @elseif($course->pricing_type === 'subscription')
                                            Subscription Only
                                        @else
                                            ${{ number_format($course->price, 2) }} or Subscription
                                        @endif
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Course Content -->
        <div class="col-12">
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <h2 class="text-20 lh-1 fw-500 mb-30">@lmsterm('Study Material') Content</h2>
                
                @if($course->sections->count() > 0)
                    <div class="y-gap-20">
                        @foreach($course->sections as $section)
                            <div class="border border-light rounded-16 p-20">
                                <h4 class="text-18 fw-500 mb-15">{{ $section->title }}</h4>
                                @if($section->description)
                                    <p class="text-14 text-light-1 mb-15">{{ $section->description }}</p>
                                @endif
                                
                                <div class="y-gap-10">
                                    @foreach($section->lessons as $lesson)
                                        <div class="d-flex items-center py-10 px-15 bg-light-3 -dark-bg-dark-2 rounded-8">
                                            <i class="icon-play text-purple-1 mr-15"></i>
                                            <span class="text-14 fw-500 flex-1">{{ $lesson->title }}</span>
                                            <span class="badge bg-light-7 text-dark-1">{{ ucfirst($lesson->lesson_type) }}</span>
                                        </div>
                                    @endforeach
                                    
                                    @foreach($section->quizzes as $quiz)
                                        <div class="d-flex items-center py-10 px-15 bg-light-3 -dark-bg-dark-2 rounded-8">
                                            <i class="icon-question text-blue-1 mr-15"></i>
                                            <span class="text-14 fw-500 flex-1">{{ $quiz->title }}</span>
                                            <span class="badge bg-blue-1 text-white">Quiz</span>
                                        </div>
                                    @endforeach
                                    
                                    @foreach($section->assignments as $assignment)
                                        <div class="d-flex items-center py-10 px-15 bg-light-3 -dark-bg-dark-2 rounded-8">
                                            <i class="icon-file text-green-1 mr-15"></i>
                                            <span class="text-14 fw-500 flex-1">{{ $assignment->title }}</span>
                                            <span class="badge bg-green-1 text-white">Assignment</span>
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        @endforeach
                    </div>
                @else
                    <div class="text-center py-40">
                        <i class="icon-file text-light-1 text-40 mb-20"></i>
                        <p class="text-16 text-light-1">No content sections found</p>
                    </div>
                @endif
            </div>
        </div>

        <!-- Teacher Information -->
        <div class="col-12">
            <div class="py-30 px-30 rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                <h2 class="text-20 lh-1 fw-500 mb-30">Teacher Information</h2>
                
                <div class="d-flex items-start">
                    <div class="size-60 bg-purple-1 rounded-full d-flex items-center justify-center mr-20">
                        <span class="text-20 fw-700 text-white">{{ substr($course->teacher->name, 0, 1) }}</span>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-18 fw-500 mb-10">{{ $course->teacher->name }}</h4>
                        <div class="text-14 text-light-1 mb-10">{{ $course->teacher->email }}</div>
                        @if($course->instructor_info)
                            <div class="text-14 text-dark-1">{{ $course->instructor_info }}</div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Approve Modal -->
    <div class="modal fade" id="approveModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Approve @lmsterm('Study Material')</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form method="POST" action="{{ route('admin.course-approvals.approve', $course) }}">
                    @csrf
                    <div class="modal-body">
                        <div class="mb-20">
                            <label class="text-14 fw-500 text-dark-1 mb-10">Approval Notes (Optional)</label>
                            <textarea name="notes" rows="3" class="form-control" 
                                      placeholder="Add any notes about the approval..."></textarea>
                        </div>
                        <div class="alert alert-success">
                            <i class="icon-check mr-10"></i>
                            This @lmsterm('study material') will be approved and published immediately.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="button -md -light-3 text-dark-1" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="button -md -green-1 text-white">Approve & Publish</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Reject Modal -->
    <div class="modal fade" id="rejectModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Reject @lmsterm('Study Material')</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form method="POST" action="{{ route('admin.course-approvals.reject', $course) }}">
                    @csrf
                    <div class="modal-body">
                        <div class="mb-20">
                            <label class="text-14 fw-500 text-dark-1 mb-10">Rejection Reason *</label>
                            <textarea name="reason" rows="4" class="form-control" required
                                      placeholder="Please provide a detailed reason for rejecting this course..."></textarea>
                        </div>
                        <div class="alert alert-warning">
                            <i class="icon-warning mr-10"></i>
                            The teacher will be notified about the rejection and can resubmit after making changes.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="button -md -light-3 text-dark-1" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="button -md -red-1 text-white">Reject @lmsterm('Study Material')</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    @push('scripts')
    <script>
    function showApproveModal() {
        new bootstrap.Modal(document.getElementById('approveModal')).show();
    }

    function showRejectModal() {
        new bootstrap.Modal(document.getElementById('rejectModal')).show();
    }
    </script>
    @endpush
</x-dashboard-layout> 