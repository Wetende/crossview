<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class TeacherPayout extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'period_start',
        'period_end',
        'amount',
        'status',
        'notes',
        'payment_details_snapshot',
        'reference',
        'processed_by_user_id',
        'processed_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'amount' => 'decimal:2',
        'processed_at' => 'datetime',
        'payment_details_snapshot' => 'json',
    ];

    /**
     * The teacher receiving the payout.
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The admin who processed the payout.
     */
    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by_user_id');
    }

    /**
     * Scope a query to only include pending payouts.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to only include processing payouts.
     */
    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    /**
     * Scope a query to only include paid payouts.
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    /**
     * Scope a query to only include failed payouts.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope a query to only include cancelled payouts.
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    /**
     * Scope a query to only include payouts for a specific teacher.
     */
    public function scopeForTeacher($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Check if the payout is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if the payout is processing.
     */
    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }

    /**
     * Check if the payout is paid.
     */
    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    /**
     * Check if the payout is failed.
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Check if the payout is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Mark the payout as processing.
     */
    public function markAsProcessing(User $admin): void
    {
        $this->update([
            'status' => 'processing',
            'processed_by_user_id' => $admin->id,
            'processed_at' => now(),
        ]);
    }

    /**
     * Mark the payout as paid.
     */
    public function markAsPaid(User $admin, string $reference = null): void
    {
        $this->update([
            'status' => 'paid',
            'reference' => $reference,
            'processed_by_user_id' => $admin->id,
            'processed_at' => now(),
        ]);
    }

    /**
     * Mark the payout as failed.
     */
    public function markAsFailed(User $admin, string $reason = null): void
    {
        $this->update([
            'status' => 'failed',
            'notes' => $reason ?? $this->notes,
            'processed_by_user_id' => $admin->id,
            'processed_at' => now(),
        ]);
    }

    /**
     * Mark the payout as cancelled.
     */
    public function markAsCancelled(User $admin, string $reason = null): void
    {
        $this->update([
            'status' => 'cancelled',
            'notes' => $reason ?? $this->notes,
            'processed_by_user_id' => $admin->id,
            'processed_at' => now(),
        ]);
    }
}
