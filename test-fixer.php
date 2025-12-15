<?php

require_once __DIR__ . '/vendor/autoload.php';

// Import our custom fixer
use App\Tools\CustomCommentRemoverFixer;

// Set up error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    echo "Creating CustomCommentRemoverFixer instance...\n";
    $fixer = new CustomCommentRemoverFixer();
    
    echo "Fixer class loaded successfully!\n";
    echo "Fixer name: " . $fixer->getName() . "\n";
    echo "Fixer priority: " . $fixer->getPriority() . "\n";
    
    // Configure the fixer
    $fixer->configure([
        'preserve_patterns' => [
            '/^\s*\* @/',
            '/TODO|FIXME/i',
            '/LICENSE|COPYRIGHT/i',
        ],
    ]);
    
    echo "Fixer configured successfully.\n";
    echo "Done.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
} 