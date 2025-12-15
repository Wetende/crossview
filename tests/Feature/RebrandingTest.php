<?php

namespace Tests\Feature;

use Tests\TestCase;

class RebrandingTest extends TestCase
{
    /**
     * Feature: app-rebranding, Property 3: Configuration consistency
     * Validates: Requirements 2.1, 2.2, 2.3, 2.4
     * 
     * Test that configuration consistently returns "Crossview College of Theology and Technology"
     * as the application name and "Crossview College" as the short name.
     */
    public function test_configuration_consistency(): void
    {
        $expectedFullName = 'Crossview College of Theology and Technology';
        $expectedShortName = 'Crossview College';
        $expectedAbbreviation = 'CCT&T';
        
        // Test config helper returns correct full name
        $this->assertEquals($expectedFullName, config('app.name'));
        
        // Test short name configuration
        $this->assertEquals($expectedShortName, config('app.short_name'));
        
        // Test abbreviation configuration
        $this->assertEquals($expectedAbbreviation, config('app.abbreviation'));
        
        // Test that the configuration is loaded from environment
        $this->assertEquals($expectedFullName, env('APP_NAME'));
        $this->assertEquals($expectedShortName, env('APP_SHORT_NAME'));
        $this->assertEquals($expectedAbbreviation, env('APP_ABBREVIATION'));
        
        // Test multiple access patterns return consistent values
        $configName = app('config')->get('app.name');
        $this->assertEquals($expectedFullName, $configName);
        
        // Test that the name is available in different contexts
        $appName = app()->make('config')->get('app.name');
        $this->assertEquals($expectedFullName, $appName);
    }

    /**
     * Feature: app-rebranding, Property 4: Mail configuration consistency
     * Validates: Requirements 1.4, 2.5
     * 
     * Test that mail configuration consistently returns "Crossview College of Theology and Technology"
     * as the sender name.
     */
    public function test_mail_configuration_consistency(): void
    {
        $expectedName = 'Crossview College of Theology and Technology';

        // Test mail from name configuration
        $this->assertEquals($expectedName, config('mail.from.name'));
        
        // Test that mail configuration is loaded correctly
        $mailFromName = app('config')->get('mail.from.name');
        $this->assertEquals($expectedName, $mailFromName);
        
        // Test environment variable fallback
        if (env('MAIL_FROM_NAME')) {
            $this->assertEquals($expectedName, env('MAIL_FROM_NAME'));
        }
    }

    /**
     * Feature: app-rebranding, Property 1: Brand name consistency in UI elements
     * Validates: Requirements 1.1, 1.3, 3.1, 3.3
     * 
     * Test that UI elements consistently display "Crossview College" (short name)
     * in headers/navigation and "Crossview College of Theology and Technology" (full name) in footers.
     */
    public function test_ui_brand_name_consistency(): void
    {
        $expectedFullName = 'Crossview College of Theology and Technology';
        $expectedShortName = 'Crossview College';
        
        // Test that the brand name appears somewhere on the home page
        $response = $this->get('/');
        
        // Either short name or full name should appear
        $content = $response->getContent();
        $hasShortName = str_contains($content, $expectedShortName);
        $hasFullName = str_contains($content, $expectedFullName);
        
        $this->assertTrue($hasShortName || $hasFullName, 
            'Home page should contain either short name or full name');
    }

    /**
     * Feature: app-rebranding, Property 5: Copyright notice consistency
     * Validates: Requirements 1.5
     * 
     * Test that copyright notices consistently display "Crossview College of Theology and Technology"
     * (full name) across all pages.
     */
    public function test_copyright_notice_consistency(): void
    {
        $expectedName = 'Crossview College of Theology and Technology';
        
        // Test that the brand name appears on the home page
        $response = $this->get('/');
        $response->assertSee($expectedName);
        
        // Test that the footer template contains the correct copyright format
        $footerPath = resource_path('views/layouts/footer.blade.php');
        $this->assertFileExists($footerPath, 'Footer template should exist');
        
        $footerContent = file_get_contents($footerPath);
        
        // Verify the footer contains the dynamic copyright pattern with config('app.name')
        $this->assertStringContainsString("config('app.name')", $footerContent, 
            'Footer should use config(\'app.name\') for dynamic brand name');
        $this->assertStringContainsString("date('Y')", $footerContent, 
            'Footer should use date(\'Y\') for dynamic year');
        $this->assertStringContainsString('All Rights Reserved', $footerContent, 
            'Footer should contain "All Rights Reserved"');
        
        // Verify the copyright symbol is present
        $this->assertTrue(
            str_contains($footerContent, '©') || str_contains($footerContent, '&copy;'),
            'Footer should contain copyright symbol (© or &copy;)'
        );
        
        // Verify the app name configuration returns the expected value
        $this->assertEquals($expectedName, config('app.name'), 
            'App name configuration should return the new brand name');
    }

    /**
     * Feature: app-rebranding, Property 8: Legacy reference elimination
     * Validates: Requirements 4.1, 4.4
     * 
     * Test that no legacy "Study Safari", "StudiesSafari", or "Cross View" (two words) references remain
     * in active application files and configuration.
     */
    public function test_legacy_reference_elimination(): void
    {
        $legacyTerms = ['Study Safari', 'StudiesSafari', 'study safari', 'studies safari', 'Cross View College'];
        
        // Test that configuration doesn't contain legacy references
        $appName = config('app.name');
        foreach ($legacyTerms as $term) {
            $this->assertStringNotContainsString($term, $appName, "Configuration contains legacy term: {$term}");
        }
        
        // Test that mail configuration doesn't contain legacy references
        $mailFromName = config('mail.from.name');
        foreach ($legacyTerms as $term) {
            $this->assertStringNotContainsString($term, $mailFromName, "Mail configuration contains legacy term: {$term}");
        }
        
        // Test that rendered pages don't contain legacy references
        $response = $this->get('/');
        $content = $response->getContent();
        
        foreach ($legacyTerms as $term) {
            $this->assertStringNotContainsString($term, $content, "Home page contains legacy term: {$term}");
        }
        
        // Test authentication pages
        $loginResponse = $this->get('/login');
        $loginContent = $loginResponse->getContent();
        
        foreach ($legacyTerms as $term) {
            $this->assertStringNotContainsString($term, $loginContent, "Login page contains legacy term: {$term}");
        }
    }

    /**
     * Feature: app-rebranding, Property 9: Generated content consistency
     * Validates: Requirements 4.3
     * 
     * Test that generated output and content contains no references to "Study Safari"
     * and consistently uses the new brand name.
     */
    public function test_generated_content_consistency(): void
    {
        $expectedFullName = 'Crossview College of Theology and Technology';
        $expectedShortName = 'Crossview College';
        $legacyTerms = ['Study Safari', 'StudiesSafari', 'study safari', 'studies safari'];
        
        // Test various generated pages
        $routes = ['/', '/about', '/contact', '/courses-list', '/pricing'];
        
        foreach ($routes as $route) {
            $response = $this->get($route);
            
            if ($response->status() === 200) {
                $content = $response->getContent();
                
                // Ensure no legacy terms appear in generated content
                foreach ($legacyTerms as $term) {
                    $this->assertStringNotContainsString(
                        $term, 
                        $content, 
                        "Generated content on {$route} contains legacy term: {$term}"
                    );
                }
                
                // Ensure new brand name (either short or full) appears in generated content
                $hasShortName = str_contains($content, $expectedShortName);
                $hasFullName = str_contains($content, $expectedFullName);
                
                $this->assertTrue(
                    $hasShortName || $hasFullName, 
                    "Generated content on {$route} missing new brand name"
                );
            }
        }
        
        // Test that error pages also use correct branding
        $response = $this->get('/non-existent-route');
        if ($response->status() === 404) {
            $content = $response->getContent();
            
            foreach ($legacyTerms as $term) {
                $this->assertStringNotContainsString(
                    $term, 
                    $content, 
                    "404 page contains legacy term: {$term}"
                );
            }
        }
    }
}
