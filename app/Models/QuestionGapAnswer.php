<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class QuestionGapAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id',
        'gap_identifier',
        'correct_text',
        'case_sensitive',
        'points',
    ];

    protected $casts = [
        'case_sensitive' => 'boolean',
        'points' => 'integer',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
