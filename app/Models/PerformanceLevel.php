<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

final class PerformanceLevel extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'min_score',
        'max_score',
        'color_code',
        'description',
        'display_order',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'min_score' => 'float',
        'max_score' => 'float',
        'display_order' => 'integer',
    ];

    /**
     * Determine if the given score falls within this performance level.
     */
    public function containsScore(float $score): bool
    {
        return $score >= $this->min_score && $score <= $this->max_score;
    }

    /**
     * Get all student performances at this level.
     */
    public function studentPerformances()
    {
        return $this->hasMany(StudentPerformance::class, 'level', 'name');
    }

    /**
     * Get the Ugandan equivalent of this performance level.
     */
    public function getUgandanEquivalentAttribute(): string
    {
        return match ($this->name) {
            'Distinction' => 'D1 - Distinction One',
            'Credit' => 'C3 - Credit Three',
            'Pass' => 'P6 - Pass Six',
            default => $this->name,
        };
    }
}
