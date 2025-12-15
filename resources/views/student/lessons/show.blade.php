<x-dashboard-layout>
    <div class="dashboard__content bg-light-4">
        <div class="row y-gap-20 justify-between items-end pb-30 mb-10">
            <div class="col-auto">
                <h1 class="text-30 lh-12 fw-700">{{ $course->title }}</h1>
                <div class="mt-10">{{ $lesson->title }}</div>
            </div>
            <div class="col-auto">
                <a href="{{ route('courses.show', $course->slug) }}" class="button -md -outline-purple-1 text-purple-1">
                    <i class="icon-arrow-left text-14 mr-10"></i>
                    Back to @lmsterm('Study Material')
                </a>
            </div>
        </div>

        <div class="row y-gap-30">
            <!-- Curriculum Sidebar -->
            <div class="col-xl-4 col-lg-4">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4 h-100">
                    <div class="d-flex items-center py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">Curriculum</h2>
                        <div class="ml-20 d-flex items-center">
                            <div class="progress-bar w-60 d-inline-block mr-10">
                                <div class="progress-bar__bg bg-light-3"></div>
                                <div class="progress-bar__bar bg-purple-1" style="width: {{ $course->enrollments->where('user_id', auth()->id())->first()->progress }}%;"></div>
                            </div>
                            <div class="text-14 lh-1 text-dark-1">{{ round($course->enrollments->where('user_id', auth()->id())->first()->progress) }}% Complete</div>
                        </div>
                    </div>

                    <div class="py-20 px-30 curriculum-content">
                        <div class="accordion js-accordion">
                            @foreach($courseSections as $section)
                                <div class="accordion__item">
                                    <div class="accordion__button py-15 px-20 bg-light-4 -dark-bg-dark-2 rounded-8">
                                        <div class="d-flex items-center">
                                            <div class="accordion__icon mr-10">
                                                <div class="icon" data-feather="chevron-down"></div>
                                                <div class="icon" data-feather="chevron-up"></div>
                                            </div>
                                            <span class="text-16 fw-500 text-dark-1">{{ $section->title }}</span>
                                        </div>
                                    </div>

                                    <div class="accordion__content">
                                        <div class="accordion__content__inner px-30 py-15">
                                            <div class="y-gap-10">
                                                @foreach($section->lessons as $sectionLesson)
                                                    <div class="d-flex justify-between items-center {{ $sectionLesson->id === $lesson->id ? 'bg-light-3 rounded-8 p-5' : '' }}">
                                                        <div>
                                                            <a href="{{ route('student.learn.lesson', [$course, $sectionLesson]) }}" class="d-flex items-center">
                                                                @if($sectionLesson->isCompletedByUser(auth()->id()))
                                                                    <div class="d-flex size-20 items-center justify-center rounded-full bg-green-1 mr-10">
                                                                        <i class="icon-check text-white"></i>
                                                                    </div>
                                                                @else
                                                                    <div class="d-flex size-20 items-center justify-center rounded-full border-light mr-10">
                                                                        @switch($sectionLesson->lesson_type->value)
                                                                            @case('text')
                                                                                <i class="icon-text text-14"></i>
                                                                                @break
                                                                            @case('video')
                                                                                <i class="icon-play text-14"></i>
                                                                                @break
                                                                            @case('quiz_link')
                                                                                <i class="icon-puzzle text-14"></i>
                                                                                @break
                                                                            @default
                                                                                <i class="icon-file-text text-14"></i>
                                                                        @endswitch
                                                                    </div>
                                                                @endif
                                                                <div class="text-16 lh-1 fw-500 text-dark-1">{{ $sectionLesson->title }}</div>
                                                            </a>
                                                        </div>
                                                        <div class="d-flex items-center">
                                                            @if($sectionLesson->isCompletedByUser(auth()->id()))
                                                                <span class="text-14 lh-1 text-green-1 mr-10">Completed</span>
                                                            @endif
                                                            <div class="text-14 lh-1 text-light-1">
                                                                {{ $sectionLesson->duration }} min
                                                            </div>
                                                        </div>
                                                    </div>
                                                @endforeach
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="col-xl-8 col-lg-8">
                <div class="rounded-16 bg-white -dark-bg-dark-1 shadow-4">
                    <div class="d-flex items-center justify-between py-20 px-30 border-bottom-light">
                        <h2 class="text-17 lh-1 fw-500">{{ $lesson->title }}</h2>
                        <div class="d-flex items-center">
                            @if($previousLesson)
                                <a href="{{ route('student.learn.lesson', [$course, $previousLesson]) }}" class="button -sm -light-3 text-purple-1 mr-10">
                                    <i class="icon-arrow-left text-14 mr-10"></i>
                                    Previous
                                </a>
                            @endif
                            @if($nextLesson)
                                <a href="{{ route('student.learn.lesson', [$course, $nextLesson]) }}" class="button -sm -purple-1 text-white">
                                    Next
                                    <i class="icon-arrow-right text-14 ml-10"></i>
                                </a>
                            @endif
                        </div>
                    </div>

                    <div class="py-30 px-30">
                        <div class="lesson-content mb-30">
                            @switch($lesson->lesson_type->value)
                                @case('text')
                                    <div class="lesson-text-content">
                                        {!! $content !!}
                                    </div>
                                @break
                                
                                @case('video')
                                    <div class="lesson-video-content">
                                        <div class="video-player rounded-8 overflow-hidden js-video-player" data-lesson-id="{{ $lesson->id }}">
                                            <video 
                                                id="lessonVideo" 
                                                class="video-js vjs-big-play-centered" 
                                                controls 
                                                preload="auto" 
                                                width="100%" 
                                                height="440"
                                                data-lesson-id="{{ $lesson->id }}"
                                                data-progress="{{ $lessonProgress->progress_percentage ?? 0 }}"
                                            >
                                                <source src="{{ $lesson->video_url }}" type="video/mp4">
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    </div>
                                @break
                                
                                @case('pdf')
                                    <div class="lesson-pdf-content">
                                        <div class="pdf-viewer rounded-8 overflow-hidden" id="pdfViewer">
                                            <div id="pdfContainer" class="w-full" style="height: 600px;">
                                                <canvas id="pdfCanvas" class="w-full h-full"></canvas>
                                            </div>
                                            <div class="pdf-controls mt-10 d-flex justify-between items-center">
                                                <button id="prevPage" class="button -sm -light-3 text-dark-1">
                                                    <i class="icon-arrow-left text-14 mr-10"></i>
                                                    Previous
                                                </button>
                                                <div class="page-info">
                                                    Page <span id="currentPage">1</span> of <span id="totalPages">1</span>
                                                </div>
                                                <button id="nextPage" class="button -sm -light-3 text-dark-1">
                                                    Next
                                                    <i class="icon-arrow-right text-14 ml-10"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                @break
                                
                                @case('quiz_link')
                                    <div class="lesson-quiz-link d-flex flex-column items-center justify-center py-30 text-center">
                                        <div class="icon-puzzle text-40 text-purple-1 mb-20"></div>
                                        <h3 class="text-24 fw-500 mb-10">Quiz: {{ $lesson->title }}</h3>
                                        <p class="text-16 mb-30">Test your knowledge of this section with a quiz.</p>
                                        <a href="{{ route('student.quizzes.take', [$course, $lesson->quiz]) }}" class="button -md -purple-1 text-white">Start Quiz</a>
                                    </div>
                                @break
                                
                                @case('assignment_link')
                                    <div class="lesson-assignment-link d-flex flex-column items-center justify-center py-30 text-center">
                                        <div class="icon-file-upload text-40 text-purple-1 mb-20"></div>
                                        <h3 class="text-24 fw-500 mb-10">Assignment: {{ $lesson->title }}</h3>
                                        <p class="text-16 mb-30">Complete and submit this assignment to progress.</p>
                                        <!-- Assignment submission to be implemented in a future phase -->
                                        <!-- When implemented, the assignment completion will automatically mark this lesson as complete -->
                                        <a href="#" class="button -md -purple-1 text-white">View Assignment</a>
                                    </div>
                                @break
                                
                                @case('stream')
                                    <div class="lesson-stream-content d-flex flex-column items-center justify-center py-30 text-center">
                                        <div class="icon-live-stream text-40 text-purple-1 mb-20"></div>
                                        <h3 class="text-24 fw-500 mb-10">Live Stream: {{ $lesson->title }}</h3>
                                        @if($lesson->video_url)
                                            <div class="video-stream-container mb-20 w-1/1">
                                                <iframe src="{{ $lesson->video_url }}" width="100%" height="440" frameborder="0" allowfullscreen></iframe>
                                            </div>
                                        @else
                                            <p class="text-16 mb-30">This live stream is not currently available.</p>
                                        @endif
                                    </div>
                                @break
                                
                                @default
                                    <div class="lesson-default-content">
                                        <p class="text-16">This lesson content type is not available for display.</p>
                                    </div>
                            @endswitch
                        </div>

                        @if(count($attachments) > 0)
                            <div class="lesson-attachments mt-30 pt-30 border-top-light">
                                <h4 class="text-18 fw-500 mb-15">Attachments</h4>
                                <div class="row y-gap-15">
                                    @foreach($attachments as $attachment)
                                        <div class="col-12">
                                            <div class="d-flex items-center justify-between bg-light-4 -dark-bg-dark-2 rounded-8 px-15 py-10">
                                                <div class="d-flex items-center">
                                                    <div class="d-flex size-40 items-center justify-center rounded-8 bg-white -dark-bg-dark-3 mr-10">
                                                        <i class="icon-file-text text-purple-1 text-20"></i>
                                                    </div>
                                                    <div>
                                                        <div class="text-16 fw-500 lh-1">{{ $attachment->title }}</div>
                                                        <div class="text-14 lh-1 mt-5">{{ $attachment->file_size_human }}</div>
                                                    </div>
                                                </div>
                                                <a href="{{ route('student.lessons.attachment.download', [$course, $lesson, $attachment]) }}" class="button -sm -outline-purple-1 text-purple-1">
                                                    <i class="icon-download text-14 mr-10"></i>
                                                    Download
                                                </a>
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        @endif

                        @if(!$isCompleted)
                            <div class="lesson-complete-action mt-30 pt-30 border-top-light">
                                <form action="{{ route('student.lessons.complete', [$course, $lesson]) }}" method="POST">
                                    @csrf
                                    <button type="submit" class="button -md -purple-1 text-white">
                                        <i class="icon-check text-14 mr-10"></i>
                                        Mark as Complete
                                    </button>
                                </form>
                            </div>
                        @else
                            <div class="lesson-completed-status mt-30 pt-30 border-top-light">
                                <div class="d-flex items-center">
                                    <div class="d-flex size-40 items-center justify-center rounded-full bg-green-1 mr-10">
                                        <i class="icon-check text-white"></i>
                                    </div>
                                    <div class="text-16 fw-500 text-green-1">Lesson Completed</div>
                                </div>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
    </div>

    @push('scripts')
    <!-- PDF.js library -->
    <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js"></script>
    
    <script>
        // Pre-define PHP variables for JavaScript to use
        const LESSON_PROGRESS = @json($lessonProgress->progress_percentage ?? 0);
        const CONTENT_URL = @json($lesson->content_url ?? '');
        const PROGRESS_UPDATE_URL = @json(route('student.lessons.progress.update', [$course, $lesson]));
        const LESSON_COMPLETE_URL = @json(route('student.lessons.complete', [$course, $lesson]));
        const CSRF_TOKEN = @json(csrf_token());
        
        document.addEventListener('DOMContentLoaded', function() {
            // Video player progress tracking
            initializeVideoTracking();
            
            // PDF viewer initialization
            initializePdfViewer();
            
            // Initialize accordion for curriculum sections
            initializeAccordion();
        });
        
        function initializeVideoTracking() {
            const videoElement = document.getElementById('lessonVideo');
            
            if (!videoElement) return;
            
            const player = videojs('lessonVideo');
            const lessonId = videoElement.dataset.lessonId;
            const storedProgress = parseFloat(videoElement.dataset.progress);
            
            // Set initial time if there's stored progress
            if (storedProgress > 0) {
                player.ready(function() {
                    const duration = player.duration();
                    if (duration) {
                        const timeToSet = (storedProgress / 100) * duration;
                        player.currentTime(timeToSet);
                    }
                });
            }
            
            // Update progress at regular intervals and when video ends
            let progressUpdateInterval;
            
            player.on('play', function() {
                progressUpdateInterval = setInterval(updateVideoProgress, 5000); // Update every 5 seconds
            });
            
            player.on('pause', function() {
                clearInterval(progressUpdateInterval);
                updateVideoProgress();
            });
            
            player.on('ended', function() {
                clearInterval(progressUpdateInterval);
                updateVideoProgress(100); // Force 100% on completion
                
                // Auto-mark as complete
                if (parseFloat(videoElement.dataset.progress) >= 95) {
                    markLessonComplete();
                }
            });
            
            function updateVideoProgress(forceValue = null) {
                const duration = player.duration();
                let progressPercentage;
                
                if (forceValue !== null) {
                    progressPercentage = forceValue;
                } else {
                    const currentTime = player.currentTime();
                    progressPercentage = Math.floor((currentTime / duration) * 100);
                }
                
                // Update progress via AJAX
                updateProgress(progressPercentage);
            }
        }
        
        function initializePdfViewer() {
            const pdfContainer = document.getElementById('pdfContainer');
            if (!pdfContainer) return;
            
            // Set PDF.js worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
            
            // PDF variables
            let pdfDoc = null;
            let pageNum = 1;
            let totalPages = 0;
            let pdfProgress = LESSON_PROGRESS;
            const pdfUrl = CONTENT_URL;
            
            // PDF elements
            const canvas = document.getElementById('pdfCanvas');
            const ctx = canvas.getContext('2d');
            const prevButton = document.getElementById('prevPage');
            const nextButton = document.getElementById('nextPage');
            const currentPageEl = document.getElementById('currentPage');
            const totalPagesEl = document.getElementById('totalPages');
            
            // Initialize PDF rendering
            pdfjsLib.getDocument(pdfUrl).promise.then(function(pdf) {
                pdfDoc = pdf;
                totalPages = pdf.numPages;
                totalPagesEl.textContent = totalPages;
                
                // If we have progress, try to restore the page position
                if (pdfProgress > 0) {
                    // Calculate which page to show based on progress
                    pageNum = Math.max(1, Math.floor((pdfProgress / 100) * totalPages));
                }
                
                // Render the page
                renderPage(pageNum);
                
                // Set progress update interval - update every 10 seconds
                const progressInterval = setInterval(updatePdfProgress, 10000);
                
                // Update on page change too
                prevButton.addEventListener('click', function() {
                    if (pageNum <= 1) return;
                    pageNum--;
                    renderPage(pageNum);
                    updatePdfProgress();
                });
                
                nextButton.addEventListener('click', function() {
                    if (pageNum >= totalPages) return;
                    pageNum++;
                    renderPage(pageNum);
                    updatePdfProgress();
                    
                    // If reaching the last page, mark as complete
                    if (pageNum === totalPages) {
                        updatePdfProgress(100); // Force 100% completion
                    }
                });
            }).catch(function(error) {
                console.error('Error loading PDF:', error);
            });
            
            // Function to render a page
            function renderPage(num) {
                pdfDoc.getPage(num).then(function(page) {
                    const viewport = page.getViewport({ scale: 1.5 });
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    const renderContext = {
                        canvasContext: ctx,
                        viewport: viewport
                    };
                    
                    page.render(renderContext);
                    currentPageEl.textContent = num;
                });
            }
            
            // Function to update PDF progress
            function updatePdfProgress(forceValue = null) {
                let progressPercentage;
                
                if (forceValue !== null) {
                    progressPercentage = forceValue;
                } else {
                    // Calculate progress based on current page vs total pages
                    progressPercentage = Math.floor((pageNum / totalPages) * 100);
                }
                
                // Update progress via AJAX
                updateProgress(progressPercentage);
            }
        }
        
        function initializeAccordion() {
            const accordionItems = document.querySelectorAll('.accordion__item');
            
            accordionItems.forEach(item => {
                const button = item.querySelector('.accordion__button');
                
                // Auto-expand the section containing current lesson
                if (item.querySelector('.bg-light-3')) {
                    item.classList.add('is-active');
                }
                
                button.addEventListener('click', () => {
                    item.classList.toggle('is-active');
                });
            });
        }
        
        // Common function to update progress
        function updateProgress(progressPercentage) {
            fetch(PROGRESS_UPDATE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': CSRF_TOKEN
                },
                body: JSON.stringify({
                    progress_percentage: progressPercentage
                })
            })
            .then(response => response.json())
            .then(data => {
                // If progress is >= 95% and server marked it as completed
                if (progressPercentage >= 95 && data.completed) {
                    // Refresh to show completion status
                    window.location.reload();
                }
            })
            .catch(error => console.error('Error updating progress:', error));
        }
        
        // Function to mark lesson as complete
        function markLessonComplete() {
            fetch(LESSON_COMPLETE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': CSRF_TOKEN
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    // Reload page to reflect completion
                    window.location.reload();
                }
            })
            .catch(error => console.error('Error marking lesson as complete:', error));
        }
    </script>
    @endpush
</x-dashboard-layout> 