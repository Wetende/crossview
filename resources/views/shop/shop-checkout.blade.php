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
                            <a href="#">Checkout</a>
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
              <div class="shopCheckout-form">
                        <h2 class="text-20 fw-500">Billing details</h2>

                        <form id="checkout-form" action="{{ route('shop.checkout.process') }}" method="POST" class="contact-form row y-gap-30 pt-30">
                            @csrf
                            <div class="col-lg-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">First name*</label>
                                <input type="text" name="first_name" placeholder="First name" required value="{{ $userInfo['first_name'] ?? '' }}">
                                @error('first_name')
                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                @enderror
                            </div>
                            <div class="col-lg-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Last name*</label>
                                <input type="text" name="last_name" placeholder="Last name" required value="{{ $userInfo['last_name'] ?? '' }}">
                                @error('last_name')
                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                @enderror
                            </div>
                            <div class="col-12">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Company name (optional)</label>
                                <input type="text" name="company_name" placeholder="Company name" value="{{ $userInfo['company_name'] ?? '' }}">
                            </div>
                            <div class="col-12">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Country / Region *</label>
                                <select name="country" required>
                                    <option value="KE" {{ (isset($userInfo['country']) && $userInfo['country'] == 'KE') ? 'selected' : '' }}>Kenya</option>
                                    <option value="UG" {{ (isset($userInfo['country']) && $userInfo['country'] == 'UG') ? 'selected' : '' }}>Uganda</option>
                                    <option value="TZ" {{ (isset($userInfo['country']) && $userInfo['country'] == 'TZ') ? 'selected' : '' }}>Tanzania</option>
                                    <option value="RW" {{ (isset($userInfo['country']) && $userInfo['country'] == 'RW') ? 'selected' : '' }}>Rwanda</option>
                                </select>
                                @error('country')
                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                @enderror
                            </div>
                            <div class="col-12">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Street address *</label>
                                <input type="text" name="address" placeholder="House number and street name" required value="{{ $userInfo['address'] ?? '' }}">
                                @error('address')
                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                @enderror
                            </div>
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Town / City *</label>
                                <input type="text" name="city" placeholder="Town / City" required value="{{ $userInfo['city'] ?? '' }}">
                                @error('city')
                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                @enderror
                            </div>
                            <div class="col-md-6">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Phone *</label>
                                <input type="tel" name="phone" placeholder="Phone" required value="{{ $userInfo['phone'] ?? '' }}">
                                @error('phone')
                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                @enderror
                            </div>
                            <div class="col-12">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Email address *</label>
                                <input type="email" name="email" placeholder="Email address" required value="{{ $userInfo['email'] ?? '' }}">
                                @error('email')
                                    <div class="text-red-1 mt-1">{{ $message }}</div>
                                @enderror
                            </div>
                            <div class="col-12">
                                <label class="text-16 lh-1 fw-500 text-dark-1 mb-10">Order notes (optional)</label>
                                <textarea name="notes" placeholder="Notes about your order, e.g. special notes for delivery." rows="5">{{ $userInfo['notes'] ?? '' }}</textarea>
                            </div>

                            <!-- Hidden total field to pass to the controller -->
                            <input type="hidden" name="total" value="{{ $total ?? 0 }}">
                        </form>
              </div>
            </div>

            <div class="col-lg-4">
                    <div class="shopCheckout-sidebar rounded-8 bg-light-4 py-30 px-30">
                        <h5 class="text-20 fw-500 mb-30">Your order</h5>

                        <div class="shopCheckout-sidebar__item">
                            <div class="d-flex justify-between mb-15">
                                <div class="fw-500">Product</div>
                                <div class="fw-500">Subtotal</div>
                  </div>

                            <!-- Order Items -->
                            @forelse($cartItems as $item)
                            <div class="d-flex justify-between border-bottom-light mb-15 pb-15">
                                <div>{{ $item['title'] }}</div>
                                <div>KES {{ number_format($item['price']) }}</div>
                  </div>
                            @empty
                            <div class="d-flex justify-between border-bottom-light mb-15 pb-15">
                                <div>No items in cart</div>
                                <div>KES 0</div>
                            </div>
                            @endforelse

                            <div class="d-flex justify-between border-bottom-light mb-15 pb-15">
                                <div class="fw-500">Subtotal</div>
                                <div>KES {{ number_format($subtotal ?? 0) }}</div>
                  </div>

                            <div class="d-flex justify-between">
                                <div class="fw-500">Total</div>
                                <div class="fw-500 text-purple-1">KES {{ number_format($total ?? 0) }}</div>
                </div>
                        </div>

                        <div class="shopCheckout-sidebar__item mt-30">
                            <div class="d-inline-block mt-30">
                                <button type="submit" form="checkout-form" class="button -md -purple-1 text-white">Proceed to Payment</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
    </section>
</x-app-layout>