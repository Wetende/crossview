<?php

declare(strict_types=1);

namespace Tests\Feature\BlueprintEngine;

use App\Models\AcademicBlueprint;
use App\Models\Course;
use App\Models\CurriculumNode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * **Feature: blueprint-engine, Property 4: Node Parent Reference Integrity**
 * **Validates: Requirements 2.1**
 *
 * For any CurriculumNode created with a parent_id, the parent relationship
 * should resolve to the correct parent node, and root nodes should have null parent_id.
 */
final class NodeParentReferenceTest extends TestCase
{
    use RefreshDatabase;

    private AcademicBlueprint $blueprint;
    private Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => ['Course', 'Section', 'Lesson'],
        ]);

        $this->course = Course::factory()->create([
            'blueprint_id' => $this->blueprint->id,
        ]);
    }

    /**
     * @dataProvider nodeTreeDepthProvider
     */
    public function test_parent_reference_resolves_correctly_at_any_depth(int $depth): void
    {
        $nodes = [];
        $parentId = null;
        $nodeTypes = ['course', 'section', 'lesson'];

        for ($i = 0; $i <= $depth && $i < count($nodeTypes); $i++) {
            $node = CurriculumNode::create([
                'course_id' => $this->course->id,
                'parent_id' => $parentId,
                'node_type' => $nodeTypes[$i],
                'title' => "Node at depth {$i}",
                'position' => 0,
            ]);

            $nodes[] = $node;
            $parentId = $node->id;
        }

        // Verify each node's parent reference
        foreach ($nodes as $index => $node) {
            $retrieved = CurriculumNode::find($node->id);

            if ($index === 0) {
                $this->assertNull($retrieved->parent_id, "Root node should have null parent_id");
                $this->assertNull($retrieved->parent, "Root node parent relationship should be null");
            } else {
                $expectedParent = $nodes[$index - 1];
                $this->assertEquals(
                    $expectedParent->id,
                    $retrieved->parent_id,
                    "Node at depth {$index} should reference correct parent"
                );
                $this->assertNotNull($retrieved->parent);
                $this->assertEquals($expectedParent->id, $retrieved->parent->id);
            }
        }
    }

    public static function nodeTreeDepthProvider(): array
    {
        return array_combine(
            array_map(fn ($i) => "depth_{$i}", range(0, 2)),
            array_map(fn ($i) => [$i], range(0, 2))
        );
    }

    /**
     * @dataProvider multipleChildrenProvider
     */
    public function test_multiple_children_reference_same_parent(int $childCount): void
    {
        $parent = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Parent Node',
            'position' => 0,
        ]);

        $children = [];
        for ($i = 0; $i < $childCount; $i++) {
            $children[] = CurriculumNode::create([
                'course_id' => $this->course->id,
                'parent_id' => $parent->id,
                'node_type' => 'section',
                'title' => "Child {$i}",
                'position' => $i,
            ]);
        }

        // Verify all children reference the same parent
        foreach ($children as $child) {
            $retrieved = CurriculumNode::find($child->id);
            $this->assertEquals($parent->id, $retrieved->parent_id);
            $this->assertEquals($parent->id, $retrieved->parent->id);
        }

        // Verify parent's children relationship
        $parentChildren = $parent->children;
        $this->assertCount($childCount, $parentChildren);
    }

    public static function multipleChildrenProvider(): array
    {
        return [
            'one_child' => [1],
            'two_children' => [2],
            'five_children' => [5],
            'ten_children' => [10],
        ];
    }

    public function test_root_nodes_have_null_parent(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $node = CurriculumNode::create([
                'course_id' => $this->course->id,
                'parent_id' => null,
                'node_type' => 'course',
                'title' => "Root Node {$i}",
                'position' => $i,
            ]);

            $retrieved = CurriculumNode::find($node->id);
            $this->assertNull($retrieved->parent_id);
            $this->assertNull($retrieved->parent);
        }
    }

    public function test_get_depth_returns_correct_value(): void
    {
        $root = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Root',
            'position' => 0,
        ]);

        $level1 = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => $root->id,
            'node_type' => 'section',
            'title' => 'Level 1',
            'position' => 0,
        ]);

        $level2 = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => $level1->id,
            'node_type' => 'lesson',
            'title' => 'Level 2',
            'position' => 0,
        ]);

        $this->assertEquals(0, $root->getDepth());
        $this->assertEquals(1, $level1->getDepth());
        $this->assertEquals(2, $level2->getDepth());
    }
}
