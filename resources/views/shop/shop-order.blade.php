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
                            <a href="#">Order Confirmation</a>
                      </div>
                    </div>
                </div>
              </div>
            </div>
    </section>

    <section class="layout-pt-md layout-pb-lg">
                      <div class="container">
            <div class="row justify-center">
                <div class="col-xl-8 col-lg-9 col-md-11">
                    <div class="order-completed-page">
                        <div class="order-completed-page__circle bg-green-1">
                            <i class="icon-check text-40 text-white"></i>
                        </div>

                        <h2 class="text-30 lh-13 fw-700 text-center mt-30">Your order is completed!</h2>
                        <div class="text-center mt-25">
                            Thank you for your purchase! Your order {{ $order->reference_number ?? '#12345' }} has been processed successfully.
                </div>

                        <div class="d-flex justify-center mt-30">
                            <a href="{{ route('dashboard') }}" class="button -md -purple-1 text-white">Go to Dashboard</a>
                        </div>

                        <div class="mt-50">
                            <h5 class="text-20 fw-500 mb-25">Order Details</h5>

                            <div class="py-30 px-30 rounded-8 bg-light-4">
                                <div class="row">
                                    <div class="col-lg-3 col-md-6">
                                        <div>
                                            <div class="text-15 fw-500 text-dark-1">Order Number</div>
                                            <div class="text-15 fw-500 mt-15">{{ $order->reference_number ?? '#12345' }}</div>
                            </div>
                          </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div>
                                            <div class="text-15 fw-500 text-dark-1">Date</div>
                                            <div class="text-15 fw-500 mt-15">{{ $order->created_at ?? now()->format('M d, Y') }}</div>
                          </div>
                        </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div>
                                            <div class="text-15 fw-500 text-dark-1">Total</div>
                                            <div class="text-15 fw-500 mt-15">KES {{ number_format($order->total ?? 45000) }}</div>
                      </div>
                        </div>

                                    <div class="col-lg-3 col-md-6">
                                        <div>
                                            <div class="text-15 fw-500 text-dark-1">Payment Method</div>
                                            <div class="text-15 fw-500 mt-15">{{ $order->payment_method ?? 'Mobile Money' }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                        <div class="mt-30">
                            <h5 class="text-20 fw-500 mb-25">Order Summary</h5>

                            <div class="py-30 px-30 rounded-8 bg-light-4">
                                <div class="row y-gap-30">
                                    <div class="col-12">
                                        <div class="px-30 pr-60 py-25 rounded-8 bg-light-6 md:d-none">
                                            <div class="row justify-between">
                                                <div class="col-md-6">
                                                    <div class="fw-500 text-purple-1">Product</div>
                </div>
                                                <div class="col-md-3">
                                                    <div class="fw-500 text-purple-1">Price</div>
              </div>
                                                <div class="col-md-3">
                                                    <div class="d-flex justify-end">
                                                        <div class="fw-500 text-purple-1">Subtotal</div>
              </div>
            </div>
          </div>
        </div>

                                        <div class="border-bottom-light">
                                            <!-- Order Items -->
                                            @foreach($order->items as $item)
                                            <div class="row y-gap-20 justify-between items-center py-20">
                                                <div class="col-md-6">
                                                    <div class="d-flex items-center">
                                                        <div class="size-90 bg-image rounded-8 js-lazy" data-bg="{{ asset('img/shop/products/placeholder.png') }}"></div>
                                                        <div class="fw-500 text-dark-1 ml-30">{{ $item->course->title }}</div>
                </div>
              </div>

                                                <div class="col-md-3 md:mt-20">
                                                    <div class="">
                                                        <div class="shopCart-products__title d-none md:d-block mb-10">Price</div>
                                                        <p>KES {{ number_format($item->price) }}</p>
                    </div>
                  </div>

                                                <div class="col-md-3 md:mt-20">
                                                    <div class="md:d-none d-flex justify-end">
                                                        <p>KES {{ number_format($item->price) }}</p>
                    </div>
                  </div>
                    </div>
                                            @endforeach
                                            <!-- End Order Items -->
                  </div>

                                        <div class="border-bottom-light py-20">
                                            <div class="row justify-between">
                                                <div class="col-auto">
                                                    <div class="text-15 fw-500">Subtotal</div>
                    </div>
                                                <div class="col-auto">
                                                    <div class="text-15 fw-500">KES {{ number_format($order->subtotal ?? 45000) }}</div>
                  </div>
                </div>
              </div>

                                        @if(isset($order->discount) && $order->discount > 0)
                                        <div class="border-bottom-light py-20">
                                            <div class="row justify-between">
                                                <div class="col-auto">
                                                    <div class="text-15 fw-500">Discount</div>
                  </div>
                                                <div class="col-auto">
                                                    <div class="text-15 fw-500 text-green-1">-KES {{ number_format($order->discount) }}</div>
                  </div>
                </div>
              </div>
                                        @endif

                                        <div class="py-20">
                                            <div class="row justify-between">
              <div class="col-auto">
                                                    <div class="text-15 fw-500">Total</div>
              </div>
              <div class="col-auto">
                                                    <div class="text-15 fw-500">KES {{ number_format($order->total ?? 45000) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
                </div>
              </div>

                        <div class="d-flex justify-center mt-30">
                            <a href="{{ route('courses.index') }}" class="button -md -outline-purple-1 text-purple-1 mr-20">Browse More @lmsterm('Study Materials')</a>
                            <a href="{{ route('dashboard') }}" class="button -md -purple-1 text-white">Go to Dashboard</a>
                </div>
              </div>
            </div>
          </div>
        </div>
    </section>
</x-app-layout>