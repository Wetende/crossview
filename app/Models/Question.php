<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes; 



final class Question extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'quiz_id',
        'text',
        'question_type',
        'points',
        'order',
        'hint',
        'explanation',
        'image_path',
        'add_to_my_library',
        'subject_topic_id',
    ];

    protected $casts = [
        'points' => 'integer',
        'order' => 'integer',
        'add_to_my_library' => 'boolean',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(QuestionOption::class)->orderBy('order');
    }

    public function matchingPairs(): HasMany
    {
        return $this->hasMany(QuestionMatchingPair::class)->orderBy('order');
    }

    public function gapAnswers(): HasMany
    {
        return $this->hasMany(QuestionGapAnswer::class);
    }

    public function keywordAnswers(): HasMany
    {
        return $this->hasMany(QuestionKeywordAnswer::class);
    }

    public function subjectTopic(): BelongsTo
    {
        return $this->belongsTo(SubjectTopic::class);
    }
}
