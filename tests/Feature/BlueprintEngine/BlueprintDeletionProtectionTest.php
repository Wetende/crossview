<?php

declare(strict_types=1);

namespace Tests\Feature\BlueprintEngine;

use App\Exceptions\BlueprintInUseException;
use App\Models\AcademicBlueprint;
use App\Models\Course;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * **Feature: blueprint-engine, Property 3: Blueprint Deletion Protection**
 * **Validates: Requirements 1.5**
 *
 * For any AcademicBlueprint that has one or more associated Programs/Courses,
 * attempting to delete the blueprint should fail and return an error.
 */
final class BlueprintDeletionProtectionTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @dataProvider courseCountProvider
     */
    public function test_cannot_delete_blueprint_with_associated_courses(int $courseCount): void
    {
        $blueprint = AcademicBlueprint::factory()->create();

        Course::factory()->count($courseCount)->create([
            'blueprint_id' => $blueprint->id,
        ]);

        $this->expectException(BlueprintInUseException::class);
        $this->expectExceptionMessage("Cannot delete blueprint '{$blueprint->name}'");

        $blueprint->delete();
    }

    public static function courseCountProvider(): array
    {
        return [
            'one_course' => [1],
            'two_courses' => [2],
            'five_courses' => [5],
            'ten_courses' => [10],
        ];
    }

    public function test_can_delete_blueprint_without_associated_courses(): void
    {
        $blueprint = AcademicBlueprint::factory()->create();

        $this->assertTrue($blueprint->delete());
        $this->assertSoftDeleted('academic_blueprints', ['id' => $blueprint->id]);
    }

    public function test_can_delete_blueprint_after_courses_removed(): void
    {
        $blueprint = AcademicBlueprint::factory()->create();

        $courses = Course::factory()->count(3)->create([
            'blueprint_id' => $blueprint->id,
        ]);

        // Remove association
        foreach ($courses as $course) {
            $course->update(['blueprint_id' => null]);
        }

        $this->assertTrue($blueprint->delete());
        $this->assertSoftDeleted('academic_blueprints', ['id' => $blueprint->id]);
    }

    /**
     * Property test: For any number of courses associated with a blueprint,
     * deletion should always fail.
     *
     * @dataProvider randomCourseCountProvider
     */
    public function test_deletion_always_fails_with_any_course_count(int $count): void
    {
        $blueprint = AcademicBlueprint::factory()->create();

        Course::factory()->count($count)->create([
            'blueprint_id' => $blueprint->id,
        ]);

        $this->expectException(BlueprintInUseException::class);

        $blueprint->delete();
    }

    public static function randomCourseCountProvider(): array
    {
        $cases = [];
        for ($i = 1; $i <= 20; $i++) {
            $cases["count_{$i}"] = [$i];
        }
        return $cases;
    }
}
