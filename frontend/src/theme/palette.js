/**
 * LMS color palette
 * Supports both light and dark modes
 *
 * Primary: LMS Green (#166534)
 * Secondary: LMS Dark Green (#14532D)
 * Success: LMS Bright Green (#22C55E)
 * Warning: Amber (#F59E0B)
 */

import { generatePaletteFromColor } from "./utils/colorUtils";

const lightPalette = {
    mode: "light",
    primary: {
        lighter: "#DCFCE7",
        light: "#4ADE80",
        main: "#166534",
        dark: "#14532D",
        darker: "#052E16",
        contrastText: "#FFFFFF",
    },
    secondary: {
        lighter: "#ECFDF5",
        light: "#34D399",
        main: "#14532D",
        dark: "#0F3D22",
        darker: "#052E16",
        contrastText: "#FFFFFF",
    },
    success: {
        lighter: "#F0FDF4",
        light: "#4ADE80",
        main: "#22C55E",
        dark: "#16A34A",
        darker: "#15803D",
        contrastText: "#FFFFFF",
    },
    warning: {
        lighter: "#FEF3C7",
        light: "#FBBF24",
        main: "#F59E0B",
        dark: "#D97706",
        darker: "#92400E",
        contrastText: "#052E16",
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
        default: "#F4F7F5",
        paper: "#FFFFFF",
    },
    action: {
        hover: "rgba(0, 0, 0, 0.04)",
        selected: "rgba(0, 0, 0, 0.08)",
    },
};

const darkPalette = {
    mode: "dark",
    primary: {
        lighter: "#123B24",
        light: "#4ADE80",
        main: "#86EFAC",
        dark: "#BBF7D0",
        darker: "#DCFCE7",
        contrastText: "#052E16",
    },
    secondary: {
        lighter: "#10311F",
        light: "#34D399",
        main: "#6EE7B7",
        dark: "#A7F3D0",
        darker: "#D1FAE5",
        contrastText: "#052E16",
    },
    success: {
        lighter: "#14532D",
        light: "#4ADE80",
        main: "#86EFAC",
        dark: "#BBF7D0",
        darker: "#DCFCE7",
        contrastText: "#0F172A",
    },
    warning: {
        lighter: "#78350F",
        light: "#FBBF24",
        main: "#FCD34D",
        dark: "#FDE68A",
        darker: "#FEF3C7",
        contrastText: "#052E16",
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
        primary: "#F4FBF6",
        secondary: "#B6D4BF",
    },
    divider: "#284A34",
    background: {
        default: "#071B10",
        paper: "#102A1A",
    },
    action: {
        hover: "rgba(255, 255, 255, 0.08)",
        selected: "rgba(255, 255, 255, 0.12)",
    },
};

export default function palette(mode = "light", brandColors = {}) {
    const { primaryColor, secondaryColor } = brandColors;
    const basePalette = mode === "dark" ? darkPalette : lightPalette;

    // Use base palette as starting point
    const mergedPalette = { ...basePalette };

    // Override primary if custom color provided
    if (primaryColor) {
        mergedPalette.primary = generatePaletteFromColor(primaryColor, mode);
    }

    // Override secondary if custom color provided
    if (secondaryColor) {
        mergedPalette.secondary = generatePaletteFromColor(
            secondaryColor,
            mode,
        );
    }

    return mergedPalette;
}

// Export color constants for direct access (light mode defaults)
export const COLORS = {
    PRIMARY: "#166534",
    SECONDARY: "#14532D",
    SUCCESS: "#22C55E",
    WARNING: "#F59E0B",
    INFO: "#3B82F6",
    ERROR: "#EF4444",
    TEXT_PRIMARY: "#1A1C1E",
    TEXT_SECONDARY: "#42474E",
    DIVIDER: "#E2E8F0",
    BACKGROUND: "#F4F7F5",
};
