import { Link } from "@inertiajs/react";
import {
    Box,
    Container,
    Stack,
    Typography,
    Button,
    AppBar,
    Toolbar,
    useScrollTrigger,
    useTheme,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";
import { IconBrandTabler, IconMenu2, IconX } from "@tabler/icons-react";
import { cloneElement, useState } from "react";
import ButtonAnimationWrapper from "./ButtonAnimationWrapper";

// Navigation links - Single source of truth
const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Programs", href: "/programs/" },
    { label: "Events", href: "/events/" },
    { label: "About", href: "/about/" },
    { label: "Contact", href: "/contact/" },
];

// Elevation scroll effect
function ElevationScroll({ children }) {
    const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 0 });
    return cloneElement(children, {
        elevation: trigger ? 4 : 0,
        sx: {
            bgcolor: trigger ? "rgba(255, 255, 255, 0.9)" : "transparent",
            backdropFilter: trigger ? "blur(20px)" : "none",
            borderBottom: trigger ? 1 : 0,
            borderColor: "divider",
            transition: "all 0.3s ease",
            py: trigger ? 1 : 2,
        },
    });
}

/**
 * PublicNavbar - Shared navigation component for all public pages
 * @param {string} activeLink - The href of the currently active page (e.g., "/about/")
 * @param {boolean} showAuth - Whether to show Sign In / Get Started buttons (default: true)
 * @param {object} auth - Auth object from usePage().props to check if user is logged in
 */
export default function PublicNavbar({ activeLink = "/", showAuth = true, auth = null }) {
    const theme = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (href) => activeLink === href;

    return (
        <>
            <ElevationScroll>
                <AppBar position="fixed" color="transparent" sx={{ py: 2 }}>
                    <Container maxWidth="lg">
                        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
                            {/* Logo */}
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Box
                                    component={Link}
                                    href="/"
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: "primary.main",
                                        borderRadius: 2,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        textDecoration: "none",
                                    }}
                                >
                                    <IconBrandTabler size={24} />
                                </Box>
                                <Typography
                                    component={Link}
                                    href="/"
                                    variant="h5"
                                    fontWeight={700}
                                    sx={{ color: "grey.900", textDecoration: "none" }}
                                >
                                    Crossview
                                </Typography>
                            </Stack>

                            {/* Desktop Navigation */}
                            <Stack
                                direction="row"
                                spacing={3}
                                sx={{ display: { xs: "none", md: "flex" } }}
                            >
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        style={{
                                            textDecoration: "none",
                                            color: isActive(link.href)
                                                ? theme.palette.primary.main
                                                : theme.palette.text.primary,
                                            fontWeight: isActive(link.href) ? 600 : 500,
                                        }}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </Stack>

                            {/* CTA Buttons */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                {showAuth && (
                                    <>
                                        {auth?.user ? (
                                            <Button
                                                component={Link}
                                                href="/dashboard/"
                                                variant="contained"
                                                sx={{ borderRadius: 100, px: 3 }}
                                            >
                                                Dashboard
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    component={Link}
                                                    href="/login/"
                                                    color="inherit"
                                                    sx={{
                                                        fontWeight: 600,
                                                        display: { xs: "none", sm: "inline-flex" },
                                                    }}
                                                >
                                                    Sign In
                                                </Button>
                                                <ButtonAnimationWrapper>
                                                    <Button
                                                        component={Link}
                                                        href="/register/"
                                                        variant="contained"
                                                        sx={{
                                                            borderRadius: 100,
                                                            px: 3,
                                                            display: { xs: "none", sm: "inline-flex" },
                                                        }}
                                                    >
                                                        Get Started
                                                    </Button>
                                                </ButtonAnimationWrapper>
                                            </>
                                        )}
                                    </>
                                )}

                                {/* Mobile Menu Toggle */}
                                <IconButton
                                    sx={{ display: { md: "none" } }}
                                    onClick={() => setMobileMenuOpen(true)}
                                >
                                    <IconMenu2 />
                                </IconButton>
                            </Stack>
                        </Toolbar>
                    </Container>
                </AppBar>
            </ElevationScroll>

            {/* Mobile Drawer */}
            <Drawer
                anchor="right"
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                PaperProps={{ sx: { width: 280, p: 2 } }}
            >
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                    <IconButton onClick={() => setMobileMenuOpen(false)}>
                        <IconX />
                    </IconButton>
                </Box>
                <List>
                    {NAV_LINKS.map((link) => (
                        <ListItem
                            key={link.href}
                            component={Link}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            sx={{
                                color: isActive(link.href)
                                    ? "primary.main"
                                    : "text.primary",
                                fontWeight: isActive(link.href) ? 600 : 400,
                            }}
                        >
                            <ListItemText primary={link.label} />
                        </ListItem>
                    ))}
                    {showAuth && !auth?.user && (
                        <>
                            <ListItem component={Link} href="/login/">
                                <ListItemText primary="Sign In" />
                            </ListItem>
                            <ListItem>
                                <Button
                                    component={Link}
                                    href="/register/"
                                    variant="contained"
                                    fullWidth
                                    sx={{ borderRadius: 2 }}
                                >
                                    Get Started
                                </Button>
                            </ListItem>
                        </>
                    )}
                    {showAuth && auth?.user && (
                        <ListItem>
                            <Button
                                component={Link}
                                href="/dashboard/"
                                variant="contained"
                                fullWidth
                                sx={{ borderRadius: 2 }}
                            >
                                Dashboard
                            </Button>
                        </ListItem>
                    )}
                </List>
            </Drawer>
        </>
    );
}

// Export nav links for use in other components if needed
export { NAV_LINKS };
