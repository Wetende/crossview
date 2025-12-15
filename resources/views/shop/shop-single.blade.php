<x-app-layout>
    <section data-anim="fade" class="breadcrumbs">
        <div class="container">
          <div class="row">
            <div class="col-auto">
              <div class="breadcrumbs__content">
                        <div class="breadcrumbs__item">
                  <a href="#">Home</a>
                </div>
                        <div class="breadcrumbs__item">
                            <a href="#">Shop</a>
                </div>
                        <div class="breadcrumbs__item">
                            <a href="#">Product Details</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    <section class="layout-pt-lg layout-pb-lg">
        <div class="container">
            <div class="row y-gap-60">
                <div class="col-lg-12">
                    <div class="shopSingle-preview">
                        <div class="row y-gap-30">
            <div class="col-lg-6">
                                <div class="shopSingle-preview__image">
                                    <img src="{{ asset('img/shop/products/1.png') }}" alt="Product image">
                        </div>
                    </div>

                            <div class="col-lg-6">
                                <div class="shopSingle-preview__content">
                                    <div class="shopSingle-preview__title">
                                        <h2 class="text-24 fw-500">{{ $course->title ?? 'JavaScript Fundamentals' }}</h2>
                        </div>

                                    <div class="shopSingle-preview__price mt-15">
                                        @if(isset($course) && method_exists($course, 'hasDiscount') && $course->hasDiscount())
                                        <div class="d-flex items-center">
                                            <div class="text-24 fw-500 text-dark-1 lh-1 line-through mr-10">KES {{ number_format($course->original_price) }}</div>
                                            <div class="text-30 fw-500 text-dark-1 lh-1">KES {{ number_format($course->price) }}</div>
                        </div>
                                        @else
                                        <div class="text-30 fw-500 text-dark-1 lh-1">KES {{ number_format($course->price ?? 45000) }}</div>
                                        @endif
                    </div>

                                    <div class="shopSingle-preview__rating mt-20">
                                        <div class="d-flex items-center">
                                            <div class="d-flex x-gap-5 pr-10">
                                                <div><i class="icon-star text-yellow-1 text-14"></i></div>
                                                <div><i class="icon-star text-yellow-1 text-14"></i></div>
                                                <div><i class="icon-star text-yellow-1 text-14"></i></div>
                                                <div><i class="icon-star text-yellow-1 text-14"></i></div>
                                                <div><i class="icon-star text-yellow-1 text-14"></i></div>
                        </div>
                                            <div class="text-14 lh-12 text-light-1">({{ $course->reviews_count ?? 4 }} reviews)</div>
                        </div>
                    </div>

                                    <div class="mt-30">
                                        <div class="text-dark-1">{{ $course->excerpt ?? 'Learn JavaScript, one of the most popular programming languages in the world and the backbone of modern web development. This course is perfect for beginners with no prior programming experience.' }}</div>
                        </div>

                <div class="mt-30">
                                        <div class="d-flex items-center justify-between">
                                            <form action="{{ route('shop.cart.add') }}" method="POST">
                                                @csrf
                                                <input type="hidden" name="course_id" value="{{ $course->id ?? 1 }}">
                                                <div class="d-flex items-center">
                                                    <div class="input-counter">
                                                        <input type="number" class="input-counter__counter" value="1" min="1" max="1" readonly />
                </div>

                                                    <div class="ml-20">
                                                        <button type="submit" class="button h-50 px-30 -purple-1 text-white">
                                                            Add To Cart
                        </button>
                      </div>
                    </div>
                                            </form>
                                            
                                            <!-- Buy Now Button -->
                                            <form action="{{ route('shop.cart.add') }}" method="POST">
                                                @csrf
                                                <input type="hidden" name="course_id" value="{{ $course->id ?? 1 }}">
                                                <input type="hidden" name="buy_now" value="1">
                                                <button type="submit" class="button h-50 px-30 -dark-1 text-white">
                                                    Buy Now
                  </button>
                                            </form>
                </div>
                </div>

                                    <div class="mt-30">
                                        <div class="row y-gap-10">
            <div class="col-12">
                                                <div class="d-flex items-center">
                                                    <div class="text-dark-1 fw-500 mr-10">Category:</div>
                                                    <div>{{ $course->category->name ?? 'Programming' }}</div>
              </div>
            </div>

                                            <div class="col-12">
                                                <div class="d-flex items-center">
                                                    <div class="text-dark-1 fw-500 mr-10">Duration:</div>
                                                    <div>{{ $course->duration ?? '10 hours' }}</div>
                    </div>
                                </div>

                                            <div class="col-12">
                                                <div class="d-flex items-center">
                                                    <div class="text-dark-1 fw-500 mr-10">Instructor:</div>
                                                    <div>{{ $course->teacher->name ?? 'John Doe' }}</div>
                                  </div>
                                  </div>
                                  </div>
                                </div>
                              </div>
                                </div>
                                  </div>
                                  </div>

                    <div class="shopSingle-info pt-60 lg:pt-40">
                        <div class="tabs -underline-2 js-tabs">
                            <div class="tabs__controls row x-gap-40 y-gap-10 js-tabs-controls">
                                <div class="col-auto">
                                    <button class="tabs__button text-dark-1 js-tabs-button is-active" data-tab-target=".-tab-item-1" type="button">
                  Description
                </button>
                                  </div>
                                <div class="col-auto">
                                    <button class="tabs__button text-dark-1 js-tabs-button" data-tab-target=".-tab-item-2" type="button">
                                        Curriculum
                </button>
                                </div>
                                <div class="col-auto">
                                    <button class="tabs__button text-dark-1 js-tabs-button" data-tab-target=".-tab-item-3" type="button">
                            Reviews
                                    </button>
                        </div>
                      </div>

                            <div class="tabs__content pt-30 js-tabs-content">
                                <div class="tabs__pane -tab-item-1 is-active">
                                    <div>
                                        <h4 class="text-20 fw-500">Description</h4>
                        <div class="mt-30">
                                            <p>{{ $course->description ?? 'JavaScript is the programming language of the Web. JavaScript is easy to learn. This tutorial will teach you JavaScript from basic to advanced. JavaScript is one of the world\'s most popular programming languages. JavaScript is the programming language of the Web. JavaScript is easy to learn. This tutorial will teach you JavaScript from basic to advanced.' }}</p>
                                            
                                            <ul class="ul-list y-gap-10 mt-30">
                                                <li>Learn JavaScript and web development fundamentals</li>
                                                <li>Create interactive web pages with DOM manipulation</li>
                                                <li>Work with arrays, objects, and functions</li>
                                                <li>Learn modern JavaScript features (ES6+)</li>
                                                <li>Build multiple real-world projects</li>
                                            </ul>
                          </div>
                          </div>
                          </div>

                                <div class="tabs__pane -tab-item-2">
                                    <div>
                                        <h4 class="text-20 fw-500">@lmsterm('Study Material') Curriculum</h4>
                        <div class="mt-30">
                                            <div class="accordion -block js-accordion">
                                                <div class="accordion__item">
                                                    <div class="accordion__button">
                                                        <div class="accordion__icon">
                                                            <div class="icon" data-feather="plus"></div>
                                                            <div class="icon" data-feather="minus"></div>
              </div>
                                                        <span class="text-17 fw-500 text-dark-1">Section 1: Getting Started</span>
          </div>

                                                    <div class="accordion__content">
                                                        <div class="accordion__content__inner">
                                                            <div class="y-gap-20">
                                                                <div class="d-flex items-center justify-between">
                                                                    <div>
                                                                        <div class="d-flex items-center">
                                                                            <div class="d-flex justify-center items-center size-30 rounded-full bg-purple-3 mr-10">
                                                                                <div class="icon-play text-9"></div>
                  </div>
                                                                            <div>Introduction to JavaScript</div>
                </div>
                  </div>
                                                                    <div class="d-flex x-gap-20 items-center">
                                                                        <div>20 min</div>
              </div>
            </div>

                                                                <div class="d-flex items-center justify-between">
                                                                    <div>
                                                                        <div class="d-flex items-center">
                                                                            <div class="d-flex justify-center items-center size-30 rounded-full bg-purple-3 mr-10">
                                                                                <div class="icon-play text-9"></div>
                  </div>
                                                                            <div>Setting Up Your Development Environment</div>
                </div>
                  </div>
                                                                    <div class="d-flex x-gap-20 items-center">
                                                                        <div>15 min</div>
                  </div>
                </div>
              </div>
            </div>
                  </div>
                </div>
                  </div>
                </div>
              </div>
            </div>

                                <div class="tabs__pane -tab-item-3">
                                    <div>
                                        <h4 class="text-20 fw-500">Student Feedback</h4>

                                        <div class="mt-30">
                                            <div class="row y-gap-30">
                                                <div class="col-lg-4">
                                                    <div class="d-flex items-center flex-column py-30 px-30 rounded-8 bg-light-4">
                                                        <div class="text-60 lh-1 text-dark-1 fw-500">4.8</div>
                                                        <div class="d-flex x-gap-5 mt-10">
                                                            <div><i class="icon-star text-yellow-1 text-11"></i></div>
                                                            <div><i class="icon-star text-yellow-1 text-11"></i></div>
                                                            <div><i class="icon-star text-yellow-1 text-11"></i></div>
                                                            <div><i class="icon-star text-yellow-1 text-11"></i></div>
                                                            <div><i class="icon-star text-yellow-1 text-11"></i></div>
                  </div>
                                                        <div class="text-14 lh-12 mt-10">@lmsterm('Study Material') Rating</div>
                </div>
                  </div>

                                                <div class="col-lg-8">
                                                    <div class="py-20 px-30 bg-light-4 rounded-8">
                                                        <div class="row y-gap-15">
                                                            <div class="col-12">
                                                                <div class="d-flex items-center">
                                                                    <div class="text-14 lh-12 fw-500 text-dark-1 w-60">5 stars</div>
                                                                    <div class="progress bg-light-3 ml-10 w-full">
                                                                        <div class="progress-bar bg-yellow-1" style="width: 70%"></div>
                  </div>
                                                                    <div class="text-14 lh-12 fw-500 text-dark-1 w-60 ml-10">70%</div>
              </div>
            </div>

                                                            <div class="col-12">
                                                                <div class="d-flex items-center">
                                                                    <div class="text-14 lh-12 fw-500 text-dark-1 w-60">4 stars</div>
                                                                    <div class="progress bg-light-3 ml-10 w-full">
                                                                        <div class="progress-bar bg-yellow-1" style="width: 20%"></div>
          </div>
                                                                    <div class="text-14 lh-12 fw-500 text-dark-1 w-60 ml-10">20%</div>
            </div>
          </div>

                                                            <div class="col-12">
                                                                <div class="d-flex items-center">
                                                                    <div class="text-14 lh-12 fw-500 text-dark-1 w-60">3 stars</div>
                                                                    <div class="progress bg-light-3 ml-10 w-full">
                                                                        <div class="progress-bar bg-yellow-1" style="width: 7%"></div>
                </div>
                                                                    <div class="text-14 lh-12 fw-500 text-dark-1 w-60 ml-10">7%</div>
                    </div>
                  </div>

                                                            <div class="col-12">
                                                                <div class="d-flex items-center">
                                                                    <div class="text-14 lh-12 fw-500 text-dark-1 w-60">2 stars</div>
                                                                    <div class="progress bg-light-3 ml-10 w-full">
                                                                        <div class="progress-bar bg-yellow-1" style="width: 3%"></div>
                    </div>
                                                                    <div class="text-14 lh-12 fw-500 text-dark-1 w-60 ml-10">3%</div>
                </div>
              </div>

                                                            <div class="col-12">
                                                                <div class="d-flex items-center">
                                                                    <div class="text-14 lh-12 fw-500 text-dark-1 w-60">1 stars</div>
                                                                    <div class="progress bg-light-3 ml-10 w-full">
                                                                        <div class="progress-bar bg-yellow-1" style="width: 0%"></div>
                </div>
                                                                    <div class="text-14 lh-12 fw-500 text-dark-1 w-60 ml-10">0%</div>
              </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
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
</x-app-layout>