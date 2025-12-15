<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class StudentRanking extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'subject_id',
        'grade_level_id',
        'ranking_type',
        'percentile',
        'rank',
        'total_students',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'percentile' => 'float',
        'rank' => 'integer',
        'total_students' => 'integer',
    ];

    /**
     * Get the user this ranking belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the subject this ranking is for.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Get the grade level this ranking is for.
     */
    public function gradeLevel(): BelongsTo
    {
        return $this->belongsTo(GradeLevel::class);
    }

    /**
     * Get the formatted rank (e.g., 1st, 2nd, 3rd).
     */
    public function getFormattedRankAttribute(): string
    {
        $rank = $this->rank;

        if ($rank % 100 >= 11 && $rank % 100 <= 13) {
            return $rank . 'th';
        }

        return match ($rank % 10) {
            1 => $rank . 'st',
            2 => $rank . 'nd',
            3 => $rank . 'rd',
            default => $rank . 'th',
        };
    }

    /**
     * Get the performance tier based on percentile.
     */
    public function getPerformanceTierAttribute(): string
    {
        return match (true) {
            $this->percentile >= 90 => 'Elite',
            $this->percentile >= 75 => 'Advanced',
            $this->percentile >= 50 => 'Proficient',
            $this->percentile >= 25 => 'Developing',
            default => 'Emerging',
        };
    }
}
