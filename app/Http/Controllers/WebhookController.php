<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\User;
use App\Services\DpoService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

final class WebhookController extends Controller
{
    public function __construct(
        private readonly DpoService $dpoService
    ) {
    }

    /**
     * Handle DPO payment webhook notifications
     *
     */
    public function handleDpoPayment(Request $request): Response
    {
        Log::channel('payment')->info('DPO Webhook received', [
            'payload' => $request->all(),
        ]);

        
        if (!$request->has('TransactionToken') || !$request->has('TransactionRef')) {
            Log::channel('payment')->error('Invalid DPO webhook payload', [
                'payload' => $request->all(),
            ]);
            return response('Invalid payload', 400);
        }

        $transactionToken = $request->input('TransactionToken');
        $transactionRef = $request->input('TransactionRef');

        try {
            
            $verificationResult = $this->dpoService->verifyToken($transactionToken);

            
            if (!$verificationResult['success']) {
                Log::channel('payment')->error('DPO payment verification failed', [
                    'transactionRef' => $transactionRef,
                    'result' => $verificationResult,
                ]);
                return response('Payment verification failed', 400);
            }

            
            $order = Order::where('reference_number', $transactionRef)->first();
            if (!$order) {
                Log::channel('payment')->error('Order not found for reference', [
                    'transactionRef' => $transactionRef,
                ]);
                return response('Order not found', 404);
            }

            
            if ($verificationResult['status'] === 'success') {
                
                $order->update([
                    'status' => 'paid',
                    'payment_status' => 'completed',
                    'payment_details' => json_encode($verificationResult)
                ]);

                
                $this->createEnrollmentsForOrder($order);

                Log::channel('payment')->info('Payment completed via webhook', [
                    'orderId' => $order->id,
                    'transactionRef' => $transactionRef,
                ]);
            } else {
                
                $order->update([
                    'status' => 'failed',
                    'payment_status' => 'failed',
                    'payment_details' => json_encode($verificationResult)
                ]);

                Log::channel('payment')->info('Payment failed via webhook', [
                    'orderId' => $order->id,
                    'transactionRef' => $transactionRef,
                    'status' => $verificationResult['status']
                ]);
            }

            return response('Webhook processed successfully', 200);
        } catch (\Exception $e) {
            Log::channel('payment')->error('Error processing DPO webhook', [
                'transactionRef' => $transactionRef,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response('Internal server error', 500);
        }
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
}
