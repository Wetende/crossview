<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

final class Leaderboard extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'scope_type',
        'scope_id',
        'time_period',
        'is_active',
        'start_date',
        'end_date',
        'last_updated_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
        'last_updated_at' => 'datetime',
    ];

    /**
     * Get all of the leaderboard entries for this leaderboard.
     */
    public function entries(): HasMany
    {
        return $this->hasMany(LeaderboardEntry::class);
    }

    /**
     * Get the top N entries for this leaderboard.
     */
    public function topEntries(int $limit = 10): HasMany
    {
        return $this->entries()
            ->where('is_public', true)
            ->orderBy('rank')
            ->limit($limit);
    }

    /**
     * Get the scopeable model (e.g., a Course or Category).
     */
    public function scopeable(): MorphTo
    {
        return $this->morphTo('scopeable', 'scope_type', 'scope_id');
    }
}
