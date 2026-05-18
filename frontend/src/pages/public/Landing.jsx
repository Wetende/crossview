import { Head, Link, usePage } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Button,
    Stack,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ThemeProvider,
    createTheme,
    CssBaseline,
    useScrollTrigger,
    AppBar,
    Toolbar,
    Avatar,
    Menu,
    MenuItem,
    Divider,
} from "@mui/material";
import { IconMenu2, IconX, IconBell, IconDashboard, IconUser, IconLogout } from "@tabler/icons-react";
import { useState } from "react";
import useLogout from "@/hooks/useLogout";

// Components
import LazySection from "@/components/LazySection";
import PlatformLogo from "@/components/common/PlatformLogo";
import ButtonAnimationWrapper from "@/features/components/common/ButtonAnimationWrapper";

// Sections
import HeroSection from "@/components/sections/landing/HeroSection";
import Footer from "@/components/common/Footer";

// Skeletons
import CardGridSkeleton from "@/components/sections/landing/skeletons/CardGridSkeleton";
import ProgramSkeleton from "@/components/sections/landing/skeletons/ProgramSkeleton";

// Force light theme for landing page (isolate from dashboard dark mode)
const lightTheme = createTheme({
    palette: {
        mode: "light",
        background: {
            default: "#FAFAFA",
            paper: "#FFFFFF",
        },
        text: {
            primary: "#1F2937",
            secondary: "#6B7280",
        },
    },
});

// --- Main Component ---

export default function Landing() {
    const { platform, programs = [], stats = {} } = usePage().props;

    // If platform is set up, show the platform-specific landing
    if (platform) {
        return (
            <PlatformLanding
                platform={platform}
                programs={programs}
                stats={stats}
            />
        );
    }

    // Default marketing landing for unconfigured instances
    return (
        <>
            <Head title="LMS - The Chameleon Engine" />
            <Box
                sx={{
                    minHeight: "100vh",
                    bgcolor: "background.default",
                    overflowX: "hidden",
                }}
            >
                {/* Default landing for unconfigured instances */}
                <Container maxWidth="lg" sx={{ py: 20, textAlign: "center" }}>
                    <Typography variant="h2" fontWeight={700} gutterBottom>
                        Welcome to the LMS
                    </Typography>
                    <Typography
                        variant="h5"
                        color="text.secondary"
                        sx={{ mb: 4 }}
                    >
                        Please complete the setup wizard to configure your
                        platform.
                    </Typography>
                    <Button
                        component={Link}
                        href="/login/"
                        variant="contained"
                        size="large"
                        sx={{ borderRadius: 100, px: 4 }}
                    >
                        Get Started
                    </Button>
                </Container>
            </Box>
        </>
    );
}

// --- Platform Landing (Premium Design) ---

function PlatformLanding({ platform, programs = [], stats = {} }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuAnchor, setUserMenuAnchor] = useState(null);
    const { auth } = usePage().props;
    const user = auth?.user;
    const triggerLogout = useLogout();

    // Dynamic colors from platform settings
    const primaryColor = platform.primaryColor || "#3B82F6";
    const secondaryColor = platform.secondaryColor || "#1E40AF";

    // Navigation links
    const navLinks = [
        { label: "Home", href: "/" },
        { label: "Programs", href: "/programs/" },
        { label: "Events", href: "/events/" },
        { label: "About", href: "/about/" },
        { label: "Contact", href: "/contact/" },
    ];

    // Scroll trigger for dynamic navbar
    const scrolled = useScrollTrigger({
        disableHysteresis: true,
        threshold: 10, // Slight threshold to avoid flickering at very top
    });

    // Dynamic text color based on scroll state
    const navbarTextColor = scrolled ? lightTheme.palette.text.primary : "white";

    // Dashboard URL based on user role
    const getDashboardUrl = () => {
        if (!user) return "/dashboard/";
        if (user.role === "instructor") return "/instructor/";
        if (user.role === "student") return "/student/programs/";
        return "/dashboard/";
    };

    // Get user initials for avatar
    const getInitials = () => {
        if (!user) return "?";
        const first = user.first_name?.[0] || user.firstName?.[0] || "";
        const last = user.last_name?.[0] || user.lastName?.[0] || "";
        return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
    };

    const closeUserMenu = () => setUserMenuAnchor(null);
    const closeMobileMenu = () => setMobileMenuOpen(false);

    const handleDesktopLogout = () => {
        triggerLogout({
            onBefore: closeUserMenu,
            onSuccess: closeUserMenu,
            onError: closeUserMenu,
        });
    };

    const handleMobileLogout = () => {
        triggerLogout({
            onBefore: closeMobileMenu,
            onSuccess: closeMobileMenu,
            onError: closeMobileMenu,
        });
    };

    return (
        <ThemeProvider theme={lightTheme}>
            <CssBaseline />
            <Head title={`${platform.institutionName} - Learning Portal`} />

            <Box
                sx={{
                    minHeight: "100vh",
                    bgcolor: "#FAFAFA",
                    overflowX: "hidden",
                }}
            >
                {/* ================== NAVBAR ================== */}
                <AppBar
                    position="fixed"
                    color="transparent"
                    elevation={scrolled ? 4 : 0}
                    sx={{
                        bgcolor: scrolled ? "rgba(255, 255, 255, 0.95)" : "transparent",
                        backdropFilter: scrolled ? "blur(20px)" : "none",
                        borderBottom: scrolled ? 1 : 0,
                        borderColor: "divider",
                        transition: "all 0.3s ease",
                    }}
                >
                    <Container maxWidth="lg">
                        <Toolbar
                            disableGutters
                            sx={{ py: 1, justifyContent: "space-between" }}
                        >
                            {/* Logo */}
                            <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                            >
                                <PlatformLogo
                                    platform={platform}
                                    logoHeight={40}
                                    logoMaxWidth={160}
                                    iconContainerSize={40}
                                    iconSize={24}
                                    iconBgColor={primaryColor}
                                    nameVariant="h6"
                                    nameColor={navbarTextColor}
                                    nameSx={{ transition: "color 0.3s ease" }}
                                />
                            </Stack>

                            {/* Desktop Nav */}
                            <Stack
                                direction="row"
                                spacing={4}
                                sx={{ display: { xs: "none", md: "flex" } }}
                            >
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        style={{
                                            textDecoration: "none",
                                            color: navbarTextColor,
                                            fontWeight: 500,
                                            fontSize: "0.95rem",
                                            transition: "color 0.3s ease",
                                        }}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </Stack>

                            {/* CTA Buttons / User Menu */}
                            <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                            >
                                {user ? (
                                    /* Logged In State */
                                    <>
                                        {/* Notification Bell */}
                                        <IconButton
                                            sx={{
                                                color: navbarTextColor,
                                                display: { xs: "none", sm: "flex" },
                                            }}
                                        >
                                            <IconBell size={22} />
                                        </IconButton>

                                        {/* User Avatar with Dropdown */}
                                        <Box>
                                            <IconButton
                                                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                                                sx={{ p: 0.5 }}
                                                aria-label="open user menu"
                                            >
                                                {user.avatar_url || user.avatarUrl ? (
                                                    <Avatar
                                                        src={user.avatar_url || user.avatarUrl}
                                                        alt={user.first_name || user.firstName}
                                                        sx={{ width: 36, height: 36 }}
                                                    />
                                                ) : (
                                                    <Avatar
                                                        sx={{
                                                            width: 36,
                                                            height: 36,
                                                            bgcolor: primaryColor,
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {getInitials()}
                                                    </Avatar>
                                                )}
                                            </IconButton>
                                            <Menu
                                                anchorEl={userMenuAnchor}
                                                open={Boolean(userMenuAnchor)}
                                                onClose={() => setUserMenuAnchor(null)}
                                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                                transformOrigin={{ vertical: "top", horizontal: "right" }}
                                                PaperProps={{ sx: { mt: 1, minWidth: 180 } }}
                                            >
                                                <MenuItem
                                                    component={Link}
                                                    href={getDashboardUrl()}
                                                    onClick={() => setUserMenuAnchor(null)}
                                                >
                                                    <ListItemIcon><IconDashboard size={18} /></ListItemIcon>
                                                    <ListItemText>Dashboard</ListItemText>
                                                </MenuItem>
                                                <MenuItem
                                                    component={Link}
                                                    href="/profile/"
                                                    onClick={() => setUserMenuAnchor(null)}
                                                >
                                                    <ListItemIcon><IconUser size={18} /></ListItemIcon>
                                                    <ListItemText>Profile</ListItemText>
                                                </MenuItem>
                                                <Divider />
                                                <MenuItem onClick={handleDesktopLogout}>
                                                    <ListItemIcon><IconLogout size={18} /></ListItemIcon>
                                                    <ListItemText>Logout</ListItemText>
                                                </MenuItem>
                                            </Menu>
                                        </Box>
                                    </>
                                ) : (
                                    /* Logged Out State */
                                    <>
                                        <Button
                                            component={Link}
                                            href="/login/"
                                            color="inherit"
                                            sx={{
                                                fontWeight: 600,
                                                color: navbarTextColor,
                                                transition: "color 0.3s ease",
                                                display: {
                                                    xs: "none",
                                                    sm: "inline-flex",
                                                },
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
                                                    bgcolor: primaryColor,
                                                    "&:hover": {
                                                        bgcolor: secondaryColor,
                                                    },
                                                    display: {
                                                        xs: "none",
                                                        sm: "inline-flex",
                                                    },
                                                }}
                                            >
                                                Get Started
                                            </Button>
                                        </ButtonAnimationWrapper>
                                    </>
                                )}

                                {/* Mobile Menu Toggle */}
                                <IconButton
                                    sx={{
                                        display: { md: "none" },
                                        color: navbarTextColor,
                                        transition: "color 0.3s ease",
                                    }}
                                    onClick={() => setMobileMenuOpen(true)}
                                    aria-label="open mobile menu"
                                >
                                    <IconMenu2 />
                                </IconButton>
                            </Stack>
                        </Toolbar>
                    </Container>
                </AppBar>

                {/* Mobile Drawer */}
                <Drawer
                    anchor="right"
                    open={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                    PaperProps={{ sx: { width: 280, p: 2 } }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            mb: 2,
                        }}
                    >
                        <IconButton onClick={() => setMobileMenuOpen(false)}>
                            <IconX />
                        </IconButton>
                    </Box>
                    <List>
                        {navLinks.map((link) => (
                            <ListItem
                                key={link.href}
                                component={Link}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <ListItemText primary={link.label} />
                            </ListItem>
                        ))}
                        {user ? (
                            <>
                                <Divider sx={{ my: 1 }} />
                                <ListItem component={Link} href={getDashboardUrl()}>
                                    <ListItemText primary="Dashboard" />
                                </ListItem>
                                <ListItem component={Link} href="/profile/">
                                    <ListItemText primary="Profile" />
                                </ListItem>
                                <ListItem>
                                    <Button
                                        onClick={handleMobileLogout}
                                        variant="outlined"
                                        fullWidth
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Logout
                                    </Button>
                                </ListItem>
                            </>
                        ) : (
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
                                        sx={{ bgcolor: primaryColor, borderRadius: 2 }}
                                    >
                                        Get Started
                                    </Button>
                                </ListItem>
                            </>
                        )}
                    </List>
                </Drawer>

                {/* ================== HERO SECTION (Eager Loaded) ================== */}
                <HeroSection platform={platform} stats={stats} />

                {/* ================== LAZY LOADED SECTIONS ================== */}

                {/* Trust Badges */}
                <LazySection
                    sections={[
                        {
                            importFunc: () =>
                                import(
                                    "@/components/sections/landing/TrustBadgesSection"
                                ).then((m) => ({ default: m.default })),
                            props: { platform, stats },
                        },
                    ]}
                    offset="100px"
                    placeholderHeight={150}
                />

                {/* Features */}
                <LazySection
                    sections={[
                        {
                            importFunc: () =>
                                import(
                                    "@/components/sections/landing/FeaturesSection"
                                ).then((m) => ({ default: m.default })),
                            props: { platform },
                        },
                    ]}
                    offset="200px"
                    placeholderHeight={600}
                    skeleton={CardGridSkeleton}
                />

                {/* Programs */}
                {programs.length > 0 && (
                    <LazySection
                        sections={[
                            {
                                importFunc: () =>
                                    import(
                                        "@/components/sections/landing/ProgramsSection"
                                    ).then((m) => ({ default: m.default })),
                                props: { platform, programs },
                            },
                        ]}
                        offset="200px"
                        placeholderHeight={800}
                        skeleton={ProgramSkeleton}
                    />
                )}

                {/* Learning Modes - Choose Your Learning Path */}
                <LazySection
                    sections={[
                        {
                            importFunc: () =>
                                import(
                                    "@/components/sections/landing/LearningModesSection"
                                ).then((m) => ({ default: m.default })),
                            props: { platform },
                        },
                    ]}
                    offset="200px"
                    placeholderHeight={400}
                />

                {/* Instructors */}
                <LazySection
                    sections={[
                        {
                            importFunc: () =>
                                import(
                                    "@/components/sections/landing/InstructorsSection"
                                ).then((m) => ({ default: m.default })),
                            props: { platform },
                        },
                    ]}
                    offset="200px"
                    placeholderHeight={600}
                    skeleton={CardGridSkeleton}
                />

                {/* Testimonials */}
                <LazySection
                    sections={[
                        {
                            importFunc: () =>
                                import(
                                    "@/components/sections/landing/TestimonialsSection"
                                ).then((m) => ({ default: m.default })),
                            props: { platform },
                        },
                    ]}
                    offset="200px"
                    placeholderHeight={500}
                    skeleton={CardGridSkeleton}
                />

                {/* FAQ */}
                <LazySection
                    sections={[
                        {
                            importFunc: () =>
                                import(
                                    "@/components/sections/landing/FAQSection"
                                ).then((m) => ({ default: m.default })),
                            props: { platform },
                        },
                    ]}
                    offset="200px"
                    placeholderHeight={600}
                />

                {/* Footer - Static import to avoid build warnings */}
                <Footer />
            </Box>
        </ThemeProvider>
    );
}
