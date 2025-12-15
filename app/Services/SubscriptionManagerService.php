<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Models\SubscriptionTier;
use App\Models\UserSubscription;
use App\Models\Payment;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB; 
use Illuminate\Support\Facades\Log;

final class SubscriptionManagerService
{
    /**
     * Subscribes a user to a new subscription tier or updates their existing one.
     *
     * @param User             $user    The user to subscribe.
     * @param SubscriptionTier $tier    The tier to subscribe to.
     * @param Payment          $payment The successful payment record for this subscription.
     *
     * @return UserSubscription The created or updated user subscription.
     */
    public function activateSubscription(User $user, SubscriptionTier $tier, Payment $payment): UserSubscription
    {
        return DB::transaction(function () use ($user, $tier, $payment) {
            
            $this->deactivateOldSubscriptions($user);

            
            
            $previousActiveSubscription = $user->subscriptions()->onlyTrashed()->where('status', 'cancelled')->where('cancellation_reason', 'Superseded by new subscription.')->latest('canceled_at')->first();
            $previousTier = $previousActiveSubscription?->tier;

            
            $newSubscription = UserSubscription::create([
                'user_id' => $user->id,
                'subscription_tier_id' => $tier->id,
                'started_at' => Carbon::now(),
                'expires_at' => $this->calculateExpiryDate($tier),
                'status' => 'active',
                'latest_payment_id' => $payment->id,
                'auto_renew' => false, 
            ]);

            
            if ($previousTier && $tier->level < $previousTier->level) {
                Log::info("Downgrade detected for user {$user->id} from tier {$previousTier->name} (level {$previousTier->level}) to {$tier->name} (level {$tier->level}). Applying course access restrictions.");
                $this->handleDowngradeCourseAccess($user, $newSubscription, $previousTier);
            } else {
                
                $this->handleMaxCoursesEnforcement($user, $newSubscription);
            }

            Log::info("User {$user->id} subscribed to tier {$tier->id}. Subscription ID: {$newSubscription->id}");

            return $newSubscription;
        });
    }

    /**
     * Deactivates all existing active subscriptions for a user.
     */
    private function deactivateOldSubscriptions(User $user): void
    {
        $user->subscriptions()
            ->where('status', 'active') 
            ->get()
            ->each(function (UserSubscription $subscription) use ($user) {
                $subscription->status = 'cancelled';
                if ($subscription->expires_at && Carbon::now()->gt($subscription->expires_at)) {
                    $subscription->status = 'expired';
                }
                $subscription->canceled_at = Carbon::now();
                $subscription->cancellation_reason = 'Superseded by new subscription.';
                $subscription->save();
                Log::info("Deactivated old subscription {$subscription->id} for user {$user->id} (new status: {$subscription->status}).");
            });
    }

    /**
     * Calculates the expiry date for a subscription based on the tier's duration.
     */
    private function calculateExpiryDate(SubscriptionTier $tier): ?Carbon
    {
        if ($tier->duration_days > 0) {
            return Carbon::now()->addDays($tier->duration_days);
        }
        return null; 
    }

    /**
     * Handles course access restrictions when a user downgrades their subscription tier.
     */
    private function handleDowngradeCourseAccess(User $user, UserSubscription $newActiveSubscription, SubscriptionTier $previousTier): void
    {
        $newTier = $newActiveSubscription->tier;
        Log::info("Executing handleDowngradeCourseAccess for user {$user->id}, new tier: {$newTier->name} (Level {$newTier->level}), previous tier: {$previousTier->name} (Level {$previousTier->level}).");

        
        $enrollmentsToRestrictBasedOnTierLevel = $user->enrollments()
            ->where('access_type', 'subscription')
            ->where('status', 'active') 
            ->whereHas('course', function ($query) use ($newTier) {
                $query->whereNotNull('required_subscription_tier_id')
                      ->whereHas('requiredSubscriptionTier', function ($tierQuery) use ($newTier) {
                          $tierQuery->where('level', '>', $newTier->level);
                      });
            })->get();

        foreach ($enrollmentsToRestrictBasedOnTierLevel as $enrollment) {
            $enrollment->status = 'restricted_tier';
            $enrollment->save();
            Log::info("Downgrade (Tier Level): Restricted access for user {$user->id} to course {$enrollment->course_id}. Set enrollment status to 'restricted_tier'.");
        }

        
        $this->handleMaxCoursesEnforcement($user, $newActiveSubscription);
    }

    /**
     * Enforces the max_courses limit for a user's active subscription.
     */
    private function handleMaxCoursesEnforcement(User $user, UserSubscription $activeSubscription): void
    {
        $tier = $activeSubscription->tier;
        if ($tier->max_courses === null || $tier->max_courses <= 0) {
            Log::info("Max courses enforcement: Tier '{$tier->name}' has unlimited courses for user {$user->id}.");
            return;
        }


        $validSubscriptionEnrollments = $user->enrollments()
            ->where('access_type', 'subscription')
            ->where('status', 'active') 
            ->whereHas('course', function ($query) use ($tier) {
                $query->where(function ($q) use ($tier) {
                    $q->whereNull('required_subscription_tier_id')
                      ->orWhereHas('requiredSubscriptionTier', function ($tierQuery) use ($tier) {
                          $tierQuery->where('level', '<=', $tier->level);
                      });
                });
            })
            ->orderBy('enrolled_at', 'asc') 
            ->get();

        $countToRestrict = $validSubscriptionEnrollments->count() - $tier->max_courses;
        Log::info("Max courses enforcement for user {$user->id} on tier '{$tier->name}': Max allowed: {$tier->max_courses}, Current active & valid: {$validSubscriptionEnrollments->count()}, To restrict: {$countToRestrict}");

        if ($countToRestrict > 0) {
            $enrollmentsToDeactivate = $validSubscriptionEnrollments->take($countToRestrict);
            foreach ($enrollmentsToDeactivate as $enrollment) {
                $enrollment->status = 'restricted_limit';
                $enrollment->save();
                Log::info("Max courses enforcement: Restricted access for user {$user->id} to course {$enrollment->course_id}. Set enrollment status to 'restricted_limit'.");
            }
        }
    }
}
