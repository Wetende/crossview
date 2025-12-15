<?php

declare(strict_types=1);

namespace App\Enums;

enum LessonType: string
{
    case TEXT = 'text';
    case VIDEO = 'video';
    case STREAM = 'stream';
    case PAST_PAPERS = 'past_papers';
    case QUIZ_LINK = 'quiz_link';
    case ASSIGNMENT_LINK = 'assignment_link';

    public function SreadableName(): string
    {
        return match ($this) {
            self::TEXT => 'Text Content',
            self::VIDEO => 'Video',
            self::STREAM => 'Live Stream / Webinar',
            self::PAST_PAPERS => 'Past Papers & Resources',
            self::QUIZ_LINK => 'Link to Quiz',
            self::ASSIGNMENT_LINK => 'Link to Assignment',
        };
    }
}
