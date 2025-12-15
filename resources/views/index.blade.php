<x-app-layout>

    <main class="main-content  ">

        <div class="content-wrapper  js-content-wrapper">

            <section class="masthead -type-1 js-mouse-move-container">
                <div class="masthead__bg">
                    <img src="{{ asset('img/home-1/hero/bg.png') }}" alt="image">
                </div>

                <div class="container">
                    <div data-anim-wrap class="row y-gap-30 justify-between items-end">
                        <div class="col-xl-6 col-lg-6 col-sm-10">
                            <div class="masthead__content">
                                <h1 data-anim-child="slide-up" class="masthead__title">
                                    Unlock Your Potential with {{ config('app.short_name', 'Crossview College') }}
                                </h1>
                                <p data-anim-child="slide-up delay-1" class="masthead__text">
                                    Explore @lmsterm('study materials') tailored to the Kenyan CBC curriculum, designed for every learner's
                                    journey—students, teachers, and parents.
                                </p>
                                <div data-anim-child="slide-up delay-2" class="masthead__buttons row x-gap-10 y-gap-10">
                                    <div class="col-12 col-sm-auto">
                                        <a data-barba href="signup.html" class="button -md -purple-1 text-white">Join
                                            For Free</a>
                                    </div>
                                    <div class="col-12 col-sm-auto">
                                        <a data-barba href="courses"
                                            class="button -md -outline-green-1 text-green-1">Find @lmsterm('Study Materials')</a>
                                    </div>
                                </div>
                                <div data-anim-child="slide-up delay-3" class="masthead-info row y-gap-15 sm:d-none">

                                    <div class="masthead-info__item d-flex items-center text-white">
                                        <div class="masthead-info__icon mr-10">
                                            <img src="{{ asset('img/masthead/icons/1.svg') }}" alt="icon">
                                        </div>
                                        <div class="masthead-info__title lh-1">Over 12 million students</div>
                                    </div>

                                    <div class="masthead-info__item d-flex items-center text-white">
                                        <div class="masthead-info__icon mr-10">
                                            <img src="{{ asset('img/masthead/icons/2.svg') }}" alt="icon">
                                        </div>
                                        <div class="masthead-info__title lh-1">More than 60,000 @lmsterm('study materials')</div>
                                    </div>

                                    <div class="masthead-info__item d-flex items-center text-white">
                                        <div class="masthead-info__icon mr-10">
                                            <img src="{{ asset('img/masthead/icons/3.svg') }}" alt="icon">
                                        </div>
                                        <div class="masthead-info__title lh-1">Learning Paths for Every Role</div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        <div data-anim-child="slide-up delay-5" class="col-xl-6 col-lg-6">
                            <div class="masthead-image">
                                <div class="masthead-image__el1">
                                    <img class="js-mouse-move" data-move="40" src="{{ asset('img/masthead/1.png') }}"
                                        alt="image">

                                    <div data-move="30"
                                        class="lg:d-none img-el -w-250 px-20 py-20 d-flex items-center bg-white rounded-8 js-mouse-move">
                                        <div class="size-50 d-flex justify-center items-center bg-red-2 rounded-full">
                                            <img src="{{ asset('img/masthead/1.svg') }}" alt="icon">
                                        </div>
                                        <div class="ml-20">
                                            <div class="text-orange-1 text-16 fw-500 lh-1">3.000 +</div>
                                            <div class="mt-3">Free @lmsterm('Study Materials')</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="masthead-image__el2">
                                    <img class="js-mouse-move" data-move="70" src="{{ asset('img/masthead/2.png') }}"
                                        alt="image">

                                    <div data-move="60"
                                        class="lg:d-none img-el -w-260 px-20 py-20 d-flex items-center bg-white rounded-8 js-mouse-move">
                                        <img src="{{ asset('img/masthead/4.png') }}" alt="icon">
                                        <div class="ml-20">
                                            <div class="text-dark-1 text-16 fw-500 lh-1">Ali Tufan</div>
                                            <div class="mt-3">UX/UI Designer</div>
                                            <div class="d-flex x-gap-5 mt-3">
                                                <div>
                                                    <div class="icon-star text-yellow-1 text-11"></div>
                                                </div>
                                                <div>
                                                    <div class="icon-star text-yellow-1 text-11"></div>
                                                </div>
                                                <div>
                                                    <div class="icon-star text-yellow-1 text-11"></div>
                                                </div>
                                                <div>
                                                    <div class="icon-star text-yellow-1 text-11"></div>
                                                </div>
                                                <div>
                                                    <div class="icon-star text-yellow-1 text-11"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="masthead-image__el3">
                                    <img class="js-mouse-move" data-move="40" src="{{ asset('img/masthead/3.png') }}"
                                        alt="image">

                                    <div data-move="30"
                                        class="shadow-4 img-el -w-260 px-30 py-20 d-flex items-center bg-white rounded-8 js-mouse-move">
                                        <div class="img-el__side">
                                            <div
                                                class="size-50 d-flex justify-center items-center bg-purple-1 rounded-full">
                                                <img src="{{ asset('img/masthead/2.svg') }}" alt="icon">
                                            </div>
                                        </div>
                                        <div class="">
                                            <div class="text-purple-1 text-16 fw-500 lh-1">Congrats!</div>
                                            <div class="mt-3">Your Admission Completed</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <svg class="svg-waves" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                    viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
                    <defs>
                        <path id="gentle-wave"
                            d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
                    </defs>
                    <g class="svg-waves__parallax">
                        <use xlink:href="#gentle-wave" x="48" y="0" />
                        <use xlink:href="#gentle-wave" x="48" y="3" />
                        <use xlink:href="#gentle-wave" x="48" y="5" />
                        <use xlink:href="#gentle-wave" x="48" y="7" />
                    </g>
                </svg>
            </section>


            <section class="layout-pt-md layout-pb-md">
                <div data-anim-wrap class="container">
                    <div class="row justify-center text-center">
                        <div class="col-auto">
                            <div class="sectionTitle">
                                <h2 class="sectionTitle__title">Our Core Subjects</h2>
                                <p class="sectionTitle__text">Comprehensive coverage of the Kenyan CBC curriculum</p>
                            </div>
                        </div>
                    </div>

                    <div class="overflow-hidden pt-50 js-section-slider" data-gap="30" data-loop data-pagination
                        data-slider-cols="xl-6 lg-4 md-2 sm-2">
                        <div class="swiper-wrapper">

                            <div class="swiper-slide">
                                <div data-anim-child="slide-left delay-2"
                                    class="featureCard -type-1 -featureCard-hover">
                                    <div class="featureCard__content">
                                        <div class="featureCard__icon">
                                            <img src="{{ asset('img/featureCards/4.svg') }}" alt="icon">
                                        </div>
                                        <div class="featureCard__title">English</div>
                                        <div class="featureCard__text">Primary & Secondary Levels</div>
                                    </div>
                                </div>
                            </div>

                            <div class="swiper-slide">
                                <div data-anim-child="slide-left delay-3"
                                    class="featureCard -type-1 -featureCard-hover">
                                    <div class="featureCard__content">
                                        <div class="featureCard__icon">
                                            <img src="{{ asset('img/subjects/math.svg') }}" alt="Math icon">
                                        </div>
                                        <div class="featureCard__title">Mathematics</div>
                                        <div class="featureCard__text">All grade levels</div>
                                    </div>
                                </div>
                            </div>

                            <div class="swiper-slide">
                                <div data-anim-child="slide-left delay-4"
                                    class="featureCard -type-1 -featureCard-hover">
                                    <div class="featureCard__content">
                                        <div class="featureCard__icon">
                                            <img src="{{ asset('img/featureCards/5.svg') }}" alt="icon">
                                        </div>
                                        <div class="featureCard__title">Sciences</div>
                                        <div class="featureCard__text">Physics, Chemistry, Biology</div>
                                    </div>
                                </div>
                            </div>

                            <div class="swiper-slide">
                                <div data-anim-child="slide-left delay-5"
                                    class="featureCard -type-1 -featureCard-hover">
                                    <div class="featureCard__content">
                                        <div class="featureCard__icon">
                                            <img src="{{ asset('img/featureCards/6.svg') }}" alt="icon">
                                        </div>
                                        <div class="featureCard__title">Humanities & Life Skills</div>
                                        <div class="featureCard__text">History, Geography, Life Skills</div>
                                    </div>
                                </div>
                            </div>

                            <div class="swiper-slide">
                                <div data-anim-child="slide-left delay-6"
                                    class="featureCard -type-1 -featureCard-hover">
                                    <div class="featureCard__content">
                                        <div class="featureCard__icon">
                                            <img src="{{ asset('img/featureCards/2.svg') }}" alt="icon">
                                        </div>
                                        <div class="featureCard__title">Languages</div>
                                        <div class="featureCard__text">Kiswahili, French, Literature</div>
                                    </div>
                                </div>
                            </div>

                            <div class="swiper-slide">
                                <div data-anim-child="slide-left delay-7"
                                    class="featureCard -type-1 -featureCard-hover">
                                    <div class="featureCard__content">
                                        <div class="featureCard__icon">
                                            <img src="{{ asset('img/featureCards/2.svg') }}" alt="icon">
                                        </div>
                                        <div class="featureCard__title">Business</div>
                                        <div class="featureCard__text">Commerce, Entrepreneurship</div>
                                    </div>
                                </div>
                            </div>

                            <div class="swiper-slide">
                                <div data-anim-child="slide-left delay-8"
                                    class="featureCard -type-1 -featureCard-hover">
                                    <div class="featureCard__content">
                                        <div class="featureCard__icon">
                                            <img src="{{ asset('img/featureCards/6.svg') }}" alt="icon">
                                        </div>
                                        <div class="featureCard__title">Technology</div>
                                        <div class="featureCard__text">Computer Studies, Agriculture</div>
                                    </div>
                                </div>
                            </div>

                            <div class="swiper-slide">
                                <div data-anim-child="slide-left delay-9"
                                    class="featureCard -type-1 -featureCard-hover">
                                    <div class="featureCard__content">
                                        <div class="featureCard__icon">
                                            <img src="{{ asset('img/featureCards/3.svg') }}" alt="icon">
                                        </div>
                                        <div class="featureCard__title">Creative Arts</div>
                                        <div class="featureCard__text">Art, Music, Home Economics</div>
                                    </div>
                                </div>
                            </div>

                            <div class="swiper-slide">
                                <div data-anim-child="slide-left delay-10"
                                    class="featureCard -type-1 -featureCard-hover">
                                    <div class="featureCard__content">
                                        <div class="featureCard__icon">
                                            <img src="{{ asset('img/featureCards/2.svg') }}" alt="icon">
                                        </div>
                                        <div class="featureCard__title">Technical</div>
                                        <div class="featureCard__text">Woodwork, Metalwork</div>
                                    </div>
                                </div>
                            </div>

                            <div class="swiper-slide">
                                <div data-anim-child="slide-left delay-11"
                                    class="featureCard -type-1 -featureCard-hover">
                                    <div class="featureCard__content">
                                        <div class="featureCard__icon">
                                            <img src="{{ asset('img/featureCards/1.svg') }}" alt="icon">
                                        </div>
                                        <div class="featureCard__title">Physical Education</div>
                                        <div class="featureCard__text">Fitness & Sports</div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div class="d-flex justify-center x-gap-15 items-center pt-60 lg:pt-40">
                            <div class="col-auto">
                                <button class="d-flex items-center text-24 arrow-left-hover js-prev">
                                    <i class="icon icon-arrow-left"></i>
                                </button>
                            </div>
                            <div class="col-auto">
                                <div class="pagination -arrows js-pagination"></div>
                            </div>
                            <div class="col-auto">
                                <button class="d-flex items-center text-24 arrow-right-hover js-next">
                                    <i class="icon icon-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <section class="layout-pt-md layout-pb-lg">
                <div data-anim-wrap class="container">
                    <div class="row justify-center text-center">
                        <div class="col-auto">

                            <div class="sectionTitle ">

                                <h2 class="sectionTitle__title ">Our Most Popular @lmsterm('Study Materials')</h2>

                                <p class="sectionTitle__text ">10,000+ unique online @lmsterm('study material') list designs</p>

                            </div>

                        </div>
                    </div>
                    <div class="tabs -pills pt-50 js-tabs">
                        <div class="tabs__controls d-flex justify-center x-gap-10 js-tabs-controls">
                            <div>
                                <button class="tabs__button px-15 py-8 rounded-8 js-tabs-button is-active"
                                    data-tab-target=".-tab-item-1" type="button">All Subjects</button>
                            </div>

                            <div>
                                <button class="tabs__button px-15 py-8 rounded-8 js-tabs-button"
                                    data-tab-target=".-tab-item-2" type="button">Core Subjects</button>
                            </div>

                            <div>
                                <button class="tabs__button px-15 py-8 rounded-8 js-tabs-button"
                                    data-tab-target=".-tab-item-3" type="button">Sciences</button>
                            </div>

                            <div>
                                <button class="tabs__button px-15 py-8 rounded-8 js-tabs-button"
                                    data-tab-target=".-tab-item-4" type="button">Humanities</button>
                            </div>

                            <div>
                                <button class="tabs__button px-15 py-8 rounded-8 js-tabs-button"
                                    data-tab-target=".-tab-item-5" type="button">Languages</button>
                            </div>

                            <div>
                                <button class="tabs__button px-15 py-8 rounded-8 js-tabs-button"
                                    data-tab-target=".-tab-item-6" type="button">Business & Tech</button>
                            </div>

                            <div>
                                <button class="tabs__button px-15 py-8 rounded-8 js-tabs-button"
                                    data-tab-target=".-tab-item-7" type="button">Applied Sciences</button>
                            </div>

                            <div>
                                <button class="tabs__button px-15 py-8 rounded-8 js-tabs-button"
                                    data-tab-target=".-tab-item-8" type="button">Creative Arts</button>
                            </div>
                        </div>

                        <div class="tabs__content pt-60 js-tabs-content">

                            <div class="tabs__pane -tab-item-1 is-active">
                                <div class="row y-gap-30 justify-center">


                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-5">

                                            <a href="courses-single-1.html" class="coursesCard -type-1 ">
                                                <div class="relative">
                                                    <div class="coursesCard__image overflow-hidden rounded-8">
                                                        <img class="w-1/1"
                                                            src="{{ asset('img/coursesCards/5.png') }}"
                                                            alt="image">
                                                        <div class="coursesCard__image_overlay rounded-8"></div>
                                                    </div>
                                                    <div
                                                        class="d-flex justify-between py-10 px-10 absolute-full-center z-3">

                                                    </div>
                                                </div>

                                                <div class="h-100 pt-15">
                                                    <div class="d-flex items-center">
                                                        <div class="text-14 lh-1 text-yellow-1 mr-10">4.5</div>
                                                        <div class="d-flex x-gap-5 items-center">
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                        </div>
                                                        <div class="text-13 lh-1 ml-10">(1991)</div>
                                                    </div>

                                                    <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">Photography
                                                        Masterclass: A Complete Guide to Photography</div>

                                                    <div class="d-flex x-gap-10 items-center pt-10">

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="{{ asset('img/coursesCards/icons/1.svg') }}"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">6 lesson</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="{{ asset('img/coursesCards/icons/2.svg') }}"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">3h 56m</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="{{ asset('img/coursesCards/icons/3.svg') }}"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">S1-S3</div>
                                                        </div>

                                                    </div>

                                                    <div class="coursesCard-footer">
                                                        <div class="coursesCard-footer__author">
                                                            <img src="{{ asset('img/general/avatar-1.png') }}"
                                                                alt="image">
                                                            <div>Ali Tufan</div>
                                                        </div>

                                                        <div class="coursesCard-footer__price">
                                                            <div>$179</div>
                                                            <div>$79</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>

                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-6">



                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-7">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-8">


                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div class="tabs__pane -tab-item-2 ">
                                <div class="row y-gap-30 justify-center">

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-1">



                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-2">



                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-3">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-6">



                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-7">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-8">

                                            <a href="courses-single-1.html" class="coursesCard -type-1 ">
                                                <div class="relative">
                                                    <div class="coursesCard__image overflow-hidden rounded-8">
                                                        <img class="w-1/1" src="img/coursesCards/8.png"
                                                            alt="image">
                                                        <div class="coursesCard__image_overlay rounded-8"></div>
                                                    </div>
                                                    <div
                                                        class="d-flex justify-between py-10 px-10 absolute-full-center z-3">

                                                    </div>
                                                </div>

                                                <div class="h-100 pt-15">
                                                    <div class="d-flex items-center">
                                                        <div class="text-14 lh-1 text-yellow-1 mr-10">4.5</div>
                                                        <div class="d-flex x-gap-5 items-center">
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                        </div>
                                                        <div class="text-13 lh-1 ml-10">(1991)</div>
                                                    </div>

                                                    <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">The Complete
                                                        Financial Analyst Training &amp; Investing Course</div>

                                                    <div class="d-flex x-gap-10 items-center pt-10">

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/1.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">6 lesson</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/2.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">3h 56m</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/3.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">S1-S3</div>
                                                        </div>

                                                    </div>

                                                    <div class="coursesCard-footer">
                                                        <div class="coursesCard-footer__author">
                                                            <img src="img/general/avatar-1.png" alt="image">
                                                            <div>Ali Tufan</div>
                                                        </div>

                                                        <div class="coursesCard-footer__price">
                                                            <div>$179</div>
                                                            <div>$79</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>

                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div class="tabs__pane -tab-item-3 ">
                                <div class="row y-gap-30 justify-center">

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-1">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-2">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-3">



                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-4">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-5">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-6">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-7">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-8">

                                            <a href="courses-single-1.html" class="coursesCard -type-1 ">
                                                <div class="relative">
                                                    <div class="coursesCard__image overflow-hidden rounded-8">
                                                        <img class="w-1/1" src="img/coursesCards/8.png"
                                                            alt="image">
                                                        <div class="coursesCard__image_overlay rounded-8"></div>
                                                    </div>
                                                    <div
                                                        class="d-flex justify-between py-10 px-10 absolute-full-center z-3">

                                                    </div>
                                                </div>

                                                <div class="h-100 pt-15">
                                                    <div class="d-flex items-center">
                                                        <div class="text-14 lh-1 text-yellow-1 mr-10">4.5</div>
                                                        <div class="d-flex x-gap-5 items-center">
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                        </div>
                                                        <div class="text-13 lh-1 ml-10">(1991)</div>
                                                    </div>

                                                    <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">The Complete
                                                        Financial Analyst Training &amp; Investing Course</div>

                                                    <div class="d-flex x-gap-10 items-center pt-10">

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/1.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">6 lesson</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/2.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">3h 56m</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/3.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">S1-S3</div>
                                                        </div>

                                                    </div>

                                                    <div class="coursesCard-footer">
                                                        <div class="coursesCard-footer__author">
                                                            <img src="img/general/avatar-1.png" alt="image">
                                                            <div>Ali Tufan</div>
                                                        </div>

                                                        <div class="coursesCard-footer__price">
                                                            <div>$179</div>
                                                            <div>$79</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>

                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div class="tabs__pane -tab-item-4 ">
                                <div class="row y-gap-30 justify-center">

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-1">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-2">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-3">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-4">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-5">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-6">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-7">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-8">

                                            <a href="courses-single-1.html" class="coursesCard -type-1 ">
                                                <div class="relative">
                                                    <div class="coursesCard__image overflow-hidden rounded-8">
                                                        <img class="w-1/1" src="img/coursesCards/8.png"
                                                            alt="image">
                                                        <div class="coursesCard__image_overlay rounded-8"></div>
                                                    </div>
                                                    <div
                                                        class="d-flex justify-between py-10 px-10 absolute-full-center z-3">

                                                    </div>
                                                </div>

                                                <div class="h-100 pt-15">
                                                    <div class="d-flex items-center">
                                                        <div class="text-14 lh-1 text-yellow-1 mr-10">4.5</div>
                                                        <div class="d-flex x-gap-5 items-center">
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                        </div>
                                                        <div class="text-13 lh-1 ml-10">(1991)</div>
                                                    </div>

                                                    <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">The Complete
                                                        Financial Analyst Training &amp; Investing Course</div>

                                                    <div class="d-flex x-gap-10 items-center pt-10">

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/1.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">6 lesson</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/2.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">3h 56m</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/3.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">S1-S3</div>
                                                        </div>

                                                    </div>

                                                    <div class="coursesCard-footer">
                                                        <div class="coursesCard-footer__author">
                                                            <img src="img/general/avatar-1.png" alt="image">
                                                            <div>Ali Tufan</div>
                                                        </div>

                                                        <div class="coursesCard-footer__price">
                                                            <div>$179</div>
                                                            <div>$79</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>

                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div class="tabs__pane -tab-item-5 ">
                                <div class="row y-gap-30 justify-center">

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-1">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-2">



                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-3">



                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-4">



                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-5">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-6">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-7">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-8">

                                            <a href="courses-single-1.html" class="coursesCard -type-1 ">
                                                <div class="relative">
                                                    <div class="coursesCard__image overflow-hidden rounded-8">
                                                        <img class="w-1/1" src="img/coursesCards/8.png"
                                                            alt="image">
                                                        <div class="coursesCard__image_overlay rounded-8"></div>
                                                    </div>
                                                    <div
                                                        class="d-flex justify-between py-10 px-10 absolute-full-center z-3">

                                                    </div>
                                                </div>

                                                <div class="h-100 pt-15">
                                                    <div class="d-flex items-center">
                                                        <div class="text-14 lh-1 text-yellow-1 mr-10">4.5</div>
                                                        <div class="d-flex x-gap-5 items-center">
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                        </div>
                                                        <div class="text-13 lh-1 ml-10">(1991)</div>
                                                    </div>

                                                    <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">The Complete
                                                        Financial Analyst Training &amp; Investing Course</div>

                                                    <div class="d-flex x-gap-10 items-center pt-10">

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/1.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">6 lesson</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/2.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">3h 56m</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/3.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">S1-S3</div>
                                                        </div>

                                                    </div>

                                                    <div class="coursesCard-footer">
                                                        <div class="coursesCard-footer__author">
                                                            <img src="img/general/avatar-1.png" alt="image">
                                                            <div>Ali Tufan</div>
                                                        </div>

                                                        <div class="coursesCard-footer__price">
                                                            <div>$179</div>
                                                            <div>$79</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>

                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div class="tabs__pane -tab-item-6 ">
                                <div class="row y-gap-30 justify-center">

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-1">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-2">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-3">



                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-4">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-5">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-6">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-7">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-8">

                                            <a href="courses-single-1.html" class="coursesCard -type-1 ">
                                                <div class="relative">
                                                    <div class="coursesCard__image overflow-hidden rounded-8">
                                                        <img class="w-1/1" src="img/coursesCards/8.png"
                                                            alt="image">
                                                        <div class="coursesCard__image_overlay rounded-8"></div>
                                                    </div>
                                                    <div
                                                        class="d-flex justify-between py-10 px-10 absolute-full-center z-3">

                                                    </div>
                                                </div>

                                                <div class="h-100 pt-15">
                                                    <div class="d-flex items-center">
                                                        <div class="text-14 lh-1 text-yellow-1 mr-10">4.5</div>
                                                        <div class="d-flex x-gap-5 items-center">
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                        </div>
                                                        <div class="text-13 lh-1 ml-10">(1991)</div>
                                                    </div>

                                                    <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">The Complete
                                                        Financial Analyst Training &amp; Investing Course</div>

                                                    <div class="d-flex x-gap-10 items-center pt-10">

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/1.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">6 lesson</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/2.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">3h 56m</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/3.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">S1-S3</div>
                                                        </div>

                                                    </div>

                                                    <div class="coursesCard-footer">
                                                        <div class="coursesCard-footer__author">
                                                            <img src="img/general/avatar-1.png" alt="image">
                                                            <div>Ali Tufan</div>
                                                        </div>

                                                        <div class="coursesCard-footer__price">
                                                            <div>$179</div>
                                                            <div>$79</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>

                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div class="tabs__pane -tab-item-7 ">
                                <div class="row y-gap-30 justify-center">

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-1">



                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-2">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-3">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-4">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-5">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-6">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-7">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-8">

                                            <a href="courses-single-1.html" class="coursesCard -type-1 ">
                                                <div class="relative">
                                                    <div class="coursesCard__image overflow-hidden rounded-8">
                                                        <img class="w-1/1" src="img/coursesCards/8.png"
                                                            alt="image">
                                                        <div class="coursesCard__image_overlay rounded-8"></div>
                                                    </div>
                                                    <div
                                                        class="d-flex justify-between py-10 px-10 absolute-full-center z-3">

                                                    </div>
                                                </div>

                                                <div class="h-100 pt-15">
                                                    <div class="d-flex items-center">
                                                        <div class="text-14 lh-1 text-yellow-1 mr-10">4.5</div>
                                                        <div class="d-flex x-gap-5 items-center">
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                        </div>
                                                        <div class="text-13 lh-1 ml-10">(1991)</div>
                                                    </div>

                                                    <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">The Complete
                                                        Financial Analyst Training &amp; Investing Course</div>

                                                    <div class="d-flex x-gap-10 items-center pt-10">

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/1.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">6 lesson</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/2.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">3h 56m</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/3.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">S1-S3</div>
                                                        </div>

                                                    </div>

                                                    <div class="coursesCard-footer">
                                                        <div class="coursesCard-footer__author">
                                                            <img src="img/general/avatar-1.png" alt="image">
                                                            <div>Ali Tufan</div>
                                                        </div>

                                                        <div class="coursesCard-footer__price">
                                                            <div>$179</div>
                                                            <div>$79</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>

                                        </div>
                                    </div>

                                </div>
                            </div>

                            <div class="tabs__pane -tab-item-8 ">
                                <div class="row y-gap-30 justify-center">

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-1">



                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-2">



                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-3">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-4">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-5">



                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-6">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-7">


                                        </div>
                                    </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div data-anim-child="slide-up delay-8">

                                            <a href="courses-single-1.html" class="coursesCard -type-1 ">
                                                <div class="relative">
                                                    <div class="coursesCard__image overflow-hidden rounded-8">
                                                        <img class="w-1/1" src="img/coursesCards/8.png"
                                                            alt="image">
                                                        <div class="coursesCard__image_overlay rounded-8"></div>
                                                    </div>
                                                    <div
                                                        class="d-flex justify-between py-10 px-10 absolute-full-center z-3">

                                                    </div>
                                                </div>

                                                <div class="h-100 pt-15">
                                                    <div class="d-flex items-center">
                                                        <div class="text-14 lh-1 text-yellow-1 mr-10">4.5</div>
                                                        <div class="d-flex x-gap-5 items-center">
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                            <div class="icon-star text-9 text-yellow-1"></div>
                                                        </div>
                                                        <div class="text-13 lh-1 ml-10">(1991)</div>
                                                    </div>

                                                    <div class="text-17 lh-15 fw-500 text-dark-1 mt-10">The Complete
                                                        Financial Analyst Training &amp; Investing Course</div>

                                                    <div class="d-flex x-gap-10 items-center pt-10">

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/1.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">6 lesson</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/2.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">3h 56m</div>
                                                        </div>

                                                        <div class="d-flex items-center">
                                                            <div class="mr-8">
                                                                <img src="img/coursesCards/icons/3.svg"
                                                                    alt="icon">
                                                            </div>
                                                            <div class="text-14 lh-1">S1-S3</div>
                                                        </div>

                                                    </div>

                                                    <div class="coursesCard-footer">
                                                        <div class="coursesCard-footer__author">
                                                            <img src="img/general/avatar-1.png" alt="image">
                                                            <div>Ali Tufan</div>
                                                        </div>

                                                        <div class="coursesCard-footer__price">
                                                            <div>$179</div>
                                                            <div>$79</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>

                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            <section class="layout-pt-lg layout-pb-lg bg-purple-1 position-relative overflow-hidden">
                <!-- Decorative elements -->
                <div class="shape-1 bg-green-1 opacity-10 rounded-full"
                    style="width: 300px; height: 300px; position: absolute; top: -50px; left: -50px;"></div>
                <div class="shape-2 bg-white opacity-10 rounded-full"
                    style="width: 200px; height: 200px; position: absolute; bottom: -50px; right: -50px;"></div>

                <div class="container position-relative z-2">
                    <div class="row y-gap-30 justify-between items-center">
                        <div class="col-xl-5 col-lg-6">
                            <h2 class="text-40 lh-13 text-white fw-700">
                                Join Our Vibrant Learning Community
                                <span class="text-green-1 d-block mt-10">Discover Your Path with {{ config('app.short_name', 'Crossview College') }}</span>
                            </h2>
                            <p class="text-white mt-20 opacity-80" style="max-width: 500px;">
                                Access thousands of @lmsterm('study materials'), connect with expert tutors, and join a community of
                                passionate learners.
                            </p>
                        </div>

                        <div class="col-lg-auto">
                            <div class="d-flex flex-column items-center">
                                <a href="#" class="button -xl -green-1 text-dark-1 fw-600 px-40 py-15">
                                    Start Learning For Free
                                    <i class="icon-arrow-right text-14 ml-10"></i>
                                </a>
                                <div class="d-flex items-center mt-15">
                                    <div class="d-flex x-gap-5">
                                        <div class="icon-star text-yellow-1 text-14"></div>
                                        <div class="icon-star text-yellow-1 text-14"></div>
                                        <div class="icon-star text-yellow-1 text-14"></div>
                                        <div class="icon-star text-yellow-1 text-14"></div>
                                        <div class="icon-star text-yellow-1 text-14"></div>
                                    </div>
                                    <div class="text-white ml-10">Trusted by 10,000+ students</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Subscription Plans Section -->
            <section class="py-20 bg-gray-50">
                <div class="container mx-auto px-4">
                    <div class="text-center mb-16">
                        <h2 class="text-4xl font-bold text-gray-900 mb-4">Choose Your Learning Journey</h2>
                        <p class="text-xl text-gray-600 max-w-2xl mx-auto">Flexible subscription plans to fit your
                            learning needs</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                        @php
                            // Fetch top 3 active subscription tiers
                            $featuredTiers = App\Models\SubscriptionTier::where('is_active', true)
                                ->orderBy('level')
                                ->take(3)
                                ->get();
                        @endphp

                        @forelse($featuredTiers as $tier)
                            <div class="relative">
                                @if ($tier->price == 0)
                                    <div
                                        class="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-md">
                                        POPULAR</div>
                                @endif
                                <div
                                    class="h-full bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl {{ $tier->price == 0 ? 'border-2 border-purple-500 transform hover:-translate-y-2' : '' }}">
                                    <div class="p-8 text-center">
                                        <h3 class="text-2xl font-bold text-gray-800 mb-2">{{ $tier->name }}</h3>
                                        <div class="my-6">
                                            <span class="text-5xl font-extrabold text-gray-900">
                                                @if ($tier->price > 0)
                                                    UGX {{ number_format($tier->price, 0) }}
                                                @else
                                                    Free
                                                @endif
                                            </span>
                                            <span class="block text-gray-500 mt-2">
                                                @if ($tier->duration_days > 0)
                                                    {{ $tier->duration_days }} days
                                                @else
                                                    Unlimited
                                                @endif
                                            </span>
                                        </div>

                                        <p class="text-gray-600 mb-8 text-left">
                                            {{ Str::limit($tier->description, 100) }}</p>

                                        <ul class="space-y-3 text-left mb-10">
                                            @foreach (array_slice($tier->features ?? [], 0, 4) as $feature)
                                                <li class="flex items-start">
                                                    <svg class="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none"
                                                        viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                            stroke-width="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <span class="text-gray-700">{{ $feature }}</span>
                                                </li>
                                            @endforeach

                                            @if (count($tier->features ?? []) > 4)
                                                <li class="text-blue-600 font-medium underline">
                                                    +{{ count($tier->features) - 4 }} more features</li>
                                            @endif
                                        </ul>

                                        <div class="mt-auto">
                                            @auth
                                                @if (auth()->user()->hasActiveSubscription() && auth()->user()->activeSubscription->tier->id === $tier->id)
                                                    <button
                                                        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg cursor-default">Current
                                                        Plan</button>
                                                @else
                                                    <a href="{{ route('subscriptions.subscribe', ['subscriptionTier' => $tier->id]) }}"
                                                        class="block w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-3 px-6 rounded-lg transition duration-200 text-center">
                                                        Subscribe Now
                                                    </a>
                                                @endif
                                            @else
                                                <a href="{{ route('register') }}"
                                                    class="block w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-3 px-6 rounded-lg transition duration-200 text-center">
                                                    Get Started
                                                </a>
                                            @endauth
                                        </div>
                                    </div>
                                </div>
                            </div>
                        @empty
                            <div class="col-span-3 text-center py-12">
                                <p class="text-gray-600 text-lg">No subscription plans are currently available. Please
                                    check back later.</p>
                            </div>
                        @endforelse
                    </div>

                    <div class="text-center mt-16">
                        <a href="{{ route('pricing.index') }}"
                            class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
                            View All Plans
                        </a>
                    </div>
                </div>
            </section>

            <style>
                .floating-elements {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    pointer-events: none;
                    z-index: 1;
                }

                .floating-element {
                    position: absolute;
                    animation: float 6s ease-in-out infinite;
                    filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.2));
                }

                @keyframes float {

                    0%,
                    100% {
                        transform: translateY(0) rotate(0deg);
                    }

                    50% {
                        transform: translateY(-20px) rotate(5deg);
                    }
                }
            </style>
        </div>
    </main>
</x-app-layout>
