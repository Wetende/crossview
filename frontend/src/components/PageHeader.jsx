import { Box, Typography, Button, Stack } from "@mui/material";

/**
 * PageHeader - Displays page title, subtitle, and action buttons
 */
export default function PageHeader({
    title,
    subtitle,
    actions = [],
    breadcrumbs,
}) {
    return (
        <Box sx={{ mb: 3 }}>
            {breadcrumbs}

            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", sm: "center" },
                    gap: 2,
                }}
            >
                <Box>
                    <Typography
                        variant="h4"
                        component="h1"
                        gutterBottom={!!subtitle}
                    >
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body1" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>

                {actions.length > 0 && (
                    <Stack direction="row" spacing={1}>
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                variant={action.variant || "contained"}
                                color={action.color || "primary"}
                                startIcon={action.icon}
                                onClick={action.onClick}
                                disabled={action.disabled}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}
