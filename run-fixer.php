<?php

require_once __DIR__ . '/vendor/autoload.php';

use PhpCsFixer\Config;
use PhpCsFixer\Console\ConfigurationResolver;
use PhpCsFixer\Error\ErrorsManager;
use PhpCsFixer\Finder;
use PhpCsFixer\Runner\Runner;
use PhpCsFixer\ToolInfo;
use App\Tools\CustomCommentRemoverFixer;

// Set up error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    echo "Loading PHP-CS-Fixer configuration...\n";
    
    $finder = Finder::create()
        ->in(__DIR__)
        ->name('test-comment-remover.php');
    
    $config = new Config();
    
    // Register custom fixer
    echo "Registering custom fixer...\n";
    $customFixer = new CustomCommentRemoverFixer();
    echo "Fixer name: " . $customFixer->getName() . "\n";
    
    $config->registerCustomFixers([$customFixer]);
    
    $rules = [
        '@PSR12' => true,
        'no_empty_comment' => true,
        'no_trailing_whitespace_in_comment' => true,
        $customFixer->getName() => [
            'preserve_patterns' => [
                '/^\s*\* @/',
                '/TODO|FIXME/i',
                '/LICENSE|COPYRIGHT/i',
            ],
        ],
    ];
    
    $config->setRules($rules)
        ->setFinder($finder)
        ->setRiskyAllowed(true)
        ->setUsingCache(false);
    
    echo "Configuration prepared successfully.\n";
    
    // Create error manager
    $errorsManager = new ErrorsManager();
    $toolInfo = new ToolInfo();
    
    // Create resolver
    echo "Creating configuration resolver...\n";
    $resolver = new ConfigurationResolver(
        $config,
        [
            'dry-run' => true,
            'diff' => true,
        ],
        getcwd(),
        $toolInfo
    );
    
    // Run the fixer
    echo "Running fixer...\n";
    $runner = new Runner(
        $resolver->getFinder(),
        $resolver->getFixers(),
        $resolver->getDiffer(),
        null,
        $errorsManager,
        $resolver->getLinter(),
        $resolver->isDryRun(),
        $resolver->getCacheManager(),
        $resolver->getDirectory(),
        $resolver->shouldStopOnViolation()
    );
    
    $changed = $runner->fix();
    
    echo "Fixer completed. Files changed: " . count($changed) . "\n";
    
    if ($errorsManager->getExceptionErrors()) {
        echo "Errors occurred during execution:\n";
        foreach ($errorsManager->getExceptionErrors() as $error) {
            echo " - " . $error->getMessage() . "\n";
        }
    } else {
        echo "No errors reported.\n";
    }
    
    echo "Done.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
} 