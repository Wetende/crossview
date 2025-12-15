<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class QuestionKeywordAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id',
        'acceptable_keyword',
        'case_sensitive',
        'points_per_keyword',
    ];

    protected $casts = [
        'case_sensitive' => 'boolean',
        'points_per_keyword' => 'integer',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
