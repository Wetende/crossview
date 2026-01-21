/**
 * Theme Context - Global dark/light mode state
 * Persists user preference to localStorage
 */

import { createContext, useContext, useState, useEffect, useMemo } from "react";

const STORAGE_KEY = "lms_theme_main";

const ThemeContext = createContext({
    mode: "light",
    isDark: false,
    toggleMode: () => {},
    setMode: () => {},
});

export function ThemeModeProvider({
    children,
    initialPlatform = null,
    forcedMode = null,
    storageKey = STORAGE_KEY,
}) {
    const [stateMode, setModeState] = useState(() => {
        if (forcedMode) return forcedMode;
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(storageKey);
            if (stored === "dark" || stored === "light") {
                return stored;
            }
            // Check system preference
            if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
                return "dark";
            }
        }
        return "light";
    });

    const mode = forcedMode || stateMode;

    // State for dynamic platform brand colors
    const [platformColors, setPlatformColors] = useState({
        primaryColor: initialPlatform?.primaryColor || null,
        secondaryColor: initialPlatform?.secondaryColor || null,
    });

    // Sync state if initialPlatform prop changes
    useEffect(() => {
        setPlatformColors({
            primaryColor: initialPlatform?.primaryColor || null,
            secondaryColor: initialPlatform?.secondaryColor || null,
        });
    }, [initialPlatform]);

    // Persist to localStorage (only if not forced)
    useEffect(() => {
        if (!forcedMode && typeof window !== "undefined") {
            localStorage.setItem(storageKey, mode);
        }
    }, [mode, forcedMode, storageKey]);

    const toggleMode = () => {
        if (!forcedMode) {
            setModeState((prev) => (prev === "light" ? "dark" : "light"));
        }
    };

    const setMode = (newMode) => {
        if (!forcedMode && (newMode === "light" || newMode === "dark")) {
            setModeState(newMode);
        }
    };

    const value = useMemo(
        () => ({
            mode,
            isDark: mode === "dark",
            toggleMode,
            setMode,
            platformColors,
            setPlatformColors,
        }),
        [mode, platformColors],
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
}

export function useThemeMode() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useThemeMode must be used within a ThemeModeProvider");
    }
    return context;
}

export default ThemeContext;
