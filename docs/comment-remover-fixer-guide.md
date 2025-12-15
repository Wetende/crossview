# Custom Comment Remover for PHP-CS-Fixer

This guide explains how to set up and use the `CustomCommentRemoverFixer` to automatically remove useless comments from your PHP codebase.

## Overview

The `CustomCommentRemoverFixer` is a custom PHP-CS-Fixer rule that removes redundant and useless comments, such as:

1. PHPDoc blocks that merely restate what's obvious from method signatures
2. Obvious inline comments that just repeat what the code does
3. Empty or trivial comments

## Installation

### 1. Create the CustomCommentRemoverFixer class

Create a file at `app/Tools/CustomCommentRemoverFixer.php` with the following content:

```php
<?php

declare(strict_types=1);

namespace App\Tools;

use PhpCsFixer\AbstractFixer;
use PhpCsFixer\Fixer\ConfigurableFixerInterface;
use PhpCsFixer\FixerDefinition\CodeSample;
use PhpCsFixer\FixerDefinition\FixerDefinition;
use PhpCsFixer\FixerDefinition\FixerDefinitionInterface;
use PhpCsFixer\Tokenizer\Tokens;
use PhpCsFixer\Tokenizer\Token;
use PhpCsFixer\FixerConfiguration\FixerConfigurationResolver;
use PhpCsFixer\FixerConfiguration\FixerConfigurationResolverInterface;
use PhpCsFixer\FixerConfiguration\FixerOptionBuilder;
use Symfony\Component\OptionsResolver\OptionsResolver;

final class CustomCommentRemoverFixer extends AbstractFixer implements ConfigurableFixerInterface
{
    private array $preservePatterns = [];

    public function configure(array $configuration): void
    {
        $resolver = new OptionsResolver();
        $resolver->setDefaults([
            'preserve_patterns' => [],
        ]);
        $resolver->setAllowedTypes('preserve_patterns', 'array');
        
        $resolvedConfig = $resolver->resolve($configuration);
        $this->preservePatterns = $resolvedConfig['preserve_patterns'];
    }

    public function getConfigurationDefinition(): FixerConfigurationResolverInterface
    {
        $preservePatternsOption = (new FixerOptionBuilder('preserve_patterns', 'List of regex patterns for comments to preserve'))
            ->setAllowedTypes(['array'])
            ->setDefault([])
            ->getOption();

        return new FixerConfigurationResolver([$preservePatternsOption]);
    }

    public function getDefinition(): FixerDefinitionInterface
    {
        return new FixerDefinition(
            'Removes useless comments like redundant PHPDoc blocks, obvious inline comments, etc.',
            [
                new CodeSample(
                    '<?php
/**
 * The class name.
 *
 * @var string
 */
protected $name;

/**
 * Constructor.
 */
public function __construct()
{
    // Initialize
    $this->initialize();
}
'
                ),
                new CodeSample(
                    '<?php
/**
 * The class name.
 *
 * @var string
 */
protected $name;

/**
 * Constructor.
 */
public function __construct()
{
    // Initialize
    $this->initialize();
}
',
                    ['preserve_patterns' => ['/TODO|FIXME/i']]
                ),
            ]
        );
    }

    public function isCandidate(Tokens $tokens): bool
    {
        return $tokens->isTokenKindFound(T_COMMENT) || $tokens->isTokenKindFound(T_DOC_COMMENT);
    }

    public function getName(): string
    {
        return 'CrossViewCollege/comment_remover';
    }

    public function getPriority(): int
    {
        // Should run after other comment-related fixers
        return -50;
    }

    protected function applyFix(\SplFileInfo $file, Tokens $tokens): void
    {
        foreach ($tokens as $index => $token) {
            if (!$token->isComment()) {
                continue;
            }

            $content = $token->getContent();

            // Skip comments that match preserve patterns
            foreach ($this->preservePatterns as $pattern) {
                if (preg_match($pattern, $content)) {
                    continue 2; // Skip to the next token
                }
            }

            // Check for useless PHPDoc patterns
            if ($this->isUselessPHPDoc($content, $index, $tokens)) {
                $tokens->clearAt($index);
                continue;
            }

            // Check for obvious inline comments
            if ($this->isObviousInlineComment($content)) {
                $tokens->clearAt($index);
                continue;
            }
        }
    }

    private function isUselessPHPDoc(string $content, int $index, Tokens $tokens): bool
    {
        // Check for property default doc blocks
        if (preg_match('/^\s*\/\*\*\s*\n\s*\*\s*The\s+[a-zA-Z0-9_]+(\s+[a-zA-Z0-9_]+)?\.\s*\n\s*\*\s*\n?\s*\*\s*@var\s+/', $content)) {
            return true;
        }

        // Check for constructor default doc blocks
        if (preg_match('/^\s*\/\*\*\s*\n\s*\*\s*Create\s+a\s+new\s+(instance|event\s+instance)\.\s*\n\s*\*\/\s*$/m', $content)) {
            return true;
        }

        // Check for get channels doc blocks
        if (preg_match('/^\s*\/\*\*\s*\n\s*\*\s*Get\s+the\s+channels\s+the\s+event\s+should\s+broadcast\s+on\.\s*\n/', $content)) {
            return true;
        }

        // Check for command signature doc blocks
        if (preg_match('/^\s*\/\*\*\s*\n\s*\*\s*The\s+name\s+and\s+signature\s+of\s+the\s+console\s+command\.\s*\n/', $content)) {
            return true;
        }

        // Check for command description doc blocks
        if (preg_match('/^\s*\/\*\*\s*\n\s*\*\s*The\s+console\s+command\s+description\.\s*\n/', $content)) {
            return true;
        }

        // Check for execute command doc blocks
        if (preg_match('/^\s*\/\*\*\s*\n\s*\*\s*Execute\s+the\s+console\s+command\.\s*\n/', $content)) {
            return true;
        }

        return false;
    }

    private function isObviousInlineComment(string $content): bool
    {
        $patterns = [
            // Loop-related comments
            '/\/\/\s*Loop(\s+through)?\s+[a-zA-Z0-9_]+/i',
            
            // Initialize/setup comments
            '/\/\/\s*Initialize/i',
            
            // Get/set comments
            '/\/\/\s*Get\s+[a-zA-Z0-9_]+/i',
            '/\/\/\s*Set\s+[a-zA-Z0-9_]+/i',
            
            // Return value comments
            '/\/\/\s*Return\s+the\s+[a-zA-Z0-9_]+/i',
            
            // Empty one-word comments
            '/\/\/\s*[a-zA-Z0-9_]{1,10}\s*$/'
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }

        return false;
    }
}
```

### 2. Configure PHP-CS-Fixer

Update your `.php-cs-fixer.dist.php` file to include and use the custom fixer:

```php
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
            '/^\s*\* @/',           // Preserve annotations
            '/TODO|FIXME/i',        // Preserve TODOs and FIXMEs
            '/LICENSE|COPYRIGHT/i', // Preserve license/copyright notices
            '/^#!/i',               // Preserve shebang lines
            '/\/\/\s+@phpstan-/i',  // Preserve PHPStan annotations
            '/phpcs:/i',            // Preserve phpcs annotations
        ],
    ],
    // Other rules...
];

$finder = Finder::create()
    ->in([
        __DIR__ . '/app',
        __DIR__ . '/routes',
        __DIR__ . '/tests',
        __DIR__ . '/config',
        __DIR__ . '/database',
    ])
    // Other finder configurations...
    ->name('*.php')
    ->notName('*.blade.php');

$config = new Config();

// Register our custom fixer
$config->registerCustomFixers([$commentRemoverFixer]);

return $config
    ->setRules($rules)
    ->setFinder($finder)
    ->setRiskyAllowed(true)
    ->setUsingCache(true);
```

### 3. Update Composer Autoloading (if needed)

Ensure that your `composer.json` has the correct PSR-4 autoloading configuration:

```json
"autoload": {
    "psr-4": {
        "App\\": "app/",
        "Database\\Factories\\": "database/factories/",
        "Database\\Seeders\\": "database/seeders/"
    },
    "files": [
        "app/Helpers/helpers.php"
    ]
}
```

Then run:

```
composer dump-autoload
```

## Usage

To run the fixer:

```bash
# Fix a specific file
php vendor/bin/php-cs-fixer fix path/to/file.php

# Fix all files in the codebase
php vendor/bin/php-cs-fixer fix

# Dry run to see what would be changed
php vendor/bin/php-cs-fixer fix --dry-run --diff
```

## What Comments Will Be Removed

### PHPDoc Blocks
- Property doc blocks that just state the property name
- Constructor doc blocks that just say "Create a new instance"
- Method doc blocks that just restate the method name
- Command class signature/description doc blocks

### Inline Comments
- Comments that just say "Loop through items"
- Comments that just say "Initialize" 
- Comments that just state what a method returns
- Single-word comments that add no value

## Customization

You can customize the patterns of comments to preserve by modifying the `preserve_patterns` configuration in your `.php-cs-fixer.dist.php` file.

You can also extend the `isUselessPHPDoc` and `isObviousInlineComment` methods in the `CustomCommentRemoverFixer` class to add more patterns of useless comments to remove.

## Troubleshooting

If you encounter issues:

1. Make sure the `app/Tools` directory is properly autoloaded
2. Run `composer dump-autoload` to refresh the autoloader
3. Check that the namespace in the fixer class matches your PSR-4 configuration
4. Clear the PHP-CS-Fixer cache: `rm -f .php-cs-fixer.cache`
5. Run with verbose flag for more information: `php vendor/bin/php-cs-fixer fix --verbose`

## Adding New Patterns

To add new patterns for useless comments that should be removed:

1. For PHPDoc blocks, add new regex patterns to the `isUselessPHPDoc` method
2. For inline comments, add new regex patterns to the `isObviousInlineComment` method array

For example, to add detection for comments like "// End of function":

```php
private function isObviousInlineComment(string $content): bool
{
    $patterns = [
        // Existing patterns...
        
        // Add new pattern
        '/\/\/\s*End of \w+/i',
    ];
    
    // Rest of the method...
}
```

## Common Issues

### Issue: "Is not configurable" error

If you get an error saying your fixer "Is not configurable", make sure:
1. Your fixer class implements `ConfigurableFixerInterface`
2. You've implemented the `getConfigurationDefinition()` method
3. You've correctly implemented the `configure()` method 