import { Box } from "@mui/material";

/**
 * VisuallyHidden
 * safely hides content from the screen while keeping it accessible to screen readers and search engines.
 * This is the modern, SEO-compliant way to include rich text without cluttering the visual UI.
 */
export default function VisuallyHidden({ children, component = "span" }) {
    return (
        <Box
            component={component}
            sx={{
                position: "absolute",
                width: "1px",
                height: "1px",
                padding: 0,
                margin: "-1px",
                overflow: "hidden",
                clip: "rect(0, 0, 0, 0)",
                whiteSpace: "nowrap",
                border: 0,
            }}
        >
            {children}
        </Box>
    );
}
