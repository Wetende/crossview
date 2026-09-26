import { Link } from "@inertiajs/react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { VisibilityOutlined } from "@mui/icons-material";

/**
 * Persistent notice shown above a free preview lesson, with the enroll CTA
 * (same enrollment decision and wording as the public course page).
 */
const PreviewBanner = ({ enrollCta = null }) => (
    <Box
        component="section"
        aria-label="Free preview"
        sx={{
            flexShrink: 0,
            px: { xs: 2, sm: 3 },
            py: 1,
            bgcolor: "primary.lighter",
            borderBottom: "1px solid",
            borderColor: "divider",
        }}
    >
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                maxWidth: 900,
                mx: "auto",
            }}
        >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <VisibilityOutlined fontSize="small" color="primary" />
                <Typography
                    variant="body2"
                    color="textPrimary"
                    sx={{ fontWeight: 600 }}
                >
                    You&apos;re previewing a free lesson
                </Typography>
            </Stack>
            {enrollCta?.href && (
                <Button
                    component={Link}
                    href={enrollCta.href}
                    variant="contained"
                    size="small"
                    sx={{ textTransform: "none", flexShrink: 0 }}
                >
                    {enrollCta.label}
                </Button>
            )}
        </Stack>
    </Box>
);

export default PreviewBanner;
