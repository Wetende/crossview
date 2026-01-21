/**
 * Crossview LMS Color Palette
 * Supports both light and dark modes
 *
 * Primary: Deep Blue (#2563EB) - Trust and professionalism
 * Secondary: Vibrant Teal (#14B8A6) - Innovation and digital learning
 * Success: Fresh Green (#10B981) - Progress, achievements, completion
 * Warning: Warm Coral (#F97316) - CTAs and important notifications
 * Info: Soft Sky Blue (#3B82F6) - Backgrounds and hover states
 */

import { generatePaletteFromColor } from './utils/colorUtils';

const lightPalette = {
    mode: 'light',
    primary: {
        lighter: "#DBEAFE",
        light: "#3B82F6",
        main: "#2563EB",
        dark: "#1E40AF",
        darker: "#1E3A8A",
        contrastText: "#FFFFFF",
    },
    secondary: {
        lighter: "#CCFBF1",
        light: "#2DD4BF",
        main: "#14B8A6",
        dark: "#0D9488",
        darker: "#115E59",
        contrastText: "#FFFFFF",
    },
    success: {
        lighter: "#D1FAE5",
        light: "#34D399",
        main: "#10B981",
        dark: "#059669",
        darker: "#065F46",
        contrastText: "#FFFFFF",
    },
    warning: {
        lighter: "#FFEDD5",
        light: "#FB923C",
        main: "#F97316",
        dark: "#EA580C",
        darker: "#9A3412",
        contrastText: "#FFFFFF",
    },
    info: {
        lighter: "#DBEAFE",
        light: "#60A5FA",
        main: "#3B82F6",
        dark: "#2563EB",
        darker: "#1E40AF",
        contrastText: "#FFFFFF",
    },
    error: {
        lighter: "#FEE2E2",
        light: "#F87171",
        main: "#EF4444",
        dark: "#DC2626",
        darker: "#991B1B",
        contrastText: "#FFFFFF",
    },
    grey: {
        50: "#F8FAFC",
        100: "#F1F5F9",
        200: "#E2E8F0",
        300: "#CBD5E1",
        400: "#94A3B8",
        500: "#64748B",
        600: "#475569",
        700: "#334155",
        800: "#1E293B",
        900: "#0F172A",
    },
    text: {
        primary: "#1A1C1E",
        secondary: "#42474E",
    },
    divider: "#E2E8F0",
    background: {
        default: "#F8FAFC",
        paper: "#FFFFFF",
    },
    action: {
        hover: "rgba(0, 0, 0, 0.04)",
        selected: "rgba(0, 0, 0, 0.08)",
    },
};

const darkPalette = {
    mode: 'dark',
    primary: {
        lighter: "#1E3A8A",
        light: "#3B82F6",
        main: "#60A5FA",
        dark: "#93C5FD",
        darker: "#DBEAFE",
        contrastText: "#0F172A",
    },
    secondary: {
        lighter: "#115E59",
        light: "#2DD4BF",
        main: "#5EEAD4",
        dark: "#99F6E4",
        darker: "#CCFBF1",
        contrastText: "#0F172A",
    },
    success: {
        lighter: "#065F46",
        light: "#34D399",
        main: "#6EE7B7",
        dark: "#A7F3D0",
        darker: "#D1FAE5",
        contrastText: "#0F172A",
    },
    warning: {
        lighter: "#9A3412",
        light: "#FB923C",
        main: "#FDBA74",
        dark: "#FED7AA",
        darker: "#FFEDD5",
        contrastText: "#0F172A",
    },
    info: {
        lighter: "#1E40AF",
        light: "#60A5FA",
        main: "#93C5FD",
        dark: "#BFDBFE",
        darker: "#DBEAFE",
        contrastText: "#0F172A",
    },
    error: {
        lighter: "#991B1B",
        light: "#F87171",
        main: "#FCA5A5",
        dark: "#FECACA",
        darker: "#FEE2E2",
        contrastText: "#0F172A",
    },
    grey: {
        50: "#0F172A",
        100: "#1E293B",
        200: "#334155",
        300: "#475569",
        400: "#64748B",
        500: "#94A3B8",
        600: "#CBD5E1",
        700: "#E2E8F0",
        800: "#F1F5F9",
        900: "#F8FAFC",
    },
    text: {
        primary: "#F1F5F9",
        secondary: "#94A3B8",
    },
    divider: "#334155",
    background: {
        default: "#0F172A",
        paper: "#1E293B",
    },
    action: {
        hover: "rgba(255, 255, 255, 0.08)",
        selected: "rgba(255, 255, 255, 0.12)",
    },
};

export default function palette(mode = 'light', brandColors = {}) {
    const { primaryColor, secondaryColor } = brandColors;
    const basePalette = mode === 'dark' ? darkPalette : lightPalette;

    // Use base palette as starting point
    const mergedPalette = { ...basePalette };

    // Override primary if custom color provided
    if (primaryColor) {
        mergedPalette.primary = generatePaletteFromColor(primaryColor, mode);
    }

    // Override secondary if custom color provided
    if (secondaryColor) {
        mergedPalette.secondary = generatePaletteFromColor(secondaryColor, mode);
    }

    return mergedPalette;
}

// Export color constants for direct access (light mode defaults)
export const COLORS = {
    PRIMARY: "#2563EB",
    SECONDARY: "#14B8A6",
    SUCCESS: "#10B981",
    WARNING: "#F97316",
    INFO: "#3B82F6",
    ERROR: "#EF4444",
    TEXT_PRIMARY: "#1A1C1E",
    TEXT_SECONDARY: "#42474E",
    DIVIDER: "#E2E8F0",
    BACKGROUND: "#F8FAFC",
};
