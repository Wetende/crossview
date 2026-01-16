import { Head, Link, usePage } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardMedia,
    Grid,
    Stack,
    Chip,
    Avatar,
    useTheme,
    AppBar,
    Toolbar,
    useScrollTrigger,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
    Rating,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    ThemeProvider,
    createTheme,
    CssBaseline,
} from "@mui/material";
import {
    IconSchool,
    IconCertificate,
    IconUsers,
    IconDeviceAnalytics,
    IconArrowRight,
    IconBrandTabler,
    IconCheck,
    IconPlayerPlay,
    IconClock,
    IconBook,
    IconTrophy,
    IconStarFilled,
    IconQuote,
    IconMenu2,
    IconX,
    IconMail,
    IconPhone,
    IconMapPin,
    IconChevronDown,
    IconShieldCheck,
    IconAward,
    IconThumbUp,
} from "@tabler/icons-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { getBackgroundDots } from "../../utils/getBackgroundDots";
import ButtonAnimationWrapper from "../../components/common/ButtonAnimationWrapper";
import PublicProgramCard from "../../components/cards/PublicProgramCard";
import { cloneElement, useState } from "react";

// Hero background image
import heroBgImage from "../../assets/images/hero1.jpg";

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

// --- Animation Variants ---
const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] },
};

const staggerContainer = {
    initial: {},
    whileInView: {
        transition: {
            staggerChildren: 0.1,
        },
    },
    viewport: { once: true },
};

const fadeInScale = {
    initial: { opacity: 0, scale: 0.95 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true },
    transition: { duration: 0.5 },
};

// --- Helper: Color utilities ---
function hexToRgba(hex, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
}

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

function SectionLabel({ children, color = "primary.main", bgColor }) {
    return (
        <Chip
            label={children}
            size="small"
            sx={{
                bgcolor: bgColor || hexToRgba(color, 0.1),
                color: color,
                fontWeight: 700,
                mb: 2,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontSize: "0.7rem",
                px: 1,
            }}
        />
    );
}

// --- Main Component ---

export default function Landing() {
    const { platform, programs = [], stats = {} } = usePage().props;
    const theme = useTheme();
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 100]);

    // If platform is set up, show the platform-specific landing
    if (platform) {
        return <PlatformLanding platform={platform} programs={programs} stats={stats} />;
    }

    // Default Crossview marketing landing (for unsetup instances)
    return (
        <>
            <Head title="Crossview LMS - The Chameleon Engine" />
            <Box sx={{ minHeight: "100vh", bgcolor: "background.default", overflowX: "hidden" }}>
                {/* Default landing for unconfigured instances */}
                <Container maxWidth="lg" sx={{ py: 20, textAlign: "center" }}>
                    <Typography variant="h2" fontWeight={700} gutterBottom>
                        Welcome to Crossview LMS
                    </Typography>
                    <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
                        Please complete the setup wizard to configure your platform.
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
    const theme = useTheme();
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

    // Features data
    const features = [
        {
            icon: IconSchool,
            title: "Expert Instructors",
            description: "Learn from industry professionals with years of hands-on experience in their fields.",
        },
        {
            icon: IconCertificate,
            title: "Verified Certificates",
            description: "Earn recognized certificates upon completion with unique QR verification codes.",
        },
        {
            icon: IconBook,
            title: "Comprehensive Curriculum",
            description: "Structured learning paths designed to take you from beginner to expert.",
        },
        {
            icon: IconDeviceAnalytics,
            title: "Track Your Progress",
            description: "Monitor your learning journey with detailed analytics and progress tracking.",
        },
    ];

    // Instructors data
    const instructors = [
        {
            name: "Dr. Sarah Kimani",
            role: "Lead Instructor, Data Science",
            bio: "Ph.D. in Computer Science with 10+ years of industry experience at top tech firms.",
            avatar: "SK",
        },
        {
            name: "James Mwangi",
            role: "Senior Trainer, Automotive Engineering",
            bio: "Certified Master Mechanic ensuring students gain practical, hands-on skills.",
            avatar: "JM",
        },
        {
            name: "Pastor David Omondi",
            role: "Head of Theology Department",
            bio: "Dedicated to guiding students in their spiritual and academic growth.",
            avatar: "DO",
        },
        {
            name: "Alice Wanjiru",
            role: "Hairdressing & Beauty Expert",
            bio: "Award-winning stylist bringing modern techniques to the classroom.",
            avatar: "AW",
        },
    ];

    // Testimonials data
    const testimonials = [
        {
            name: "Mary Wanjiku",
            role: "Graduate, Certificate in IT",
            quote: "The structured curriculum and supportive instructors helped me land my dream job within 3 months of graduating.",
            avatar: "MW",
            rating: 5,
        },
        {
            name: "John Ochieng",
            role: "Current Student",
            quote: "The practical approach to learning is incredible. I'm already applying what I've learned at my workplace.",
            avatar: "JO",
            rating: 5,
        },
        {
            name: "Grace Muthoni",
            role: "Graduate, Diploma Program",
            quote: "The certificate I earned opened new doors for my career. Highly recommend for anyone looking to upskill.",
            avatar: "GM",
            rating: 5,
        },
    ];

    return (
        <ThemeProvider theme={lightTheme}>
            <CssBaseline />
            <Head title={`${platform.institutionName} - Learning Portal`} />

            <Box sx={{ minHeight: "100vh", bgcolor: "#FAFAFA", overflowX: "hidden" }}>
                {/* ================== NAVBAR ================== */}
                <ElevationScroll primaryColor={primaryColor}>
                    <AppBar position="fixed" color="transparent">
                        <Container maxWidth="lg">
                            <Toolbar disableGutters sx={{ py: 1, justifyContent: "space-between" }}>
                                {/* Logo */}
                                <Stack direction="row" spacing={2} alignItems="center">
                                    {platform.logoUrl ? (
                                        <Box
                                            component="img"
                                            src={platform.logoUrl}
                                            alt={platform.institutionName}
                                            sx={{ height: 40, maxWidth: 160, objectFit: "contain" }}
                                        />
                                    ) : (
                                        <Stack direction="row" spacing={1} alignItems="center">
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
                                            <Typography variant="h6" fontWeight={700} color="text.primary">
                                                {platform.institutionName}
                                            </Typography>
                                        </Stack>
                                    )}
                                </Stack>

                                {/* Desktop Nav */}
                                <Stack direction="row" spacing={4} sx={{ display: { xs: "none", md: "flex" } }}>
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            style={{
                                                textDecoration: "none",
                                                color: theme.palette.text.primary,
                                                fontWeight: 500,
                                                fontSize: "0.95rem",
                                            }}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </Stack>

                                {/* CTA Buttons */}
                                <Stack direction="row" spacing={2} alignItems="center">
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
                                                bgcolor: primaryColor,
                                                "&:hover": { bgcolor: secondaryColor },
                                                display: { xs: "none", sm: "inline-flex" },
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
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
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

                {/* ================== HERO SECTION ================== */}
                <Box
                    sx={{
                        pt: { xs: 14, md: 16 },
                        pb: { xs: 10, md: 14 },
                        backgroundImage: `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.5)} 0%, ${hexToRgba(secondaryColor, 0.6)} 100%), url(${heroBgImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Background decoration */}
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            opacity: 0.05,
                            backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
                            backgroundSize: "60px 60px",
                        }}
                    />
                    {/* Floating shapes */}
                    <Box
                        component={motion.div}
                        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        sx={{
                            position: "absolute",
                            top: "20%",
                            right: "10%",
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            bgcolor: "rgba(255,255,255,0.1)",
                            display: { xs: "none", md: "block" },
                        }}
                    />
                    <Box
                        component={motion.div}
                        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        sx={{
                            position: "absolute",
                            bottom: "30%",
                            left: "5%",
                            width: 60,
                            height: 60,
                            borderRadius: 3,
                            bgcolor: "rgba(255,255,255,0.08)",
                            display: { xs: "none", md: "block" },
                        }}
                    />

                    <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
                        <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <motion.div {...fadeInUp}>
                                    <SectionLabel color="white" bgColor="rgba(255,255,255,0.2)">
                                        Welcome to {platform.institutionName}
                                    </SectionLabel>
                                    <Typography
                                        variant="h1"
                                        sx={{
                                            color: "white",
                                            fontWeight: 800,
                                            fontSize: { xs: "2.5rem", md: "3.5rem", lg: "4rem" },
                                            lineHeight: 1.1,
                                            mb: 3,
                                        }}
                                    >
                                        Unlock Your{" "}
                                        <Box
                                            component="span"
                                            sx={{
                                                background: "linear-gradient(90deg, #FFD700, #FFA500)",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                            }}
                                        >
                                            Potential
                                        </Box>
                                        <br />
                                        Start Learning Today
                                    </Typography>
                                    {platform.tagline && (
                                        <Typography
                                            variant="h5"
                                            sx={{
                                                color: "rgba(255,255,255,0.9)",
                                                fontWeight: 400,
                                                mb: 4,
                                                maxWidth: 480,
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            {platform.tagline}
                                        </Typography>
                                    )}
                                    {!platform.tagline && (
                                        <Typography
                                            variant="h5"
                                            sx={{
                                                color: "rgba(255,255,255,0.9)",
                                                fontWeight: 400,
                                                mb: 4,
                                                maxWidth: 480,
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            Quality education designed to help you achieve your personal and professional goals.
                                        </Typography>
                                    )}

                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 5 }}>
                                        <ButtonAnimationWrapper>
                                            <Button
                                                component={Link}
                                                href="/programs/"
                                                variant="contained"
                                                size="large"
                                                endIcon={<IconArrowRight size={20} />}
                                                sx={{
                                                    bgcolor: "white",
                                                    color: primaryColor,
                                                    "&:hover": { bgcolor: "grey.100" },
                                                    px: 4,
                                                    py: 1.5,
                                                    borderRadius: 100,
                                                    fontWeight: 700,
                                                    fontSize: "1rem",
                                                }}
                                            >
                                                Explore Programs
                                            </Button>
                                        </ButtonAnimationWrapper>
                                        <ButtonAnimationWrapper>
                                            <Button
                                                component={Link}
                                                href="/verify-certificate/"
                                                variant="outlined"
                                                size="large"
                                                sx={{
                                                    borderColor: "rgba(255,255,255,0.5)",
                                                    color: "white",
                                                    "&:hover": {
                                                        borderColor: "white",
                                                        bgcolor: "rgba(255,255,255,0.1)",
                                                    },
                                                    px: 4,
                                                    py: 1.5,
                                                    borderRadius: 100,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Verify Certificate
                                            </Button>
                                        </ButtonAnimationWrapper>
                                    </Stack>

                                    {/* Trust indicators */}
                                    <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "white" }}>
                                            <IconCheck size={20} />
                                            <Typography variant="body2" fontWeight={500}>Quality Education</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "white" }}>
                                            <IconCheck size={20} />
                                            <Typography variant="body2" fontWeight={500}>Verified Certificates</Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "white" }}>
                                            <IconCheck size={20} />
                                            <Typography variant="body2" fontWeight={500}>Expert Instructors</Typography>
                                        </Stack>
                                    </Stack>
                                </motion.div>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <motion.div {...fadeInScale}>
                                    {/* Stats Card */}
                                    <Card
                                        sx={{
                                            p: 4,
                                            borderRadius: 4,
                                            bgcolor: "rgba(255,255,255,0.95)",
                                            boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
                                            backdropFilter: "blur(10px)",
                                        }}
                                    >
                                        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: "text.primary" }}>
                                            Join Our Learning Community
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                                            Start your journey to success with our comprehensive programs.
                                        </Typography>
                                        
                                        <Grid container spacing={3}>
                                            <Grid item xs={6}>
                                                <Box sx={{ textAlign: "center", p: 2, bgcolor: hexToRgba(primaryColor, 0.08), borderRadius: 3 }}>
                                                    <Typography variant="h3" fontWeight={800} sx={{ color: primaryColor }}>
                                                        {stats.programCount || 0}+
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                        Programs
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Box sx={{ textAlign: "center", p: 2, bgcolor: hexToRgba(primaryColor, 0.08), borderRadius: 3 }}>
                                                    <Typography variant="h3" fontWeight={800} sx={{ color: primaryColor }}>
                                                        {stats.studentCount || 0}+
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                                        Students
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        <Button
                                            component={Link}
                                            href="/register/"
                                            variant="contained"
                                            fullWidth
                                            size="large"
                                            sx={{
                                                mt: 4,
                                                bgcolor: primaryColor,
                                                "&:hover": { bgcolor: secondaryColor },
                                                borderRadius: 2,
                                                py: 1.5,
                                                fontWeight: 700,
                                            }}
                                        >
                                            Start Learning Now
                                        </Button>
                                    </Card>
                                </motion.div>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* ================== TRUST BADGES SECTION ================== */}
                <Box sx={{ py: { xs: 4, md: 6 }, bgcolor: "white", borderBottom: "1px solid", borderColor: "grey.100" }}>
                    <Container maxWidth="lg">
                        <motion.div {...fadeInUp}>
                            <Grid container spacing={4} justifyContent="center" alignItems="center">
                                {[
                                    { icon: IconShieldCheck, label: "Verified Institution", sublabel: "Quality Assured" },
                                    { icon: IconAward, label: "Certified Programs", sublabel: "Industry Recognized" },
                                    { icon: IconUsers, label: `${stats.studentCount || 500}+ Students`, sublabel: "Active Learners" },
                                    { icon: IconThumbUp, label: "4.8/5 Rating", sublabel: "Student Satisfaction" },
                                ].map((badge, idx) => (
                                    <Grid item xs={6} sm={3} key={idx}>
                                        <Stack
                                            direction="row"
                                            spacing={2}
                                            alignItems="center"
                                            justifyContent="center"
                                            sx={{ textAlign: "left" }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 2,
                                                    bgcolor: hexToRgba(primaryColor, 0.1),
                                                    color: primaryColor,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <badge.icon size={24} stroke={1.5} />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                                    {badge.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {badge.sublabel}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Grid>
                                ))}
                            </Grid>
                        </motion.div>
                    </Container>
                </Box>

                {/* ================== FEATURES SECTION ================== */}
                <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: "#F8FAFC" }}>
                    <Container maxWidth="md">
                        <Stack spacing={2} textAlign="center" sx={{ mb: 8 }}>
                            <motion.div {...fadeInUp}>
                                <SectionLabel color={primaryColor}>Why Choose Us</SectionLabel>
                                <Typography variant="h2" fontWeight={700} sx={{ mb: 2, color: "text.primary" }}>
                                    Why Join this Program?
                                </Typography>
                            </motion.div>
                        </Stack>

                        <Box sx={{ flexGrow: 1 }}>
                            <Grid container spacing={3} justifyContent="center">
                                {features.slice(0, 3).map((feature, idx) => (
                                    <Grid item xs={12} sm={4} key={idx}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                                    >
                                        <Card
                                            sx={{
                                                p: 4,
                                                height: "100%",
                                                textAlign: "center",
                                                borderRadius: 4,
                                                bgcolor: "white",
                                                border: "none",
                                                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                                transition: "all 0.3s ease",
                                                "&:hover": {
                                                    transform: "translateY(-8px)",
                                                    boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 64,
                                                    height: 64,
                                                    borderRadius: "50%",
                                                    bgcolor: hexToRgba(primaryColor, 0.1),
                                                    color: primaryColor,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    mx: "auto",
                                                    mb: 3,
                                                }}
                                            >
                                                <feature.icon size={28} stroke={1.5} />
                                            </Box>
                                            <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: "text.primary" }}>
                                                {feature.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                                {feature.description}
                                            </Typography>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                        </Box>
                    </Container>
                </Box>

                {/* ================== PROGRAMS SECTION ================== */}
                {programs.length > 0 && (
                    <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: "#FAFAFA" }}>
                        <Container maxWidth="lg">
                            <Stack spacing={2} textAlign="center" sx={{ mb: 8 }}>
                                <motion.div {...fadeInUp}>
                                    <SectionLabel color={primaryColor}>Our Programs</SectionLabel>
                                    <Typography variant="h2" fontWeight={700} sx={{ mb: 2 }}>
                                        Explore Our Courses
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
                                        Choose from our carefully designed programs to advance your knowledge and skills.
                                    </Typography>
                                </motion.div>
                            </Stack>

                            <Grid container spacing={4}>
                                {programs.slice(0, 6).map((program, idx) => (
                                    <Grid item xs={12} md={4} key={program.id}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                                        >
                                            <PublicProgramCard program={program} />
                                        </motion.div>
                                    </Grid>
                                ))}
                            </Grid>

                            <Box sx={{ textAlign: "center", mt: 6 }}>
                                <ButtonAnimationWrapper>
                                    <Button
                                        component={Link}
                                        href="/programs/"
                                        variant="contained"
                                        size="large"
                                        endIcon={<IconArrowRight size={20} />}
                                        sx={{
                                            bgcolor: primaryColor,
                                            "&:hover": { bgcolor: secondaryColor },
                                            borderRadius: 100,
                                            px: 5,
                                            py: 1.5,
                                        }}
                                    >
                                        View All Programs
                                    </Button>
                                </ButtonAnimationWrapper>
                            </Box>
                        </Container>
                    </Box>
                )}

                {/* ================== INSTRUCTORS SECTION ================== */}
                <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: "white" }}>
                    <Container maxWidth="md">
                        <Stack spacing={2} textAlign="center" sx={{ mb: 8 }}>
                            <motion.div {...fadeInUp}>
                                <SectionLabel color={primaryColor}>Our Experts</SectionLabel>
                                <Typography variant="h2" fontWeight={700} sx={{ mb: 2 }}>
                                    Learn from the Best
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
                                    Our dedicated team of instructors are industry veterans committed to your success.
                                </Typography>
                            </motion.div>
                        </Stack>

                        <Box sx={{ flexGrow: 1 }}>
                            <Grid container spacing={3} justifyContent="center">
                                {instructors.slice(0, 3).map((instructor, idx) => (
                                    <Grid item xs={12} sm={4} key={idx}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                                    >
                                        <Card
                                            sx={{
                                                height: "100%",
                                                borderRadius: 4,
                                                bgcolor: "#FFFFFF",
                                                border: "none",
                                                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                                overflow: "hidden",
                                                transition: "all 0.3s ease",
                                                "&:hover": {
                                                    transform: "translateY(-8px)",
                                                    boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                                                },
                                            }}
                                        >
                                            {/* Image placeholder */}
                                            <Box
                                                sx={{
                                                    height: 200,
                                                    bgcolor: hexToRgba(primaryColor, 0.1),
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <Avatar
                                                    sx={{
                                                        width: 100,
                                                        height: 100,
                                                        bgcolor: hexToRgba(primaryColor, 0.2),
                                                        color: primaryColor,
                                                        fontSize: "2rem",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {instructor.avatar}
                                                </Avatar>
                                            </Box>
                                            <Box sx={{ p: 3, textAlign: "left" }}>
                                                <Typography variant="h6" fontWeight={700} sx={{ color: "#1F2937" }}>
                                                    {instructor.name}
                                                </Typography>
                                                <Typography variant="subtitle2" sx={{ color: primaryColor, mb: 1 }}>
                                                    {instructor.role}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: "#6B7280", lineHeight: 1.6 }}>
                                                    {instructor.bio}
                                                </Typography>
                                            </Box>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                        </Box>
                    </Container>
                </Box>

                {/* ================== TESTIMONIALS SECTION ================== */}
                <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: "white" }}>
                    <Container maxWidth="lg">
                        <Stack spacing={2} textAlign="center" sx={{ mb: 8 }}>
                            <motion.div {...fadeInUp}>
                                <SectionLabel color={primaryColor}>Testimonials</SectionLabel>
                                <Typography variant="h2" fontWeight={700} sx={{ mb: 2 }}>
                                    What Our Students Say
                                </Typography>
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
                                        <Card
                                            sx={{
                                                p: 4,
                                                height: "100%",
                                                borderRadius: 4,
                                                bgcolor: "#FFFFFF",
                                                border: "none",
                                                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                                position: "relative",
                                            }}
                                        >
                                            <IconQuote
                                                size={40}
                                                color={hexToRgba(primaryColor, 0.2)}
                                                style={{ position: "absolute", top: 16, right: 16 }}
                                            />
                                            
                                            <Rating value={testimonial.rating} readOnly size="small" sx={{ mb: 2 }} />
                                            
                                            <Typography
                                                variant="body1"
                                                sx={{ mb: 3, lineHeight: 1.8, color: "#6B7280", fontStyle: "italic" }}
                                            >
                                                "{testimonial.quote}"
                                            </Typography>

                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Avatar
                                                    sx={{
                                                        width: 48,
                                                        height: 48,
                                                        bgcolor: primaryColor,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {testimonial.avatar}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#1F2937" }}>
                                                        {testimonial.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "#6B7280" }}>
                                                        {testimonial.role}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Card>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </Container>
                </Box>

                {/* ================== FAQ SECTION ================== */}
                <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: "#FAFAFA" }}>
                    <Container maxWidth="md">
                        <Stack spacing={2} textAlign="center" sx={{ mb: 6 }}>
                            <motion.div {...fadeInUp}>
                                <SectionLabel color={primaryColor}>FAQ</SectionLabel>
                                <Typography variant="h2" fontWeight={700}>
                                    Frequently Asked Questions
                                </Typography>
                            </motion.div>
                        </Stack>

                        <motion.div {...fadeInUp}>
                            {[
                                {
                                    q: "How do I enroll in a program?",
                                    a: "Simply browse our programs, select the one you're interested in, and click 'Enroll Now'. You'll be guided through the registration process step by step."
                                },
                                {
                                    q: "Are the certificates recognized?",
                                    a: "Yes, all our certificates are verified and can be authenticated using our online certificate verification system. Each certificate comes with a unique QR code for instant verification."
                                },
                                {
                                    q: "What support is available for students?",
                                    a: "We provide comprehensive support including instructor assistance, discussion forums, and dedicated student support to help you succeed in your learning journey."
                                },
                                {
                                    q: "Can I learn at my own pace?",
                                    a: "Most of our programs offer flexible learning options, allowing you to progress at your own pace while still meeting program requirements."
                                },
                            ].map((faq, idx) => (
                                <Accordion
                                    key={idx}
                                    sx={{
                                        mb: 2,
                                        borderRadius: 2,
                                        "&:before": { display: "none" },
                                        boxShadow: "none",
                                        border: "1px solid",
                                        borderColor: "grey.200",
                                        "&.Mui-expanded": { margin: "0 0 16px 0" },
                                    }}
                                >
                                    <AccordionSummary
                                        expandIcon={<IconChevronDown size={20} />}
                                        sx={{
                                            fontWeight: 600,
                                            "& .MuiAccordionSummary-content": { my: 2 },
                                        }}
                                    >
                                        <Typography fontWeight={600}>{faq.q}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                                        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                            {faq.a}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </motion.div>
                    </Container>
                </Box>

                {/* ================== CTA SECTION ================== */}
                <Box
                    sx={{
                        py: { xs: 10, md: 14 },
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            opacity: 0.05,
                            backgroundImage: `radial-gradient(white 1px, transparent 1px)`,
                            backgroundSize: "40px 40px",
                        }}
                    />
                    <Container maxWidth="md" sx={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                        <motion.div {...fadeInUp}>
                            <Typography
                                variant="h2"
                                fontWeight={700}
                                sx={{ color: "white", mb: 3 }}
                            >
                                Ready to Start Your Learning Journey?
                            </Typography>
                            <Typography
                                variant="h5"
                                sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 400, mb: 5, maxWidth: 500, mx: "auto" }}
                            >
                                Join thousands of students already learning with us. Get started today!
                            </Typography>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                                <ButtonAnimationWrapper>
                                    <Button
                                        component={Link}
                                        href="/register/"
                                        variant="contained"
                                        size="large"
                                        sx={{
                                            bgcolor: "white",
                                            color: primaryColor,
                                            "&:hover": { bgcolor: "grey.100" },
                                            px: 5,
                                            py: 1.5,
                                            borderRadius: 100,
                                            fontWeight: 700,
                                            fontSize: "1rem",
                                        }}
                                    >
                                        Get Started Free
                                    </Button>
                                </ButtonAnimationWrapper>
                                <ButtonAnimationWrapper>
                                    <Button
                                        component={Link}
                                        href="/contact/"
                                        variant="outlined"
                                        size="large"
                                        sx={{
                                            borderColor: "rgba(255,255,255,0.5)",
                                            color: "white",
                                            "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.1)" },
                                            px: 5,
                                            py: 1.5,
                                            borderRadius: 100,
                                        }}
                                    >
                                        Contact Us
                                    </Button>
                                </ButtonAnimationWrapper>
                            </Stack>
                        </motion.div>
                    </Container>
                </Box>

                {/* ================== FOOTER ================== */}
                <Box sx={{ bgcolor: "#111827", color: "grey.400", py: 8 }}>
                    <Container maxWidth="lg">
                        <Grid container spacing={6}>
                            {/* Brand Column */}
                            <Grid item xs={12} md={4}>
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    {platform.logoUrl ? (
                                        <Box
                                            component="img"
                                            src={platform.logoUrl}
                                            alt={platform.institutionName}
                                            sx={{ height: 32, filter: "brightness(0) invert(1)" }}
                                        />
                                    ) : (
                                        <IconSchool size={32} color="white" />
                                    )}
                                    <Typography variant="h6" fontWeight={700} sx={{ color: "white" }}>
                                        {platform.institutionName}
                                    </Typography>
                                </Stack>
                                {platform.tagline && (
                                    <Typography variant="body2" sx={{ maxWidth: 280, mb: 3, lineHeight: 1.7 }}>
                                        {platform.tagline}
                                    </Typography>
                                )}
                            </Grid>

                            {/* Quick Links */}
                            <Grid item xs={6} md={2}>
                                <Typography variant="subtitle2" sx={{ color: "white", fontWeight: 700, mb: 2 }}>
                                    Platform
                                </Typography>
                                <Stack spacing={1.5}>
                                    <Link href="/programs/" style={{ color: "inherit", textDecoration: "none" }}>Programs</Link>
                                    <Link href="/about/" style={{ color: "inherit", textDecoration: "none" }}>About Us</Link>
                                    <Link href="/contact/" style={{ color: "inherit", textDecoration: "none" }}>Contact</Link>
                                </Stack>
                            </Grid>

                            {/* Account Links */}
                            <Grid item xs={6} md={2}>
                                <Typography variant="subtitle2" sx={{ color: "white", fontWeight: 700, mb: 2 }}>
                                    Account
                                </Typography>
                                <Stack spacing={1.5}>
                                    <Link href="/login/" style={{ color: "inherit", textDecoration: "none" }}>Sign In</Link>
                                    <Link href="/register/" style={{ color: "inherit", textDecoration: "none" }}>Register</Link>
                                    <Link href="/verify-certificate/" style={{ color: "inherit", textDecoration: "none" }}>Verify Certificate</Link>
                                </Stack>
                            </Grid>

                            {/* Contact Info */}
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" sx={{ color: "white", fontWeight: 700, mb: 2 }}>
                                    Contact Us
                                </Typography>
                                <Stack spacing={2}>
                                    {platform.contactEmail && (
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <IconMail size={18} />
                                            <Typography variant="body2">{platform.contactEmail}</Typography>
                                        </Stack>
                                    )}
                                    {platform.contactPhone && (
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <IconPhone size={18} />
                                            <Typography variant="body2">{platform.contactPhone}</Typography>
                                        </Stack>
                                    )}
                                    {platform.address && (
                                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                            <IconMapPin size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                                            <Typography variant="body2">{platform.address}</Typography>
                                        </Stack>
                                    )}
                                </Stack>
                            </Grid>
                        </Grid>

                        {/* Copyright */}
                        <Box sx={{ mt: 8, pt: 4, borderTop: 1, borderColor: "grey.800", textAlign: "center" }}>
                            <Typography variant="caption" sx={{ color: "grey.500" }}>
                                © {new Date().getFullYear()} {platform.institutionName}. Powered by Crossview LMS.
                            </Typography>
                        </Box>
                    </Container>
                </Box>
            </Box>

            {/* Custom CSS injection */}
            {platform.customCss && (
                <style dangerouslySetInnerHTML={{ __html: platform.customCss }} />
            )}
        </ThemeProvider>
    );
}
