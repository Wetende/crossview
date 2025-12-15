  
<x-editor-layout :course="$course" :currentTab="$currentTab ?? 'curriculum'">
    @push('styles')
        <link rel="stylesheet" href="{{ asset('css/course-editor.css') }}?v={{ time() }}">
    @endpush

    <x-slot name="header_actions">
        {{-- Actions specific to the builder header can go here --}}
    </x-slot>

    <x-slot name="sidebar">
        @if(request()->is('*settings*'))
            @include('teacher.courses.builder.partials._settings_sidebar', ['course' => $course]) 
        @elseif(request()->is('*builder*'))
            @include('teacher.courses.builder.partials._curriculum_sidebar', ['course' => $course]) 
        @endif
    </x-slot>
    
    <!-- Main Content Area -->
    <div class="editor-main-content p-0 mx-auto w-full max-w-full">
        @if(request()->is('*settings*'))
            <div class="container-fluid px-4 py-4">
                @include('teacher.courses.builder.partials._settings_content', ['course' => $course, 'categories' => $categories ?? [], 'subjects' => $subjects ?? [], 'gradeLevels' => $gradeLevels ?? [], 'certificateTemplates' => $certificateTemplates ?? [], 'allCourses' => $allCourses ?? []])
            </div>
        @elseif(request()->is('*pricing*'))
            <div class="container-fluid px-4 py-4">
                @include('teacher.courses.builder.partials._pricing_content', ['course' => $course, 'subscriptionTiers' => $subscriptionTiers ?? []])
            </div>
        @elseif(request()->is('*notice*'))
            <div class="container-fluid px-4 py-4">
                @include('teacher.courses.builder.partials._notice_content', ['course' => $course, 'notices' => $notices ?? []])
            </div>
        @elseif(request()->is('*faq*'))
            <div class="container-fluid px-4 py-4">
                @include('teacher.courses.builder.partials._faq_content', ['course' => $course, 'faqs' => $faqs ?? []])
            </div>
        @else
            <div class="container-fluid px-4 py-4">
                @include('teacher.courses.builder.partials._curriculum_content', ['course' => $course])
            </div>
        @endif
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js"></script>
    
    <!-- Approval Status Banner -->
    @if($course->approval_status !== 'draft')
        <div class="approval-status-banner">
            <div class="container-fluid px-4">
                @if($course->approval_status === 'submitted')
                    <div class="alert alert-warning mb-0 rounded-0 border-0">
                        <div class="d-flex align-items-center">
                            <i class="icon-clock text-orange-1 mr-15 text-20"></i>
                            <div class="flex-1">
                                <div class="text-16 fw-500">@lmsterm('Study Material') Submitted for Approval</div>
                                <div class="text-14 text-light-1">
                                    Submitted on {{ $course->submitted_at->format('M d, Y \a\t h:i A') }}. 
                                    @if($course->isEditingLocked())
                                        Editing is currently restricted while under review.
                                    @endif
                                </div>
                            </div>
                            @if(!$course->isEditingLocked())
                                <div class="ml-auto">
                                    <button class="button -sm -light-3 text-dark-1" onclick="window.history.back()">
                                        Continue Editing
                                    </button>
                                </div>
                            @endif
                        </div>
                    </div>
                @elseif($course->approval_status === 'approved')
                    <div class="alert alert-success mb-0 rounded-0 border-0">
                        <div class="d-flex align-items-center">
                            <i class="icon-check text-green-1 mr-15 text-20"></i>
                            <div class="flex-1">
                                <div class="text-16 fw-500">@lmsterm('Study Material') Approved & Published</div>
                                <div class="text-14 text-light-1">
                                    Approved on {{ $course->approved_at->format('M d, Y \a\t h:i A') }} by {{ $course->reviewedByAdmin->name ?? 'Admin' }}.
                                    @lmsterm('Study Material') is now live and available to students.
                                </div>
                            </div>
                            <div class="ml-auto">
                                <a href="{{ route('courses.show', $course->slug) }}" target="_blank" class="button -sm -purple-1 text-white">
                                    <i class="icon-eye mr-10"></i>
                                    View Live @lmsterm('Study Material')
                                </a>
                            </div>
                        </div>
                    </div>
                @elseif($course->approval_status === 'rejected')
                    <div class="alert alert-danger mb-0 rounded-0 border-0">
                        <div class="d-flex align-items-center">
                            <i class="icon-close text-red-1 mr-15 text-20"></i>
                            <div class="flex-1">
                                <div class="text-16 fw-500">@lmsterm('Study Material') Rejected</div>
                                <div class="text-14 text-light-1">
                                    Rejected on {{ $course->rejected_at->format('M d, Y \a\t h:i A') }} by {{ $course->reviewedByAdmin->name ?? 'Admin' }}.
                                    @if($course->rejection_reason)
                                        <div class="mt-5">
                                            <strong>Reason:</strong> {{ $course->rejection_reason }}
                                        </div>
                                    @endif
                                </div>
                            </div>
                            <div class="ml-auto">
                                <form method="POST" action="{{ route('teacher.courses.resubmit', $course) }}" class="d-inline">
                                    @csrf
                                    <button type="submit" class="button -sm -purple-1 text-white">
                                        <i class="icon-refresh mr-10"></i>
                                        Resubmit for Approval
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                @endif
            </div>
        </div>
    @endif
</x-editor-layout>       