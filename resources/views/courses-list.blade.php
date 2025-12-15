<x-app-layout>

    <main class="main-content">

        <div class="content-wrapper js-content-wrapper">

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

                                @if (request('category_id') && isset($filterOptions['categories']))
                                    @php
                                        $selectedCategory = $filterOptions['categories']->firstWhere(
                                            'id',
                                            request('category_id'),
                                        );
                                    @endphp
                                    @if ($selectedCategory)
                                        <div class="breadcrumbs__item ">
                                            <a href="#">{{ $selectedCategory->name }}</a>
                                        </div>
                                    @endif
                                @endif

                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="page-header -type-1">
                <div class="container">
                    <div class="page-header__content">
                        <div class="row">
                            <div class="col-auto">
                                <div data-anim="slide-up delay-1">
                                    <h1 class="page-header__title">All @lmsterm('Study Materials')</h1>
                                </div>

                                <div data-anim="slide-up delay-2">
                                    <p class="page-header__text">Discover @lmsterm('study materials') from our expert teachers
                                        across all grade levels and subjects.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="layout-pt-md layout-pb-lg">
                <div data-anim="slide-up delay-2" class="container">
                    <div class="row y-gap-20 items-center justify-between pb-30">
                        <div class="col-12">
                            <div class="text-14 lh-12">Showing <span
                                    class="text-dark-1 fw-500">{{ $courses->total() }}</span> total results</div>
                        </div>

                        <div class="col-12">
                            <div class="row x-gap-20 y-gap-20">
                                <div class="col-auto">
                                    <div class="dropdown js-dropdown js-category-active">
                                        <div class="dropdown__button d-flex items-center text-14 rounded-8 px-20 py-10 text-14 lh-12"
                                            data-el-toggle=".js-category-toggle"
                                            data-el-toggle-active=".js-category-active">
                                            <span class="js-dropdown-title">
                                                @if (request('category_id') && isset($filterOptions['categories']))
                                                    {{ $filterOptions['categories']->firstWhere('id', request('category_id'))->name ?? 'Category' }}
                                                @else
                                                    Category
                                                @endif
                                            </span>
                                            <i class="icon text-9 ml-40 icon-chevron-down"></i>
                                        </div>

                                        <div
                                            class="toggle-element -dropdown -dark-bg-dark-2 -dark-border-white-10 js-click-dropdown js-category-toggle">
                                            <div class="text-14 y-gap-15 js-dropdown-list">
                                                <div><a href="{{ request()->fullUrlWithQuery(['category_id' => null, 'page' => null]) }}"
                                                        class="d-block js-dropdown-link">All Categories</a></div>
                                                @foreach ($filterOptions['categories'] as $category)
                                                    <div><a href="{{ request()->fullUrlWithQuery(['category_id' => $category->id, 'page' => null]) }}"
                                                            class="d-block js-dropdown-link">{{ $category->name }}</a>
                                                    </div>
                                                @endforeach
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-auto">
                                    <div class="dropdown js-dropdown js-instructors-active">
                                        <div class="dropdown__button d-flex items-center text-14 rounded-8 px-20 py-10 text-14 lh-12"
                                            data-el-toggle=".js-instructors-toggle"
                                            data-el-toggle-active=".js-instructors-active">
                                            <span class="js-dropdown-title">
                                                @if (request('instructor_id') && isset($filterOptions['instructors']))
                                                    {{ $filterOptions['instructors']->firstWhere('id', request('instructor_id'))->name ?? 'Instructors' }}
                                                @else
                                                    Instructors
                                                @endif
                                            </span>
                                            <i class="icon text-9 ml-40 icon-chevron-down"></i>
                                        </div>

                                        <div
                                            class="toggle-element -dropdown -dark-bg-dark-2 -dark-border-white-10 js-click-dropdown js-instructors-toggle">
                                            <div class="text-14 y-gap-15 js-dropdown-list">
                                                <div><a href="{{ request()->fullUrlWithQuery(['instructor_id' => null, 'page' => null]) }}"
                                                        class="d-block js-dropdown-link">All Instructors</a></div>
                                                @foreach ($filterOptions['instructors'] as $instructor)
                                                    <div><a href="{{ request()->fullUrlWithQuery(['instructor_id' => $instructor->id, 'page' => null]) }}"
                                                            class="d-block js-dropdown-link">{{ $instructor->name }}</a>
                                                    </div>
                                                @endforeach
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-auto">
                                    <div class="dropdown js-dropdown js-price-active">
                                        <div class="dropdown__button d-flex items-center text-14 rounded-8 px-20 py-10 text-14 lh-12"
                                            data-el-toggle=".js-price-toggle" data-el-toggle-active=".js-price-active">
                                            <span class="js-dropdown-title">
                                                @if (request('price_range'))
                                                    @switch(request('price_range'))
                                                        @case('free')
                                                            Free
                                                        @break

                                                        @case('0-50')
                                                            $0 - $50
                                                        @break

                                                        @case('50-100')
                                                            $50 - $100
                                                        @break

                                                        @case('100+')
                                                            $100+
                                                        @break

                                                        @default
                                                            Price
                                                    @endswitch
                                                @else
                                                    Price
                                                @endif
                                            </span>
                                            <i class="icon text-9 ml-40 icon-chevron-down"></i>
                                        </div>

                                        <div
                                            class="toggle-element -dropdown -dark-bg-dark-2 -dark-border-white-10 js-click-dropdown js-price-toggle">
                                            <div class="text-14 y-gap-15 js-dropdown-list">
                                                <div><a href="{{ request()->fullUrlWithQuery(['price_range' => null, 'page' => null]) }}"
                                                        class="d-block js-dropdown-link">All Prices</a></div>
                                                <div><a href="{{ request()->fullUrlWithQuery(['price_range' => 'free', 'page' => null]) }}"
                                                        class="d-block js-dropdown-link">Free</a></div>
                                                <div><a href="{{ request()->fullUrlWithQuery(['price_range' => '0-50', 'page' => null]) }}"
                                                        class="d-block js-dropdown-link">$0 - $50</a></div>
                                                <div><a href="{{ request()->fullUrlWithQuery(['price_range' => '50-100', 'page' => null]) }}"
                                                        class="d-block js-dropdown-link">$50 - $100</a></div>
                                                <div><a href="{{ request()->fullUrlWithQuery(['price_range' => '100+', 'page' => null]) }}"
                                                        class="d-block js-dropdown-link">$100+</a></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-auto">
                                    <div class="dropdown js-dropdown js-level-active">
                                        <div class="dropdown__button d-flex items-center text-14 rounded-8 px-20 py-10 text-14 lh-12"
                                            data-el-toggle=".js-level-toggle" data-el-toggle-active=".js-level-active">
                                            <span class="js-dropdown-title">
                                                @if (request('grade_level_id') && isset($filterOptions['gradeLevels']))
                                                    @php
                                                        $selectedGrade = $filterOptions['gradeLevels']->firstWhere(
                                                            'id',
                                                            request('grade_level_id'),
                                                        );
                                                    @endphp
                                                    {{ $selectedGrade ? $selectedGrade->name . ' (Senior ' . substr($selectedGrade->name, 1) . ')' : 'Grade Level' }}
                                                @else
                                                    Grade Level
                                                @endif
                                            </span>
                                            <i class="icon text-9 ml-40 icon-chevron-down"></i>
                                        </div>

                                        <div
                                            class="toggle-element -dropdown -dark-bg-dark-2 -dark-border-white-10 js-click-dropdown js-level-toggle">
                                            <div class="text-14 y-gap-15 js-dropdown-list">
                                                <div><a href="{{ request()->fullUrlWithQuery(['grade_level_id' => null, 'page' => null]) }}"
                                                        class="d-block js-dropdown-link">All Grade Levels</a></div>
                                                @foreach ($filterOptions['gradeLevels'] as $gradeLevel)
                                                    <div><a href="{{ request()->fullUrlWithQuery(['grade_level_id' => $gradeLevel->id, 'page' => null]) }}"
                                                            class="d-block js-dropdown-link">{{ $gradeLevel->name }}
                                                            (Senior {{ substr($gradeLevel->name, 1) }})
                                                        </a></div>
                                                @endforeach
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-auto">
                                    <div class="dropdown js-dropdown js-duration-active">
                                        <div class="dropdown__button d-flex items-center text-14 rounded-8 px-20 py-10 text-14 lh-12"
                                            data-el-toggle=".js-duration-toggle"
                                            data-el-toggle-active=".js-duration-active">
                                            <span class="js-dropdown-title">
                                                @if (request('duration_range'))
                                                    @switch(request('duration_range'))
                                                        @case('0-3')
                                                            0-3 hours
                                                        @break

                                                        @case('3-7')
                                                            3-7 hours
                                                        @break

                                                        @case('7+')
                                                            7+ hours
                                                        @break

                                                        @default
                                                            Duration
                                                    @endswitch
                                                @else
                                                    Duration
                                                @endif
                                            </span>
                                            <i class="icon text-9 ml-40 icon-chevron-down"></i>
                                        </div>

                                        <div
                                            class="toggle-element -dropdown -dark-bg-dark-2 -dark-border-white-10 js-click-dropdown js-duration-toggle">
                                            <div class="text-14 y-gap-15 js-dropdown-list">
                                                <div><a href="{{ request()->fullUrlWithQuery(['duration_range' => null, 'page' => null]) }}"
                                                        class="d-block js-dropdown-link">All Durations</a></div>
                                                <div><a href="{{ request()->fullUrlWithQuery(['duration_range' => '0-3', 'page' => null]) }}"
                                                        class="d-block js-dropdown-link">0-3 hours</a></div>
                                                <div><a href="{{ request()->fullUrlWithQuery(['duration_range' => '3-7', 'page' => null]) }}"
                                                        class="d-block js-dropdown-link">3-7 hours</a></div>
                                                <div><a href="{{ request()->fullUrlWithQuery(['duration_range' => '7+', 'page' => null]) }}"
                                                        class="d-block js-dropdown-link">7+ hours</a></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row y-gap-30">
                        @forelse($courses as $course)
                            <div class="col-xl-3 col-lg-4 col-md-6">

                                <a href="{{ route('courses.show', $course) }}" class="coursesCard -type-1 ">
                                    <div class="relative">
                                        <div class="coursesCard__image overflow-hidden rounded-8">
                                            <img class="w-1/1"
                                                src="{{ $course->thumbnail_path ? Storage::url($course->thumbnail_path) : asset('img/course.jpeg') }}"
                                                alt="{{ $course->title }}">
                                            <div class="coursesCard__image_overlay rounded-8"></div>
                                        </div>
                                        <div class="d-flex justify-between py-10 px-10 absolute-full-center z-3">
                                            @if ($course->enrollments_count > 100)
                                                <div>
                                                    <div class="px-15 rounded-200 bg-purple-1">
                                                        <span
                                                            class="text-11 lh-1 uppercase fw-500 text-white">Popular</span>
                                                    </div>
                                                </div>
                                            @endif

                                            @if ($course->price <= 0)
                                                <div>
                                                    <div class="px-15 rounded-200 bg-green-1">
                                                        <span
                                                            class="text-11 lh-1 uppercase fw-500 text-dark-1">Free</span>
                                                    </div>
                                                </div>
                                            @endif
                                        </div>
                                    </div>

                                    <div class="h-100 pt-15">
                                        <div class="d-flex items-center">
                                            <div class="text-14 lh-1 text-yellow-1 mr-10">
                                                {{ number_format($course->average_rating ?? 0, 1) }}</div>
                                            <div class="d-flex x-gap-5 items-center">
                                                @for ($i = 1; $i <= 5; $i++)
                                                    <div
                                                        class="icon-star text-9 {{ $i <= ($course->average_rating ?? 0) ? 'text-yellow-1' : 'text-light-1' }}">
                                                    </div>
                                                @endfor
                                            </div>
                                            <div class="text-13 lh-1 ml-10">({{ $course->reviews_count ?? 0 }})</div>
                                        </div>

                                        <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">
                                            {{ Str::limit($course->title, 50) }}</div>

                                        <div class="d-flex x-gap-10 items-center pt-10">

                                            <div class="d-flex items-center">
                                                <div class="mr-8">
                                                    <img src="{{ asset('img/coursesCards/icons/1.svg') }}"
                                                        alt="icon">
                                                </div>
                                                <div class="text-14 lh-1">{{ $course->lessons_count ?? 0 }}
                                                    lesson{{ ($course->lessons_count ?? 0) !== 1 ? 's' : '' }}</div>
                                            </div>

                                            <div class="d-flex items-center">
                                                <div class="mr-8">
                                                    <img src="{{ asset('img/coursesCards/icons/2.svg') }}"
                                                        alt="icon">
                                                </div>
                                                <div class="text-14 lh-1">
                                                    @php
                                                        $hours = floor(($course->duration_in_minutes ?? 0) / 60);
                                                        $minutes = ($course->duration_in_minutes ?? 0) % 60;
                                                    @endphp
                                                    {{ $hours }}h {{ $minutes }}m
                                                </div>
                                            </div>

                                            <div class="d-flex items-center">
                                                <div class="mr-8">
                                                    <img src="{{ asset('img/coursesCards/icons/3.svg') }}"
                                                        alt="icon">
                                                </div>
                                                <div class="text-14 lh-1">
                                                    {{ $course->gradeLevel->name ?? 'Not specified' }}</div>
                                            </div>

                                        </div>

                                        <div class="coursesCard-footer">
                                            <div class="coursesCard-footer__author">
                                                <img src="{{ $course->teacher->profile_picture_path ? asset('storage/' . $course->teacher->profile_picture_path) : asset('img/default.png') }}"
                                                    alt="{{ $course->teacher->name }}">
                                                <div>{{ $course->teacher->name }}</div>
                                            </div>

                                            <div class="coursesCard-footer__price">
                                                @if ($course->price <= 0)
                                                    <div class="text-green-1 fw-500">Free</div>
                                                @elseif($course->subscription_required && $course->price > 0)
                                                    <div class="text-14 text-light-1">Subscribe or</div>
                                                    <div>${{ number_format($course->price, 0) }}</div>
                                                @elseif($course->subscription_required)
                                                    <div class="text-purple-1 fw-500">Subscribe</div>
                                                @else
                                                    <div>${{ number_format($course->price, 0) }}</div>
                                                @endif
                                            </div>
                                        </div>
                                    </div>
                                </a>

                            </div>
                        @empty
                            <div class="col-12">
                                <div class="text-center py-40">
                                    <img src="{{ asset('img/dashboard/empty-state/courses.svg') }}"
                                        alt="No courses found" style="max-width: 200px;" class="mb-20">
                                    <h4 class="text-18 fw-500 mb-10">No @lmsterm('Study Materials') Found</h4>
                                    <p class="text-14 mb-20">Try adjusting your filters or search terms.</p>
                                </div>
                            </div>
                        @endforelse
                    </div>

                    <div class="row justify-center pt-90 lg:pt-50">
                        <div class="col-auto">
                            @if ($courses->hasPages())
                                <div class="pagination -buttons">
                                    {{-- Previous Page Link --}}
                                    @if ($courses->onFirstPage())
                                        <button class="pagination__button -prev" disabled>
                                            <i class="icon icon-chevron-left"></i>
                                        </button>
                                    @else
                                        <a href="{{ $courses->appends(request()->except('page'))->previousPageUrl() }}"
                                            class="pagination__button -prev" onclick="event.stopPropagation()">
                                            <i class="icon icon-chevron-left"></i>
                                        </a>
                                    @endif

                                    {{-- Pagination Elements --}}
                                    <div class="pagination__count">
                                        @foreach ($courses->onEachSide(1)->links()->elements[0] as $page => $url)
                                            @if ($page == $courses->currentPage())
                                                <span class="-count-is-active">{{ $page }}</span>
                                            @else
                                                <a href="{{ $url }}"
                                                    onclick="event.stopPropagation()">{{ $page }}</a>
                                            @endif
                                        @endforeach
                                    </div>

                                    {{-- Next Page Link --}}
                                    @if ($courses->hasMorePages())
                                        <a href="{{ $courses->appends(request()->except('page'))->nextPageUrl() }}"
                                            class="pagination__button -next" onclick="event.stopPropagation()">
                                            <i class="icon icon-chevron-right"></i>
                                        </a>
                                    @else
                                        <button class="pagination__button -next" disabled>
                                            <i class="icon icon-chevron-right"></i>
                                        </button>
                                    @endif
                                </div>
                            @endif
                        </div>
                    </div>
                </div>
            </section>

            @if ($recommendedCourses->isNotEmpty())
                <section class="layout-pt-md layout-pb-lg">
                    <div data-anim-wrap class="container">
                        <div class="row y-gap-20 justify-between items-end pb-30">
                            <div class="col-auto">
                                <div class="sectionTitle">
                                    <h2 class="sectionTitle__title">@lmsterm('Study Materials') You May Like</h2>
                                    <p class="sectionTitle__text">Discover more @lmsterm('study materials') that match your
                                        interests</p>
                                </div>
                            </div>
                        </div>

                        <div class="row y-gap-30">
                            @foreach ($recommendedCourses as $course)
                                <div data-anim-child="slide-up delay-{{ $loop->iteration }}"
                                    class="col-xl-3 col-lg-4 col-md-6">

                                    <a href="{{ route('courses.show', $course->slug) }}" class="coursesCard -type-1">
                                        <div class="relative">
                                            <div class="coursesCard__image overflow-hidden rounded-8">
                                                <img class="w-1/1"
                                                    src="{{ $course->thumbnail_path ? Storage::url($course->thumbnail_path): asset('img/course.jpeg') }}"
                                                    alt="{{ $course->title }}">
                                                <div class="coursesCard__image_overlay rounded-8"></div>
                                            </div>
                                            <div class="d-flex justify-between py-10 px-10 absolute-full-center z-3">
                                                @if ($course->enrollments_count > 100)
                                                    <div>
                                                        <div class="px-15 rounded-200 bg-purple-1">
                                                            <span
                                                                class="text-11 lh-1 uppercase fw-500 text-white">Popular</span>
                                                        </div>
                                                    </div>
                                                @endif

                                                @if ($course->price <= 0)
                                                    <div>
                                                        <div class="px-15 rounded-200 bg-green-1">
                                                            <span
                                                                class="text-11 lh-1 uppercase fw-500 text-dark-1">Free</span>
                                                        </div>
                                                    </div>
                                                @endif
                                            </div>
                                        </div>

                                        <div class="h-100 pt-15">
                                            <div class="d-flex items-center">
                                                <div class="text-14 lh-1 text-yellow-1 mr-10">
                                                    {{ number_format($course->average_rating ?? 0, 1) }}</div>
                                                <div class="d-flex x-gap-5 items-center">
                                                    @for ($i = 1; $i <= 5; $i++)
                                                        <div
                                                            class="icon-star text-9 {{ $i <= ($course->average_rating ?? 0) ? 'text-yellow-1' : 'text-light-1' }}">
                                                        </div>
                                                    @endfor
                                                </div>
                                                <div class="text-13 lh-1 ml-10">({{ $course->reviews_count ?? 0 }})
                                                </div>
                                            </div>

                                            <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">
                                                {{ Str::limit($course->title, 50) }}</div>

                                            <div class="d-flex x-gap-10 items-center pt-10">

                                                <div class="d-flex items-center">
                                                    <div class="mr-8">
                                                        <img src="{{ asset('img/coursesCards/icons/1.svg') }}"
                                                            alt="icon">
                                                    </div>
                                                    <div class="text-14 lh-1">{{ $course->lessons_count ?? 0 }}
                                                        lesson{{ ($course->lessons_count ?? 0) !== 1 ? 's' : '' }}
                                                    </div>
                                                </div>

                                                <div class="d-flex items-center">
                                                    <div class="mr-8">
                                                        <img src="{{ asset('img/coursesCards/icons/2.svg') }}"
                                                            alt="icon">
                                                    </div>
                                                    <div class="text-14 lh-1">
                                                        @php
                                                            $hours = floor(($course->duration_in_minutes ?? 0) / 60);
                                                            $minutes = ($course->duration_in_minutes ?? 0) % 60;
                                                        @endphp
                                                        {{ $hours }}h {{ $minutes }}m
                                                    </div>
                                                </div>

                                                <div class="d-flex items-center">
                                                    <div class="mr-8">
                                                        <img src="{{ asset('img/coursesCards/icons/3.svg') }}"
                                                            alt="icon">
                                                    </div>
                                                    <div class="text-14 lh-1">
                                                        {{ $course->gradeLevel->name ?? 'Not specified' }}</div>
                                                </div>

                                            </div>

                                            <div class="coursesCard-footer">
                                                <div class="coursesCard-footer__author">
                                                    <img src="{{ $course->teacher->profile_picture_path ? asset('storage/' . $course->teacher->profile_picture_path) : asset('img/default.png') }}"
                                                        alt="{{ $course->teacher->name }}">
                                                    <div>{{ $course->teacher->name }}</div>
                                                </div>

                                                <div class="coursesCard-footer__price">
                                                    @if ($course->price <= 0)
                                                        <div class="text-green-1 fw-500">Free</div>
                                                    @elseif($course->subscription_required && $course->price > 0)
                                                        <div class="text-14 text-light-1">Subscribe or</div>
                                                        <div>${{ number_format($course->price, 0) }}</div>
                                                    @elseif($course->subscription_required)
                                                        <div class="text-purple-1 fw-500">Subscribe</div>
                                                    @else
                                                        <div>${{ number_format($course->price, 0) }}</div>
                                                    @endif
                                                </div>
                                            </div>
                                        </div>
                                    </a>

                                </div>
                            @endforeach
                        </div>
                    </div>
                </section>
            @endif

        </div>

    </main>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Prevent dropdown JS from interfering with pagination
            document.querySelectorAll('.pagination a').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent any parent handlers
                    // Let the default anchor behavior work
                });
            });

            // Ensure filter dropdowns don't interfere
            document.querySelectorAll('.js-dropdown-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.stopPropagation();
                    window.location = this.getAttribute('href');
                });
            });
        });
    </script>

</x-app-layout>
