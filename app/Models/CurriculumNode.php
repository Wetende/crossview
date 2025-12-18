<?php

declare(strict_types=1);

namespace App\Models;

use App\Exceptions\InvalidNodeTypeException;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Collection;

final class CurriculumNode extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'course_id',
        'parent_id',
        'node_type',
        'title',
        'code',
        'description',
        'properties',
        'completion_rules',
        'position',
        'is_published',
    ];

    protected $casts = [
        'properties' => 'array',
        'completion_rules' => 'array',
        'position' => 'integer',
        'is_published' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (CurriculumNode $node) {
            $node->validateNodeType();
        });
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(CurriculumNode::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(CurriculumNode::class, 'parent_id')->orderBy('position');
    }

    public function getDepth(): int
    {
        $depth = 0;
        $current = $this;

        while ($current->parent_id !== null) {
            $depth++;
            $current = $current->parent;

            if ($current === null) {
                break;
            }
        }

        return $depth;
    }

    public function getLabel(): string
    {
        $course = $this->course;

        if (!$course || !$course->blueprint) {
            return $this->node_type;
        }

        $depth = $this->getDepth();

        return $course->blueprint->getLabelForDepth($depth);
    }

    public function ancestors(): Collection
    {
        $ancestors = collect();
        $current = $this->parent;

        while ($current !== null) {
            $ancestors->push($current);
            $current = $current->parent;
        }

        return $ancestors->reverse()->values();
    }

    public function descendants(): Collection
    {
        $descendants = collect();

        foreach ($this->children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->descendants());
        }

        return $descendants;
    }

    protected function validateNodeType(): void
    {
        $course = $this->course;

        if (!$course) {
            $course = Course::find($this->course_id);
        }

        if (!$course || !$course->blueprint) {
            return;
        }

        $validTypes = array_map('strtolower', $course->blueprint->hierarchy_structure ?? []);
        $nodeType = strtolower($this->node_type);

        if (!in_array($nodeType, $validTypes, true)) {
            throw new InvalidNodeTypeException(
                "Node type '{$this->node_type}' is not valid for this blueprint. " .
                "Valid types are: " . implode(', ', $course->blueprint->hierarchy_structure)
            );
        }
    }
}
