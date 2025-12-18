<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\InvalidGradingLogicException;
use App\Exceptions\InvalidHierarchyStructureException;

final class BlueprintValidationService
{
    private const VALID_GRADING_TYPES = ['weighted', 'competency', 'pass_fail'];

    public function validateHierarchyStructure(array $structure): void
    {
        if (empty($structure)) {
            throw new InvalidHierarchyStructureException(
                'Hierarchy structure must contain at least one level label.'
            );
        }

        foreach ($structure as $index => $label) {
            if (!is_string($label) || trim($label) === '') {
                throw new InvalidHierarchyStructureException(
                    "Hierarchy structure at index {$index} must be a non-empty string."
                );
            }
        }
    }

    public function validateGradingLogic(array $logic): void
    {
        if (!isset($logic['type'])) {
            throw new InvalidGradingLogicException(
                'Grading logic must contain a "type" field.'
            );
        }

        if (!in_array($logic['type'], self::VALID_GRADING_TYPES, true)) {
            throw new InvalidGradingLogicException(
                'Grading logic type must be one of: ' . implode(', ', self::VALID_GRADING_TYPES)
            );
        }

        match ($logic['type']) {
            'weighted' => $this->validateWeightedGrading($logic),
            'competency' => $this->validateCompetencyGrading($logic),
            'pass_fail' => $this->validatePassFailGrading($logic),
        };
    }

    private function validateWeightedGrading(array $logic): void
    {
        if (!isset($logic['pass_mark'])) {
            throw new InvalidGradingLogicException(
                'Weighted grading logic must contain a "pass_mark" field.'
            );
        }

        if (!is_numeric($logic['pass_mark']) || $logic['pass_mark'] < 0 || $logic['pass_mark'] > 100) {
            throw new InvalidGradingLogicException(
                'Pass mark must be a number between 0 and 100.'
            );
        }
    }

    private function validateCompetencyGrading(array $logic): void
    {
        // Competency grading is valid with just the type
    }

    private function validatePassFailGrading(array $logic): void
    {
        // Pass/fail grading is valid with just the type
    }
}
