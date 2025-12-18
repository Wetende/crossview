<?php

declare(strict_types=1);

namespace App\Models;

use App\Exceptions\BlueprintInUseException;
use App\Services\BlueprintValidationService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

final class AcademicBlueprint extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'hierarchy_structure',
        'grading_logic',
        'progression_rules',
        'gamification_enabled',
        'certificate_enabled',
    ];

    protected $casts = [
        'hierarchy_structure' => 'array',
        'grading_logic' => 'array',
        'progression_rules' => 'array',
        'gamification_enabled' => 'boolean',
        'certificate_enabled' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (AcademicBlueprint $blueprint) {
            $validator = app(BlueprintValidationService::class);
            $validator->validateHierarchyStructure($blueprint->hierarchy_structure ?? []);
            $validator->validateGradingLogic($blueprint->grading_logic ?? []);
        });

        static::deleting(function (AcademicBlueprint $blueprint) {
            if ($blueprint->courses()->exists()) {
                throw new BlueprintInUseException(
                    "Cannot delete blueprint '{$blueprint->name}' because it has associated courses."
                );
            }
        });
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class, 'blueprint_id');
    }

    public function getHierarchyDepth(): int
    {
        return count($this->hierarchy_structure ?? []);
    }

    public function getLabelForDepth(int $depth): string
    {
        $structure = $this->hierarchy_structure ?? [];

        if ($depth < 0 || $depth >= count($structure)) {
            return 'Unknown';
        }

        return $structure[$depth];
    }
}
