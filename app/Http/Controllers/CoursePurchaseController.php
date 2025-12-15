<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Payment;
use App\Models\CoursePurchase;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CoursePurchaseController extends Controller
{
    /**
     * Initiate the purchase process for a course.
     *
     */
    public function initiatePurchase(Request $request, Course $course): RedirectResponse|JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();


        if (!$course->is_published) {
            Log::warning("Attempt to purchase unpublished course {$course->id} by user {$user->id}");
            return $this->purchaseErrorResponse($course, 'This course is not currently available for purchase.');
        }


        if (!$course->canBePurchased()) {
            Log::warning("Attempt to purchase non-purchasable course {$course->id} (pricing_type: {$course->pricing_type}) by user {$user->id}");
            return $this->purchaseErrorResponse($course, 'This course cannot be purchased directly. It might be free or subscription-only.');
        }


        if ($course->getEffectivePrice() <= 0) {
            Log::warning("Attempt to purchase course {$course->id} with invalid price ({$course->getEffectivePrice()}) by user {$user->id}");
            return $this->purchaseErrorResponse($course, 'This course does not have a valid price set for purchase.');
        }

        $isEnrolled = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->exists();

        if ($isEnrolled) {
            return $this->purchaseInfoResponse($course, 'You are already enrolled in this ' . get_lms_term('study material') . '.');
        }


        $existingPayment = Payment::where('user_id', $user->id)
            ->where('payable_id', $course->id)
            ->where('payable_type', Course::class)
            ->whereIn('status', ['pending', 'completed'])
            ->exists();

        if ($existingPayment) {
            $pendingPayment = Payment::where('user_id', $user->id)
                ->where('payable_id', $course->id)
                ->where('payable_type', Course::class)
                ->where('status', 'pending')->first();
            if ($pendingPayment) {
                return $this->purchaseInfoResponse($course, 'You already have a pending payment for this ' . get_lms_term('study material') . '. Please complete or cancel it.');
            }
        }


        try {
            return DB::transaction(function () use ($user, $course) {
                $payment = Payment::create([
                    'user_id' => $user->id,
                    'amount' => $course->getEffectivePrice(),
                    'currency' => config('app.currency', 'UGX'),
                    'status' => 'pending',
                    'payment_gateway' => 'simulated',
                    'gateway_reference_id' => 'SIM-' . Str::uuid()->toString(),
                    'payable_type' => Course::class,
                    'payable_id' => $course->id,
                ]);


                $platformFeePercentage = config('payouts.platform_fee_percentage', 0.3);
                $platformFee = $payment->amount * $platformFeePercentage;
                $teacherPayout = $payment->amount - $platformFee;

                CoursePurchase::create([
                    'user_id' => $user->id,
                    'course_id' => $course->id,
                    'payment_id' => $payment->id,
                    'platform_fee' => $platformFee,
                    'teacher_payout' => $teacherPayout,
                ]);

                Log::info("Payment {$payment->id} initiated for " . get_lms_term('study material') . " {$course->id} by user {$user->id}. Amount: {$payment->amount} {$payment->currency}.");

                return response()->json([
                    'message' => 'Purchase initiated successfully. Please complete the payment.',
                    'payment_id' => $payment->id,
                    'course_id' => $course->id,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'course_title' => $course->title,
                    'effective_price' => $course->getEffectivePrice(),
                    'is_sale_active' => $course->isSaleActive(),
                ], 201);
            });
        } catch (\Exception $e) {
            Log::error("Error initiating purchase for " . get_lms_term('study material') . " {$course->id} by user {$user->id}: " . $e->getMessage());
            return $this->purchaseErrorResponse($course, 'Could not initiate purchase due to an unexpected error. Please try again.', 500);
        }
    }

    private function purchaseErrorResponse(Course $course, string $message, int $statusCode = 422): RedirectResponse|JsonResponse
    {

        if (request()->expectsJson()) {
            return response()->json(['message' => $message, 'course_id' => $course->id], $statusCode);
        }
        return redirect()->route('courses.show', $course->slug)->with('error', $message);
    }

    private function purchaseInfoResponse(Course $course, string $message): RedirectResponse|JsonResponse
    {
        if (request()->expectsJson()) {
            return response()->json(['message' => $message, 'course_id' => $course->id], 200);
        }
        return redirect()->route('courses.show', $course->slug)->with('info', $message);
    }

    /**
     * Handle incoming webhook notifications from the payment gateway.
     *
     */
    public function handleGatewayWebhook(Request $request): JsonResponse
    {
        Log::info('Received payment gateway webhook.', $request->all());











        $payload = $request->all();
        $paymentId = $payload['payment_id'] ?? null;
        $eventType = $payload['event_type'] ?? null;
        $simulatedGatewayReference = $payload['gateway_reference_id'] ?? null;

        if (!$paymentId || !$eventType) {
            Log::info("Webhook received with missing payment_id or event_type.", $payload);
            return response()->json(['error' => 'Missing payment_id or event_type'], 400);
        }

        $payment = Payment::find($paymentId);

        if (!$payment) {
            Log::warning("Webhook received for non-existent payment_id: {$paymentId}", $payload);
            return response()->json(['error' => 'Payment not found'], 404);
        }


        if (in_array($payment->status, ['completed', 'failed'], true)) {
            Log::info("Webhook for already processed payment_id: {$paymentId}, status: {$payment->status}");
            return response()->json(['message' => 'Payment already processed']);
        }

        DB::beginTransaction();
        try {
            switch ($eventType) {
                case 'payment.succeeded':
                    $payment->status = 'completed';
                    $payment->paid_at = now();
                    if ($simulatedGatewayReference) {
                        $payment->gateway_reference_id = $simulatedGatewayReference;
                    }
                    $payment->save();

                    $coursePurchase = CoursePurchase::where('payment_id', $payment->id)->first();

                    if (!$coursePurchase) {
                        Log::error("Critical: Payment {$payment->id} completed but no associated " . get_lms_term('Study Material') . " purchase record found.");
                        DB::rollBack();

                        return response()->json(['error' => 'Internal server error: ' . get_lms_term('Study Material') . ' purchase record not found.'], 500);
                    }


                    Enrollment::create([
                        'user_id' => $payment->user_id,
                        'course_id' => $coursePurchase->course_id,
                        'enrolled_at' => now(),
                        'access_type' => 'purchase',
                        'status' => 'active',
                        'course_purchase_id' => $coursePurchase->id,
                    ]);

                    Log::info("Payment {$payment->id} successfully processed (completed). User {$payment->user_id} enrolled in " . get_lms_term('study material') . " {$coursePurchase->course_id}.");



                    break;

                case 'payment.failed':
                    $payment->status = 'failed';
                    if ($simulatedGatewayReference) {
                        $payment->gateway_reference_id = $simulatedGatewayReference;
                    }
                    $payment->save();
                    Log::info("Payment {$payment->id} processed (failed).");


                    break;

                default:
                    Log::info("Webhook received for unhandled event_type: {$eventType} for payment_id: {$paymentId}");



                    DB::rollBack();
                    return response()->json(['message' => 'Unhandled event type'], 200);
            }

            DB::commit();
            return response()->json(['message' => 'Webhook processed successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error processing webhook for payment_id {$paymentId}: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            return response()->json(['error' => 'Internal server error during webhook processing'], 500);
        }
    }
}
