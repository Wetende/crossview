<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Http\Controllers\Admin\CourseController as AdminCourseController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\SubjectController;
use App\Http\Controllers\Admin\GradeLevelController;
use App\Http\Controllers\Admin\SubjectTopicController;
use App\Http\Controllers\Public\CourseController as PublicCourseController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\CoursePurchaseController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Session;
use App\Http\Controllers\WebhookController;

Route::get('/', function () {
    return view('index');
})->name('home');


Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        $user = Auth::user();
        if ($user->hasRole('admin')) {
            return redirect()->route('admin.overview');
        } elseif ($user->hasRole('teacher')) {
            return redirect()->route('teacher.overview');
        } elseif ($user->hasRole('student')) {
            return redirect()->route('student.overview');
        } elseif ($user->hasRole('parent')) {
            return redirect()->route('parent.overview');
        } else {

            return view('dashboard');
        }
    })->name('dashboard');
});


Route::get('/study-materials', [PublicCourseController::class, 'index'])->name('courses.index');
Route::get('/study-materials/list', [PublicCourseController::class, 'indexView'])->name('courses.list');
Route::get('/study-materials/{course}', [PublicCourseController::class, 'showView'])->name('courses.show');


Route::middleware('auth')->group(function () {
    Route::post('/study-materials/{course:slug}/reviews', [PublicCourseController::class, 'storeReview'])->name('courses.reviews.store');
});


Route::prefix('api')->group(function () {
    Route::get('/study-materials', [PublicCourseController::class, 'index'])->name('api.courses.index');
    Route::get('/study-materials/{course:slug}', [PublicCourseController::class, 'show'])->name('api.courses.show');
});

Route::get('/about', function () {
    return view('about');
})->name('about');

Route::get('/events', function () {
    return view('events');
});

Route::get('/blogs', function () {
    return view('blogs-list');
});

Route::get('/instructors', function () {
    return view('instructors-list');
});


Route::get('/instructors/id', function () {
    return view('instructors-single');
});

Route::get('/contact', function () {
    return view('contact');
});


Route::get('/login', function () {
    return view('auth.login');
});

Route::get('/register', function () {
    return view('auth.login');
});


Route::middleware([
    'auth',
    'verified',
    'role:admin'
])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('courses', AdminCourseController::class);

    Route::put('courses/{course}/status', [AdminCourseController::class, 'updateStatus'])->name('courses.status.update');

    Route::put('courses/{course}/featured', [AdminCourseController::class, 'toggleFeatured'])->name('courses.featured.toggle');
    Route::put('courses/{course}/recommended', [AdminCourseController::class, 'toggleRecommended'])->name('courses.recommended.toggle');

    Route::get('courses/trash', [AdminCourseController::class, 'trash'])->name('courses.trash');
    Route::delete('courses/{course}/force-delete', [AdminCourseController::class, 'forceDelete'])->name('courses.force-delete');
    Route::put('courses/{courseId}/restore', [AdminCourseController::class, 'restore'])->name('courses.restore');

    Route::get('courses/{course}/curriculum', [AdminCourseController::class, 'showCurriculum'])->name('courses.curriculum');

    Route::resource('categories', CategoryController::class);
    Route::resource('subjects', SubjectController::class);
    Route::resource('grade-levels', GradeLevelController::class);
    Route::resource('subject-topics', SubjectTopicController::class);

    
    Route::post('categories/reorder', [CategoryController::class, 'reorder'])->name('categories.reorder');
    Route::post('subjects/reorder', [SubjectController::class, 'reorder'])->name('subjects.reorder');
    Route::post('grade-levels/reorder', [GradeLevelController::class, 'reorder'])->name('grade-levels.reorder');
    Route::post('subject-topics/reorder', [SubjectTopicController::class, 'reorder'])->name('subject-topics.reorder');
});


Route::middleware('auth')->group(function () {
    Route::post('/study-materials/{course:slug}/enroll/subscription', [EnrollmentController::class, 'enrollViaSubscription'])->name('courses.enroll.subscription');
    Route::post('/study-materials/{course:slug}/enroll/free', [EnrollmentController::class, 'enrollInFreeCourse'])->name('courses.enroll.free');
    Route::post('/study-materials/{course:slug}/purchase', [CoursePurchaseController::class, 'initiatePurchase'])->name('courses.purchase.initiate');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});



Route::post('/payments/webhook/your-gateway', [CoursePurchaseController::class, 'handleGatewayWebhook'])->name('payments.webhook.gateway');


Route::get('/pricing', function () {
    return view('pricing');
})->name('pricing.index');


Route::middleware('auth')->prefix('subscriptions')->name('subscriptions.')->group(function () {
    Route::get('/', [App\Http\Controllers\SubscriptionController::class, 'index'])->name('index');
    Route::get('/tier/{subscriptionTier}', [App\Http\Controllers\SubscriptionController::class, 'showSubscribeForm'])->name('subscribe');
    Route::post('/tier/{subscriptionTier}', [App\Http\Controllers\SubscriptionController::class, 'processSubscription'])->name('process');
    Route::get('/payment/{payment}/simulation', [App\Http\Controllers\SubscriptionController::class, 'showSimulatedDpoPage'])->name('simulatedDpoPage');
    Route::post('/payment/callback', [App\Http\Controllers\SubscriptionController::class, 'handlePaymentCallback'])->name('paymentCallback');
    Route::get('/payment/status', [App\Http\Controllers\SubscriptionController::class, 'showPaymentStatus'])->name('paymentStatus');
});


Route::prefix('shop')->name('shop.')->group(function () {
    Route::get('/', [App\Http\Controllers\ShopController::class, 'index'])->name('index');
    Route::get('/product/{slug}', [App\Http\Controllers\ShopController::class, 'show'])->name('product');
    Route::get('/cart', [App\Http\Controllers\ShopController::class, 'cart'])->name('cart');
    Route::get('/checkout', [App\Http\Controllers\ShopController::class, 'checkout'])->name('checkout');

    
    Route::post('/cart/add', [App\Http\Controllers\ShopController::class, 'addToCart'])->name('cart.add');
    Route::delete('/cart/remove/{id}', [App\Http\Controllers\ShopController::class, 'removeFromCart'])->name('cart.remove');
    Route::post('/cart/clear', [App\Http\Controllers\ShopController::class, 'clearCart'])->name('cart.clear');
    Route::post('/cart/update', [App\Http\Controllers\ShopController::class, 'updateCart'])->name('cart.update');
    Route::post('/cart/apply-coupon', [App\Http\Controllers\ShopController::class, 'applyCoupon'])->name('cart.apply-coupon');

    
    Route::get('/filter', [App\Http\Controllers\ShopController::class, 'filter'])->name('filter');
    Route::get('/sort', [App\Http\Controllers\ShopController::class, 'sort'])->name('sort');

    
    Route::post('/checkout/process', [App\Http\Controllers\ShopController::class, 'processCheckout'])->name('checkout.process');

    
    Route::get('/payment/callback', [App\Http\Controllers\ShopController::class, 'handlePaymentCallback'])->name('payment.callback');
    Route::get('/payment/cancel', [App\Http\Controllers\ShopController::class, 'handlePaymentCancel'])->name('payment.cancel');
    Route::get('/order/{referenceNumber}', [App\Http\Controllers\ShopController::class, 'orderComplete'])->name('order.complete');
});


Route::post('/webhooks/dpo-payment', [WebhookController::class, 'handleDpoPayment'])
    ->name('webhooks.dpo-payment')
    ->middleware('api');





Route::get('/stop-impersonating', function () {
    if (Session::has('admin_id')) {

        $adminId = Session::get('admin_id');

        
        Auth::logout();

        
        Auth::loginUsingId($adminId);

        
        Session::forget('admin_id');
        Session::forget('impersonating');

        return redirect()->route('admin.users.index')->with('success', 'Returned to admin account.');
    }

    return redirect()->route('dashboard');
})->middleware('auth')->name('stop-impersonating');



require __DIR__ . '/auth.php';
require __DIR__ . '/admin.php';
require __DIR__ . '/teacher.php';
require __DIR__ . '/student.php';
