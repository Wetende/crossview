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
    ThemeProvider,
    createTheme,
    CssBaseline,
    useScrollTrigger,
    AppBar,
    Toolbar,
} from "@mui/material";
import { IconSchool, IconMenu2, IconX } from "@tabler/icons-react";
import { cloneElement, useState } from "react";

// Components
import LazySection from "@/components/LazySection";
import ButtonAnimationWrapper from "@/features/components/common/ButtonAnimationWrapper";

// Sections
import HeroSection from "@/components/sections/landing/HeroSection";

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

// --- Helper Components ---

function ElevationScroll({ children, primaryColor }) {
    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
    });

    return cloneElement(children, {
        elevation: trigger ? 4 : 0,
        sx: {
            bgcolor: trigger ? "rgba(255, 255, 255, 0.95)" : "transparent",
            backdropFilter: trigger ? "blur(20px)" : "none",
            borderBottom: trigger ? 1 : 0,
            borderColor: "divider",
            transition: "all 0.3s ease",
        },
    });
}

// --- Main Component ---

export default function Landing() {
    const { platform, programs = [], stats = {}, allPrograms = [] } = usePage().props;

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

    // Default Crossview marketing landing (for unsetup instances)
    return (
        <>
            <Head title="Crossview LMS - The Chameleon Engine" />
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
                        Welcome to Crossview LMS
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

    // Dynamic colors from platform settings
    const primaryColor = platform.primaryColor || "#3B82F6";
    const secondaryColor = platform.secondaryColor || "#1E40AF";

    // Navigation links
    const navLinks = [
        { label: "Programs", href: "/programs/" },
        { label: "Events", href: "/events/" },
        { label: "About", href: "/about/" },
        { label: "Contact", href: "/contact/" },
    ];

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
                <ElevationScroll primaryColor={primaryColor}>
                    <AppBar position="fixed" color="transparent">
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
                                    {platform.logoUrl ? (
                                        <Box
                                            component="img"
                                            src={platform.logoUrl}
                                            alt={platform.institutionName}
                                            sx={{
                                                height: 40,
                                                maxWidth: 160,
                                                objectFit: "contain",
                                            }}
                                        />
                                    ) : (
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                        >
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    bgcolor: primaryColor,
                                                    borderRadius: 2,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "white",
                                                }}
                                            >
                                                <IconSchool size={24} />
                                            </Box>
                                            <Typography
                                                variant="h6"
                                                fontWeight={700}
                                                color="text.primary"
                                            >
                                                {platform.institutionName}
                                            </Typography>
                                        </Stack>
                                    )}
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
                                                color: lightTheme.palette.text
                                                    .primary,
                                                fontWeight: 500,
                                                fontSize: "0.95rem",
                                            }}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </Stack>

                                {/* CTA Buttons */}
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                >
                                    <Button
                                        component={Link}
                                        href="/login/"
                                        color="inherit"
                                        sx={{
                                            fontWeight: 600,
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
                    </List>
                </Drawer>

                {/* ================== HERO SECTION (Eager Loaded) ================== */}
                <HeroSection platform={platform} stats={stats} allPrograms={allPrograms} />

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

                {/* Footer */}
                <LazySection
                    sections={[
                        {
                            importFunc: () =>
                                import(
                                    "@/components/sections/landing/FooterSection"
                                ).then((m) => ({ default: m.default })),
                            props: { platform },
                        },
                    ]}
                    offset="100px"
                    placeholderHeight={300}
                />
            </Box>
        </ThemeProvider>
    );
}
