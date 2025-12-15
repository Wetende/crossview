<?php

/**
 * This script demonstrates how to run PHP-CS-Fixer programmatically
 * to clean up useless comments in your codebase.
 */

// Set up error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// The directory to process
$target = $argv[1] ?? 'app/Events';

// Execute the PHP-CS-Fixer command
$command = sprintf(
    'php vendor/bin/php-cs-fixer fix %s --dry-run -v',
    escapeshellarg($target)
);

echo "Running PHP-CS-Fixer on {$target}...\n";
echo "Command: {$command}\n\n";

// Execute the command
passthru($command, $exitCode);

echo "\nPHP-CS-Fixer completed with exit code: {$exitCode}\n";

// If everything looks good, suggest running without dry-run
if ($exitCode === 0) {
    echo "\nTo apply these changes, run:\n";
    echo str_replace(' --dry-run', '', $command) . "\n";
} else {
    echo "\nPlease check the errors above before applying changes.\n";
} 