import { Box, Paper, Typography } from "@mui/material";

/**
 * Lightweight sidebar positioning shell that mirrors the Curriculum sidebar layout.
 * Provides: fixed-width Paper | optional header | scrollable body.
 *
 * Usage:
 *   <PanelSidebar title="Settings" width={240}>
 *       <List>your nav items</List>
 *   </PanelSidebar>
 */
export default function PanelSidebar({
    title,
    width = 320,
    children,
    sx,
    contentSx,
}) {
    return (
        <Paper
            elevation={0}
            square
            sx={{
                width,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                bgcolor: "transparent",
                borderRight: 1,
                borderColor: "divider",
                overflow: "hidden",
                ...sx,
            }}
        >
            {title && (
                <Box
                    sx={{
                        px: { xs: 2.25, md: 2.5 },
                        pt: { xs: 2, md: 3.5 },
                        pb: { xs: 1.5, md: 2.5 },
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 500,
                            letterSpacing: 0,
                            fontSize: { xs: 26, md: 34 },
                            lineHeight: 1.1,
                        }}
                    >
                        {title}
                    </Typography>
                </Box>
            )}

            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    px: { xs: 2, md: 2.25 },
                    pb: { xs: 2, md: 3 },
                    ...contentSx,
                }}
            >
                {children}
            </Box>
        </Paper>
    );
}
