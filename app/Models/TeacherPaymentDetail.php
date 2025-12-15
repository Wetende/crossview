<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class TeacherPaymentDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'payment_method',
        'account_details',
        'is_verified',
        'status',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
    ];

    /**
     * The teacher who owns the payment details.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the payment details are valid and verified.
     */
    public function isValid(): bool
    {
        return $this->status === 'verified' && !empty($this->account_details);
    }

    /**
     * Check if the payment details are pending verification.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if the payment details have been rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Get a specific account detail by key.
     */
    public function getAccountDetail(string $key): ?string
    {
        $details = json_decode($this->account_details, true);
        return $details[$key] ?? null;
    }

    /**
     * Set a specific account detail by key.
     */
    public function setAccountDetail(string $key, string $value): void
    {
        $details = json_decode($this->account_details, true) ?: [];
        $details[$key] = $value;
        $this->account_details = json_encode($details);
    }
}
