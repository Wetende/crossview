<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\Category;
use App\Models\Order;
use App\Models\Enrollment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Services\DpoService;
use App\Models\User;
use App\Http\Requests\CheckoutRequest;

class ShopController extends Controller
{
    /**
     * Display the shop listing page.
     */
    public function index(Request $request)
    {

        $categories = Category::withCount('courses')->get();


        $query = Course::with(['teacher', 'category'])
            ->where('is_published', true);


        if ($request->has('category')) {
            $categorySlug = $request->input('category');
            $query->whereHas('category', function ($q) use ($categorySlug) {
                $q->where('slug', $categorySlug);
            });
        }


        $courses = $query->orderBy('created_at', 'desc')
            ->paginate(9);

        return view('shop.shop-list', compact('courses', 'categories'));
    }

    /**
     * Display the single product page.
     */
    public function show($slug)
    {
        $course = Course::with(['teacher', 'category', 'reviews'])
            ->where('slug', $slug)
            ->firstOrFail();

        return view('shop.shop-single', compact('course'));
    }

    /**
     * Display the shopping cart.
     */
    public function cart()
    {

        $cartItems = session('cart', []);


        $subtotal = $this->calculateCartSubtotal($cartItems);
        $total = $subtotal;

        return view('shop.shop-cart', compact('cartItems', 'subtotal', 'total'));
    }

    /**
     * Add a course to cart.
     */
    public function addToCart(Request $request)
    {
        $courseId = $request->input('course_id');
        $course = Course::findOrFail($courseId);

        $cart = session()->get('cart', []);


        if (isset($cart[$courseId])) {

            return redirect()->route('shop.cart')->with('info', 'Item already in cart');
        } else {

            $cart[$courseId] = [
                'id' => $course->id,
                'title' => $course->title,
                'price' => $course->price,
                'image' => $course->thumbnail_path ?? 'img/shop/products/placeholder.png',
                'slug' => $course->slug,
            ];

            session()->put('cart', $cart);
        }


        if ($request->has('buy_now')) {
            return redirect()->route('shop.checkout')->with('success', get_lms_term('Study Material') . ' added to cart!');
        }

        return redirect()->route('shop.cart')->with('success', get_lms_term('Study Material') . ' added to cart successfully!');
    }

    /**
     * Remove a course from cart.
     */
    public function removeFromCart($id)
    {
        $cart = session()->get('cart', []);

        if (isset($cart[$id])) {
            unset($cart[$id]);
            session()->put('cart', $cart);
        }

        return redirect()->route('shop.cart')->with('success', get_lms_term('Study Material') . ' removed from cart successfully!');
    }

    /**
     * Clear the entire cart.
     */
    public function clearCart()
    {
        session()->forget('cart');
        return redirect()->route('shop.cart')->with('success', 'Cart cleared successfully!');
    }

    /**
     * Update cart quantities.
     */
    public function updateCart(Request $request)
    {

        return redirect()->route('shop.cart')->with('success', 'Cart updated successfully!');
    }

    /**
     * Display the checkout page.
     */
    public function checkout()
    {

        if (!Auth::check()) {
            return redirect()->route('login')
                ->with('warning', 'Please log in to complete your purchase.')
                ->with('redirect', route('shop.checkout'));
        }


        $cartItems = session('cart', []);


        if (empty($cartItems)) {
            return redirect()->route('shop.cart')->with('info', 'Your cart is empty');
        }


        $subtotal = $this->calculateCartSubtotal($cartItems);
        $total = $subtotal;


        $user = Auth::user();
        $userInfo = [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone_number,
        ];

        return view('shop.shop-checkout', compact('cartItems', 'subtotal', 'total', 'userInfo'));
    }

    /**
     * Process checkout and create order
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function processCheckout(CheckoutRequest $request)
    {

        if (!Auth::check()) {
            return redirect()->route('login')
                ->with('warning', 'Please log in to complete your purchase.')
                ->with('redirect', route('shop.checkout'));
        }


        $cart = $this->getCartItems();
        if (empty($cart['items'])) {
            return redirect()->route('shop.cart')->with('error', 'Your cart is empty. Please add items before checking out.');
        }


        $userId = Auth::id();
        $referenceNumber = 'ORD-' . time() . '-' . $userId;

        try {

            DB::beginTransaction();


            $order = Order::create([
                'reference_number' => $referenceNumber,
                'user_id' => $userId,
                'subtotal' => $cart['subtotal'],
                'total' => $cart['total'],
                'total_amount' => $cart['total'],
                'status' => 'pending',
                'payment_status' => 'pending',
                'payment_method' => 'dpo',
                'items' => json_encode($cart['items']),
                'billing_first_name' => $request->first_name,
                'billing_last_name' => $request->last_name,
                'billing_company' => $request->company_name,
                'billing_email' => $request->email,
                'billing_phone' => $request->phone,
                'billing_address' => $request->address,
                'billing_city' => $request->city,
                'billing_country' => $request->country,
                'notes' => $request->notes,
            ]);


            $dpoService = app(DpoService::class);

            $paymentResponse = $dpoService->createToken([
                'reference' => $referenceNumber,
                'amount' => $cart['total'],
                'currency' => config('services.dpo.currency', 'UGX'),
                'email' => $request->email,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'phone' => $request->phone,
                'address' => $request->address,
                'city' => $request->city,
                'state' => $request->state ?? '',
                'postal_code' => $request->postal_code ?? '',
                'country' => $request->country,
                'description' => 'Order Payment #' . $referenceNumber,
                'redirect_url' => route('shop.payment.callback', ['ref' => $referenceNumber]),
                'back_url' => route('shop.payment.cancel', ['ref' => $referenceNumber]),
            ]);


            if (!$paymentResponse['success']) {
                throw new \Exception('Failed to initialize payment: ' . ($paymentResponse['error_message'] ?? 'Unknown error'));
            }


            $order->update([
                'payment_id' => $paymentResponse['token'] ?? null,
                'payment_status' => 'pending',
                'notes' => $order->notes . "\nPayment Details: " . json_encode($paymentResponse),
            ]);


            DB::commit();


            session()->forget('cart');


            Log::channel('payment')->info('Redirecting to DPO payment gateway', [
                'order_id' => $order->id,
                'reference_number' => $referenceNumber,
                'redirect_url' => $paymentResponse['redirect_url'],
            ]);

            return redirect()->away($paymentResponse['redirect_url']);

        } catch (\Exception $e) {

            DB::rollBack();

            Log::error('Checkout process error', [
                'error' => $e->getMessage(),
                'user_id' => $userId,
                'cart' => $cart,
            ]);

            return redirect()->back()->with('error', 'An error occurred during checkout: ' . $e->getMessage());
        }
    }

    /**
     * Handle payment callback from DPO
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function handlePaymentCallback(Request $request)
    {
        $referenceNumber = $request->query('ref');
        $transactionToken = $request->query('TransID');

        if (empty($referenceNumber)) {
            return redirect()->route('shop.cart')->with('error', 'Invalid payment reference.');
        }

        try {

            $order = Order::where('reference_number', $referenceNumber)->first();

            if (!$order) {
                Log::channel('payment')->error('Order not found in payment callback', [
                    'reference' => $referenceNumber,
                ]);
                return redirect()->route('shop.index')->with('error', 'Order not found.');
            }


            if ($order->payment_status === 'completed') {
                return redirect()->route('shop.order.complete', ['referenceNumber' => $order->reference_number])
                    ->with('success', 'Your payment was successful.');
            }


            $dpoService = app(DpoService::class);
            $verificationResult = $dpoService->verifyToken($transactionToken);

            if ($verificationResult['success'] && $verificationResult['status'] === 'success') {

                $order->update([
                    'status' => 'paid',
                    'payment_status' => 'completed',
                    'payment_details' => json_encode($verificationResult),
                ]);


                $this->createEnrollmentsForOrder($order);

                return redirect()->route('shop.order.complete', ['referenceNumber' => $order->reference_number])
                    ->with('success', 'Your payment was successful. Thank you for your purchase!');
            } elseif ($verificationResult['success'] && $verificationResult['status'] === 'pending') {

                $order->update([
                    'payment_details' => json_encode($verificationResult),
                ]);

                return redirect()->route('shop.order.complete', ['referenceNumber' => $order->reference_number])
                    ->with('info', 'Your payment is being processed. We will update you once it is completed.');
            } else {

                $order->update([
                    'status' => 'failed',
                    'payment_status' => 'failed',
                    'payment_details' => json_encode($verificationResult),
                ]);

                return redirect()->route('shop.checkout')
                    ->with('error', 'Payment failed: ' . ($verificationResult['error_message'] ?? 'Unknown error'));
            }
        } catch (\Exception $e) {
            Log::channel('payment')->error('Payment callback error', [
                'error' => $e->getMessage(),
                'reference' => $referenceNumber,
            ]);

            return redirect()->route('shop.checkout')
                ->with('error', 'An error occurred while processing your payment.');
        }
    }

    /**
     * Handle payment cancellation
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function handlePaymentCancel(Request $request)
    {
        $referenceNumber = $request->query('ref');

        if (empty($referenceNumber)) {
            return redirect()->route('shop.cart')->with('error', 'Invalid payment reference.');
        }

        try {

            $order = Order::where('reference_number', $referenceNumber)->first();

            if (!$order) {
                return redirect()->route('shop.cart')->with('error', 'Order not found.');
            }


            $order->update([
                'status' => 'cancelled',
                'payment_status' => 'cancelled',
            ]);


            if ($order->items) {
                $items = json_decode($order->items, true) ?? [];
                foreach ($items as $item) {
                    if ($item['type'] === 'course') {
                        $course = Course::find($item['id']);
                        if ($course) {
                            $this->addToCart($course->id, 'course');
                        }
                    }
                }
            }

            return redirect()->route('shop.cart')
                ->with('info', 'Your payment was cancelled. The items have been restored to your cart.');

        } catch (\Exception $e) {
            Log::channel('payment')->error('Payment cancellation error', [
                'error' => $e->getMessage(),
                'reference' => $referenceNumber,
            ]);

            return redirect()->route('shop.cart')
                ->with('error', 'An error occurred while cancelling your payment.');
        }
    }

    /**
     * Show order complete page
     *
     * @return \Illuminate\View\View
     */
    public function orderComplete(string $referenceNumber)
    {
        $order = Order::where('reference_number', $referenceNumber)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $items = json_decode($order->items, true) ?? [];
        $courseIds = collect($items)
            ->filter(fn ($item) => $item['type'] === 'course')
            ->pluck('id')
            ->toArray();

        $courses = Course::whereIn('id', $courseIds)->get();

        return view('shop.order-complete', [
            'order' => $order,
            'courses' => $courses,
        ]);
    }

    /**
     * Create enrollments for all courses in an order
     *
     */
    private function createEnrollmentsForOrder(Order $order): void
    {
        $items = json_decode($order->items, true) ?? [];
        $user = User::find($order->user_id);

        if (!$user) {
            Log::channel('payment')->error('User not found for order', [
                'orderId' => $order->id,
                'userId' => $order->user_id,
            ]);
            return;
        }

        foreach ($items as $item) {
            if ($item['type'] === 'course') {
                $course = Course::find($item['id']);

                if (!$course) {
                    Log::channel('payment')->error('Course not found', [
                        'courseId' => $item['id'],
                        'orderId' => $order->id,
                    ]);
                    continue;
                }


                $existingEnrollment = Enrollment::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->first();

                if (!$existingEnrollment) {

                    Enrollment::create([
                        'user_id' => $user->id,
                        'course_id' => $course->id,
                        'order_id' => $order->id,
                        'status' => 'active',
                        'enrollment_date' => now(),
                        'expiry_date' => $course->has_expiry ? now()->addDays($course->expiry_days) : null,
                    ]);

                    Log::channel('payment')->info('Enrollment created for course', [
                        'userId' => $user->id,
                        'courseId' => $course->id,
                        'orderId' => $order->id,
                    ]);
                } else {

                    $existingEnrollment->update([
                        'status' => 'active',
                        'order_id' => $order->id,
                        'expiry_date' => $course->has_expiry ? now()->addDays($course->expiry_days) : $existingEnrollment->expiry_date,
                    ]);

                    Log::channel('payment')->info('Existing enrollment updated for course', [
                        'enrollmentId' => $existingEnrollment->id,
                        'userId' => $user->id,
                        'courseId' => $course->id,
                        'orderId' => $order->id,
                    ]);
                }
            }
        }
    }

    /**
     * Apply coupon code.
     */
    public function applyCoupon(Request $request)
    {
        $couponCode = $request->input('coupon_code');




        return redirect()->route('shop.cart')->with('success', 'Coupon applied successfully!');
    }

    /**
     * Filter shop products.
     */
    public function filter(Request $request)
    {
        $priceMin = $request->input('price_min', 0);
        $priceMax = $request->input('price_max', 1000000);

        $courses = Course::with(['teacher', 'category'])
            ->where('is_published', true)
            ->whereBetween('price', [$priceMin, $priceMax])
            ->paginate(9);

        $categories = Category::withCount('courses')->get();

        return view('shop.shop-list', compact('courses', 'categories'));
    }

    /**
     * Sort shop products.
     */
    public function sort(Request $request)
    {
        $sortOption = $request->input('sort', 'popularity');

        $query = Course::with(['teacher', 'category'])
            ->where('is_published', true);

        switch ($sortOption) {
            case 'price-low-high':
                $query->orderBy('price', 'asc');
                break;
            case 'price-high-low':
                $query->orderBy('price', 'desc');
                break;
            case 'newest':
                $query->orderBy('created_at', 'desc');
                break;
            case 'popularity':
            default:
                $query->orderBy('total_enrollments', 'desc');
                break;
        }

        $courses = $query->paginate(9);
        $categories = Category::withCount('courses')->get();

        return view('shop.shop-list', compact('courses', 'categories'));
    }

    /**
     * Calculate cart subtotal from current database prices
     */
    private function calculateCartSubtotal(array $cartItems): float
    {
        $subtotal = 0;

        foreach ($cartItems as $item) {

            if (isset($item['id'])) {
                $course = Course::find($item['id']);
                if ($course) {
                    $subtotal += $course->price;
                } else {

                    $subtotal += $item['price'];
                }
            } else {

                $subtotal += $item['price'];
            }
        }

        return $subtotal;
    }

    /**
     * Get cart items with totals for order processing
     *
     */
    private function getCartItems(): array
    {
        $cartItems = session('cart', []);
        $items = [];
        $total = 0;

        foreach ($cartItems as $id => $item) {

            $items[] = [
                'id' => $id,
                'type' => 'course',
                'title' => $item['title'],
                'price' => $item['price'],
            ];


            $total += $item['price'];
        }

        return [
            'items' => $items,
            'total' => $total,
            'subtotal' => $total,
        ];
    }
}
