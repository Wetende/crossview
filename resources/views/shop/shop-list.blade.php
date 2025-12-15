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
                            <h1 class="page-header__title">Shop</h1>
                </div>
                <div data-anim="slide-up delay-2">
                            <p class="page-header__text">Browse our courses and learning materials</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="layout-pt-md layout-pb-lg">
        <div class="container">
            <div class="row">
                <div class="col-lg-4 col-md-8">
                    <div class="pr-30 lg:pr-0">
                        <div class="sidebar -shop">
                <div class="sidebar__item">
                  <h5 class="sidebar__title">Categories</h5>
                  <div class="sidebar-content -list">
                                    <div class="sidebar-category">
                                        <a href="{{ route('shop.index') }}" class="sidebar-category__item">
                                            <span class="sidebar-category__item-line"></span>
                                            <span class="sidebar-category__item-title">All @lmsterm('Study Materials')</span>
                                            <span class="sidebar-category__item-count">({{ $categories->sum('courses_count') ?? 156 }})</span>
                                        </a>
                                        @foreach($categories ?? [] as $category)
                                        <a href="{{ route('shop.index', ['category' => $category->slug]) }}" class="sidebar-category__item">
                                            <span class="sidebar-category__item-line"></span>
                                            <span class="sidebar-category__item-title">{{ $category->name }}</span>
                                            <span class="sidebar-category__item-count">({{ $category->courses_count }})</span>
                                        </a>
                                        @endforeach
                                    </div>
                  </div>
                </div>

                <div class="sidebar__item">
                  <h5 class="sidebar__title">Filter by price</h5>
                                <div class="sidebar-content -price">
                                    <div class="price-range">
                                        <div class="price-range__wrapper">
                                            <div class="price-range__slider"></div>
                      </div>

                                        <div class="price-range__filterInput">
                                            <div class="price-range__value">
                                                <span>Price:</span>
                                                <span class="js-price-range-value"></span>
                        </div>
                                            <form action="{{ route('shop.filter') }}" method="GET">
                                                <input type="hidden" class="js-price-range-from" name="price_min">
                                                <input type="hidden" class="js-price-range-to" name="price_max">
                                                <button type="submit" class="button -md -accent text-white mt-20">Filter</button>
                                            </form>
                      </div>
                    </div>
                  </div>
                </div>
                    </div>
                    </div>
                    </div>

                <div class="col-lg-8">
                    <div class="row y-gap-20 justify-between items-center mb-30">
                <div class="col-auto">
                            <div class="text-14">Showing {{ $courses->firstItem() ?? 1 }}–{{ $courses->lastItem() ?? 9 }} of {{ $courses->total() ?? 42 }} results</div>
                </div>

                <div class="col-auto">
                  <div class="d-flex items-center">
                                <div class="text-14 fw-500 mr-20">Sort by:</div>
                                <form id="sort-form" action="{{ route('shop.sort') }}" method="GET">
                                    <select class="selectize-shop" name="sort" onchange="document.getElementById('sort-form').submit()">
                                        <option value="popularity" {{ request('sort') == 'popularity' ? 'selected' : '' }}>Popularity</option>
                                        <option value="price-low-high" {{ request('sort') == 'price-low-high' ? 'selected' : '' }}>Price: low to high</option>
                                        <option value="price-high-low" {{ request('sort') == 'price-high-low' ? 'selected' : '' }}>Price: high to low</option>
                                        <option value="newest" {{ request('sort') == 'newest' ? 'selected' : '' }}>Newest first</option>
                                    </select>
                                </form>
                    </div>
                </div>
              </div>

                    <div class="row y-gap-30">
                        @forelse($courses as $course)
                        <!-- Single Product Card -->
                        <div class="col-lg-4 col-sm-6">
                            <div class="productCard -type-1">
                                <div class="productCard__image">
                                    <a href="{{ route('shop.product', $course->slug) }}">
                                        <img src="{{ $course->thumbnail_path ? asset($course->thumbnail_path) : asset('img/shop/products/placeholder.png') }}" alt="{{ $course->title }}">
                                    </a>
                                </div>

                                <div class="productCard__content mt-20">
                                    <div class="d-flex justify-between">
                                        <div>
                                            @if(method_exists($course, 'isFeatured') && $course->isFeatured())
                                            <div class="badge -sm -green text-white">Featured</div>
                                            @endif
                                        </div>
                                        <div>
                                            <div class="d-flex items-center">
                                                <div class="text-14 lh-1 text-yellow-1 mr-10">{{ number_format($course->average_rating ?? 0, 1) }}</div>
                                                <div class="d-flex x-gap-5 items-center">
                                                    @for ($i = 1; $i <= 5; $i++)
                                                        @if ($i <= round($course->average_rating ?? 0))
                                                            <i class="icon-star text-9 text-yellow-1"></i>
                                                        @else
                                                            <i class="icon-star text-9 text-light-1"></i>
                                                        @endif
                                                    @endfor
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <h4 class="productCard__title text-17 lh-15 fw-500 mt-5">
                                        <a href="{{ route('shop.product', $course->slug) }}">{{ $course->title }}</a>
                                    </h4>

                                    <div class="productCard__price mt-8">
                                        @if(method_exists($course, 'hasDiscount') && $course->hasDiscount())
                                        <div class="text-15 lh-14 fw-500 line-through">KES {{ number_format($course->original_price) }}</div>
                                        <div class="text-18 lh-16 fw-500 text-purple-1 ml-10">KES {{ number_format($course->price) }}</div>
                                        @else
                                        <div class="text-18 lh-16 fw-500 text-purple-1">KES {{ number_format($course->price) }}</div>
                                        @endif
                                    </div>

                                    <div class="d-flex justify-between items-center pt-15">
                                        <form action="{{ route('shop.cart.add') }}" method="POST">
                                            @csrf
                                            <input type="hidden" name="course_id" value="{{ $course->id }}">
                                            <button type="submit" class="button h-45 px-25 -purple-1 text-white">
                                                Add to cart
                                            </button>
                                        </form>

                                        <button class="button -simple-accent h-45 px-25" data-course-id="{{ $course->id }}">
                                            <i class="icon-heart text-13 pr-8"></i>
                                            Wishlist
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- End Single Product Card -->
                        @empty
                        <div class="col-12">
                            <div class="text-center py-50">
                                <h4 class="text-20 fw-500">No courses available</h4>
                                <p class="mt-10">Please check back later for new courses.</p>
                            </div>
                        </div>
                        @endforelse
                    </div>

                    <div class="row justify-center pt-60 lg:pt-40">
                        <div class="col-auto">
                            <div class="pagination -shop">
                                {{ $courses->links() ?? '' }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</x-app-layout>