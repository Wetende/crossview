/**
 * Crossview LMS Color Palette
 *
 * Primary: Deep Blue (#2563EB) - Trust and professionalism
 * Secondary: Vibrant Teal (#14B8A6) - Innovation and digital learning
 * Success: Fresh Green (#10B981) - Progress, achievements, completion
 * Warning: Warm Coral (#F97316) - CTAs and important notifications
 * Info: Soft Sky Blue (#3B82F6) - Backgrounds and hover states
 */

export default function palette() {
    const textPrimary = "#1A1C1E";
    const textSecondary = "#42474E";
    const divider = "#C2C7CE";
    const background = "#F8FAFC";

    return {
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
            600: divider,
            700: "#475569",
            800: textSecondary,
            900: textPrimary,
        },
        text: {
            primary: textPrimary,
            secondary: textSecondary,
        },
        divider,
        background: {
            default: background,
            paper: "#FFFFFF",
        },
    };
}

// Export color constants for direct access
export const COLORS = {
    PRIMARY: "#2563EB",
    SECONDARY: "#14B8A6",
    SUCCESS: "#10B981",
    WARNING: "#F97316",
    INFO: "#3B82F6",
    ERROR: "#EF4444",
    TEXT_PRIMARY: "#1A1C1E",
    TEXT_SECONDARY: "#42474E",
    DIVIDER: "#C2C7CE",
    BACKGROUND: "#F8FAFC",
};
