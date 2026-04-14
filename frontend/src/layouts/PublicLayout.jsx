import PropTypes from "prop-types";
import { usePage, Link } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Button,
    Stack,
    Alert,
} from "@mui/material";
import ThemeProvider from "@/theme";
import { getFlashMessages, getFlashSeverity } from "@/utils/userMessages";
import PlatformLogo from "@/components/common/PlatformLogo";

/**
 * PublicLayout - Layout wrapper for public pages with platform branding.
 * Applies platform branding CSS variables and handles error states.
 * Requirements: 6.5, 6.6
 */
export default function PublicLayout({
    children,
    showHeader = true,
    showFooter = true,
}) {
    const { platform, flash } = usePage().props;
    const flashMessages = getFlashMessages(flash);

    // Handle inactive platform
    if (platform && !platform.isActive) {
        return (
            <ErrorState
                title="Institution Unavailable"
                message="This institution's portal is currently unavailable. Please contact the administrator."
            />
        );
    }

    return (
        <ThemeProvider>
            <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                bgcolor: "background.default",
                // Apply platform branding as CSS variables
                "--platform-primary": platform?.primaryColor || "#3B82F6",
                "--platform-secondary": platform?.secondaryColor || "#1E40AF",
            }}
        >
            {/* Flash Messages */}
            {flashMessages.length > 0 && (
                <Box
                    sx={{ position: "fixed", top: 16, right: 16, zIndex: 9999 }}
                >
                    <Stack spacing={1}>
                        {flashMessages.map((msg, idx) => (
                            <Alert key={idx} severity={getFlashSeverity(msg.type)}>
                                {msg.message}
                            </Alert>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Header */}
            {showHeader && platform && (
                <Box
                    sx={{
                        py: 2,
                        px: 3,
                        borderBottom: 1,
                        borderColor: "divider",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <PlatformLogo
                            platform={platform}
                            showNameWhenLogo
                            logoHeight={40}
                            logoMaxWidth={140}
                            nameVariant="h6"
                            nameFontWeight={600}
                        />
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button
                            component={Link}
                            href="/login/"
                            variant="outlined"
                        >
                            Sign In
                        </Button>
                        {platform.registrationEnabled && (
                            <Button
                                component={Link}
                                href="/register/"
                                variant="contained"
                            >
                                Register
                            </Button>
                        )}
                    </Stack>
                </Box>
            )}

            {/* Main Content */}
            <Box sx={{ flexGrow: 1 }}>{children}</Box>

            {/* Footer */}
            {showFooter && (
                <Box
                    sx={{
                        py: 3,
                        textAlign: "center",
                        borderTop: 1,
                        borderColor: "divider",
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        {platform
                            ? `Powered by Crossview LMS`
                            : `© ${new Date().getFullYear()} Crossview LMS`}
                    </Typography>
                </Box>
            )}

            {/* Custom CSS injection for platform branding */}
            {platform?.customCss && (
                <style dangerouslySetInnerHTML={{ __html: platform.customCss }} />
            )}
            </Box>
        </ThemeProvider>
    );
}

PublicLayout.propTypes = {
    children: PropTypes.node.isRequired,
    showHeader: PropTypes.bool,
    showFooter: PropTypes.bool,
};

/**
 * Error State Component
 * Requirements: 6.5, 6.6
 */
function ErrorState({ title, message }) {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.default",
                px: 2,
            }}
        >
            <Container maxWidth="sm" sx={{ textAlign: "center" }}>
                <Typography
                    variant="h4"
                    fontWeight={600}
                    color="error"
                    gutterBottom
                >
                    {title}
                </Typography>
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 4 }}
                >
                    {message}
                </Typography>
                <Button component={Link} href="/" variant="contained">
                    Go to Homepage
                </Button>
            </Container>
        </Box>
    );
}

ErrorState.propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
};
