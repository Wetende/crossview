<?php

declare(strict_types=1);

function formatBytes(int $bytes, int $precision = 2): string
{
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];

    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);

    $bytes /= pow(1024, $pow);

    return round($bytes, $precision) . ' ' . $units[$pow];
}

/**
 * Get the localized term for system entities
 */
function get_lms_term(string $term): string
{
    $terms = [
        'Course' => 'Study Material',
        'Courses' => 'Study Materials',
        'course' => 'study material',
        'courses' => 'study materials',
    ];
    
    return $terms[$term] ?? $term;
}
