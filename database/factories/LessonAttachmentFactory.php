<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Lesson;
use App\Models\LessonAttachment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LessonAttachment>
 */
final class LessonAttachmentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = LessonAttachment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $fileTypes = ['pdf', 'docx', 'pptx', 'xlsx', 'zip'];
        $fileType = fake()->randomElement($fileTypes);
        $fileName = fake()->word() . '.' . $fileType;
        $fileSizeKb = fake()->numberBetween(100, 5000);

        return [
            'lesson_id' => Lesson::factory(),
            'title' => fake()->words(3, true),
            'file_path' => 'lessons/attachments/' . fake()->uuid() . '.' . $fileType,
            'file_name' => $fileName,
            'file_size' => $fileSizeKb * 1024, 
            'file_type' => 'application/' . $fileType,
            'description' => fake()->optional()->sentence(),
            'order' => fake()->numberBetween(1, 5),
        ];
    }

    /**
     * Make the attachment a PDF file.
     */
    public function pdf(): self
    {
        $fileName = fake()->word() . '.pdf';
        return $this->state(fn (array $attributes) => [
            'file_path' => 'lessons/attachments/' . fake()->uuid() . '.pdf',
            'file_name' => $fileName,
            'file_type' => 'application/pdf',
        ]);
    }

    /**
     * Make the attachment a document (docx) file.
     */
    public function document(): self
    {
        $fileName = fake()->word() . '.docx';
        return $this->state(fn (array $attributes) => [
            'file_path' => 'lessons/attachments/' . fake()->uuid() . '.docx',
            'file_name' => $fileName,
            'file_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
    }

    /**
     * Make the attachment a presentation (pptx) file.
     */
    public function presentation(): self
    {
        $fileName = fake()->word() . '.pptx';
        return $this->state(fn (array $attributes) => [
            'file_path' => 'lessons/attachments/' . fake()->uuid() . '.pptx',
            'file_name' => $fileName,
            'file_type' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ]);
    }

    /**
     * Specify the lesson for the attachment.
     */
    public function forLesson(Lesson $lesson): self
    {
        return $this->state(fn (array $attributes) => [
            'lesson_id' => $lesson->id,
        ]);
    }
}
