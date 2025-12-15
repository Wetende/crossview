<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\SubscriptionTier;
use App\Models\Payment;
use App\Services\SubscriptionManagerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;

final class SubscriptionController extends Controller
{
    protected SubscriptionManagerService $subscriptionManagerService;

    public function __construct(SubscriptionManagerService $subscriptionManagerService)
    {
        $this->subscriptionManagerService = $subscriptionManagerService;
    }

    /**
     * Display a listing of available subscription tiers to the user (Pricing Page).
     */
    public function index(): View
    {
        $tiers = SubscriptionTier::where('is_active', true)
                                 ->orderBy('level')
                                 ->get();

        return view('subscriptions.index', compact('tiers'));
    }

    /**
     * Show the form for a user to confirm and proceed with subscribing to a specific tier.
     */
    public function showSubscribeForm(SubscriptionTier $subscriptionTier): View|RedirectResponse
    {
        if (!$subscriptionTier->is_active) {
            return redirect()->route('pricing.index')->with('error', 'This subscription tier is currently not active.');
        }

        return view('subscriptions.subscribe_form', compact('subscriptionTier'));
    }

    /**
     * Process the subscription initiation: create a pending payment and redirect to simulation.
     */
    public function processSubscription(Request $request, SubscriptionTier $subscriptionTier): RedirectResponse
    {
        if (!$subscriptionTier->is_active) {
            return redirect()->route('pricing.index')->with('error', 'This subscription tier is currently not active.');
        }

        $user = Auth::user();


        $payment = Payment::create([
            'user_id' => $user->id,
            'amount' => $subscriptionTier->price,
            'currency' => 'UGX',
            'status' => 'pending',
            'payment_gateway' => 'simulated_dpo',
            'gateway_reference_id' => 'SIM-' . strtoupper(Str::random(12)),
            'payable_id' => $subscriptionTier->id,
            'payable_type' => SubscriptionTier::class,
        ]);


        return redirect()->route('subscriptions.simulatedDpoPage', ['payment' => $payment->id]);
    }

    /**
     * Display the simulated DPO payment page.
     */
    public function showSimulatedDpoPage(Payment $payment): View|Response
    {

        if ($payment->user_id !== Auth::id() || $payment->status !== 'pending') {

            abort(403, 'Unauthorized action or payment not pending.');
        }
        return view('subscriptions.simulated_dpo_page', compact('payment'));
    }

    /**
     * Handle the callback from the (simulated) payment gateway.
     */
    public function handlePaymentCallback(Request $request): RedirectResponse
    {
        $paymentId = $request->input('payment_id');
        $status = $request->input('status');
        $transactionId = $request->input('transaction_id');

        $payment = Payment::find($paymentId);

        if (!$payment) {
            return redirect()->route('pricing.index')->with('error', 'Invalid payment details.');
        }

        $user = Auth::user();
        if ($payment->user_id !== $user->id || $payment->status !== 'pending') {
            return redirect()->route('pricing.index')->with('error', 'Unauthorized action or payment not processable.');
        }

        if ($status === 'success') {
            $payment->status = 'completed';
            $payment->gateway_reference_id = $transactionId;
            $payment->paid_at = now();
            $payment->save();


            if ($payment->payable_type === SubscriptionTier::class && $payment->payable instanceof SubscriptionTier) {
                $this->subscriptionManagerService->activateSubscription($user, $payment->payable, $payment);
            } else {

                Log::error("Payment {$payment->id} callback success, but payable is not a SubscriptionTier.", [
                    'payable_id' => $payment->payable_id,
                    'payable_type' => $payment->payable_type
                ]);
                return redirect()->route('subscriptions.paymentStatus', ['status' => 'error', 'payment_id' => $payment->id])
                                 ->with('error', 'There was an issue processing your subscription. Please contact support.');
            }

            return redirect()->route('subscriptions.paymentStatus', ['status' => 'success', 'payment_id' => $payment->id]);
        } else {
            $payment->status = 'failed';
            $payment->gateway_reference_id = $transactionId;
            $payment->save();
            return redirect()->route('subscriptions.paymentStatus', ['status' => 'failure', 'payment_id' => $payment->id]);
        }
    }

    /**
     * Display payment status to the user.
     */
    public function showPaymentStatus(Request $request): View
    {
        $status = $request->query('status');
        $paymentId = $request->query('payment_id');
        $payment = null;

        if ($paymentId) {
            $payment = Payment::where('id', $paymentId)->where('user_id', Auth::id())->first();
        }

        return view('subscriptions.payment_status', compact('status', 'payment'));
    }


}
