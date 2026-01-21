import { useEffect } from 'react';

/**
 * Component that applies platform branding (favicon) from props.
 * This is a renderless component that should be placed high in the component tree.
 * 
 * @param {string} faviconUrl - URL of the favicon to set
 */
export default function PlatformBranding({ faviconUrl }) {
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

    return null; // This component doesn't render anything
}
