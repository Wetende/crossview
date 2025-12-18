<?php

declare(strict_types=1);

namespace Tests\Feature\BlueprintEngine;

use App\Models\AcademicBlueprint;
use App\Models\Course;
use App\Models\CurriculumNode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * **Feature: blueprint-engine, Property 7: Cascade Delete Removes All Descendants**
 * **Validates: Requirements 2.4**
 *
 * For any CurriculumNode with descendants, deleting the node should also
 * delete all descendant nodes. The count of remaining nodes should equal
 * original count minus the deleted subtree size.
 */
final class CascadeDeleteTest extends TestCase
{
    use RefreshDatabase;

    private Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $blueprint = AcademicBlueprint::factory()->create([
            'hierarchy_structure' => ['Course', 'Section', 'Lesson', 'Topic'],
        ]);

        $this->course = Course::factory()->create([
            'blueprint_id' => $blueprint->id,
        ]);
    }

    public function test_deleting_parent_removes_all_children(): void
    {
        $parent = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Parent',
            'position' => 0,
        ]);

        for ($i = 0; $i < 5; $i++) {
            CurriculumNode::create([
                'course_id' => $this->course->id,
                'parent_id' => $parent->id,
                'node_type' => 'section',
                'title' => "Child {$i}",
                'position' => $i,
            ]);
        }

        $this->assertEquals(6, CurriculumNode::count());

        // Force delete to trigger cascade
        $parent->forceDelete();

        $this->assertEquals(0, CurriculumNode::count());
    }

    public function test_deleting_node_removes_entire_subtree(): void
    {
        // Create a tree: root -> 2 sections -> 3 lessons each
        $root = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Root',
            'position' => 0,
        ]);

        $section1 = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => $root->id,
            'node_type' => 'section',
            'title' => 'Section 1',
            'position' => 0,
        ]);

        $section2 = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => $root->id,
            'node_type' => 'section',
            'title' => 'Section 2',
            'position' => 1,
        ]);

        for ($i = 0; $i < 3; $i++) {
            CurriculumNode::create([
                'course_id' => $this->course->id,
                'parent_id' => $section1->id,
                'node_type' => 'lesson',
                'title' => "Lesson 1.{$i}",
                'position' => $i,
            ]);

            CurriculumNode::create([
                'course_id' => $this->course->id,
                'parent_id' => $section2->id,
                'node_type' => 'lesson',
                'title' => "Lesson 2.{$i}",
                'position' => $i,
            ]);
        }

        // Total: 1 root + 2 sections + 6 lessons = 9
        $this->assertEquals(9, CurriculumNode::count());

        // Delete section1 (should remove section1 + 3 lessons = 4 nodes)
        $section1->forceDelete();

        // Remaining: 1 root + 1 section + 3 lessons = 5
        $this->assertEquals(5, CurriculumNode::count());

        // Verify section2 and its children still exist
        $this->assertDatabaseHas('curriculum_nodes', ['id' => $root->id]);
        $this->assertDatabaseHas('curriculum_nodes', ['id' => $section2->id]);
    }

    #[DataProvider('treeDepthProvider')]
    public function test_cascade_delete_at_various_depths(int $depth, int $childrenPerLevel): void
    {
        $nodeTypes = ['course', 'section', 'lesson', 'topic'];
        $totalNodes = 0;

        // Create tree
        $createLevel = function (int $currentDepth, ?int $parentId) use (&$createLevel, $depth, $childrenPerLevel, $nodeTypes, &$totalNodes) {
            if ($currentDepth > $depth) {
                return;
            }

            for ($i = 0; $i < $childrenPerLevel; $i++) {
                $node = CurriculumNode::create([
                    'course_id' => $this->course->id,
                    'parent_id' => $parentId,
                    'node_type' => $nodeTypes[$currentDepth] ?? 'topic',
                    'title' => "Node at depth {$currentDepth}, index {$i}",
                    'position' => $i,
                ]);
                $totalNodes++;

                $createLevel($currentDepth + 1, $node->id);
            }
        };

        $createLevel(0, null);

        $initialCount = CurriculumNode::count();
        $this->assertEquals($totalNodes, $initialCount);

        // Delete first root node
        $firstRoot = CurriculumNode::whereNull('parent_id')->first();
        $subtreeSize = $this->countSubtree($firstRoot->id);

        $firstRoot->forceDelete();

        $remainingCount = CurriculumNode::count();
        $this->assertEquals($initialCount - $subtreeSize, $remainingCount);
    }

    public static function treeDepthProvider(): array
    {
        return [
            'depth_1_children_2' => [1, 2],
            'depth_2_children_2' => [2, 2],
            'depth_2_children_3' => [2, 3],
            'depth_3_children_2' => [3, 2],
        ];
    }

    public function test_deleting_leaf_node_only_removes_itself(): void
    {
        $root = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Root',
            'position' => 0,
        ]);

        $section = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => $root->id,
            'node_type' => 'section',
            'title' => 'Section',
            'position' => 0,
        ]);

        $lesson = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => $section->id,
            'node_type' => 'lesson',
            'title' => 'Lesson',
            'position' => 0,
        ]);

        $this->assertEquals(3, CurriculumNode::count());

        $lesson->forceDelete();

        $this->assertEquals(2, CurriculumNode::count());
        $this->assertDatabaseHas('curriculum_nodes', ['id' => $root->id]);
        $this->assertDatabaseHas('curriculum_nodes', ['id' => $section->id]);
    }

    public function test_soft_delete_does_not_cascade(): void
    {
        $root = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => null,
            'node_type' => 'course',
            'title' => 'Root',
            'position' => 0,
        ]);

        $child = CurriculumNode::create([
            'course_id' => $this->course->id,
            'parent_id' => $root->id,
            'node_type' => 'section',
            'title' => 'Child',
            'position' => 0,
        ]);

        // Soft delete
        $root->delete();

        // Child should still exist (soft delete doesn't cascade)
        $this->assertSoftDeleted('curriculum_nodes', ['id' => $root->id]);
        $this->assertDatabaseHas('curriculum_nodes', [
            'id' => $child->id,
            'deleted_at' => null,
        ]);
    }

    private function countSubtree(int $nodeId): int
    {
        $count = 1; // Count the node itself
        $children = CurriculumNode::where('parent_id', $nodeId)->get();

        foreach ($children as $child) {
            $count += $this->countSubtree($child->id);
        }

        return $count;
    }
}
