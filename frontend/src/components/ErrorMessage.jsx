import { Box, Typography, Button, Alert, AlertTitle } from "@mui/material";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";

/**
 * ErrorMessage - Displays error with optional retry
 *
 * @param {string} title - Error title
 * @param {string} message - Error description
 * @param {function} onRetry - Retry callback
 * @param {string} severity - 'error' | 'warning' | 'info'
 */
export default function ErrorMessage({
    title = "Something went wrong",
    message,
    onRetry,
    severity = "error",
}) {
    return (
        <Alert
            severity={severity}
            icon={<IconAlertCircle size={24} />}
            action={
                onRetry && (
                    <Button
                        color="inherit"
                        size="small"
                        onClick={onRetry}
                        startIcon={<IconRefresh size={16} />}
                    >
                        Retry
                    </Button>
                )
            }
        >
            <AlertTitle>{title}</AlertTitle>
            {message}
        </Alert>
    );
}

/**
 * FullPageError - Full page error display
 */
export function FullPageError({
    title = "Something went wrong",
    message = "An unexpected error occurred. Please try again.",
    onRetry,
}) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "50vh",
                textAlign: "center",
                px: 3,
            }}
        >
            <Box
                sx={{
                    p: 3,
                    borderRadius: "50%",
                    backgroundColor: "error.lighter",
                    color: "error.main",
                    mb: 3,
                }}
            >
                <IconAlertCircle size={48} stroke={1.5} />
            </Box>

            <Typography variant="h5" gutterBottom>
                {title}
            </Typography>

            <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 400, mb: 3 }}
            >
                {message}
            </Typography>

            {onRetry && (
                <Button
                    variant="contained"
                    onClick={onRetry}
                    startIcon={<IconRefresh size={18} />}
                >
                    Try Again
                </Button>
            )}
        </Box>
    );
}
