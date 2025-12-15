<x-app-layout>
    <main class="main-content  ">

        <div class="content-wrapper  js-content-wrapper">


      <section data-anim="fade" class="breadcrumbs ">
        <div class="container">
          <div class="row">
            <div class="col-auto">
              <div class="breadcrumbs__content">

                <div class="breadcrumbs__item ">
                  <a href="#">Home</a>
                </div>

                <div class="breadcrumbs__item ">
                  <a href="#">All courses</a>
                </div>

                <div class="breadcrumbs__item ">
                  <a href="#">User Experience Design</a>
                </div>

                <div class="breadcrumbs__item ">
                  <a href="#">User Interface</a>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>


      <section class="page-header -type-1">
        <div class="container">
          <div class="page-header__content">
            <div class="row justify-center text-center">
              <div class="col-auto">
                <div data-anim="slide-up delay-1">

                  <h1 class="page-header__title">About Us</h1>

                </div>

                <div data-anim="slide-up delay-2">

                  <p class="page-header__text">We’re on a mission to deliver engaging, curated courses at a reasonable price.</p>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section class="layout-pt-md layout-pb-lg">
        <div data-anim-wrap class="container">
          <div class="row y-gap-50 justify-between items-center">
            <div class="col-lg-6 pr-50 sm:pr-15">
              <div class="composition -type-8">
                <div class="-el-1"><img src="img/about-1/1.png" alt="image"></div>
                <div class="-el-2"><img src="img/about-1/2.png" alt="image"></div>
                <div class="-el-3"><img src="img/about-1/3.png" alt="image"></div>
              </div>
            </div>

            <div class="col-lg-5">
              <h2 class="text-30 lh-16">Welcome to {{ config('app.short_name', 'Crossview College') }} - Enhance your skills with best Online courses</h2>
              <p class="text-dark-1 mt-30">You can start and finish one of these popular courses in under a day – for free! Check out the list below.. Take the course for free</p>
              <p class="pr-50 lg:pr-0 mt-25">Neque convallis a cras semper auctor. Libero id faucibus nisl tincidunt egetnvallis a cras semper auctonvallis a cras semper aucto. Neque convallis a cras semper auctor. Liberoe convallis a cras semper atincidunt egetnval</p>
              <div class="d-inline-block">
                <a href="signup.html" class="button -md -purple-1 text-white mt-30">Start Learning For Free</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="layout-pt-lg layout-pb-lg bg-dark-2">
        <div data-anim-wrap class="container">
          <div class="row justify-center text-center">
            <div data-anim-child="slide-up delay-1" class="col-auto">

              <div class="sectionTitle ">

                <h2 class="sectionTitle__title text-white">Why learn with our courses?</h2>

                <p class="sectionTitle__text text-white">Lorem ipsum dolor sit amet, consectetur.</p>

              </div>

            </div>
          </div>

          <div class="row y-gap-30 pt-50">

            <div data-anim-child="slide-up delay-2" class="col-lg-4 col-md-6">
              <div class="stepCard -type-1 -stepCard-hover">
                <div class="stepCard__content">
                  <div class="stepCard__icon">
                    <i class="icon-online-learning-4 text-64 text-green-1"></i>
                  </div>
                  <h4 class="stepCard__title">01. Learn</h4>
                  <p class="stepCard__text"> Lorem ipsum dolor sit amet, consectetur dolorili adipiscing elit. Felis donec massa aliqua.</p>
                </div>
              </div>
            </div>

            <div data-anim-child="slide-up delay-3" class="col-lg-4 col-md-6">
              <div class="stepCard -type-1 -stepCard-hover">
                <div class="stepCard__content">
                  <div class="stepCard__icon">
                    <i class="icon-graduation-1 text-64 text-green-1"></i>
                  </div>
                  <h4 class="stepCard__title">02. Graduate</h4>
                  <p class="stepCard__text"> Lorem ipsum dolor sit amet, consectetur dolorili adipiscing elit. Felis donec massa aliqua.</p>
                </div>
              </div>
            </div>

            <div data-anim-child="slide-up delay-4" class="col-lg-4 col-md-6">
              <div class="stepCard -type-1 -stepCard-hover">
                <div class="stepCard__content">
                  <div class="stepCard__icon">
                    <i class="icon-working-at-home-2 text-64 text-green-1"></i>
                  </div>
                  <h4 class="stepCard__title">03. Work</h4>
                  <p class="stepCard__text"> Lorem ipsum dolor sit amet, consectetur dolorili adipiscing elit. Felis donec massa aliqua.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section class="layout-pt-lg layout-pb-lg bg-purple-1">
        <div class="container">
          <div class="row justify-center text-center">
            <div class="col-auto">

              <div class="sectionTitle ">

                <h2 class="sectionTitle__title text-green-1">What People Say</h2>

                <p class="sectionTitle__text text-white">Lorem ipsum dolor sit amet, consectetur.</p>

              </div>

            </div>
          </div>

          <div data-anim-wrap class="js-section-slider pt-50" data-gap="30" data-pagination data-slider-cols="base-3 xl-3 lg-2 md-2 sm-1">
            <div class="swiper-wrapper">

              <div class="swiper-slide">
                <div data-anim-child="slide-left delay-1" class="testimonials -type-1">
                  <div class="testimonials__content">
                    <h4 class="testimonials__title">Great Work</h4>
                    <p class="testimonials__text"> “I think {{ config('app.short_name', 'Crossview College') }} is the best theme I ever seen this year. Amazing design, easy to customize and a design quality superlative account on its cloud platform for the optimized performance”</p>

                    <div class="testimonials-footer">
                      <div class="testimonials-footer__image">
                        <img src="img/testimonials/1.png" alt="image">
                      </div>

                      <div class="testimonials-footer__content">
                        <div class="testimonials-footer__title">Courtney Henry</div>
                        <div class="testimonials-footer__text">Web Designer</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="swiper-slide">
                <div data-anim-child="slide-left delay-2" class="testimonials -type-1">
                  <div class="testimonials__content">
                    <h4 class="testimonials__title">Great Work</h4>
                    <p class="testimonials__text"> “I think {{ config('app.short_name', 'Crossview College') }} is the best theme I ever seen this year. Amazing design, easy to customize and a design quality superlative account on its cloud platform for the optimized performance”</p>

                    <div class="testimonials-footer">
                      <div class="testimonials-footer__image">
                        <img src="img/testimonials/2.png" alt="image">
                      </div>

                      <div class="testimonials-footer__content">
                        <div class="testimonials-footer__title">Ronald Richards</div>
                        <div class="testimonials-footer__text">President of Sales</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="swiper-slide">
                <div data-anim-child="slide-left delay-3" class="testimonials -type-1">
                  <div class="testimonials__content">
                    <h4 class="testimonials__title">Great Work</h4>
                    <p class="testimonials__text"> “I think {{ config('app.short_name', 'Crossview College') }} is the best theme I ever seen this year. Amazing design, easy to customize and a design quality superlative account on its cloud platform for the optimized performance”</p>

                    <div class="testimonials-footer">
                      <div class="testimonials-footer__image">
                        <img src="img/testimonials/3.png" alt="image">
                      </div>

                      <div class="testimonials-footer__content">
                        <div class="testimonials-footer__title">Annette Black</div>
                        <div class="testimonials-footer__text">Nursing Assistant</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="swiper-slide">
                <div data-anim-child="slide-left delay-4" class="testimonials -type-1">
                  <div class="testimonials__content">
                    <h4 class="testimonials__title">Great Work</h4>
                    <p class="testimonials__text"> “I think {{ config('app.short_name', 'Crossview College') }} is the best theme I ever seen this year. Amazing design, easy to customize and a design quality superlative account on its cloud platform for the optimized performance”</p>

                    <div class="testimonials-footer">
                      <div class="testimonials-footer__image">
                        <img src="img/testimonials/4.png" alt="image">
                      </div>

                      <div class="testimonials-footer__content">
                        <div class="testimonials-footer__title">Courtney Henry</div>
                        <div class="testimonials-footer__text">Web Designer</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>


            <div class="d-flex x-gap-20 items-center justify-end pt-60 lg:pt-40">
              <div class="col-auto">
                <button class="button -outline-white text-white size-50 rounded-full d-flex justify-center items-center js-prev">
                  <i class="icon icon-arrow-left text-24"></i>
                </button>
              </div>
              <div class="col-auto">
                <button class="button -outline-white text-white size-50 rounded-full d-flex justify-center items-center js-next">
                  <i class="icon icon-arrow-right text-24"></i>
                </button>
              </div>
            </div>

          </div>

          <div data-anim-wrap class="row y-gap-30 counter__row">

            <div class="col-lg-3 col-sm-6">
              <div data-anim-child="slide-left delay-1" class="counter -type-1">
                <div class="counter__number">350,000+</div>
                <div class="counter__title">Students worldwide</div>
              </div>
            </div>

            <div class="col-lg-3 col-sm-6">
              <div data-anim-child="slide-left delay-2" class="counter -type-1">
                <div class="counter__number">496,00+</div>
                <div class="counter__title">Total course views</div>
              </div>
            </div>

            <div class="col-lg-3 col-sm-6">
              <div data-anim-child="slide-left delay-3" class="counter -type-1">
                <div class="counter__number">19,000+</div>
                <div class="counter__title">Five-star course reviews</div>
              </div>
            </div>

            <div class="col-lg-3 col-sm-6">
              <div data-anim-child="slide-left delay-4" class="counter -type-1">
                <div class="counter__number">987,000+</div>
                <div class="counter__title">Students community</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section class="layout-pt-lg layout-pb-md">
        <div data-anim-wrap class="container">
          <div data-anim-child="slide-left delay-1" class="row y-gap-20 justify-between items-center">
            <div class="col-lg-6">

              <div class="sectionTitle ">

                <h2 class="sectionTitle__title ">Learn from the best instructors</h2>

                <p class="sectionTitle__text ">Lorem ipsum dolor sit amet, consectetur.</p>

              </div>

            </div>

            <div class="col-auto">

              <a href="instructors-list-1.html" class="button -icon -purple-3 text-purple-1">
                View All Instructors
                <i class="icon-arrow-top-right text-13 ml-10"></i>
              </a>

            </div>
          </div>

          <div class="row y-gap-30 pt-50">

            <div class="col-lg-3 col-sm-6">
              <div data-anim-child="slide-left delay-2" class="teamCard -type-1 -teamCard-hover">
                <div class="teamCard__image">
                  <img src="img/team/1.png" alt="image">
                  <div class="teamCard__socials">
                    <div class="d-flex x-gap-20 y-gap-10 justify-center items-center h-100">
                      <a href="#"><i class="icon-facebook text-white"></i></a>
                      <a href="#"><i class="icon-twitter text-white"></i></a>
                      <a href="#"><i class="icon-instagram text-white"></i></a>
                      <a href="#"><i class="icon-linkedin text-white"></i></a>
                    </div>
                  </div>
                </div>
                <div class="teamCard__content">
                  <h4 class="teamCard__title">Floyd Miles</h4>
                  <p class="teamCard__text">President of Sales</p>

                  <div class="row items-center y-gap-10 x-gap-10 pt-10">
                    <div class="col-auto">
                      <div class="d-flex items-center">
                        <div class="icon-star text-yellow-1 text-11 mr-5"></div>
                        <div class="text-14 lh-12 text-yellow-1 fw-500">4.5</div>
                      </div>
                    </div>

                    <div class="col-auto">
                      <div class="d-flex items-center">
                        <div class="icon-online-learning text-light-1 text-11 mr-5"></div>
                        <div class="text-14 lh-12">692 Students</div>
                      </div>
                    </div>

                    <div class="col-auto">
                      <div class="d-flex items-center">
                        <div class="icon-play text-light-1 text-11 mr-5"></div>
                        <div class="text-14 lh-12">15 Course</div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-3 col-sm-6">
              <div data-anim-child="slide-left delay-3" class="teamCard -type-1 -teamCard-hover">
                <div class="teamCard__image">
                  <img src="img/team/2.png" alt="image">
                  <div class="teamCard__socials">
                    <div class="d-flex x-gap-20 y-gap-10 justify-center items-center h-100">
                      <a href="#"><i class="icon-facebook text-white"></i></a>
                      <a href="#"><i class="icon-twitter text-white"></i></a>
                      <a href="#"><i class="icon-instagram text-white"></i></a>
                      <a href="#"><i class="icon-linkedin text-white"></i></a>
                    </div>
                  </div>
                </div>
                <div class="teamCard__content">
                  <h4 class="teamCard__title">Cameron Williamson</h4>
                  <p class="teamCard__text">Web Designer</p>

                  <div class="row items-center y-gap-10 x-gap-10 pt-10">
                    <div class="col-auto">
                      <div class="d-flex items-center">
                        <div class="icon-star text-yellow-1 text-11 mr-5"></div>
                        <div class="text-14 lh-12 text-yellow-1 fw-500">4.5</div>
                      </div>
                    </div>

                    <div class="col-auto">
                      <div class="d-flex items-center">
                        <div class="icon-online-learning text-light-1 text-11 mr-5"></div>
                        <div class="text-14 lh-12">692 Students</div>
                      </div>
                    </div>

                    <div class="col-auto">
                      <div class="d-flex items-center">
                        <div class="icon-play text-light-1 text-11 mr-5"></div>
                        <div class="text-14 lh-12">15 Course</div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-3 col-sm-6">
              <div data-anim-child="slide-left delay-4" class="teamCard -type-1 -teamCard-hover">
                <div class="teamCard__image">
                  <img src="img/team/3.png" alt="image">
                  <div class="teamCard__socials">
                    <div class="d-flex x-gap-20 y-gap-10 justify-center items-center h-100">
                      <a href="#"><i class="icon-facebook text-white"></i></a>
                      <a href="#"><i class="icon-twitter text-white"></i></a>
                      <a href="#"><i class="icon-instagram text-white"></i></a>
                      <a href="#"><i class="icon-linkedin text-white"></i></a>
                    </div>
                  </div>
                </div>
                <div class="teamCard__content">
                  <h4 class="teamCard__title">Brooklyn Simmons</h4>
                  <p class="teamCard__text">Dog Trainer</p>

                  <div class="row items-center y-gap-10 x-gap-10 pt-10">
                    <div class="col-auto">
                      <div class="d-flex items-center">
                        <div class="icon-star text-yellow-1 text-11 mr-5"></div>
                        <div class="text-14 lh-12 text-yellow-1 fw-500">4.5</div>
                      </div>
                    </div>

                    <div class="col-auto">
                      <div class="d-flex items-center">
                        <div class="icon-online-learning text-light-1 text-11 mr-5"></div>
                        <div class="text-14 lh-12">692 Students</div>
                      </div>
                    </div>

                    <div class="col-auto">
                      <div class="d-flex items-center">
                        <div class="icon-play text-light-1 text-11 mr-5"></div>
                        <div class="text-14 lh-12">15 Course</div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-3 col-sm-6">
              <div data-anim-child="slide-left delay-5" class="teamCard -type-1 -teamCard-hover">
                <div class="teamCard__image">
                  <img src="img/team/4.png" alt="image">
                  <div class="teamCard__socials">
                    <div class="d-flex x-gap-20 y-gap-10 justify-center items-center h-100">
                      <a href="#"><i class="icon-facebook text-white"></i></a>
                      <a href="#"><i class="icon-twitter text-white"></i></a>
                      <a href="#"><i class="icon-instagram text-white"></i></a>
                      <a href="#"><i class="icon-linkedin text-white"></i></a>
                    </div>
                  </div>
                </div>
                <div class="teamCard__content">
                  <h4 class="teamCard__title">Wade Warren</h4>
                  <p class="teamCard__text">Marketing Coordinator</p>

                  <div class="row items-center y-gap-10 x-gap-10 pt-10">
                    <div class="col-auto">
                      <div class="d-flex items-center">
                        <div class="icon-star text-yellow-1 text-11 mr-5"></div>
                        <div class="text-14 lh-12 text-yellow-1 fw-500">4.5</div>
                      </div>
                    </div>

                    <div class="col-auto">
                      <div class="d-flex items-center">
                        <div class="icon-online-learning text-light-1 text-11 mr-5"></div>
                        <div class="text-14 lh-12">692 Students</div>
                      </div>
                    </div>

                    <div class="col-auto">
                      <div class="d-flex items-center">
                        <div class="icon-play text-light-1 text-11 mr-5"></div>
                        <div class="text-14 lh-12">15 Course</div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

          </div>

          <div class="row justify-center text-center pt-60 lg:pt-40">
            <div class="col-auto">
              <p class="lh-1">Want to help people learn, grow and achieve more in life? <a class="text-purple-1 underline" href="instructors-become.html">Become an instructor</a></p>
            </div>
          </div>
        </div>
      </section>

      <section class="layout-pt-md layout-pb-lg">
        <div data-anim-wrap class="container">
          <div class="row justify-center">
            <div class="col text-center">
              <p class="text-lg text-dark-1">Trusted by companies of all sizes</p>
            </div>
          </div>

          <div class="row y-gap-30 justify-between sm:justify-start items-center pt-60 md:pt-50">

            <div data-anim-child="slide-up delay-1" class="col-lg-auto col-md-2 col-sm-3 col-4">
              <div class="d-flex justify-center items-center px-4">
                <img class="w-1/1" src="img/clients/1.svg" alt="clients image">
              </div>
            </div>

            <div data-anim-child="slide-up delay-1" class="col-lg-auto col-md-2 col-sm-3 col-4">
              <div class="d-flex justify-center items-center px-4">
                <img class="w-1/1" src="img/clients/2.svg" alt="clients image">
              </div>
            </div>

            <div data-anim-child="slide-up delay-1" class="col-lg-auto col-md-2 col-sm-3 col-4">
              <div class="d-flex justify-center items-center px-4">
                <img class="w-1/1" src="img/clients/3.svg" alt="clients image">
              </div>
            </div>

            <div data-anim-child="slide-up delay-1" class="col-lg-auto col-md-2 col-sm-3 col-4">
              <div class="d-flex justify-center items-center px-4">
                <img class="w-1/1" src="img/clients/4.svg" alt="clients image">
              </div>
            </div>

            <div data-anim-child="slide-up delay-1" class="col-lg-auto col-md-2 col-sm-3 col-4">
              <div class="d-flex justify-center items-center px-4">
                <img class="w-1/1" src="img/clients/5.svg" alt="clients image">
              </div>
            </div>

            <div data-anim-child="slide-up delay-1" class="col-lg-auto col-md-2 col-sm-3 col-4">
              <div class="d-flex justify-center items-center px-4">
                <img class="w-1/1" src="img/clients/6.svg" alt="clients image">
              </div>
            </div>

          </div>
        </div>
      </section>

      </div>
  </main>
</x-app-layout> 
