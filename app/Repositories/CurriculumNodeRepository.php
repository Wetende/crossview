<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Exceptions\MaxDepthExceededException;
use App\Models\CurriculumNode;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class CurriculumNodeRepository
{
    /**
     * Fetch entire tree for a course using recursive CTE.
     */
    public function getTreeForCourse(int $courseId): Collection
    {
        $nodes = DB::select("
            WITH RECURSIVE node_tree AS (
                SELECT 
                    id, course_id, parent_id, node_type, title, code, 
                    description, properties, completion_rules, position, 
                    is_published, created_at, updated_at, deleted_at,
                    0 as depth,
                    CAST(LPAD(position, 10, '0') AS CHAR(1000)) as path
                FROM curriculum_nodes
                WHERE course_id = ? AND parent_id IS NULL AND deleted_at IS NULL
                
                UNION ALL
                
                SELECT 
                    cn.id, cn.course_id, cn.parent_id, cn.node_type, cn.title, cn.code,
                    cn.description, cn.properties, cn.completion_rules, cn.position,
                    cn.is_published, cn.created_at, cn.updated_at, cn.deleted_at,
                    nt.depth + 1,
                    CONCAT(nt.path, '.', LPAD(cn.position, 10, '0'))
                FROM curriculum_nodes cn
                INNER JOIN node_tree nt ON cn.parent_id = nt.id
                WHERE cn.deleted_at IS NULL
            )
            SELECT * FROM node_tree ORDER BY path
        ", [$courseId]);

        return collect($nodes)->map(fn ($node) => $this->hydrateNode($node));
    }

    /**
     * Fetch subtree from a specific node using recursive CTE.
     */
    public function getSubtree(int $nodeId): Collection
    {
        $nodes = DB::select("
            WITH RECURSIVE node_tree AS (
                SELECT 
                    id, course_id, parent_id, node_type, title, code,
                    description, properties, completion_rules, position,
                    is_published, created_at, updated_at, deleted_at,
                    0 as depth,
                    CAST(LPAD(position, 10, '0') AS CHAR(1000)) as path
                FROM curriculum_nodes
                WHERE id = ? AND deleted_at IS NULL
                
                UNION ALL
                
                SELECT 
                    cn.id, cn.course_id, cn.parent_id, cn.node_type, cn.title, cn.code,
                    cn.description, cn.properties, cn.completion_rules, cn.position,
                    cn.is_published, cn.created_at, cn.updated_at, cn.deleted_at,
                    nt.depth + 1,
                    CONCAT(nt.path, '.', LPAD(cn.position, 10, '0'))
                FROM curriculum_nodes cn
                INNER JOIN node_tree nt ON cn.parent_id = nt.id
                WHERE cn.deleted_at IS NULL
            )
            SELECT * FROM node_tree ORDER BY path
        ", [$nodeId]);

        return collect($nodes)->map(fn ($node) => $this->hydrateNode($node));
    }

    /**
     * Get ancestors (breadcrumb path) for a node.
     */
    public function getAncestors(int $nodeId): Collection
    {
        $nodes = DB::select("
            WITH RECURSIVE ancestors AS (
                SELECT 
                    id, course_id, parent_id, node_type, title, code,
                    description, properties, completion_rules, position,
                    is_published, created_at, updated_at, deleted_at,
                    0 as depth
                FROM curriculum_nodes
                WHERE id = ? AND deleted_at IS NULL
                
                UNION ALL
                
                SELECT 
                    cn.id, cn.course_id, cn.parent_id, cn.node_type, cn.title, cn.code,
                    cn.description, cn.properties, cn.completion_rules, cn.position,
                    cn.is_published, cn.created_at, cn.updated_at, cn.deleted_at,
                    a.depth + 1
                FROM curriculum_nodes cn
                INNER JOIN ancestors a ON cn.id = a.parent_id
                WHERE cn.deleted_at IS NULL
            )
            SELECT * FROM ancestors WHERE id != ? ORDER BY depth DESC
        ", [$nodeId, $nodeId]);

        return collect($nodes)->map(fn ($node) => $this->hydrateNode($node));
    }

    /**
     * Move node to new parent with depth validation.
     */
    public function moveNode(int $nodeId, ?int $newParentId): bool
    {
        $node = CurriculumNode::findOrFail($nodeId);
        $course = $node->course;

        if (!$course || !$course->blueprint) {
            $node->update(['parent_id' => $newParentId]);
            return true;
        }

        $maxDepth = $course->blueprint->getHierarchyDepth() - 1;
        $newDepth = $this->calculateNewDepth($newParentId);
        $subtreeDepth = $this->getMaxSubtreeDepth($nodeId);
        $totalDepth = $newDepth + $subtreeDepth;

        if ($totalDepth > $maxDepth) {
            throw new MaxDepthExceededException(
                "Moving this node would exceed the maximum hierarchy depth of {$maxDepth}. " .
                "The move would result in depth {$totalDepth}."
            );
        }

        $node->update(['parent_id' => $newParentId]);
        return true;
    }

    /**
     * Reorder siblings by updating their position fields.
     */
    public function reorderSiblings(array $nodeIds): void
    {
        DB::transaction(function () use ($nodeIds) {
            foreach ($nodeIds as $position => $nodeId) {
                CurriculumNode::where('id', $nodeId)->update(['position' => $position]);
            }
        });
    }

    /**
     * Get children of a node ordered by position.
     */
    public function getChildren(int $nodeId): Collection
    {
        return CurriculumNode::where('parent_id', $nodeId)
            ->orderBy('position')
            ->get();
    }

    /**
     * Get root nodes for a course ordered by position.
     */
    public function getRootNodes(int $courseId): Collection
    {
        return CurriculumNode::where('course_id', $courseId)
            ->whereNull('parent_id')
            ->orderBy('position')
            ->get();
    }

    private function calculateNewDepth(?int $parentId): int
    {
        if ($parentId === null) {
            return 0;
        }

        $parent = CurriculumNode::find($parentId);
        return $parent ? $parent->getDepth() + 1 : 0;
    }

    private function getMaxSubtreeDepth(int $nodeId): int
    {
        $result = DB::select("
            WITH RECURSIVE subtree AS (
                SELECT id, 0 as depth
                FROM curriculum_nodes
                WHERE id = ? AND deleted_at IS NULL
                
                UNION ALL
                
                SELECT cn.id, s.depth + 1
                FROM curriculum_nodes cn
                INNER JOIN subtree s ON cn.parent_id = s.id
                WHERE cn.deleted_at IS NULL
            )
            SELECT MAX(depth) as max_depth FROM subtree
        ", [$nodeId]);

        return $result[0]->max_depth ?? 0;
    }

    private function hydrateNode(object $row): CurriculumNode
    {
        $node = new CurriculumNode();
        $node->id = $row->id;
        $node->course_id = $row->course_id;
        $node->parent_id = $row->parent_id;
        $node->node_type = $row->node_type;
        $node->title = $row->title;
        $node->code = $row->code;
        $node->description = $row->description;
        $node->properties = json_decode($row->properties ?? '[]', true);
        $node->completion_rules = json_decode($row->completion_rules ?? '[]', true);
        $node->position = $row->position;
        $node->is_published = (bool) $row->is_published;
        $node->created_at = $row->created_at;
        $node->updated_at = $row->updated_at;
        $node->exists = true;

        return $node;
    }
}
