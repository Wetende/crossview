import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * Loader - Displays a centered spinner with optional message
 *
 * @param {boolean} fullScreen - Whether to take full viewport height
 * @param {string} message - Optional loading message
 * @param {string} size - Spinner size: 'small' | 'medium' | 'large'
 */
export default function Loader({
    fullScreen = false,
    message,
    size = "medium",
}) {
    const sizeMap = {
        small: 24,
        medium: 40,
        large: 56,
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: fullScreen ? "100vh" : 200,
                gap: 2,
            }}
        >
            <CircularProgress
                size={sizeMap[size]}
                thickness={4}
                aria-label="Loading"
            />
            {message && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    aria-live="polite"
                >
                    {message}
                </Typography>
            )}
        </Box>
    );
}
