<?php

namespace App\Console\Commands;

use App\Models\UserSubscription;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class CheckSubscriptionExpirationsCommand extends Command
{
    protected $signature = 'subscriptions:check-expirations';

    protected $description = 'Check for expired user subscriptions and update their status. Optionally send reminders.';

    public function handle(): int
    {
        $this->info('Checking for expired subscriptions...');
        Log::info('Running CheckSubscriptionExpirationsCommand...');

        $expiredCount = 0;
        $reminderCount = 0;


        $subscriptionsToExpire = UserSubscription::where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', Carbon::now())
            ->get();

        foreach ($subscriptionsToExpire as $subscription) {
            $subscription->status = 'expired';
            $subscription->save();
            $expiredCount++;
            Log::info("Subscription ID {$subscription->id} for user {$subscription->user_id} marked as expired.");



        }

        $this->info("Marked {$expiredCount} subscriptions as expired.");
        Log::info("Marked {$expiredCount} subscriptions as expired.");


        /*
        $reminderDateThreshold = Carbon::now()->addDays(7);
        $subscriptionsNeedingReminder = UserSubscription::where('status', 'active')
            ->whereNotNull('expires_at')
            ->whereDate('expires_at', '=', $reminderDateThreshold->toDateString()) // Check for expiry exactly 7 days from now
            // ->whereDoesntHave('user.notifications', function ($query) {
            //      // Optional: Check if a reminder was already sent recently
            // })
            ->get();

        foreach ($subscriptionsNeedingReminder as $subscription) {
            Log::info("Sending renewal reminder for subscription ID {$subscription->id} to user {$subscription->user_id}.");
            // TODO: Dispatch SubscriptionRenewalReminder notification
            // $subscription->user->notify(new SubscriptionRenewalReminder($subscription));
            $reminderCount++;
        }

        $this->info("Sent {$reminderCount} renewal reminders.");
        Log::info("Sent {$reminderCount} renewal reminders.");
        */

        $this->info('Subscription expiration check complete.');
        Log::info('CheckSubscriptionExpirationsCommand finished.');

        return Command::SUCCESS;
    }
}
