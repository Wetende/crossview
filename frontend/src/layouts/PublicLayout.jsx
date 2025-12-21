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

/**
 * PublicLayout - Layout wrapper for public pages with tenant branding.
 * Applies tenant branding CSS variables and handles error states.
 * Requirements: 6.5, 6.6
 */
export default function PublicLayout({ children, showHeader = true, showFooter = true }) {
    const { tenant, flash } = usePage().props;

    // Handle inactive tenant
    if (tenant && !tenant.isActive) {
        return (
            <ErrorState
                title="Institution Unavailable"
                message="This institution's portal is currently unavailable. Please contact the administrator."
            />
        );
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                bgcolor: "background.default",
                // Apply tenant branding as CSS variables
                "--tenant-primary": tenant?.primaryColor || "#3B82F6",
                "--tenant-secondary": tenant?.secondaryColor || "#1E40AF",
            }}
        >
            {/* Flash Messages */}
            {flash?.length > 0 && (
                <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 9999 }}>
                    <Stack spacing={1}>
                        {flash.map((msg, idx) => (
                            <Alert key={idx} severity={getSeverity(msg.type)}>
                                {msg.message}
                            </Alert>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Header */}
            {showHeader && tenant && (
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
                        {tenant.logoUrl && (
                            <Box
                                component="img"
                                src={tenant.logoUrl}
                                alt={tenant.institutionName}
                                sx={{ height: 40 }}
                            />
                        )}
                        <Typography variant="h6" fontWeight={600}>
                            {tenant.institutionName}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <Button component={Link} href="/login/" variant="outlined">
                            Sign In
                        </Button>
                        {tenant.registrationEnabled && (
                            <Button component={Link} href="/register/" variant="contained">
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
                <Box sx={{ py: 3, textAlign: "center", borderTop: 1, borderColor: "divider" }}>
                    <Typography variant="body2" color="text.secondary">
                        {tenant ? `Powered by Crossview LMS` : `© ${new Date().getFullYear()} Crossview LMS`}
                    </Typography>
                </Box>
            )}

            {/* Custom CSS injection for tenant branding */}
            {tenant?.customCss && (
                <style dangerouslySetInnerHTML={{ __html: tenant.customCss }} />
            )}
        </Box>
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
                <Typography variant="h4" fontWeight={600} color="error" gutterBottom>
                    {title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
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

/**
 * Map flash message type to MUI severity
 */
function getSeverity(type) {
    const map = {
        success: "success",
        error: "error",
        warning: "warning",
        info: "info",
    };
    return map[type] || "info";
}
