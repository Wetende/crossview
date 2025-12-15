<x-app-layout>
    <main class="main-content bg-light-4">
        <div class="content-wrapper js-content-wrapper">
            
            <!-- Preview Banner -->
            <section class="bg-dark-2 py-20">
                <div class="container">
                    <div class="row">
                        <div class="col-12">
                            <div class="d-flex justify-center items-center">
                                <div class="badge px-20 py-8 text-14 bg-orange-1 text-white fw-500 mr-15">
                                    <i class="icon-eye mr-10"></i>PREVIEW MODE
            </div>
                                <div class="text-light-1">This is how your @lmsterm('study material') will appear to students</div>
                                <a href="{{ route('teacher.courses.builder', $course) }}" class="button -sm -purple-1 text-white ml-20">
                                    <i class="icon-edit mr-10"></i>Back to Editor
                </a>
            </div>
        </div>
                    </div>
                </div>
            </section>

            <!-- Course Header Section -->
            <section data-anim="fade" class="breadcrumbs">
                <div class="container">
                    <div class="row">
                        <div class="col-auto">
                            <div class="breadcrumbs__content">
                                <div class="breadcrumbs__item">
                                    <a href="{{ route('home') }}">Home</a>
                                </div>
                                <div class="breadcrumbs__item">
                                    <a href="{{ route('courses.list') }}">All @lmsterm('study materials')</a>
                                </div>
                                <div class="breadcrumbs__item">
                                    <a href="#">{{ $course->category->name ?? 'Category' }}</a>
                                </div>
                                <div class="breadcrumbs__item">
                                    <a href="#">{{ $course->subject->name ?? 'Subject' }}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div class="js-pin-container">
                <section class="page-header -type-5">
                    <div class="page-header__bg">
                        <div class="bg-image js-lazy" data-bg="img/event-single/bg.png"></div>
                    </div>

                    <div class="container">
                        <div class="page-header__content pt-60">
                            <div class="row y-gap-30 relative">
                                <div class="col-xl-7 col-lg-8">
                                    <div class="d-flex x-gap-15 y-gap-10 pb-20">
                                        @if($course->is_featured)
                                        <div>
                                            <div class="badge px-15 py-8 text-11 bg-green-1 text-dark-1 fw-400">BEST SELLER</div>
                        </div>
                    @endif
                                        <div>
                                            <div class="badge px-15 py-8 text-11 bg-orange-1 text-white fw-400">PREVIEW</div>
                                        </div>
                                        @if($course->is_recommended)
                                        <div>
                                            <div class="badge px-15 py-8 text-11 bg-purple-1 text-white fw-400">POPULAR</div>
                        </div>
                    @endif
                </div>

                                    <div data-anim="slide-up delay-1">
                                        <h1 class="text-30 lh-14 pr-60 lg:pr-0">{{ $course->title }}</h1>
                                    </div>

                                    <p class="col-xl-9 mt-20">{{ $course->short_description ?? $course->description }}</p>

                                    <div class="d-flex x-gap-30 y-gap-10 items-center flex-wrap pt-20">
                                        <div class="d-flex items-center text-light-1">
                                            <div class="text-14 lh-1 text-yellow-1 mr-10">{{ number_format($course->reviews->avg('rating') ?? 0, 1) }}</div>
                                            <div class="d-flex x-gap-10 items-center">
                                                @for($i = 1; $i <= 5; $i++)
                                                    <div class="icon-star text-9 {{ $i <= ($course->reviews->avg('rating') ?? 0) ? 'text-yellow-1' : 'text-light-1' }}"></div>
                                                @endfor
                                            </div>
                                            <div class="text-14 lh-1 ml-10">({{ $course->reviews->count() }})</div>
                                        </div>

                                        <div class="d-flex items-center text-light-1">
                                            <div class="icon icon-person-3 text-13"></div>
                                            <div class="text-14 ml-8">{{ $course->enrollments->count() }} enrolled on this @lmsterm('study material')</div>
                                    </div>

                                        <div class="d-flex items-center text-light-1">
                                            <div class="icon icon-wall-clock text-13"></div>
                                            <div class="text-14 ml-8">Last updated {{ $course->updated_at->format('m/Y') }}</div>
                                        </div>
                </div>
                
                                    <div class="d-flex items-center pt-20">
                                        <div class="bg-image size-30 rounded-full js-lazy" data-bg="{{ $course->teacher->profile_picture_path ?? asset('img/avatars/small-1.png') }}"></div>
                                        <div class="text-14 lh-1 ml-10">{{ $course->teacher->name }}</div>
                                    </div>
                                </div>

                                <div class="col-lg-8">
                                    <div class="relative pt-40">
                                        @if($course->thumbnail_path)
                                            <img class="w-1/1" src="{{ asset($course->thumbnail_path) }}" alt="{{ $course->title }}">
                                        @else
                                            <div class="w-1/1 bg-light-3 -dark-bg-dark-2 d-flex flex-column justify-center items-center py-80" style="min-height: 300px;">
                                                <i class="icon-play-button text-80 text-purple-1 -dark-text-white"></i>
                                                <div class="text-18 lh-1 fw-500 mt-20">No Thumbnail Set</div>
                                                <div class="text-14 text-light-1 mt-5">Add a thumbnail in the editor.</div>
                                            </div>
                                        @endif
                                    </div>
                                </div>

                                <!-- Course Info Sidebar -->
                                <div class="courses-single-info js-pin-content">
                                    <div class="courses-single-info__content scroll-bar-1 bg-white shadow-2 rounded-8 border-light py-30 px-30">
                                        <div class="d-flex justify-between items-center mb-30">
                        @if($course->price > 0)
                                                <div class="text-24 lh-1 text-dark-1 fw-500">KES {{ number_format($course->price) }}</div>
                                                @if($course->sale_price && $course->isSaleActive())
                                                    <div class="lh-1 line-through">KES {{ number_format($course->sale_price) }}</div>
                                                @endif
                        @else
                                                <div class="text-24 lh-1 text-green-1 fw-500">Free</div>
                        @endif
                    </div>

                                        <button class="button -md -purple-1 text-white w-1/1" disabled>Enrollment Disabled in Preview</button>
                                        <div class="text-14 lh-1 text-center mt-10 text-light-1">This is preview mode - enrollment is not active</div>

                                        <!-- Course Details -->
                                        <div class="mt-25">
                    @php
                        $totalLessons = 0;
                        $totalQuizzes = 0;
                        $totalAssignments = 0;
                        $totalDurationMinutes = 0;
                        foreach($course->sections as $section) {
                            $totalLessons += $section->lessons->count();
                            $totalQuizzes += $section->quizzes->count();
                            $totalAssignments += $section->assignments->count();
                            foreach($section->lessons as $lesson) {
                                $totalDurationMinutes += (int) $lesson->duration;
                            }
                        }
                    @endphp

                                            <div class="d-flex justify-between py-8">
                                                <div class="d-flex items-center text-dark-1">
                                                    <div class="icon-video-file"></div>
                                                    <div class="ml-10">Lessons</div>
                                                </div>
                                                <div>{{ $totalLessons }}</div>
                                            </div>

                                            <div class="d-flex justify-between py-8 border-top-light">
                                                <div class="d-flex items-center text-dark-1">
                                                    <div class="icon-puzzle"></div>
                                                    <div class="ml-10">Quizzes</div>
                                                </div>
                                                <div>{{ $totalQuizzes }}</div>
                                            </div>

                                            <div class="d-flex justify-between py-8 border-top-light">
                                                <div class="d-flex items-center text-dark-1">
                                                    <div class="icon-clock-2"></div>
                                                    <div class="ml-10">Duration</div>
                                                </div>
                                                <div>{{ $totalDurationMinutes }} minutes</div>
                                            </div>

                                            <div class="d-flex justify-between py-8 border-top-light">
                                                <div class="d-flex items-center text-dark-1">
                                                    <div class="icon-bar-chart-2"></div>
                                                    <div class="ml-10">Grade Level</div>
                                                </div>
                                                <div>{{ $course->gradeLevel->name ?? 'Not specified' }}</div>
                                            </div>

                                            <div class="d-flex justify-between py-8 border-top-light">
                                                <div class="d-flex items-center text-dark-1">
                                                    <div class="icon-translate"></div>
                                                    <div class="ml-10">Language</div>
                                                </div>
                                                <div>{{ $course->language ?? 'English' }}</div>
                                            </div>

                                            <div class="d-flex justify-between py-8 border-top-light">
                                                <div class="d-flex items-center text-dark-1">
                                                    <div class="icon-badge"></div>
                                                    <div class="ml-10">Certificate</div>
                                                </div>
                                                <div>{{ $course->allow_certificate ? 'Yes' : 'No' }}</div>
                                            </div>

                                            <div class="d-flex justify-between py-8 border-top-light">
                                                <div class="d-flex items-center text-dark-1">
                                                    <div class="icon-infinity"></div>
                                                    <div class="ml-10">Full lifetime access</div>
                                                </div>
                                                <div>Yes</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Course Content Tabs -->
                <section class="pt-30 layout-pb-md">
                    <div class="container">
                        <div class="row">
                            <div class="col-lg-8">
                                <div class="pt-25 pb-30 px-30 bg-white shadow-2 rounded-8 border-light">
                                    <div class="tabs -active-purple-2 js-tabs pt-0">
                                        <div class="tabs__controls d-flex js-tabs-controls">
                                            <button class="tabs__button js-tabs-button js-update-pin-scene is-active" data-tab-target=".-tab-item-1" type="button">
                                                Overview
                                            </button>
                                            <button class="tabs__button js-tabs-button js-update-pin-scene ml-30" data-tab-target=".-tab-item-2" type="button">
                                                @lmsterm('Study Material') Content
                                            </button>
                                            <button class="tabs__button js-tabs-button js-update-pin-scene ml-30" data-tab-target=".-tab-item-3" type="button">
                                                Instructor
                                            </button>
                                        </div>

                                        <div class="tabs__content pt-60 lg:pt-40 js-tabs-content">
                                            <!-- Overview Tab -->
                                            <div class="tabs__pane -tab-item-1 is-active">
                                                <h4 class="text-18 fw-500">Description</h4>
                                                <div class="show-more mt-30 js-show-more">
                                                    <div class="show-more__content">
                                                        <div class="course-description">
                                                            {!! $course->description ?? '<p>No description available for this @lmsterm("study material").</p>' !!}
                                                        </div>
                                                    </div>
                                                </div>

                                                @php
                                                    $learningObjectives = $course->what_you_will_learn;
                                                    if (is_string($learningObjectives)) {
                                                        $learningObjectives = json_decode($learningObjectives, true) ?? [];
                                                    }
                                                    $learningObjectives = is_array($learningObjectives) ? $learningObjectives : [];
                                                @endphp
                                                
                                                @if(count($learningObjectives) > 0)
                                                <div class="mt-60">
                                                    <h4 class="text-20 mb-30">What you'll learn</h4>
                                                    <div class="row x-gap-100 justify-between">
                                                        @php
                                                            $halfCount = ceil(count($learningObjectives) / 2);
                                                            $firstHalf = array_slice($learningObjectives, 0, $halfCount);
                                                            $secondHalf = array_slice($learningObjectives, $halfCount);
                                                        @endphp
                                                        
                                                        <div class="col-md-6">
                                                            <div class="y-gap-20">
                                                                @foreach($firstHalf as $objective)
                                                                <div class="d-flex items-center">
                                                                    <div class="d-flex justify-center items-center border-light rounded-full size-20 mr-10">
                                                                        <i class="size-12" data-feather="check"></i>
                                                                    </div>
                                                                    <p>{{ $objective }}</p>
                                                                </div>
                                                                @endforeach
                                                            </div>
                                                        </div>

                                                        <div class="col-md-6">
                                                            <div class="y-gap-20">
                                                                @foreach($secondHalf as $objective)
                                                                <div class="d-flex items-center">
                                                                    <div class="d-flex justify-center items-center border-light rounded-full size-20 mr-10">
                                                                        <i class="size-12" data-feather="check"></i>
                                                                    </div>
                                                                    <p>{{ $objective }}</p>
                                                                </div>
                                                                @endforeach
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                @endif

                                                @php
                                                    $requirements = $course->requirements;
                                                    if (is_string($requirements)) {
                                                        $requirements = json_decode($requirements, true) ?? [];
                                                    }
                                                    $requirements = is_array($requirements) ? $requirements : [];
                                                @endphp
                                                
                                                @if(count($requirements) > 0)
                                                <div class="mt-60">
                                                    <h4 class="text-20">Requirements</h4>
                                                    <ul class="ul-list y-gap-15 pt-30">
                                                        @foreach($requirements as $requirement)
                                                            <li>{{ $requirement }}</li>
                                                        @endforeach
                                                    </ul>
                                                </div>
                                                @endif
                                            </div>

                                            <!-- Course Content Tab -->
                                            <div class="tabs__pane -tab-item-2">
                                                <h2 class="text-20 fw-500">Course Content</h2>

                                                <div class="d-flex justify-between items-center mt-30">
                                                    <div class="">{{ $course->sections->count() }} sections • {{ $totalLessons }} lessons</div>
                                                    <a href="#" class="underline text-purple-1">Expand All Sections</a>
                                                </div>

                                                <div class="mt-10">
                                                    <div class="accordion -block-2 text-left js-accordion">
                                                        @forelse($course->sections as $section)
                                                        <div class="accordion__item">
                                                            <div class="accordion__button py-20 px-30 bg-light-4">
                                                                <div class="d-flex items-center">
                                                                    <div class="accordion__icon">
                                                                        <div class="icon" data-feather="chevron-down"></div>
                                                                        <div class="icon" data-feather="chevron-up"></div>
                                                                    </div>
                                                                    <span class="text-17 fw-500 text-dark-1">{{ $section->title }}</span>
                                                                </div>
                                                                <div>{{ $section->lessons->count() }} lessons • {{ $section->quizzes->count() }} quizzes</div>
                                                            </div>

                                                            <div class="accordion__content">
                                                                <div class="accordion__content__inner px-30 py-30">
                                                                    <div class="y-gap-20">
                                                                        @foreach($section->lessons as $lesson)
                                                                        <div class="d-flex justify-between">
                                                                            <div class="d-flex items-center">
                                                                                <div class="d-flex justify-center items-center size-30 rounded-full bg-purple-3 mr-10">
                                                                                    @if($lesson->lesson_type === 'video')
                                                                                        <div class="icon-play text-9"></div>
                                                                                    @elseif($lesson->lesson_type === 'quiz_link')
                                                                                        <div class="icon-puzzle text-9"></div>
                                                                                    @elseif($lesson->lesson_type === 'assignment_link')
                                                                                        <div class="icon-file text-9"></div>
                                                                                    @else
                                                                                        <div class="icon-file-text text-9"></div>
                                                                                    @endif
                                                                                </div>
                                                                                <div>{{ $lesson->title }}</div>
                                                                            </div>
                                                                            <div class="d-flex x-gap-20 items-center">
                                                                                @if($lesson->duration)
                                                                                    <span class="text-14 lh-1 text-purple-1">{{ $lesson->duration }} min</span>
                                                                                @endif
                                                                            </div>
                                                                        </div>
                                                                        @endforeach

                                                                        @foreach($section->quizzes as $quiz)
                                                                        <div class="d-flex justify-between">
                                                                            <div class="d-flex items-center">
                                                                                <div class="d-flex justify-center items-center size-30 rounded-full bg-orange-3 mr-10">
                                                                                    <div class="icon-puzzle text-9"></div>
                                                                                </div>
                                                                                <div>{{ $quiz->title }}</div>
                                                                            </div>
                                                                            <div class="d-flex x-gap-20 items-center">
                                                                                <span class="text-14 lh-1 text-purple-1">{{ $quiz->questions->count() }} questions</span>
                                                                                @if($quiz->time_limit)
                                                                                    <span class="text-14 lh-1 text-purple-1">{{ $quiz->time_limit }} min</span>
                                                                                @endif
                                                                            </div>
                                                                        </div>
                                                                        @endforeach

                                                                        @foreach($section->assignments as $assignment)
                                                                        <div class="d-flex justify-between">
                                                                            <div class="d-flex items-center">
                                                                                <div class="d-flex justify-center items-center size-30 rounded-full bg-green-3 mr-10">
                                                                                    <div class="icon-file text-9"></div>
                                                                                </div>
                                                                                <div>{{ $assignment->title }}</div>
                                                                            </div>
                                                                            <div class="d-flex x-gap-20 items-center">
                                                                                @if($assignment->points_possible)
                                                                                    <span class="text-14 lh-1 text-purple-1">{{ $assignment->points_possible }} points</span>
                                                                                @endif
                                                                                @if($assignment->due_date)
                                                                                    <span class="text-14 lh-1 text-purple-1">Due {{ $assignment->due_date->format('M j') }}</span>
                                                                                @endif
                                                                            </div>
                                                                        </div>
                                                                        @endforeach
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        @empty
                                                        <div class="text-center py-40">
                                                            <p class="text-light-1">No course content available yet.</p>
                                                        </div>
                                                        @endforelse
                    </div>
                    </div>
                    </div>

                                            <!-- Instructor Tab -->
                                            <div class="tabs__pane -tab-item-3">
                                                <h2 class="text-20 fw-500">Instructor</h2>

                                                <div class="mt-30">
                                                    <div class="d-flex x-gap-20 y-gap-20 items-center flex-wrap">
                                                        <div class="size-120">
                                                            <img class="object-cover rounded-full" src="{{ $course->teacher->profile_picture_path ?? asset('img/misc/verified/1.png') }}" alt="{{ $course->teacher->name }}">
                    </div>

                                                        <div class="">
                                                            <h5 class="text-17 lh-14 fw-500">{{ $course->teacher->name }}</h5>
                                                            <p class="mt-5">{{ $course->teacher->title ?? 'Course Instructor' }}</p>

                                                            <div class="d-flex x-gap-20 y-gap-10 flex-wrap items-center pt-10">
                     <div class="d-flex items-center">
                                                                    <div class="d-flex items-center mr-8">
                                                                        <div class="icon-star text-11 text-yellow-1"></div>
                                                                        <div class="text-14 lh-12 text-yellow-1 ml-5">{{ number_format($course->teacher->courses->avg('reviews.rating') ?? 0, 1) }}</div>
                                                                    </div>
                                                                    <div class="text-13 lh-1">Instructor Rating</div>
                                                                </div>

                                                                <div class="d-flex items-center text-light-1">
                                                                    <div class="icon-comment text-13 mr-8"></div>
                                                                    <div class="text-13 lh-1">{{ $course->teacher->courses->sum(function($c) { return $c->reviews->count(); }) }} Reviews</div>
                                                                </div>

                                                                <div class="d-flex items-center text-light-1">
                                                                    <div class="icon-person-3 text-13 mr-8"></div>
                                                                    <div class="text-13 lh-1">{{ $course->teacher->courses->sum(function($c) { return $c->enrollments->count(); }) }} Students</div>
                                                                </div>

                                                                <div class="d-flex items-center text-light-1">
                                                                    <div class="icon-wall-clock text-13 mr-8"></div>
                                                                    <div class="text-13 lh-1">{{ $course->teacher->courses->count() }} Courses</div>
                                                                </div>
                                                            </div>
                                                        </div>
                    </div>

                    <div class="mt-30">
                                                        @if($course->instructor_info)
                                                            <div class="instructor-bio">
                                                                {!! nl2br(e($course->instructor_info)) !!}
                                                            </div>
                                                        @else
                                                            <p>
                                                                {{ $course->teacher->name }} is an experienced instructor dedicated to providing quality education. 
                                                                With expertise in {{ $course->subject->name ?? 'various subjects' }}, they bring practical knowledge 
                                                                and engaging teaching methods to help students achieve their learning goals.
                                                            </p>
                                                        @endif
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
                </section>
            </div>
        </div>
    </main>
</x-app-layout>

@section('scripts')
<script>
    // Initialize accordions and tabs
    document.addEventListener('DOMContentLoaded', function() {
        // Add any specific preview mode scripts here
    });
</script>
@endsection 