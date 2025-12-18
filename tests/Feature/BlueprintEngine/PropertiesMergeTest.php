<?php

declare(strict_types=1);

namespace Tests\Feature\BlueprintEngine;

use App\Models\AcademicBlueprint;
use App\Models\Course;
use App\Models\CurriculumNode;
use App\Services\NodePropertiesService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * **Feature: blueprint-engine, Property 9: Properties JSON Merge Behavior**
 * **Validates: Requirements 3.2**
 *
 * For any CurriculumNode with existing properties, updating with new properties
 * should merge (not replace), preserving keys not present in the update.
 */
final class PropertiesMergeTest extends TestCase
{
    use RefreshDatabase;

    private NodePropertiesService $service;
    private Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new NodePropertiesService();

        $blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => ['Course', 'Section', 'Lesson'],
        ]);

        $this->course = Course::factory()->create([
            'blueprint_id' => $blueprint->id,
        ]);
    }

    public function test_merge_preserves_existing_keys(): void
    {
        $node = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Test Node',
            'position' => 0,
            'properties' => [
                'existing_key' => 'existing_value',
                'another_key' => 'another_value',
            ],
        ]);

        $this->service->mergeProperties($node, [
            'new_key' => 'new_value',
        ]);

        $this->assertEquals('existing_value', $node->properties['existing_key']);
        $this->assertEquals('another_value', $node->properties['another_key']);
        $this->assertEquals('new_value', $node->properties['new_key']);
    }

    public function test_merge_overwrites_existing_keys_when_provided(): void
    {
        $node = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Test Node',
            'position' => 0,
            'properties' => [
                'key_to_update' => 'old_value',
                'key_to_keep' => 'keep_this',
            ],
        ]);

        $this->service->mergeProperties($node, [
            'key_to_update' => 'new_value',
        ]);

        $this->assertEquals('new_value', $node->properties['key_to_update']);
        $this->assertEquals('keep_this', $node->properties['key_to_keep']);
    }

    public function test_merge_handles_nested_properties(): void
    {
        $node = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Test Node',
            'position' => 0,
            'properties' => [
                'nested' => [
                    'existing' => 'value1',
                    'another' => 'value2',
                ],
            ],
        ]);

        $this->service->mergeProperties($node, [
            'nested' => [
                'new' => 'value3',
            ],
        ]);

        $this->assertEquals('value1', $node->properties['nested']['existing']);
        $this->assertEquals('value2', $node->properties['nested']['another']);
        $this->assertEquals('value3', $node->properties['nested']['new']);
    }

    public function test_merge_with_empty_existing_properties(): void
    {
        $node = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Test Node',
            'position' => 0,
            'properties' => [],
        ]);

        $this->service->mergeProperties($node, [
            'new_key' => 'new_value',
        ]);

        $this->assertEquals('new_value', $node->properties['new_key']);
    }

    public function test_merge_with_null_existing_properties(): void
    {
        $node = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Test Node',
            'position' => 0,
            'properties' => null,
        ]);

        $this->service->mergeProperties($node, [
            'new_key' => 'new_value',
        ]);

        $this->assertEquals('new_value', $node->properties['new_key']);
    }

    /**
     * Property test: For any combination of existing and new properties,
     * merge should preserve all existing keys not in the update.
     */
    #[DataProvider('mergeScenarioProvider')]
    public function test_merge_preserves_unupdated_keys(array $existing, array $update, array $expectedPreserved): void
    {
        $node = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Test Node',
            'position' => 0,
            'properties' => $existing,
        ]);

        $this->service->mergeProperties($node, $update);

        foreach ($expectedPreserved as $key => $value) {
            $this->assertEquals($value, $node->properties[$key], "Key '{$key}' should be preserved");
        }

        foreach ($update as $key => $value) {
            if (!is_array($value)) {
                $this->assertEquals($value, $node->properties[$key], "Key '{$key}' should be updated");
            }
        }
    }

    public static function mergeScenarioProvider(): array
    {
        return [
            'simple_merge' => [
                ['a' => 1, 'b' => 2],
                ['c' => 3],
                ['a' => 1, 'b' => 2],
            ],
            'partial_update' => [
                ['a' => 1, 'b' => 2, 'c' => 3],
                ['b' => 20],
                ['a' => 1, 'c' => 3],
            ],
            'multiple_new_keys' => [
                ['existing' => 'value'],
                ['new1' => 'v1', 'new2' => 'v2', 'new3' => 'v3'],
                ['existing' => 'value'],
            ],
            'empty_update' => [
                ['a' => 1, 'b' => 2],
                [],
                ['a' => 1, 'b' => 2],
            ],
            'complex_values' => [
                ['array' => [1, 2, 3], 'string' => 'text'],
                ['number' => 42],
                ['string' => 'text'],
            ],
        ];
    }

    public function test_get_property_returns_value(): void
    {
        $node = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Test Node',
            'position' => 0,
            'properties' => ['key' => 'value', 'nested' => ['deep' => 'data']],
        ]);

        $this->assertEquals('value', $this->service->getProperty($node, 'key'));
        $this->assertEquals('data', $this->service->getProperty($node, 'nested.deep'));
        $this->assertEquals('default', $this->service->getProperty($node, 'missing', 'default'));
    }

    public function test_has_property_checks_existence(): void
    {
        $node = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Test Node',
            'position' => 0,
            'properties' => ['key' => 'value'],
        ]);

        $this->assertTrue($this->service->hasProperty($node, 'key'));
        $this->assertFalse($this->service->hasProperty($node, 'missing'));
    }

    public function test_remove_property_deletes_key(): void
    {
        $node = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Test Node',
            'position' => 0,
            'properties' => ['keep' => 'this', 'remove' => 'this'],
        ]);

        $this->service->removeProperty($node, 'remove');

        $this->assertTrue($this->service->hasProperty($node, 'keep'));
        $this->assertFalse($this->service->hasProperty($node, 'remove'));
    }
}
