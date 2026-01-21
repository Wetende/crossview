/**
 * Color manipulation utilities for dynamic theming
 * No external dependencies required
 */

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color (e.g., "#10B981" or "#FFF")
 * @returns {object} {r, g, b} or null if invalid
 */
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
}

/**
 * Convert RGB object to hex string
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color string
 */
function rgbToHex(r, g, b) {
    return (
        "#" +
        ((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16)
            .slice(1)
            .toUpperCase()
    );
}

/**
 * Lighten a hex color by a percentage
 * @param {string} hex - Hex color (e.g., "#10B981")
 * @param {number} percent - 0 to 1 (e.g., 0.2 = 20% lighter)
 * @returns {string} New hex color
 */
export function lighten(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const r = Math.round(rgb.r + (255 - rgb.r) * percent);
    const g = Math.round(rgb.g + (255 - rgb.g) * percent);
    const b = Math.round(rgb.b + (255 - rgb.b) * percent);

    return rgbToHex(
        Math.min(255, Math.max(0, r)),
        Math.min(255, Math.max(0, g)),
        Math.min(255, Math.max(0, b)),
    );
}

/**
 * Darken a hex color by a percentage
 * @param {string} hex - Hex color (e.g., "#10B981")
 * @param {number} percent - 0 to 1 (e.g., 0.2 = 20% darker)
 * @returns {string} New hex color
 */
export function darken(hex, percent) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const r = Math.round(rgb.r * (1 - percent));
    const g = Math.round(rgb.g * (1 - percent));
    const b = Math.round(rgb.b * (1 - percent));

    return rgbToHex(
        Math.min(255, Math.max(0, r)),
        Math.min(255, Math.max(0, g)),
        Math.min(255, Math.max(0, b)),
    );
}

/**
 * Calculate relative luminance
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(r, g, b) {
    const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Determine if text should be black or white for contrast
 * @param {string} hex - Background hex color
 * @returns {string} "#FFFFFF" or "#0F172A" (dark slate)
 */
export function getContrastText(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return "#FFFFFF";

    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);

    // Threshold of 0.5 is standard, but usually prefer darker text on mid-tones
    return luminance > 0.5 ? "#0F172A" : "#FFFFFF";
}

/**
 * Generate full MUI palette object from single color
 * @param {string} hexColor - Checkbox provided hex color
 * @param {string} mode - 'light' or 'dark'
 * @returns {object} MUI palette field object
 */
export function generatePaletteFromColor(hexColor, mode = "light") {
    if (!hexColor) return null;

    // In dark mode, use a lighter variant of the brand color as the main color
    // to ensure good visibility against the dark background.
    const isDark = mode === "dark";
    const mainColor = isDark ? lighten(hexColor, 0.3) : hexColor;

    return {
        lighter: lighten(hexColor, 0.8),
        light: lighten(hexColor, 0.3),
        main: mainColor,
        dark: darken(hexColor, 0.15),
        darker: darken(hexColor, 0.3),
        contrastText: getContrastText(mainColor),
    };
}
