<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CoursePurchase;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\TeacherPayout;
use App\Models\TeacherPaymentDetail;
use App\Models\User;
use App\Models\UserSubscription;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

final class TeacherCompensationService
{
    /**
     * Calculate payouts for all eligible teachers for a specific period.
     *
     */
    public function calculatePayoutsForAllTeachers(Carbon $periodStart, Carbon $periodEnd): Collection
    {
        $teachers = User::whereHas('roles', function ($query) {
            $query->where('name', 'teacher');
        })->get();

        $payouts = collect();

        foreach ($teachers as $teacher) {
            $payout = $this->calculatePayoutForTeacher($teacher, $periodStart, $periodEnd);
            if ($payout) {
                $payouts->push($payout);
            }
        }

        return $payouts;
    }

    /**
     * Calculate payout for a specific teacher for a specific period.
     *
     */
    public function calculatePayoutForTeacher(User $teacher, Carbon $periodStart, Carbon $periodEnd): ?TeacherPayout
    {
        
        if (!$this->hasVerifiedPaymentDetails($teacher)) {
            Log::info("Teacher ID {$teacher->id} has no verified payment details. Skipping payout calculation.");
            return null;
        }

        
        $directPurchaseAmount = $this->calculateDirectPurchaseRevenue($teacher, $periodStart, $periodEnd);

        
        $subscriptionAmount = $this->calculateSubscriptionRevenue($teacher, $periodStart, $periodEnd);

        
        $totalAmount = $directPurchaseAmount + $subscriptionAmount;

        
        if ($totalAmount <= 0) {
            Log::info("Teacher ID {$teacher->id} has no revenue for the period. Skipping payout creation.");
            return null;
        }

        
        return TeacherPayout::create([
            'user_id' => $teacher->id,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'amount' => $totalAmount,
            'status' => 'pending',
            'notes' => "Direct purchases: $directPurchaseAmount, Subscriptions: $subscriptionAmount",
        ]);
    }

    /**
     * Check if the teacher has verified payment details.
     *
     */
    private function hasVerifiedPaymentDetails(User $teacher): bool
    {
        return TeacherPaymentDetail::where('user_id', $teacher->id)
            ->where('status', 'verified')
            ->exists();
    }

    /**
     * Calculate revenue from direct course purchases.
     *
     */
    private function calculateDirectPurchaseRevenue(User $teacher, Carbon $periodStart, Carbon $periodEnd): float
    {
        $teacherPercentageShare = $this->getTeacherPercentageShare();

        $purchases = CoursePurchase::whereHas('course', function ($query) use ($teacher) {
            $query->where('user_id', $teacher->id);
        })
        ->whereBetween('created_at', [$periodStart, $periodEnd])
        ->where('status', 'completed')
        ->get();

        $total = 0;

        foreach ($purchases as $purchase) {
            $total += $purchase->amount * $teacherPercentageShare;
        }

        return $total;
    }

    /**
     * Calculate revenue from subscription-based enrollments (pro-rata model).
     *
     */
    private function calculateSubscriptionRevenue(User $teacher, Carbon $periodStart, Carbon $periodEnd): float
    {
        $teacherPercentageShare = $this->getTeacherPercentageShare();
        $platformFeePercentage = $this->getPlatformFeePercentage();
        $total = 0;


        $enrollments = Enrollment::where('access_type', 'subscription')
            ->where('status', 'active')
            ->whereHas('course', function ($query) use ($teacher) {
                $query->where('user_id', $teacher->id);
            })
            ->whereHas('user.subscriptions', function ($query) use ($periodStart, $periodEnd) {
                $query->where('status', 'active')
                    ->where(function ($q) use ($periodStart, $periodEnd) {
                        $q->whereBetween('start_date', [$periodStart, $periodEnd])
                            ->orWhereBetween('end_date', [$periodStart, $periodEnd])
                            ->orWhere(function ($q2) use ($periodStart, $periodEnd) {
                                $q2->where('start_date', '<=', $periodStart)
                                    ->where('end_date', '>=', $periodEnd);
                            });
                    });
            })
            ->with(['user.subscriptions.payments', 'user.enrollments' => function ($query) {
                $query->where('access_type', 'subscription')
                    ->where('status', 'active');
            }])
            ->get();

        foreach ($enrollments as $enrollment) {

            $activeSubscription = $enrollment->user->subscriptions()
                ->where('status', 'active')
                ->where(function ($query) use ($periodStart, $periodEnd) {
                    $query->whereBetween('start_date', [$periodStart, $periodEnd])
                        ->orWhereBetween('end_date', [$periodStart, $periodEnd])
                        ->orWhere(function ($q) use ($periodStart, $periodEnd) {
                            $q->where('start_date', '<=', $periodStart)
                                ->where('end_date', '>=', $periodEnd);
                        });
                })
                ->first();

            if (!$activeSubscription) {
                continue;
            }


            $payment = $this->getSubscriptionPaymentForPeriod($activeSubscription, $periodStart, $periodEnd);
            if (!$payment) {
                continue;
            }

            
            $enrollmentStart = max($enrollment->enrolled_at, $periodStart);
            $enrollmentEnd = $enrollment->completed_at ? min($enrollment->completed_at, $periodEnd) : $periodEnd;

            $totalPeriodDays = $periodEnd->diffInDays($periodStart) + 1; 
            $activeDays = $enrollmentEnd->diffInDays($enrollmentStart) + 1;
            $durationRatio = $totalPeriodDays > 0 ? $activeDays / $totalPeriodDays : 0;

            
            $totalActiveEnrollments = $enrollment->user->enrollments
                ->where('access_type', 'subscription')
                ->where('status', 'active')
                ->count();

            if ($totalActiveEnrollments <= 0) {
                continue;
            }

            
            $grossAttributableRevenue = ($payment->amount / $totalActiveEnrollments) * $durationRatio;

            
            $netShare = $grossAttributableRevenue * (1 - $platformFeePercentage) * $teacherPercentageShare;

            $total += $netShare;
        }

        return $total;
    }

    /**
     * Get the subscription payment covering the given period.
     *
     */
    private function getSubscriptionPaymentForPeriod(UserSubscription $subscription, Carbon $periodStart, Carbon $periodEnd): ?Payment
    {
        return $subscription->payments()
            ->where('status', 'completed')
            ->where(function ($query) use ($periodStart, $periodEnd) {
                $query->whereBetween('created_at', [$periodStart, $periodEnd])
                    ->orWhere(function ($q) use ($periodStart) {
                        
                        $q->where('created_at', '<=', $periodStart)
                            ->orderBy('created_at', 'desc');
                    });
            })
            ->first();
    }

    /**
     * Get the teacher percentage share from config.
     *
     */
    private function getTeacherPercentageShare(): float
    {
        return Config::get('payouts.teacher_percentage_share', 0.7); 
    }

    /**
     * Get the platform fee percentage from config.
     *
     */
    private function getPlatformFeePercentage(): float
    {
        return Config::get('payouts.platform_fee_percentage', 0.3); 
    }
}
