<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class RankingSchedule extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'frequency',
        'run_at_time',
        'last_run_at',
        'created_by',
        'is_active',
        'subjects',
        'grade_levels',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'run_at_time' => 'datetime',
        'last_run_at' => 'datetime',
        'is_active' => 'boolean',
        'subjects' => 'array',
        'grade_levels' => 'array',
    ];

    /**
     * Get the user who created this schedule.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Check if this schedule is due to run.
     */
    public function isDue(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if (!$this->last_run_at) {
            return true;
        }

        $now = now();

        return match ($this->frequency) {
            'daily' => $this->last_run_at->diffInDays($now) >= 1,
            'weekly' => $this->last_run_at->diffInWeeks($now) >= 1,
            'monthly' => $this->last_run_at->diffInMonths($now) >= 1,
            default => false,
        };
    }

    /**
     * Get a formatted description of when this schedule runs.
     */
    public function getScheduleDescriptionAttribute(): string
    {
        $frequency = ucfirst($this->frequency);
        $time = $this->run_at_time ? ' at ' . $this->run_at_time->format('g:i A') : '';

        return "{$frequency}{$time}";
    }

    /**
     * Update the last run timestamp.
     */
    public function markAsRun(): void
    {
        $this->last_run_at = now();
        $this->save();
    }
}
