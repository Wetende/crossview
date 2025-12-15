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
                            <a href="#">Cart</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="layout-pt-md layout-pb-lg">
        <div class="container">
            <div class="row y-gap-50">
                <div class="col-lg-8">
                    <div class="shopCart-table">
                        <div class="shopCart-header">
                            <div class="row py-20 px-15 -mr-15 bg-light-4">
                                <div class="col-md-6">
                                    <div class="fw-500">Product</div>
                  </div>
                                <div class="col-md-3">
                                    <div class="fw-500">Price</div>
                  </div>
                                <div class="col-md-3">
                    <div class="d-flex justify-end">
                                        <div class="fw-500">Subtotal</div>
                    </div>
                  </div>
                </div>
              </div>

                        <div class="shopCart-items">
                            @forelse($cartItems ?? [['id' => 1, 'title' => 'JavaScript Fundamentals', 'price' => 45000]] as $item)
                            <div class="row py-20 px-15 -mr-15 border-bottom-light">
                                <div class="col-md-6">
                                    <div class="d-flex">
                                        <div class="shopCart-item-image mr-20">
                                            <img src="{{ asset($item['image'] ?? 'img/shop/products/placeholder.png') }}" alt="{{ $item['title'] }}">
                      </div>
                                        <div class="shopCart-item-info">
                                            <div class="shopCart-item-title text-dark-1 fw-500">{{ $item['title'] }}</div>
                                            <div class="d-flex items-center mt-10">
                                                <form action="{{ route('shop.cart.remove', $item['id']) }}" method="POST">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit" class="d-flex items-center text-14 text-red-1">
                                                        <i class="icon-trash text-13 mr-8"></i>
                                                        Remove
                          </button>
                                                </form>
                        </div>
                      </div>
                    </div>
                  </div>

                                <div class="col-md-3">
                                    <div class="shopCart-item-price">
                                        <div class="shopCart-item-price-title d-none md:d-block text-14 mb-5">Price</div>
                                        <div class="text-18 fw-500 text-dark-1">KES {{ number_format($item['price']) }}</div>
                    </div>
                  </div>

                                <div class="col-md-3">
                                    <div class="shopCart-item-subtotal">
                                        <div class="shopCart-item-price-title d-none md:d-block text-14 mb-5">Subtotal</div>
                                        <div class="d-flex justify-end items-center h-full">
                                            <div class="text-18 fw-500 text-dark-1">KES {{ number_format($item['price']) }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                            @empty
                            <div class="row py-30 px-15 -mr-15 border-bottom-light">
                                <div class="col-12">
                                    <div class="text-center">Your cart is empty</div>
                    </div>
                  </div>
                            @endforelse
                  </div>

                        <div class="row pt-30 pb-20">
                            <div class="col-12">
                                <div class="d-flex justify-between">
                                    <div>
                                        <form action="{{ route('shop.cart.clear') }}" method="POST">
                                            @csrf
                                            <button type="submit" class="button -md -outline-purple-1 text-purple-1">Clear Cart</button>
                    </form>
                  </div>
                                    <div>
                                        <form action="{{ route('shop.cart.update') }}" method="POST">
                                            @csrf
                                            <button type="submit" class="button -md -outline-purple-1 text-purple-1">Update Cart</button>
                                        </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
                </div>

                <div class="col-lg-4">
                    <div class="shopCart-sidebar bg-light-4 rounded-8">
                        <div class="shopCart-sidebar__item py-30 px-30 border-bottom-light">
                            <h5 class="text-20 fw-500 mb-15">Cart totals</h5>

                            <div class="d-flex justify-between mb-15">
                                <div class="text-15 fw-500">Subtotal</div>
                                <div class="text-15">KES {{ number_format($subtotal ?? 45000) }}</div>
          </div>

                            @if(isset($discount) && $discount > 0)
                            <div class="d-flex justify-between mb-15">
                                <div class="text-15 fw-500">Discount</div>
                                <div class="text-15 text-green-1">-KES {{ number_format($discount) }}</div>
                </div>
                            @endif

                            <div class="d-flex justify-between">
                                <div class="text-15 fw-500">Total</div>
                                <div class="text-15 fw-500">KES {{ number_format($total ?? 45000) }}</div>
                    </div>
                  </div>

                        <div class="shopCart-sidebar__item py-30 px-30">
                            <div class="d-flex justify-center">
                                <a href="{{ route('shop.checkout') }}" class="button -md -purple-1 text-white col-12">Proceed to checkout</a>
                </div>
              </div>

                        <div class="shopCart-sidebar__item py-30 px-30 border-top-light">
                            <h5 class="text-18 fw-500 mb-15">Apply coupon</h5>
                            <form action="{{ route('shop.cart.apply-coupon') }}" method="POST">
                                @csrf
                                <div class="d-flex items-center">
                                    <input type="text" name="coupon_code" placeholder="Coupon code" class="mr-10">
                                    <button type="submit" class="button -purple-1 text-white h-50 px-30">Apply</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

            <div class="row pt-30">
                <div class="col-12">
                    <div class="d-flex justify-center">
                        <a href="{{ route('courses.index') }}" class="button -md -outline-purple-1 text-purple-1">
                            <i class="icon-arrow-left mr-10"></i>
                            Continue Shopping
                        </a>
              </div>
            </div>
          </div>
        </div>
    </section>
</x-app-layout>