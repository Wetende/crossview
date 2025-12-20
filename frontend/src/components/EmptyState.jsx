import { Box, Typography, Button } from "@mui/material";
import { IconInbox } from "@tabler/icons-react";

/**
 * EmptyState - Displays when no data is available
 *
 * @param {ReactNode} icon - Custom icon (defaults to IconInbox)
 * @param {string} title - Main message
 * @param {string} description - Secondary description
 * @param {object} action - { label, onClick } for action button
 */
export default function EmptyState({
    icon,
    title = "No data found",
    description,
    action,
}) {
    const Icon = icon || IconInbox;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
                px: 3,
                textAlign: "center",
            }}
        >
            <Box
                sx={{
                    p: 3,
                    borderRadius: "50%",
                    backgroundColor: "grey.100",
                    color: "grey.500",
                    mb: 3,
                }}
            >
                {typeof Icon === "function" ? (
                    <Icon size={48} stroke={1.5} />
                ) : (
                    Icon
                )}
            </Box>

            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>

            {description && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ maxWidth: 400, mb: action ? 3 : 0 }}
                >
                    {description}
                </Typography>
            )}

            {action && (
                <Button
                    variant="contained"
                    onClick={action.onClick}
                    startIcon={action.icon}
                >
                    {action.label}
                </Button>
            )}
        </Box>
    );
}
