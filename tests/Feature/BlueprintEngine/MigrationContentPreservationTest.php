<?php

declare(strict_types=1);

namespace Tests\Feature\BlueprintEngine;

use App\Models\Course;
use App\Models\CourseSection;
use App\Models\CurriculumNode;
use App\Models\Lesson;
use App\Models\LessonAttachment;
use App\Services\LegacyMigrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * **Feature: blueprint-engine, Property 12: Migration Content Preservation**
 * **Validates: Requirements 6.5**
 *
 * For any Lesson with content URLs (video_url, pdf attachments), after migration
 * the corresponding CurriculumNode's properties JSON should contain equivalent
 * content references.
 */
final class MigrationContentPreservationTest extends TestCase
{
    use RefreshDatabase;

    private LegacyMigrationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new LegacyMigrationService();
    }

    public function test_migration_preserves_video_url(): void
    {
        $course = Course::factory()->create(['blueprint_id' => null]);
        $section = CourseSection::factory()->create(['course_id' => $course->id]);

        $lesson = Lesson::factory()->create([
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'video_url' => 'https://example.com/video.mp4',
            'video_source' => 'youtube',
        ]);

        $this->service->migrate();

        $lessonNode = CurriculumNode::where('course_id', $course->id)
            ->where('node_type', 'lesson')
            ->first();

        $this->assertNotNull($lessonNode);
        $this->assertEquals('https://example.com/video.mp4', $lessonNode->properties['video_url']);
        $this->assertEquals('youtube', $lessonNode->properties['video_source']);
    }

    public function test_migration_preserves_lesson_content(): void
    {
        $course = Course::factory()->create(['blueprint_id' => null]);
        $section = CourseSection::factory()->create(['course_id' => $course->id]);

        $htmlContent = '<p>This is the lesson content with <strong>formatting</strong>.</p>';

        $lesson = Lesson::factory()->create([
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'content' => $htmlContent,
            'lesson_duration' => 45,
        ]);

        $this->service->migrate();

        $lessonNode = CurriculumNode::where('course_id', $course->id)
            ->where('node_type', 'lesson')
            ->first();

        $this->assertEquals($htmlContent, $lessonNode->properties['content']);
        $this->assertEquals(45, $lessonNode->properties['lesson_duration']);
    }

    public function test_migration_preserves_stream_details(): void
    {
        $course = Course::factory()->create(['blueprint_id' => null]);
        $section = CourseSection::factory()->create(['course_id' => $course->id]);

        $lesson = Lesson::factory()->create([
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'stream_url' => 'https://stream.example.com/live',
            'stream_password' => 'secret123',
            'is_recorded' => true,
            'recording_url' => 'https://example.com/recording.mp4',
        ]);

        $this->service->migrate();

        $lessonNode = CurriculumNode::where('course_id', $course->id)
            ->where('node_type', 'lesson')
            ->first();

        $this->assertEquals('https://stream.example.com/live', $lessonNode->properties['stream_url']);
        $this->assertEquals('secret123', $lessonNode->properties['stream_password']);
        $this->assertTrue($lessonNode->properties['is_recorded']);
        $this->assertEquals('https://example.com/recording.mp4', $lessonNode->properties['recording_url']);
    }

    public function test_migration_preserves_course_metadata(): void
    {
        $course = Course::factory()->create([
            'blueprint_id' => null,
            'title' => 'Test Course',
            'description' => 'Course description',
            'thumbnail_path' => '/images/course.jpg',
            'price' => 99.99,
            'pricing_type' => 'purchase',
            'level' => 'intermediate',
            'language' => 'en',
            'duration_in_minutes' => 120,
            'is_featured' => true,
        ]);

        $this->service->migrate();

        $courseNode = CurriculumNode::where('course_id', $course->id)
            ->where('node_type', 'course')
            ->first();

        $this->assertEquals('Test Course', $courseNode->title);
        $this->assertEquals('Course description', $courseNode->description);
        $this->assertEquals('/images/course.jpg', $courseNode->properties['thumbnail_path']);
        $this->assertEquals(99.99, $courseNode->properties['price']);
        $this->assertEquals('purchase', $courseNode->properties['pricing_type']);
        $this->assertEquals('intermediate', $courseNode->properties['level']);
        $this->assertEquals('en', $courseNode->properties['language']);
        $this->assertEquals(120, $courseNode->properties['duration_in_minutes']);
        $this->assertTrue($courseNode->properties['is_featured']);
    }

    public function test_migration_preserves_section_unlock_settings(): void
    {
        $course = Course::factory()->create(['blueprint_id' => null]);

        $unlockDate = now()->addDays(7);
        $section = CourseSection::factory()->create([
            'course_id' => $course->id,
            'title' => 'Locked Section',
            'unlock_date' => $unlockDate,
            'unlock_after_days' => 14,
        ]);

        Lesson::factory()->create([
            'course_id' => $course->id,
            'course_section_id' => $section->id,
        ]);

        $this->service->migrate();

        $sectionNode = CurriculumNode::where('course_id', $course->id)
            ->where('node_type', 'section')
            ->first();

        $this->assertEquals('Locked Section', $sectionNode->title);
        $this->assertNotNull($sectionNode->properties['unlock_date']);
        $this->assertEquals(14, $sectionNode->properties['unlock_after_days']);
    }

    /**
     * Property test: For any lesson with video content,
     * migration should preserve the video URL.
     */
    #[DataProvider('videoContentProvider')]
    public function test_video_content_always_preserved(string $videoUrl, string $videoSource): void
    {
        $course = Course::factory()->create(['blueprint_id' => null]);
        $section = CourseSection::factory()->create(['course_id' => $course->id]);

        $lesson = Lesson::factory()->create([
            'course_id' => $course->id,
            'course_section_id' => $section->id,
            'video_url' => $videoUrl,
            'video_source' => $videoSource,
        ]);

        $this->service->migrate();

        $lessonNode = CurriculumNode::where('course_id', $course->id)
            ->where('node_type', 'lesson')
            ->first();

        $this->assertEquals($videoUrl, $lessonNode->properties['video_url']);
        $this->assertEquals($videoSource, $lessonNode->properties['video_source']);
    }

    public static function videoContentProvider(): array
    {
        return [
            'youtube' => ['https://youtube.com/watch?v=abc123', 'youtube'],
            'vimeo' => ['https://vimeo.com/123456', 'vimeo'],
            'uploaded' => ['/storage/videos/lesson.mp4', 'upload'],
            'external' => ['https://cdn.example.com/video.mp4', 'external'],
            'embed' => ['<iframe src="..."></iframe>', 'embed'],
        ];
    }

    public function test_migration_preserves_legacy_ids(): void
    {
        $course = Course::factory()->create(['blueprint_id' => null]);
        $section = CourseSection::factory()->create(['course_id' => $course->id]);
        $lesson = Lesson::factory()->create([
            'course_id' => $course->id,
            'course_section_id' => $section->id,
        ]);

        $this->service->migrate();

        $courseNode = CurriculumNode::where('course_id', $course->id)
            ->where('node_type', 'course')
            ->first();

        $sectionNode = CurriculumNode::where('course_id', $course->id)
            ->where('node_type', 'section')
            ->first();

        $lessonNode = CurriculumNode::where('course_id', $course->id)
            ->where('node_type', 'lesson')
            ->first();

        $this->assertEquals($course->id, $courseNode->properties['legacy_course_id']);
        $this->assertEquals($section->id, $sectionNode->properties['legacy_section_id']);
        $this->assertEquals($lesson->id, $lessonNode->properties['legacy_lesson_id']);
    }
}
