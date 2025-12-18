<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CurriculumNode;
use Illuminate\Support\Arr;

final class NodePropertiesService
{
    /**
     * Required properties per node type.
     * Can be overridden via config.
     */
    private array $requiredProperties = [
        'lesson' => ['title'],
        'session' => ['title'],
        'competency' => ['title'],
        'element' => ['title'],
    ];

    public function __construct()
    {
        $this->requiredProperties = config(
            'blueprint.required_properties',
            $this->requiredProperties
        );
    }

    /**
     * Merge new properties with existing ones, preserving keys not in update.
     */
    public function mergeProperties(CurriculumNode $node, array $newProperties): CurriculumNode
    {
        $existingProperties = $node->properties ?? [];

        // Deep merge: new properties override existing, but existing keys not in new are preserved
        $mergedProperties = array_replace_recursive($existingProperties, $newProperties);

        $node->properties = $mergedProperties;
        $node->save();

        return $node;
    }

    /**
     * Set properties completely (replaces existing).
     */
    public function setProperties(CurriculumNode $node, array $properties): CurriculumNode
    {
        $node->properties = $properties;
        $node->save();

        return $node;
    }

    /**
     * Get a specific property value.
     */
    public function getProperty(CurriculumNode $node, string $key, mixed $default = null): mixed
    {
        return Arr::get($node->properties ?? [], $key, $default);
    }

    /**
     * Check if a property exists.
     */
    public function hasProperty(CurriculumNode $node, string $key): bool
    {
        return Arr::has($node->properties ?? [], $key);
    }

    /**
     * Remove a specific property.
     */
    public function removeProperty(CurriculumNode $node, string $key): CurriculumNode
    {
        $properties = $node->properties ?? [];
        Arr::forget($properties, $key);
        $node->properties = $properties;
        $node->save();

        return $node;
    }

    /**
     * Validate that required properties for node type are present.
     */
    public function validateRequiredProperties(CurriculumNode $node): array
    {
        $nodeType = strtolower($node->node_type);
        $required = $this->requiredProperties[$nodeType] ?? [];
        $properties = $node->properties ?? [];

        $missing = [];
        foreach ($required as $requiredKey) {
            if (!Arr::has($properties, $requiredKey)) {
                $missing[] = $requiredKey;
            }
        }

        return $missing;
    }

    /**
     * Check if node has all required properties.
     */
    public function hasRequiredProperties(CurriculumNode $node): bool
    {
        return empty($this->validateRequiredProperties($node));
    }

    /**
     * Get required properties for a node type.
     */
    public function getRequiredPropertiesForType(string $nodeType): array
    {
        return $this->requiredProperties[strtolower($nodeType)] ?? [];
    }

    /**
     * Add content to node properties.
     */
    public function addContent(CurriculumNode $node, string $type, string $url, array $metadata = []): CurriculumNode
    {
        $content = [
            'type' => $type,
            'url' => $url,
            'metadata' => $metadata,
            'added_at' => now()->toIso8601String(),
        ];

        return $this->mergeProperties($node, ["{$type}_url" => $url, "{$type}_metadata" => $metadata]);
    }

    /**
     * Add attachment to node properties.
     */
    public function addAttachment(CurriculumNode $node, string $name, string $url, string $type): CurriculumNode
    {
        $attachments = $node->properties['attachments'] ?? [];

        $attachments[] = [
            'name' => $name,
            'url' => $url,
            'type' => $type,
            'added_at' => now()->toIso8601String(),
        ];

        return $this->mergeProperties($node, ['attachments' => $attachments]);
    }
}
