<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

final class SubscriptionTier extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'price',
        'level',
        'duration_days',
        'is_active',
        'features',
        'max_courses',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'decimal:2',
        'level' => 'integer',
        'duration_days' => 'integer',
        'is_active' => 'boolean',
        'features' => 'array',
        'max_courses' => 'integer',
    ];

    /**
     * Get the user subscriptions for the subscription tier.
     */
    public function userSubscriptions(): HasMany
    {
        return $this->hasMany(UserSubscription::class);
    }

    /**
     * Get the number of active subscribers for this tier.
     */
    public function getActiveSubscribersCountAttribute(): int
    {
        return $this->userSubscriptions()->currentlyActive()->count();
    }

    /**
     * Calculate the monthly price.
     *
     * The price is stored in cents, so we divide by 100 to get the dollar value.
     * Then calculate the monthly price based on duration_days.
     */
    public function getMonthlyPriceAttribute(): ?float
    {
        if ($this->duration_days > 0) {
            
            return (($this->price / 100) / $this->duration_days) * 30;
        }
        return null;
    }

    /**
     * Scope a query to only include active subscription tiers.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
