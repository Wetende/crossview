<x-app-layout>

  <main class="main-content  
  bg-light-4
">

    


    <div class="content-wrapper  js-content-wrapper">


      <section data-anim="fade" class="breadcrumbs ">
        <div class="container">
          <div class="row">
            <div class="col-auto">
              <div class="breadcrumbs__content">

                <div class="breadcrumbs__item ">
                  <a href="{{ route('home') }}">Home</a>
                </div>

                <div class="breadcrumbs__item ">
                  <a href="{{ route('courses.list') }}">All @lmsterm('Study Materials')</a>
                </div>

                <div class="breadcrumbs__item ">
                  <a href="#">{{ $course->category->name ?? 'Category' }}</a>
                </div>

                <div class="breadcrumbs__item ">
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
                    <div>
                      <div class="badge px-15 py-8 text-11 bg-green-1 text-dark-1 fw-400">BEST SELLER</div>
                    </div>
                    <div>
                      <div class="badge px-15 py-8 text-11 bg-orange-1 text-white fw-400">NEW</div>
                    </div>
                    <div>
                      <div class="badge px-15 py-8 text-11 bg-purple-1 text-white fw-400">POPULAR</div>
                    </div>
                  </div>

                  <div data-anim="slide-up delay-1">
                    <h1 class="text-30 lh-14 pr-60 lg:pr-0">{{ $course->title }}</h1>
                  </div>

                  <p class="col-xl-9 mt-20">{{ $course->short_description ?? $course->description }}</p>

                  <div class="d-flex x-gap-30 y-gap-10 items-center flex-wrap pt-20">
                    <div class="d-flex items-center text-light-1">
                      <div class="text-14 lh-1 text-yellow-1 mr-10">{{ number_format($courseStats['average_rating'], 1) }}</div>
                      <div class="d-flex x-gap-10 items-center">
                        @for($i = 1; $i <= 5; $i++)
                          <div class="icon-star text-9 {{ $i <= $courseStats['average_rating'] ? 'text-yellow-1' : 'text-light-1' }}"></div>
                        @endfor
                      </div>
                      <div class="text-14 lh-1 ml-10">({{ $courseStats['review_count'] }})</div>
                    </div>


                    <div class="d-flex items-center text-light-1">
                      <div class="icon icon-person-3 text-13"></div>
                      <div class="text-14 ml-8">{{ $courseStats['enrollment_count'] }} enrolled on this @lmsterm('study material')</div>
                    </div>

                    <div class="d-flex items-center text-light-1">
                      <div class="icon icon-wall-clock text-13"></div>
                      <div class="text-14 ml-8">Last updated {{ $course->updated_at->format('m/Y') }}</div>
                    </div>

                  </div>

                  <div class="d-flex items-center pt-20">
                    <div class="bg-image size-30 rounded-full js-lazy" data-bg="{{ $course->teacher->profile_picture_path ?? asset('img/default.png') }}"></div>
                    <div class="text-14 lh-1 ml-10">{{ $course->teacher->name }}</div>
                  </div>
                </div>

                <div class="col-lg-8">
                  <div class="relative pt-40">
                    <img class="w-1/1" src="{{ $course->thumbnail_path ? Storage::url($course->thumbnail_path) : asset('img/course.jpeg') }}">
                    @if($course->preview_video_url)
                      <div class="absolute-full-center d-flex justify-center items-center">
                        <a href="{{ $course->preview_video_url }}" class="d-flex justify-center items-center size-60 rounded-full bg-white js-gallery" data-gallery="gallery1">
                          <div class="icon-play text-18"></div>
                        </a>
                      </div>
                    @endif
                  </div>
                </div>

                <div class="courses-single-info js-pin-content">
                  <div class="courses-single-info__content scroll-bar-1 bg-white shadow-2 rounded-8 border-light py-30 px-30">
                    <div class="d-flex justify-between items-center mb-30">
                      @if($course->price > 0)
                        <div class="text-24 lh-1 text-dark-1 fw-500">KES {{ number_format($course->price) }}</div>
                        @if($course->original_price && $course->original_price > $course->price)
                          <div class="lh-1 line-through">KES {{ number_format($course->original_price) }}</div>
                        @endif
                      @else
                        <div class="text-24 lh-1 text-green-1 fw-500">Free</div>
                      @endif
                    </div>

                    <button class="button -md -purple-1 text-white w-1/1">Add To Cart</button>
                    <button class="button -md -outline-dark-1 text-dark-1 w-1/1 mt-10">Buy Now</button>

                    <div class="text-14 lh-1 text-center mt-30">30-Day Money-Back Guarantee</div>

                    <div class="mt-25">

                      <div class="d-flex justify-between py-8 ">
                        <div class="d-flex items-center text-dark-1">
                          <div class="icon-video-file"></div>
                          <div class="ml-10">Lessons</div>
                        </div>
                        <div>{{ $courseStats['total_lessons'] }}</div>
                      </div>

                      <div class="d-flex justify-between py-8 border-top-light">
                        <div class="d-flex items-center text-dark-1">
                          <div class="icon-puzzle"></div>
                          <div class="ml-10">Quizzes</div>
                        </div>
                        <div>{{ $course->sections->sum(function($section) { return $section->quizzes->count(); }) }}</div>
                      </div>

                      <div class="d-flex justify-between py-8 border-top-light">
                        <div class="d-flex items-center text-dark-1">
                          <div class="icon-clock-2"></div>
                          <div class="ml-10">Duration</div>
                        </div>
                        <div>{{ $courseStats['duration_formatted'] }}</div>
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
                        <div>Yes</div>
                      </div>

                      <div class="d-flex justify-between py-8 border-top-light">
                        <div class="d-flex items-center text-dark-1">
                          <div class="icon-infinity"></div>
                          <div class="ml-10">Full lifetime access</div>
                        </div>
                        <div>Yes</div>
                      </div>

                    </div>

                    <div class="d-flex justify-center pt-15">

                      <a href="#" class="d-flex justify-center items-center size-40 rounded-full">
                        <i class="fa fa-facebook"></i>
                      </a>

                      <a href="#" class="d-flex justify-center items-center size-40 rounded-full">
                        <i class="fa fa-twitter"></i>
                      </a>

                      <a href="#" class="d-flex justify-center items-center size-40 rounded-full">
                        <i class="fa fa-instagram"></i>
                      </a>

                      <a href="#" class="d-flex justify-center items-center size-40 rounded-full">
                        <i class="fa fa-linkedin"></i>
                      </a>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


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
                        Instructors
                      </button>
                      <button class="tabs__button js-tabs-button js-update-pin-scene ml-30" data-tab-target=".-tab-item-4" type="button">
                        Reviews
                      </button>
                    </div>

                    <div class="tabs__content pt-60 lg:pt-40 js-tabs-content">
                      <div class="tabs__pane -tab-item-1 is-active">
                        <h4 class="text-18 fw-500">Description</h4>

                        <div class="show-more mt-30 js-show-more">
                          <div class="show-more__content">
                            <div class="course-description">
                              {!! $course->description ?? '<p>No description available for this course.</p>' !!}
                            </div>
                          </div>

                          @if(strlen(strip_tags($course->description ?? '')) > 500)
                            <button class="show-more__button text-purple-1 fw-500 underline mt-30">Show more</button>
                          @endif
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

                      <div class="tabs__pane -tab-item-2">
                        <h2 class="text-20 fw-500">@lmsterm('Study Material') Content</h2>

                        <div class="d-flex justify-between items-center mt-30">
                          <div class="">{{ $course->sections->count() }} sections • {{ $courseStats['total_lessons'] }} lessons</div>
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
                                        @if($lesson->is_preview_allowed)
                                          <a href="#" class="text-14 lh-1 text-purple-1 underline">Preview</a>
                                        @endif
                                        @if($lesson->lesson_type === 'quiz_link' && $lesson->linkedQuiz)
                                          <a href="#" class="text-14 lh-1 text-purple-1 underline">{{ $lesson->linkedQuiz->questions->count() }} questions</a>
                                        @endif
                                        @if($lesson->lesson_duration)
                                          <span class="text-14 lh-1 text-purple-1">{{ gmdate('i:s', $lesson->lesson_duration * 60) }}</span>
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

                      <div class="tabs__pane -tab-item-3">
                        <h2 class="text-20 fw-500">Instructor</h2>

                        <div class="mt-30">
                          <div class="d-flex x-gap-20 y-gap-20 items-center flex-wrap">
                            <div class="size-120">
                              <img class="object-cover rounded-full" src="{{ $course->teacher->profile_picture_path ?? asset('img/default.png') }}" alt="{{ $course->teacher->name }}">
                            </div>

                            <div class="">
                              <h5 class="text-17 lh-14 fw-500">{{ $course->teacher->name }}</h5>
                              <p class="mt-5">{{ $course->teacher->title ?? 'Course Instructor' }}</p>

                              <div class="d-flex x-gap-20 y-gap-10 flex-wrap items-center pt-10">
                                <div class="d-flex items-center">
                                  <div class="d-flex items-center mr-8">
                                    <div class="icon-star text-11 text-yellow-1"></div>
                                    <div class="text-14 lh-12 text-yellow-1 ml-5">{{ number_format($instructorStats['average_rating'] ?? 0, 1) }}</div>
                                  </div>
                                  <div class="text-13 lh-1">Instructor Rating</div>
                                </div>

                                <div class="d-flex items-center text-light-1">
                                  <div class="icon-comment text-13 mr-8"></div>
                                  <div class="text-13 lh-1">{{ number_format($instructorStats['total_reviews'] ?? 0) }} Reviews</div>
                                </div>

                                <div class="d-flex items-center text-light-1">
                                  <div class="icon-person-3 text-13 mr-8"></div>
                                  <div class="text-13 lh-1">{{ number_format($instructorStats['total_students'] ?? 0) }} Students</div>
                                </div>

                                <div class="d-flex items-center text-light-1">
                                  <div class="icon-wall-clock text-13 mr-8"></div>
                                  <div class="text-13 lh-1">{{ $instructorStats['total_courses'] ?? 0 }} @lmsterm('Study Materials')</div>
                                </div>

                              </div>
                            </div>
                          </div>

                          <div class="mt-30">
                            @if($course->teacher->bio)
                              <div class="instructor-bio">
                                {!! nl2br(e($course->teacher->bio)) !!}
                              </div>
                            @else
                              <p>
                                {{ $course->teacher->name }} is an experienced instructor dedicated to providing quality education. 
                                With expertise in {{ $course->subject->name ?? 'various subjects' }}, they bring practical knowledge 
                                and engaging teaching methods to help students achieve their learning goals.
                              </p>
                            @endif
                          </div>

                          @if($instructorCourses && $instructorCourses->count() > 1)
                          <div class="mt-40">
                            <h4 class="text-18 fw-500 mb-20">Other @lmsterm('Study Materials') by {{ $course->teacher->name }}</h4>
                            <div class="row y-gap-20">
                              @foreach($instructorCourses->where('id', '!=', $course->id)->take(3) as $otherCourse)
                              <div class="col-lg-4">
                                <div class="coursesCard -type-1">
                                  <div class="coursesCard__image">
                                    <img src="{{ $otherCourse->image_url ?? asset('img/course.jpeg') }}" alt="{{ $otherCourse->title }}">
                                  </div>
                                  <div class="coursesCard__content">
                                    <h5 class="text-16 fw-500 mt-10">
                                      <a href="{{ route('courses.show', $otherCourse) }}">{{ Str::limit($otherCourse->title, 50) }}</a>
                                    </h5>
                                    <div class="d-flex items-center mt-10">
                                      <div class="text-14 text-yellow-1 mr-10">{{ number_format($otherCourse->average_rating, 1) }}</div>
                                      <div class="d-flex x-gap-5">
                                        @for($i = 1; $i <= 5; $i++)
                                          <div class="icon-star text-9 {{ $i <= $otherCourse->average_rating ? 'text-yellow-1' : 'text-light-1' }}"></div>
                                        @endfor
                                      </div>
                                    </div>
                                    <div class="coursesCard-footer mt-15">
                                      <div class="coursesCard-footer__price">
                                        @if($otherCourse->price > 0)
                                          <div>UGX {{ number_format($otherCourse->price) }}</div>
                                        @else
                                          <div class="text-green-1">Free</div>
                                        @endif
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              @endforeach
                            </div>
                          </div>
                          @endif
                        </div>
                      </div>

                      <div class="tabs__pane -tab-item-4">
                        <div class="blogPost -comments">
                          <div class="blogPost__content">
                            <h2 class="text-20 fw-500">
                              Reviews ({{ $courseStats['review_count'] }})
                            </h2>

                            @if($course->reviews && $course->reviews->count() > 0)
                            <ul class="comments__list mt-30">
                              @foreach($course->reviews->take(5) as $review)
                              <li class="comments__item">
                                <div class="comments__item-inner md:direction-column">
                                  <div class="comments__img mr-20">
                                    <div class="bg-image rounded-full js-lazy" data-bg="{{ $review->user->profile_picture_path ?? asset('img/avatars/1.png') }}"></div>
                                  </div>

                                  <div class="comments__body md:mt-15">
                                    <div class="comments__header">
                                      <h4 class="text-17 fw-500 lh-15">
                                        {{ $review->user->name }}
                                        <span class="text-13 text-light-1 fw-400">{{ $review->created_at->diffForHumans() }}</span>
                                      </h4>

                                      <div class="d-flex x-gap-5 items-center">
                                        @for($i = 1; $i <= 5; $i++)
                                          <div class="icon-star text-11 {{ $i <= $review->rating ? 'text-yellow-1' : 'text-light-1' }}"></div>
                                        @endfor
                                      </div>
                                    </div>

                                    @if($review->title)
                                      <h5 class="text-15 fw-500 mt-15">{{ $review->title }}</h5>
                                    @endif
                                    <div class="comments__text mt-10">
                                      <p>{{ $review->content }}</p>
                                    </div>

                                    <div class="comments__helpful mt-20">
                                      <span class="text-13 text-purple-1">Was this review helpful?</span>
                                      <button class="button text-13 -sm -purple-1 text-white">Yes</button>
                                      <button class="button text-13 -sm -light-7 text-purple-1">No</button>
                                    </div>
                                  </div>
                                </div>
                              </li>
                              @endforeach

                              @if($course->reviews->count() > 5)
                              <li class="comments__item">
                                <div class="d-flex justify-center">
                                  <button class="text-purple-1 lh-12 underline fw-500">View All Reviews</button>
                                </div>
                              </li>
                              @endif
                            </ul>
                            @else
                            <div class="text-center py-40">
                              <p class="text-light-1">No reviews yet. Be the first to review this course!</p>
                            </div>
                            @endif
                          </div>
                        </div>

                        @auth
                        <div class="respondForm pt-30">
                          <h3 class="text-20 fw-500">
                            Write a Review
                          </h3>

                          <div class="mt-30">
                            <h4 class="text-16 fw-500">Rate this @lmsterm('study material')</h4>
                            <div class="d-flex x-gap-10 pt-10">
                              <div class="icon-star text-14 text-yellow-1 rating-star" data-rating="1"></div>
                              <div class="icon-star text-14 text-light-1 rating-star" data-rating="2"></div>
                              <div class="icon-star text-14 text-light-1 rating-star" data-rating="3"></div>
                              <div class="icon-star text-14 text-light-1 rating-star" data-rating="4"></div>
                              <div class="icon-star text-14 text-light-1 rating-star" data-rating="5"></div>
                            </div>
                          </div>

                          <form class="contact-form respondForm__form row y-gap-30 pt-30" action="{{ route('courses.reviews.store', $course) }}" method="POST">
                            @csrf
                            <input type="hidden" name="rating" id="review-rating" value="1">
                            
                            <div class="col-12">
                              <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Review Title</label>
                              <input type="text" name="title" placeholder="Great @lmsterm('Study Material')!" value="{{ old('title') }}">
                              @error('title')
                                <div class="text-red-1 mt-1">{{ $message }}</div>
                              @enderror
                            </div>
                            
                            <div class="col-12">
                              <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Review Content</label>
                              <textarea name="content" placeholder="Share your experience with this @lmsterm('study material')..." rows="8">{{ old('content') }}</textarea>
                              @error('content')
                                <div class="text-red-1 mt-1">{{ $message ?? 'Please provide review content' }}</div>
                              @enderror
                            </div>
                            
                            <div class="col-12">
                              <button type="submit" class="button -md -purple-1 text-white">
                                Submit Review
                              </button>
                            </div>
                          </form>
                        </div>
                        @else
                        <div class="text-center pt-30">
                          <p class="text-light-1 mb-20">Please <a href="{{ route('login') }}" class="text-purple-1 underline">login</a> to write a review.</p>
                        </div>
                        @endauth
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>


      <section class="layout-pt-md layout-pb-lg">
        <div data-anim-wrap class="container">
          <div class="row">
            <div class="col-auto">

              <div class="sectionTitle ">

                <h2 class="sectionTitle__title ">You May Like</h2>

                <p class="sectionTitle__text ">Similar @lmsterm('study materials') you might be interested in</p>

              </div>

            </div>
          </div>

          <div class="relative pt-60 lg:pt-50">
            <div class="overflow-hidden js-section-slider" data-gap="30" data-loop data-pagination data-nav-prev="js-courses-prev" data-nav-next="js-courses-next" data-slider-cols="xl-4 lg-3 md-2">
              <div class="swiper-wrapper">

                @forelse($similarCourses->take(2) as $index => $similarCourse)
                <div data-anim-child="slide-up delay-{{ $index + 1 }}" class="swiper-slide">

                  <a href="{{ route('courses.show', $similarCourse) }}" class="coursesCard -type-1 ">
                    <div class="relative">
                      <div class="coursesCard__image overflow-hidden rounded-8">
                        <img class="w-1/1" src="{{ $similarCourse->image_url ?? asset('img/course.jpeg') }}" alt="{{ $similarCourse->title }}">
                        <div class="coursesCard__image_overlay rounded-8"></div>
                      </div>
                      <div class="d-flex justify-between py-10 px-10 absolute-full-center z-3">
                        @if($similarCourse->is_featured)
                          <div>
                            <div class="px-15 rounded-200 bg-purple-1">
                              <span class="text-11 lh-1 uppercase fw-500 text-white">Popular</span>
                            </div>
                          </div>
                        @endif

                        @if($similarCourse->enrollments_count > 100)
                          <div>
                            <div class="px-15 rounded-200 bg-green-1">
                              <span class="text-11 lh-1 uppercase fw-500 text-dark-1">Best sellers</span>
                            </div>
                          </div>
                        @endif
                      </div>
                    </div>

                    <div class="h-100 pt-15">
                      <div class="d-flex items-center">
                        <div class="text-14 lh-1 text-yellow-1 mr-10">{{ number_format($similarCourse->average_rating, 1) }}</div>
                        <div class="d-flex x-gap-5 items-center">
                          @for($i = 1; $i <= 5; $i++)
                            <div class="icon-star text-9 {{ $i <= $similarCourse->average_rating ? 'text-yellow-1' : 'text-light-1' }}"></div>
                          @endfor
                        </div>
                        <div class="text-13 lh-1 ml-10">({{ $similarCourse->reviews_count }})</div>
                      </div>

                      <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">{{ Str::limit($similarCourse->title, 60) }}</div>

                      <div class="d-flex x-gap-10 items-center pt-10">

                        <div class="d-flex items-center">
                          <div class="mr-8">
                            <img src="{{ asset('img/coursesCards/icons/1.svg') }}" alt="icon">
                          </div>
                          <div class="text-14 lh-1">{{ $similarCourse->sections->sum(function($section) { return $section->lessons->count(); }) }} lessons</div>
                        </div>

                        <div class="d-flex items-center">
                          <div class="mr-8">
                            <img src="{{ asset('img/coursesCards/icons/2.svg') }}" alt="icon">
                          </div>
                          <div class="text-14 lh-1">{{ $similarCourse->duration_in_minutes ? intval($similarCourse->duration_in_minutes / 60) . 'h' : '3h' }}</div>
                        </div>

                        <div class="d-flex items-center">
                          <div class="mr-8">
                            <img src="{{ asset('img/coursesCards/icons/3.svg') }}" alt="icon">
                          </div>
                          <div class="text-14 lh-1">{{ $similarCourse->gradeLevel->name ?? 'Not specified' }}</div>
                        </div>

                      </div>

                      <div class="coursesCard-footer">
                        <div class="coursesCard-footer__author">
                          <img src="{{ $similarCourse->teacher->profile_picture_path ?? asset('img/general/avatar-1.png') }}" alt="{{ $similarCourse->teacher->name }}">
                          <div>{{ $similarCourse->teacher->name }}</div>
                        </div>

                        <div class="coursesCard-footer__price">
                          @if($similarCourse->price > 0)
                            @if($similarCourse->original_price && $similarCourse->original_price > $similarCourse->price)
                              <div>UGX {{ number_format($similarCourse->original_price) }}</div>
                            @endif
                            <div>UGX {{ number_format($similarCourse->price) }}</div>
                          @else
                            <div class="text-green-1">Free</div>
                          @endif
                        </div>
                      </div>
                    </div>
                  </a>

                </div>
                @empty
                <!-- Fallback if no similar courses -->
                <div data-anim-child="slide-up delay-1" class="swiper-slide">
                  <div class="text-center py-40">
                    <p class="text-light-1">No similar courses available at the moment.</p>
                  </div>
                </div>
                @endforelse

                
              </div>
            </div>


            <button class="section-slider-nav -prev -dark-bg-dark-2 -white -absolute size-70 rounded-full shadow-5 js-courses-prev">
              <i class="icon icon-arrow-left text-24"></i>
            </button>

            <button class="section-slider-nav -next -dark-bg-dark-2 -white -absolute size-70 rounded-full shadow-5 js-courses-next">
              <i class="icon icon-arrow-right text-24"></i>
            </button>

          </div>
        </div>
      </section>


    </div>
  </main>
    
</x-app-layout>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components only if they exist on the page
    function initComponents() {
        // Star rating functionality
        const ratingStars = document.querySelectorAll('.rating-star');
        const ratingInput = document.getElementById('review-rating');
        
        if (ratingStars.length > 0 && ratingInput) {
            ratingStars.forEach((star, index) => {
                star.addEventListener('click', function() {
                    const rating = parseInt(this.dataset.rating);
                    ratingInput.value = rating;
                    
                    // Update star display
                    ratingStars.forEach((s, i) => {
                        if (i < rating) {
                            s.classList.remove('text-light-1');
                            s.classList.add('text-yellow-1');
                        } else {
                            s.classList.remove('text-yellow-1');
                            s.classList.add('text-light-1');
                        }
                    });
                });
                
                // Hover effect
                star.addEventListener('mouseenter', function() {
                    const rating = parseInt(this.dataset.rating);
                    ratingStars.forEach((s, i) => {
                        if (i < rating) {
                            s.classList.add('text-yellow-1');
                            s.classList.remove('text-light-1');
                        } else {
                            s.classList.add('text-light-1');
                            s.classList.remove('text-yellow-1');
                        }
                    });
                });
            });
            
            // Reset to current rating on mouse leave
            const ratingContainer = document.querySelector('.rating-star')?.parentElement;
            if (ratingContainer) {
                ratingContainer.addEventListener('mouseleave', function() {
                    const currentRating = parseInt(ratingInput.value);
                    ratingStars.forEach((s, i) => {
                        if (i < currentRating) {
                            s.classList.add('text-yellow-1');
                            s.classList.remove('text-light-1');
                        } else {
                            s.classList.add('text-light-1');
                            s.classList.remove('text-yellow-1');
                        }
                    });
                });
            }
        }
    }

    initComponents();
});
</script>
@endpush

