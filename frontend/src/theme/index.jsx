import { useMemo } from "react";
import {
    createTheme,
    ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeModeProvider, useThemeMode } from "./ThemeContext";
import palette from "./palette";
import typography from "./typography";
import componentsOverride from "./overrides";

/**
 * Inner ThemeProvider - Creates MUI theme based on current mode
 * `extendTheme(theme)` returns theme options merged in last, so a surface
 * can adjust the shared theme without losing component overrides.
 */
function ThemeProviderInner({ children, extendTheme }) {
    const { mode, platformColors } = useThemeMode();

    const theme = useMemo(() => {
        const themePalette = palette(mode, platformColors);

        // Create base theme with breakpoints and palette
        let themeDefault = createTheme({
            breakpoints: {
                values: {
                    xs: 0,
                    sm: 768,
                    md: 1024,
                    lg: 1266,
                    xl: 1440,
                },
            },
            direction: "ltr",
            palette: themePalette,
            shape: {
                borderRadius: 8,
            },
        });

        // Add typography with responsive sizing
        let themeWithTypography = createTheme({
            ...themeDefault,
            typography: typography(themeDefault),
        });

        // Add component overrides
        themeWithTypography.components =
            componentsOverride(themeWithTypography);

        if (extendTheme) {
            return createTheme(
                themeWithTypography,
                extendTheme(themeWithTypography),
            );
        }

        return themeWithTypography;
    }, [mode, platformColors, extendTheme]);

    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            {children}
        </MuiThemeProvider>
    );
}

/**
 * ThemeProvider - Wraps the application with MUI theme
 * Applies platform branding colors, typography, and component overrides
 * Supports dark/light mode switching
 */
export default function ThemeProvider({
    children,
    platform = null,
    forcedMode = null,
    storageKey = undefined,
    extendTheme = null,
}) {
    return (
        <ThemeModeProvider
            initialPlatform={platform}
            forcedMode={forcedMode}
            storageKey={storageKey}
        >
            <ThemeProviderInner extendTheme={extendTheme}>
                {children}
            </ThemeProviderInner>
        </ThemeModeProvider>
    );
}

// Re-export the hook for convenience
export { useThemeMode } from "./ThemeContext";
