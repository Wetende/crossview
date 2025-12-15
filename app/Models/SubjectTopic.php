<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class SubjectTopic extends Model
{
    use HasFactory;

    protected $fillable = [
        'subject_id',
        'name',
        'parent_topic_id',
        'curriculum_code',
    ];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function parentTopic(): BelongsTo
    {
        return $this->belongsTo(SubjectTopic::class, 'parent_topic_id');
    }

    public function childTopics(): HasMany
    {
        return $this->hasMany(SubjectTopic::class, 'parent_topic_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }
}
