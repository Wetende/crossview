import { Head, Link, usePage } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    Grid,
    Stack,
    Chip,
    useTheme,
    AppBar,
    Toolbar,
    useScrollTrigger,
} from "@mui/material";
import {
    IconSchool,
    IconCertificate,
    IconUsers,
    IconDeviceAnalytics,
    IconArrowRight,
    IconBrandTabler,
    IconCheck,
} from "@tabler/icons-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { getBackgroundDots } from "../../utils/getBackgroundDots";
import ButtonAnimationWrapper from "../../components/common/ButtonAnimationWrapper";
import { cloneElement } from "react";

// --- Animation Variants ---
const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] },
};

// --- Helper Components ---

function ElevationScroll({ children }) {
    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
    });

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

function SectionLabel({ children }) {
    return (
        <Chip
            label={children}
            size="small"
            sx={{
                bgcolor: "primary.lighter",
                color: "primary.main",
                fontWeight: 700,
                mb: 2,
                textTransform: "uppercase",
                letterSpacing: 1,
            }}
        />
    );
}

function GraphicsCard({ children, sx = {} }) {
    return (
        <Card
            sx={{
                borderRadius: { xs: 6, sm: 8 },
                border: "1px solid",
                borderColor: "grey.200",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                overflow: "hidden",
                ...sx,
            }}
        >
            {children}
        </Card>
    );
}

// --- Main Component ---

export default function Landing() {
    const { platform } = usePage().props;
    const theme = useTheme();
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);

    if (platform) {
        return <PlatformLanding platform={platform} />;
    }

    return (
        <>
            <Head title="Crossview LMS - The Chameleon Engine" />

            <Box sx={{ minHeight: "100vh", bgcolor: "background.default", overflowX: "hidden" }}>
                {/* Navbar */}
                <ElevationScroll>
                    <AppBar position="fixed" color="transparent" sx={{ py: 2 }}>
                        <Container maxWidth="lg">
                            <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            bgcolor: "primary.main",
                                            borderRadius: 2,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                        }}
                                    >
                                        <IconBrandTabler size={24} />
                                    </Box>
                                    <Typography variant="h5" fontWeight={700} sx={{ color: "grey.900" }}>
                                        Crossview
                                    </Typography>
                                </Stack>

                                <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" } }}>
                                    <Link href="/programs/" style={{ textDecoration: 'none', color: theme.palette.text.primary, fontWeight: 500 }}>Programs</Link>
                                    <Link href="/about/" style={{ textDecoration: 'none', color: theme.palette.text.primary, fontWeight: 500 }}>About</Link>
                                    <Link href="/contact/" style={{ textDecoration: 'none', color: theme.palette.text.primary, fontWeight: 500 }}>Contact</Link>
                                </Stack>

                                <Stack direction="row" spacing={2}>
                                    <Button component={Link} href="/login/" color="inherit" sx={{ fontWeight: 600 }}>
                                        Sign In
                                    </Button>
                                    <ButtonAnimationWrapper>
                                        <Button
                                            component={Link}
                                            href="/register/"
                                            variant="contained"
                                            sx={{ borderRadius: 100, px: 3 }}
                                        >
                                            Get Started
                                        </Button>
                                    </ButtonAnimationWrapper>
                                </Stack>
                            </Toolbar>
                        </Container>
                    </AppBar>
                </ElevationScroll>

                {/* Hero Section */}
                <Box
                    sx={{
                        position: "relative",
                        pt: { xs: 16, md: 24 },
                        pb: { xs: 12, md: 20 },
                        overflow: "hidden",
                    }}
                >
                    {/* Background Pattern */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: getBackgroundDots(theme.palette.grey[300], 2, 30),
                            zIndex: -1,
                            maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
                        }}
                    />

                    <Container maxWidth="lg">
                        <Grid container spacing={8} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <motion.div {...fadeInUp}>
                                    <SectionLabel>The Chameleon Engine</SectionLabel>
                                    <Typography variant="h1" gutterBottom sx={{ mb: 3 }}>
                                        One LMS for{" "}
                                        <Box component="span" sx={{ color: "primary.main" }}>
                                            Every Model
                                        </Box>
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        color="text.secondary"
                                        sx={{ mb: 5, fontWeight: 400, maxWidth: 500 }}
                                    >
                                        From Theology to TVET. Crossview adapts to your academic structure with flexible blueprints.
                                    </Typography>

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                        <ButtonAnimationWrapper>
                                            <Button
                                                component={Link}
                                                href="/register/"
                                                variant="contained"
                                                size="large"
                                                endIcon={<IconArrowRight size={20} />}
                                                sx={{ borderRadius: 100, px: 4, py: 1.5, fontSize: 18 }}
                                            >
                                                Get Started
                                            </Button>
                                        </ButtonAnimationWrapper>
                                        <ButtonAnimationWrapper>
                                            <Button
                                                component={Link}
                                                href="/verify-certificate/"
                                                variant="outlined"
                                                size="large"
                                                sx={{ borderRadius: 100, px: 4, py: 1.5, fontSize: 18 }}
                                            >
                                                Verify Certificate
                                            </Button>
                                        </ButtonAnimationWrapper>
                                    </Stack>

                                    <Stack direction="row" spacing={3} sx={{ mt: 6, opacity: 0.7 }}>
                                        <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <IconCheck size={18} color={theme.palette.success.main} />
                                            Kenyan Curriculum Ready
                                        </Typography>
                                        <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <IconCheck size={18} color={theme.palette.success.main} />
                                            Blueprint Driven
                                        </Typography>
                                    </Stack>
                                </motion.div>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <motion.div style={{ y: heroY }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
                                    <GraphicsCard sx={{ bgcolor: "background.paper", p: 4, position: "relative" }}>
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                right: 0,
                                                p: 2,
                                                bgcolor: "primary.lighter",
                                                borderBottomLeftRadius: 16,
                                            }}
                                        >
                                            <Typography variant="caption" fontWeight={700} color="primary.main">
                                                BLUEPRINT: TVET
                                            </Typography>
                                        </Box>
                                        {/* Abstract UI representation */}
                                        <Stack spacing={2}>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "primary.main" }} />
                                                <Box>
                                                    <Box sx={{ width: 120, height: 16, bgcolor: "grey.200", borderRadius: 1, mb: 1 }} />
                                                    <Box sx={{ width: 80, height: 12, bgcolor: "grey.100", borderRadius: 1 }} />
                                                </Box>
                                            </Stack>
                                            <Box sx={{ height: 1, bgcolor: "divider", my: 2 }} />
                                            <Stack spacing={2}>
                                                {[1, 2, 3].map((i) => (
                                                    <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                                                        <Box sx={{ width: "60%", height: 12, bgcolor: "grey.100", borderRadius: 1 }} />
                                                        <Box sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: "success.lighter", color: "success.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            <IconCheck size={14} />
                                                        </Box>
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        </Stack>
                                    </GraphicsCard>
                                </motion.div>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* Features Grid */}
                <Container maxWidth="lg" sx={{ py: { xs: 10, md: 16 } }}>
                    <Stack spacing={2} textAlign="center" sx={{ mb: 10 }}>
                        <motion.div {...fadeInUp}>
                            <SectionLabel>Key Features</SectionLabel>
                            <Typography variant="h2">Everything you need to run</Typography>
                            <Typography variant="h2" color="text.secondary">
                                a modern institution.
                            </Typography>
                        </motion.div>
                    </Stack>

                    <Grid container spacing={4}>
                        {[
                            {
                                icon: IconSchool,
                                title: "Adaptive Blueprints",
                                desc: "Configure your structure: Years > Terms > Units or Levels > Modules > Competencies.",
                            },
                            {
                                icon: IconCertificate,
                                title: "Verifiable Certificates",
                                desc: "Generate PDF certificates with QR codes that link to a public verification page.",
                            },
                            {
                                icon: IconUsers,
                                title: "Multi-Tenancy",
                                desc: "Secure data isolation for every department or campus.",
                            },
                            {
                                icon: IconDeviceAnalytics,
                                title: "Real-time Progress",
                                desc: "Track student completion rates, grades, and attendance in real-time.",
                            },
                        ].map((feature, idx) => (
                            <Grid item xs={12} md={6} lg={3} key={idx}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                                >
                                    <GraphicsCard sx={{ p: 4, height: "100%", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2,
                                                bgcolor: "primary.lighter",
                                                color: "primary.main",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                mb: 3,
                                            }}
                                        >
                                            <feature.icon size={24} />
                                        </Box>
                                        <Typography variant="h6" gutterBottom>
                                            {feature.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {feature.desc}
                                        </Typography>
                                    </GraphicsCard>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Container>

                {/* CTA Section (Replaces Pricing) */}
                <Box sx={{ bgcolor: "grey.50", py: { xs: 10, md: 16 } }}>
                    <Container maxWidth="md" sx={{ textAlign: "center" }}>
                        <motion.div {...fadeInUp}>
                            <Typography variant="h2" gutterBottom>
                                Ready to get started?
                            </Typography>
                            <Typography variant="h5" color="text.secondary" sx={{ mb: 5, fontWeight: 400 }}>
                                Join Crossview today and transform how you manage education.
                            </Typography>
                            <ButtonAnimationWrapper>
                                <Button
                                    component={Link}
                                    href="/register/"
                                    variant="contained"
                                    size="large"
                                    sx={{ borderRadius: 100, px: 5, py: 1.5, fontSize: 18 }}
                                >
                                    Get Started
                                </Button>
                            </ButtonAnimationWrapper>
                        </motion.div>
                    </Container>
                </Box>

                {/* Footer */}
                <Box sx={{ bgcolor: "grey.900", color: "grey.400", py: 8 }}>
                    <Container maxWidth="lg">
                        <Grid container spacing={8}>
                            <Grid item xs={12} md={4}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, color: "white" }}>
                                    <IconBrandTabler size={32} />
                                    <Typography variant="h5" fontWeight={700}>
                                        Crossview
                                    </Typography>
                                </Stack>
                                <Typography variant="body2" sx={{ maxWidth: 300 }}>
                                    Empowering Kenyan institutions with modern, flexible, and reliable educational technology.
                                </Typography>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <Typography variant="subtitle2" color="white" gutterBottom>
                                    Platform
                                </Typography>
                                <Stack spacing={1}>
                                    <Link href="/login/" style={{ color: "inherit", textDecoration: "none" }}>Sign In</Link>
                                    <Link href="/register/" style={{ color: "inherit", textDecoration: "none" }}>Register</Link>
                                </Stack>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <Typography variant="subtitle2" color="white" gutterBottom>
                                    Tools
                                </Typography>
                                <Stack spacing={1}>
                                    <Link href="/verify-certificate/" style={{ color: "inherit", textDecoration: "none" }}>Verify Certificate</Link>
                                </Stack>
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 8, pt: 4, borderTop: 1, borderColor: "grey.800", textAlign: "center" }}>
                            <Typography variant="caption">
                                © 2025 Crossview LMS. All rights reserved.
                            </Typography>
                        </Box>
                    </Container>
                </Box>
            </Box>
        </>
    );
}

// --- Platform Landing (Preserved) ---

function PlatformLanding({ platform }) {
    return (
        <>
            <Head title={`${platform.institutionName} - Learning Portal`} />

            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "background.default",
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        py: 2,
                        px: 3,
                        borderBottom: 1,
                        borderColor: "divider",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        bgcolor: "background.paper"
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        {platform.logoUrl && (
                            <Box
                                component="img"
                                src={platform.logoUrl}
                                alt={platform.institutionName}
                                sx={{ height: 40 }}
                            />
                        )}
                        <Typography variant="h6" fontWeight={600}>
                            {platform.institutionName}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <Button component={Link} href="/login/" variant="outlined">
                            Sign In
                        </Button>
                        {platform.registrationEnabled && (
                            <Button component={Link} href="/register/" variant="contained">
                                Register
                            </Button>
                        )}
                    </Stack>
                </Box>

                {/* Hero */}
                <Box
                    sx={{
                        flexGrow: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `linear-gradient(135deg, ${platform.primaryColor} 0%, ${platform.secondaryColor} 100%)`,
                        color: "white",
                        py: 8,
                    }}
                >
                    <Container maxWidth="md">
                        <motion.div {...fadeInUp}>
                            <Stack spacing={3} alignItems="center" textAlign="center">
                                <Typography variant="h2" fontWeight={700}>
                                    Welcome to {platform.institutionName}
                                </Typography>
                                {platform.tagline && (
                                    <Typography variant="h5" sx={{ opacity: 0.9 }}>
                                        {platform.tagline}
                                    </Typography>
                                )}
                                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                                    <ButtonAnimationWrapper>
                                        <Button
                                            component={Link}
                                            href="/login/"
                                            variant="contained"
                                            size="large"
                                            sx={{
                                                bgcolor: "white",
                                                color: platform.primaryColor,
                                                "&:hover": { bgcolor: "grey.100" },
                                                px: 4, borderRadius: 100
                                            }}
                                        >
                                            Sign In
                                        </Button>
                                    </ButtonAnimationWrapper>
                                    {platform.registrationEnabled && (
                                        <ButtonAnimationWrapper>
                                            <Button
                                                component={Link}
                                                href="/register/"
                                                variant="outlined"
                                                size="large"
                                                sx={{
                                                    borderColor: "white",
                                                    color: "white",
                                                    "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.1)" },
                                                    px: 4, borderRadius: 100
                                                }}
                                            >
                                                Register
                                            </Button>
                                        </ButtonAnimationWrapper>
                                    )}
                                </Stack>
                            </Stack>
                        </motion.div>
                    </Container>
                </Box>

                {/* Footer */}
                <Box sx={{ py: 3, textAlign: "center", borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}>
                    <Typography variant="body2" color="text.secondary">
                        Powered by Crossview LMS
                    </Typography>
                </Box>
            </Box>

            {/* Custom CSS injection */}
            {platform.customCss && (
                <style dangerouslySetInnerHTML={{ __html: platform.customCss }} />
            )}
        </>
    );
}
