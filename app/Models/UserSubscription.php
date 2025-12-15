<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\SoftDeletes;

final class UserSubscription extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'subscription_tier_id',
        'started_at',
        'expires_at',
        'auto_renew',
        'status',
        'latest_payment_id',
        'cancelled_at',
        'cancellation_reason',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'auto_renew' => 'boolean',
        'cancelled_at' => 'datetime',
    ];

    /**
     * The allowed status values.
     *
     * @var array<string>
     */
    public static array $allowedStatuses = [
        'active',
        'expired',
        'cancelled',
        'suspended',
        'pending',
    ];

    /**
     * Get the user that owns the subscription.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the subscription tier associated with the subscription.
     */
    public function tier(): BelongsTo
    {
        return $this->belongsTo(SubscriptionTier::class, 'subscription_tier_id');
    }

    /**
     * Get the latest payment associated with this subscription record.
     * This is the payment that activated or last renewed this specific subscription instance.
     */
    public function latestPayment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'latest_payment_id');
    }

    /**
     * Get all payments that were made for this specific subscription instance (e.g. initial payment, renewals for THIS instance).
     * This might be useful if a single UserSubscription record is updated upon renewal, rather than creating a new one.
     * However, the current setup implies a new UserSubscription might be made or status simply extended.
     * If payments are directly for *activating* or *renewing* this UserSubscription instance, they could be linked here.
     * The existing payments() MorphMany implies UserSubscription can BE a payable item.
     */
    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    /**
     * Check if the subscription is currently active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active' &&
               ($this->expires_at === null || Carbon::now()->lte($this->expires_at));
    }

    /**
     * Check if the subscription is canceled.
     */
    public function isCanceled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Check if the subscription is expired.
     */
    public function isExpired(): bool
    {
        return $this->status === 'expired' ||
               ($this->expires_at !== null && Carbon::now()->gt($this->expires_at));
    }

    /**
     * Check if the subscription should be auto-renewed.
     * This is a placeholder for future logic.
     */
    public function shouldAutoRenew(): bool
    {
        if (!$this->auto_renew || $this->status !== 'active' || $this->expires_at === null) {
            return false;
        }
        return Carbon::now()->diffInDays($this->expires_at, false) <= 3 && Carbon::now()->diffInDays($this->expires_at, false) >= 0;
    }

    /**
     * Calculate the number of days remaining in the subscription.
     */
    public function daysRemaining(): int
    {
        if ($this->expires_at === null) {
            return PHP_INT_MAX; 
        }

        $daysLeft = Carbon::now()->diffInDays($this->expires_at, false);
        return (int)max(0, $daysLeft);
    }

    /**
     * Scope a query to only include currently active subscriptions.
     */
    public function scopeCurrentlyActive($query)
    {
        return $query->where('status', 'active')
                     ->where(function ($q) {
                         $q->whereNull('expires_at')
                           ->orWhere('expires_at', '>=', Carbon::now());
                     });
    }

    /**
     * Scope a query to find the currently active subscription for a specific user.
     */
    public function scopeCurrentlyActiveForUser($query, $userId)
    {
        return $query->where('user_id', $userId)
                     ->where('status', 'active')
                     ->where(function ($q) {
                         $q->whereNull('expires_at')
                           ->orWhere('expires_at', '>=', Carbon::now());
                     });
    }

    /**
     * Scope a query to only include expired subscriptions.
     */
    public function scopeExpired($query)
    {
        return $query->where('status', 'expired')
                     ->orWhere(function ($q) {
                         $q->whereNotNull('expires_at')
                           ->where('expires_at', '<', Carbon::now());
                     });
    }

    /**
     * Scope a query to only include truly expired subscriptions.
     */
    public function scopeTrulyExpired($query)
    {
        return $query->where('status', 'expired')
                     ->orWhere(function ($q) {
                         $q->whereNotNull('expires_at')
                           ->where('expires_at', '<', Carbon::now());
                     });
    }
}
