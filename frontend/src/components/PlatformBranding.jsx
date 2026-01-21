import { useEffect } from 'react';

/**
 * Component that applies platform branding (favicon and document title) from props.
 * This is a renderless component that should be placed high in the component tree.
 * 
 * @param {string} faviconUrl - URL of the favicon to set
 * @param {string} platformName - Name of the platform to show in browser tab (defaults to "LMS")
 */
export default function PlatformBranding({ faviconUrl, platformName }) {
    // Update favicon
    useEffect(() => {
        if (!faviconUrl) return;

        // Find existing favicon link or create one
        let existingLink = document.querySelector("link[rel='icon']");
        if (!existingLink) {
            existingLink = document.createElement('link');
            existingLink.rel = 'icon';
            document.head.appendChild(existingLink);
        }
        
        existingLink.href = faviconUrl;

        // Also update shortcut icon for broader browser support
        let shortcutLink = document.querySelector("link[rel='shortcut icon']");
        if (!shortcutLink) {
            shortcutLink = document.createElement('link');
            shortcutLink.rel = 'shortcut icon';
            document.head.appendChild(shortcutLink);
        }
        shortcutLink.href = faviconUrl;

    }, [faviconUrl]);

    // Update document title (browser tab name)
    useEffect(() => {
        // Use platform name if provided, otherwise default to "LMS"
        document.title = platformName || 'LMS';
    }, [platformName]);

    return null; // This component doesn't render anything
}
