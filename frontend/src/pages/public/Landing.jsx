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
    const { platform, programs = [], stats = {} } = usePage().props;
    const theme = useTheme();
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);

    if (platform) {
        return <PlatformLanding platform={platform} programs={programs} stats={stats} />;
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

// --- Platform Landing (Enhanced) ---

function PlatformLanding({ platform, programs = [], stats = {} }) {
    const theme = useTheme();
    
    // Feature cards - easy to repurpose
    const features = [
        {
            icon: IconSchool,
            title: "Expert-Led Learning",
            description: "Learn from industry professionals with years of experience in their fields.",
        },
        {
            icon: IconCertificate,
            title: "Verified Certificates",
            description: "Earn certificates upon completion with unique verification codes.",
        },
        {
            icon: IconUsers,
            title: "Supportive Community",
            description: "Join a community of learners and get support when you need it.",
        },
        {
            icon: IconDeviceAnalytics,
            title: "Track Your Progress",
            description: "Monitor your learning journey with detailed progress tracking.",
        },
    ];

    // Testimonials - easy to repurpose
    const testimonials = [
        {
            name: "Mary Wanjiku",
            role: "Graduate, 2024",
            quote: "The structured curriculum and supportive instructors helped me achieve my goals faster than I expected.",
            avatar: "MW",
        },
        {
            name: "John Ochieng",
            role: "Current Student",
            quote: "The practical approach to learning has been invaluable. I'm already applying what I've learned in my work.",
            avatar: "JO",
        },
        {
            name: "Grace Muthoni",
            role: "Graduate, 2023",
            quote: "The certificate I earned opened new doors for my career. Highly recommended for anyone looking to upskill.",
            avatar: "GM",
        },
    ];

    return (
        <>
            <Head title={`${platform.institutionName} - Learning Portal`} />

            <Box sx={{ minHeight: "100vh", bgcolor: "background.default", overflowX: "hidden" }}>
                {/* Navbar */}
                <ElevationScroll>
                    <AppBar position="fixed" color="transparent" sx={{ py: 1 }}>
                        <Container maxWidth="lg">
                            <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    {platform.logoUrl ? (
                                        <Box
                                            component="img"
                                            src={platform.logoUrl}
                                            alt={platform.institutionName}
                                            sx={{ height: 40 }}
                                        />
                                    ) : (
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                bgcolor: platform.primaryColor || "primary.main",
                                                borderRadius: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "white",
                                            }}
                                        >
                                            <IconSchool size={24} />
                                        </Box>
                                    )}
                                    <Typography variant="h6" fontWeight={700} color="text.primary">
                                        {platform.institutionName}
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
                                    {platform.registrationEnabled && (
                                        <ButtonAnimationWrapper>
                                            <Button 
                                                component={Link} 
                                                href="/register/" 
                                                variant="contained"
                                                sx={{ 
                                                    borderRadius: 100, 
                                                    px: 3,
                                                    bgcolor: platform.primaryColor || "primary.main",
                                                    "&:hover": { bgcolor: platform.secondaryColor || "primary.dark" }
                                                }}
                                            >
                                                Get Started
                                            </Button>
                                        </ButtonAnimationWrapper>
                                    )}
                                </Stack>
                            </Toolbar>
                        </Container>
                    </AppBar>
                </ElevationScroll>

                {/* Hero Section */}
                <Box
                    sx={{
                        pt: { xs: 14, md: 18 },
                        pb: { xs: 10, md: 14 },
                        background: `linear-gradient(135deg, ${platform.primaryColor || "#3B82F6"} 0%, ${platform.secondaryColor || "#1E40AF"} 100%)`,
                        color: "white",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Background pattern */}
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            opacity: 0.1,
                            backgroundImage: `radial-gradient(white 1px, transparent 1px)`,
                            backgroundSize: "30px 30px",
                        }}
                    />
                    <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
                        <Grid container spacing={6} alignItems="center">
                            <Grid item xs={12} md={7}>
                                <motion.div {...fadeInUp}>
                                    <Typography variant="h1" fontWeight={700} sx={{ mb: 3, fontSize: { xs: "2.5rem", md: "3.5rem" } }}>
                                        Welcome to {platform.institutionName}
                                    </Typography>
                                    {platform.tagline && (
                                        <Typography variant="h5" sx={{ mb: 4, opacity: 0.9, fontWeight: 400, maxWidth: 500 }}>
                                            {platform.tagline}
                                        </Typography>
                                    )}
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
                                        <ButtonAnimationWrapper>
                                            <Button
                                                component={Link}
                                                href="/programs/"
                                                variant="contained"
                                                size="large"
                                                endIcon={<IconArrowRight size={20} />}
                                                sx={{
                                                    bgcolor: "white",
                                                    color: platform.primaryColor || "primary.main",
                                                    "&:hover": { bgcolor: "grey.100" },
                                                    px: 4,
                                                    py: 1.5,
                                                    borderRadius: 100,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Explore Programs
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
                                                        px: 4,
                                                        py: 1.5,
                                                        borderRadius: 100,
                                                    }}
                                                >
                                                    Register Now
                                                </Button>
                                            </ButtonAnimationWrapper>
                                        )}
                                    </Stack>
                                    <Stack direction="row" spacing={3}>
                                        <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <IconCheck size={18} /> Quality Education
                                        </Typography>
                                        <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <IconCheck size={18} /> Verified Certificates
                                        </Typography>
                                    </Stack>
                                </motion.div>
                            </Grid>
                            <Grid item xs={12} md={5} sx={{ display: { xs: "none", md: "block" } }}>
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
                                    <Card sx={{ p: 4, borderRadius: 4, bgcolor: "rgba(255,255,255,0.95)", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                                        <Stack spacing={2}>
                                            <Typography variant="h5" fontWeight={700} color="text.primary">Quick Stats</Typography>
                                            <Stack direction="row" spacing={4}>
                                                <Box>
                                                    <Typography variant="h3" fontWeight={700} sx={{ color: platform.primaryColor || "primary.main" }}>
                                                        {stats.programCount || 0}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">Programs</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="h3" fontWeight={700} sx={{ color: platform.primaryColor || "primary.main" }}>
                                                        {stats.studentCount || 0}+
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">Students</Typography>
                                                </Box>
                                            </Stack>
                                        </Stack>
                                    </Card>
                                </motion.div>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* Programs Showcase */}
                {programs.length > 0 && (
                    <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
                        <Stack spacing={2} textAlign="center" sx={{ mb: 6 }}>
                            <motion.div {...fadeInUp}>
                                <Chip label="OUR PROGRAMS" size="small" sx={{ bgcolor: "primary.lighter", color: "primary.main", fontWeight: 700, mb: 2 }} />
                                <Typography variant="h3" fontWeight={700}>Explore Our Courses</Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: "auto", mt: 1 }}>
                                    Choose from our carefully designed programs to advance your knowledge and skills.
                                </Typography>
                            </motion.div>
                        </Stack>
                        <Grid container spacing={4}>
                            {programs.map((program, idx) => (
                                <Grid item xs={12} sm={6} md={4} key={program.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                                    >
                                        <GraphicsCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                                            <Box sx={{ p: 4, flexGrow: 1 }}>
                                                <Chip label={program.code || "PROGRAM"} size="small" sx={{ bgcolor: "primary.lighter", color: "primary.main", fontWeight: 700, mb: 2 }} />
                                                <Typography variant="h5" fontWeight={700} gutterBottom>{program.name}</Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {program.description || "Comprehensive program designed to help you succeed."}
                                                </Typography>
                                                {program.enrollmentCount > 0 && (
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <IconUsers size={16} color={theme.palette.text.secondary} />
                                                        <Typography variant="caption" color="text.secondary">{program.enrollmentCount} enrolled</Typography>
                                                    </Stack>
                                                )}
                                            </Box>
                                            <Box sx={{ p: 3, pt: 0 }}>
                                                <Button
                                                    component={Link}
                                                    href={`/register/?program=${program.id}`}
                                                    variant="outlined"
                                                    fullWidth
                                                    sx={{ borderRadius: 100 }}
                                                >
                                                    Learn More
                                                </Button>
                                            </Box>
                                        </GraphicsCard>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                        <Box sx={{ textAlign: "center", mt: 6 }}>
                            <Button component={Link} href="/programs/" variant="outlined" size="large" sx={{ borderRadius: 100, px: 4 }}>
                                View All Programs
                            </Button>
                        </Box>
                    </Container>
                )}

                {/* Features Section */}
                <Box sx={{ bgcolor: "grey.50", py: { xs: 8, md: 12 } }}>
                    <Container maxWidth="lg">
                        <Stack spacing={2} textAlign="center" sx={{ mb: 6 }}>
                            <motion.div {...fadeInUp}>
                                <Chip label="WHY CHOOSE US" size="small" sx={{ bgcolor: "primary.lighter", color: "primary.main", fontWeight: 700, mb: 2 }} />
                                <Typography variant="h3" fontWeight={700}>What Sets Us Apart</Typography>
                            </motion.div>
                        </Stack>
                        <Grid container spacing={4}>
                            {features.map((feature, idx) => (
                                <Grid item xs={12} sm={6} md={3} key={idx}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                                    >
                                        <Card sx={{ p: 4, height: "100%", textAlign: "center", borderRadius: 4, border: "1px solid", borderColor: "grey.200", boxShadow: "none", transition: "all 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 24px rgba(0,0,0,0.08)" } }}>
                                            <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: platform.primaryColor ? `${platform.primaryColor}15` : "primary.lighter", color: platform.primaryColor || "primary.main", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                                                <feature.icon size={28} />
                                            </Box>
                                            <Typography variant="h6" fontWeight={700} gutterBottom>{feature.title}</Typography>
                                            <Typography variant="body2" color="text.secondary">{feature.description}</Typography>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </Container>
                </Box>

                {/* About Section */}
                <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
                    <Grid container spacing={8} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <motion.div {...fadeInUp}>
                                <Card sx={{ height: 350, bgcolor: "grey.100", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, border: "1px solid", borderColor: "grey.200" }}>
                                    <Stack alignItems="center" spacing={2}>
                                        <IconSchool size={64} color={theme.palette.grey[400]} stroke={1} />
                                        <Typography variant="body2" color="text.secondary">Institution Image</Typography>
                                    </Stack>
                                </Card>
                            </motion.div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <motion.div {...fadeInUp}>
                                <Chip label="ABOUT US" size="small" sx={{ bgcolor: "primary.lighter", color: "primary.main", fontWeight: 700, mb: 2 }} />
                                <Typography variant="h3" fontWeight={700} gutterBottom>Our Mission</Typography>
                                <Typography variant="body1" color="text.secondary" paragraph>
                                    We are committed to providing quality education that empowers individuals to achieve their personal and professional goals. Our programs are designed with industry needs in mind, ensuring our graduates are job-ready.
                                </Typography>
                                <Typography variant="body1" color="text.secondary" paragraph>
                                    With experienced instructors and a supportive learning environment, we guide every student on their journey to success.
                                </Typography>
                                <Button component={Link} href="/about/" variant="outlined" sx={{ borderRadius: 100, px: 3 }}>
                                    Learn More About Us
                                </Button>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>

                {/* Testimonials Section */}
                <Box sx={{ bgcolor: "grey.900", color: "white", py: { xs: 8, md: 12 } }}>
                    <Container maxWidth="lg">
                        <Stack spacing={2} textAlign="center" sx={{ mb: 6 }}>
                            <motion.div {...fadeInUp}>
                                <Typography variant="h3" fontWeight={700}>What Our Students Say</Typography>
                            </motion.div>
                        </Stack>
                        <Grid container spacing={4}>
                            {testimonials.map((testimonial, idx) => (
                                <Grid item xs={12} md={4} key={idx}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                                    >
                                        <Card sx={{ p: 4, height: "100%", bgcolor: "grey.800", borderRadius: 4, border: "1px solid", borderColor: "grey.700" }}>
                                            <Typography variant="body1" sx={{ mb: 3, fontStyle: "italic", color: "grey.300" }}>
                                                "{testimonial.quote}"
                                            </Typography>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Box sx={{ width: 44, height: 44, borderRadius: "50%", bgcolor: platform.primaryColor || "primary.main", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                                                    {testimonial.avatar}
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={700}>{testimonial.name}</Typography>
                                                    <Typography variant="caption" color="grey.400">{testimonial.role}</Typography>
                                                </Box>
                                            </Stack>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </Container>
                </Box>

                {/* Contact Preview Section */}
                <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
                    <Grid container spacing={6} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <motion.div {...fadeInUp}>
                                <Chip label="GET IN TOUCH" size="small" sx={{ bgcolor: "primary.lighter", color: "primary.main", fontWeight: 700, mb: 2 }} />
                                <Typography variant="h3" fontWeight={700} gutterBottom>Ready to Start?</Typography>
                                <Typography variant="body1" color="text.secondary" paragraph>
                                    Have questions? We're here to help. Reach out to us and we'll get back to you as soon as possible.
                                </Typography>
                                {platform.contactEmail && (
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "primary.lighter", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <IconBrandTabler size={20} />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Email</Typography>
                                            <Typography variant="body1" fontWeight={600}>{platform.contactEmail}</Typography>
                                        </Box>
                                    </Stack>
                                )}
                                {platform.contactPhone && (
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                                        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "primary.lighter", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <IconBrandTabler size={20} />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Phone</Typography>
                                            <Typography variant="body1" fontWeight={600}>{platform.contactPhone}</Typography>
                                        </Box>
                                    </Stack>
                                )}
                                <Button component={Link} href="/contact/" variant="contained" size="large" sx={{ borderRadius: 100, px: 4, bgcolor: platform.primaryColor || "primary.main" }}>
                                    Contact Us
                                </Button>
                            </motion.div>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <motion.div {...fadeInUp}>
                                <Card sx={{ p: 4, borderRadius: 4, bgcolor: "grey.50", border: "1px solid", borderColor: "grey.200" }}>
                                    <Typography variant="h6" fontWeight={700} gutterBottom>Send us a message</Typography>
                                    <Stack spacing={2}>
                                        <Box sx={{ height: 44, bgcolor: "grey.200", borderRadius: 2 }} />
                                        <Box sx={{ height: 44, bgcolor: "grey.200", borderRadius: 2 }} />
                                        <Box sx={{ height: 100, bgcolor: "grey.200", borderRadius: 2 }} />
                                        <Button 
                                            component={Link}
                                            href="/contact/"
                                            variant="contained" 
                                            fullWidth 
                                            sx={{ borderRadius: 100, py: 1.5, bgcolor: platform.primaryColor || "primary.main" }}
                                        >
                                            Go to Contact Page
                                        </Button>
                                    </Stack>
                                </Card>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>

                {/* Footer */}
                <Box sx={{ bgcolor: "grey.900", color: "grey.400", py: 8 }}>
                    <Container maxWidth="lg">
                        <Grid container spacing={8}>
                            <Grid item xs={12} md={4}>
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, color: "white" }}>
                                    {platform.logoUrl ? (
                                        <Box component="img" src={platform.logoUrl} alt={platform.institutionName} sx={{ height: 32, filter: "brightness(0) invert(1)" }} />
                                    ) : (
                                        <IconSchool size={32} />
                                    )}
                                    <Typography variant="h5" fontWeight={700}>{platform.institutionName}</Typography>
                                </Stack>
                                {platform.tagline && (
                                    <Typography variant="body2" sx={{ maxWidth: 300 }}>{platform.tagline}</Typography>
                                )}
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <Typography variant="subtitle2" color="white" gutterBottom fontWeight={700}>Platform</Typography>
                                <Stack spacing={1}>
                                    <Link href="/programs/" style={{ color: "inherit", textDecoration: "none" }}>Programs</Link>
                                    <Link href="/about/" style={{ color: "inherit", textDecoration: "none" }}>About</Link>
                                    <Link href="/contact/" style={{ color: "inherit", textDecoration: "none" }}>Contact</Link>
                                </Stack>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <Typography variant="subtitle2" color="white" gutterBottom fontWeight={700}>Account</Typography>
                                <Stack spacing={1}>
                                    <Link href="/login/" style={{ color: "inherit", textDecoration: "none" }}>Sign In</Link>
                                    {platform.registrationEnabled && (
                                        <Link href="/register/" style={{ color: "inherit", textDecoration: "none" }}>Register</Link>
                                    )}
                                    <Link href="/verify-certificate/" style={{ color: "inherit", textDecoration: "none" }}>Verify Certificate</Link>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="white" gutterBottom fontWeight={700}>Contact</Typography>
                                {platform.contactEmail && <Typography variant="body2">{platform.contactEmail}</Typography>}
                                {platform.contactPhone && <Typography variant="body2">{platform.contactPhone}</Typography>}
                                {platform.address && <Typography variant="body2" sx={{ mt: 1 }}>{platform.address}</Typography>}
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 8, pt: 4, borderTop: 1, borderColor: "grey.800", textAlign: "center" }}>
                            <Typography variant="caption">© {new Date().getFullYear()} {platform.institutionName}. Powered by Crossview LMS.</Typography>
                        </Box>
                    </Container>
                </Box>
            </Box>

            {/* Custom CSS injection */}
            {platform.customCss && (
                <style dangerouslySetInnerHTML={{ __html: platform.customCss }} />
            )}
        </>
    );
}
