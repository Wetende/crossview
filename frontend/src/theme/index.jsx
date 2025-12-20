import { useMemo } from "react";
import {
    createTheme,
    ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import palette from "./palette";
import typography from "./typography";
import componentsOverride from "./overrides";

/**
 * ThemeProvider - Wraps the application with MUI theme
 * Applies Crossview branding colors, typography, and component overrides
 */
export default function ThemeProvider({ children }) {
    const themePalette = useMemo(() => palette(), []);

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
    let theme = createTheme({
        ...themeDefault,
        typography: typography(themeDefault),
    });

    // Add component overrides
    theme.components = componentsOverride(theme);

    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            {children}
        </MuiThemeProvider>
    );
}
