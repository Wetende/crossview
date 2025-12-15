<!-- Select Lesson Type Modal -->
{{-- This modal needs $course and $section passed to it when included --}}
<div class="modal fade" id="selectLessonTypeModal{{ $section->id }}" tabindex="-1" aria-labelledby="selectLessonTypeModalLabel{{ $section->id }}" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="selectLessonTypeModalLabel{{ $section->id }}">Select Lesson Type</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="row g-3">
                    <div class="col-md-6">
                        <a href="{{ route('teacher.courses.sections.lessons.create', [$course, $section]) }}?lesson_type=text" class="card h-100 text-decoration-none">
                            <div class="card-body text-center">
                                <i class="fas fa-file-alt fa-2x text-blue-1 mb-2"></i>
                                <h6 class="card-title mb-2">Text Lesson</h6>
                                <p class="card-text small text-muted">Create a lesson with rich text content and optional attachments.</p>
                            </div>
                        </a>
                    </div>
                    <div class="col-md-6">
                        <a href="{{ route('teacher.courses.sections.lessons.create', [$course, $section]) }}?lesson_type=video" class="card h-100 text-decoration-none">
                            <div class="card-body text-center">
                                <i class="fas fa-video fa-2x text-purple-1 mb-2"></i>
                                <h6 class="card-title mb-2">Video Lesson</h6>
                                <p class="card-text small text-muted">Create a lesson centered around a video with optional text content.</p>
                            </div>
                        </a>
                    </div>
                    <div class="col-md-6">
                        <a href="{{ route('teacher.courses.sections.lessons.create', [$course, $section]) }}?lesson_type=stream" class="card h-100 text-decoration-none">
                            <div class="card-body text-center">
                                <i class="fas fa-satellite-dish fa-2x text-green-1 mb-2"></i>
                                <h6 class="card-title mb-2">Live Stream</h6>
                                <p class="card-text small text-muted">Create a live stream or webinar lesson (Zoom, Meet, etc.).</p>
                            </div>
                        </a>
                    </div>
                    <div class="col-md-6">
                        <a href="{{ route('teacher.courses.sections.lessons.create', [$course, $section]) }}?lesson_type=quiz_link" class="card h-100 text-decoration-none">
                            <div class="card-body text-center">
                                <i class="fas fa-question-circle fa-2x text-orange-1 mb-2"></i>
                                <h6 class="card-title mb-2">Link to Quiz</h6>
                                <p class="card-text small text-muted">Create a lesson that links to an existing quiz.</p>
                            </div>
                        </a>
                    </div>
                    <div class="col-md-6">
                        <a href="{{ route('teacher.courses.sections.lessons.create', [$course, $section]) }}?lesson_type=assignment_link" class="card h-100 text-decoration-none">
                            <div class="card-body text-center">
                                <i class="fas fa-clipboard-check fa-2x text-red-1 mb-2"></i>
                                <h6 class="card-title mb-2">Link to Assignment</h6>
                                <p class="card-text small text-muted">Create a lesson that links to an existing assignment.</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="button -dark-1" data-bs-dismiss="modal">Cancel</button>
            </div>
        </div>
    </div>
</div> 