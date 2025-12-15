<?php

use PhpCsFixer\Config;
use PhpCsFixer\Finder;
// Import our custom fixer
use App\Tools\CustomCommentRemoverFixer;

// Create custom fixer instance
$commentRemoverFixer = new CustomCommentRemoverFixer();
$customFixerName = $commentRemoverFixer->getName(); // This ensures we use the exact name from the fixer

$rules = [
    '@PSR12' => true,
    'no_superfluous_phpdoc_tags' => [
        'allow_mixed' => true,
        'remove_inheritdoc' => false,
    ],
    'no_empty_comment' => true,
    'no_trailing_whitespace_in_comment' => true,
    // Enable our custom comment remover using the dynamically retrieved name
    $customFixerName => [
        'preserve_patterns' => [
            '/@var/', // Preserve @var, @param, @return, etc.
            '/@param/',
            '/@return/',
            '/@throws/',
            '/@deprecated/',
            '/@see/',
            '/@inheritdoc/',
            '/@license/i', // Preserve License headers
            '/copyright/i', // Preserve Copyright headers
            '/TODO/i',      // Preserve TODO comments
            '/FIXME/i',     // Preserve FIXME comments
        ],
    ],
    'no_unused_imports' => true,
    'no_empty_statement' => true,
    'concat_space' => ['spacing' => 'one'],
    'phpdoc_align' => ['align' => 'vertical'],
    'phpdoc_no_empty_return' => false,
    'phpdoc_order' => true,
    'phpdoc_separation' => true,
    // Added from previous configuration if still desired
    'strict_param' => true, 
    'array_syntax' => ['syntax' => 'short'],
    'single_line_comment_style' => [
        'comment_types' => ['hash'],
    ],
];

$finder = Finder::create()
    ->in([
        __DIR__ . '/app',
        __DIR__ . '/routes',
        __DIR__ . '/config',
        __DIR__ . '/database',
        __DIR__ . '/tests',
    ])
    ->name('*.php')
    ->notName('*.blade.php')
    ->ignoreDotFiles(true)
    ->ignoreVCS(true);

$config = new Config();

// Register our custom fixer
$config->registerCustomFixers([$commentRemoverFixer]);

return $config
    ->setRules($rules)
    ->setFinder($finder)
    ->setRiskyAllowed(true) // Enabling risky rules - be aware of potential unintended changes.
    ->setUsingCache(true); // Re-enable caching now that everything is working 