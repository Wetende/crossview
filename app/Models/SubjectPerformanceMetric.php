<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class SubjectPerformanceMetric extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'subject_id',
        'performance_metric_id',
        'weight',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'weight' => 'float',
        'is_active' => 'boolean',
    ];

    /**
     * Get the subject that this performance metric belongs to.
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Get the performance metric that this belongs to.
     */
    public function performanceMetric(): BelongsTo
    {
        return $this->belongsTo(PerformanceMetric::class);
    }
}
