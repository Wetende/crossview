<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class QuestionMatchingPair extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id',
        'matching_pair_key',
        'prompt_text',
        'prompt_image_url',
        'answer_text',
        'answer_image_url',
        'order',
        'points',
    ];

    protected $casts = [
        'order' => 'integer',
        'points' => 'integer',
    ];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
