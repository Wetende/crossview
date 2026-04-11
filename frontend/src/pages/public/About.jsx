import { Head, Link, usePage } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    Button,
    ThemeProvider,
    createTheme,
    CssBaseline,
} from "@mui/material";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import PublicNavbar from "../../components/common/PublicNavbar";
import Footer from "@/components/common/Footer";

// ─── Unsplash images for education theme ──────────────────────────
const IMAGES = {
    hero: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    whoWeAre: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
    gallery: [
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=600&q=80",
    ],
    cta: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1600&q=80",
};

// ─── Animation variants ───────────────────────────────────────────
const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] },
};

const fadeInLeft = {
    initial: { opacity: 0, x: -40 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] },
};

const fadeInRight = {
    initial: { opacity: 0, x: 40 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] },
};

// Force light theme for public pages (matches Landing.jsx pattern)
const lightTheme = createTheme({
    palette: {
        mode: "light",
        background: { default: "#FAFAFA", paper: "#FFFFFF" },
        text: { primary: "#1F2937", secondary: "#6B7280" },
    },
});

// ─── Animated Counter Component ───────────────────────────────────
function AnimatedCounter({ value, suffix = "", duration = 2 }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isInView) return;

        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue)) return;

        let start = 0;
        const stepTime = Math.max(Math.floor((duration * 1000) / numericValue), 10);
        const timer = setInterval(() => {
            start += Math.ceil(numericValue / (duration * 60));
            if (start >= numericValue) {
                start = numericValue;
                clearInterval(timer);
            }
            setCount(start);
        }, stepTime);

        return () => clearInterval(timer);
    }, [isInView, value, duration]);

    const displayValue = typeof value === "string" && value.includes("K")
        ? `${(count / 1000).toFixed(count >= 1000 ? 0 : 0)}K`
        : count.toLocaleString();

    return (
        <Typography ref={ref} variant="h2" fontWeight={800} color="primary.main">
            {isInView ? displayValue : 0}{suffix}
        </Typography>
    );
}

const DEFAULT_STATS = [
    {
        key: "campusLocations",
        value: 5,
        suffix: "",
        label: "Campus Locations",
    },
    {
        key: "enrolledStudents",
        value: 10000,
        suffix: "",
        label: "Enrolled Students",
    },
    {
        key: "certifiedTeachers",
        value: 45,
        suffix: "",
        label: "Certified Teachers",
    },
    {
        key: "studentPrograms",
        value: 50,
        suffix: "+",
        label: "Student Programs",
    },
];

function buildAboutStats(statsConfig) {
    if (Array.isArray(statsConfig)) {
        return statsConfig
            .filter((item) => item?.label && item?.value !== undefined)
            .slice(0, 4)
            .map((item) => ({
                value: item.value,
                suffix: item.suffix || "",
                label: item.label,
            }));
    }

    const statsOverrides =
        statsConfig && typeof statsConfig === "object" ? statsConfig : {};

    return DEFAULT_STATS.map(({ key, ...stat }) => {
        const override = statsOverrides[key];

        if (override && typeof override === "object" && !Array.isArray(override)) {
            return {
                value: override.value ?? stat.value,
                suffix: override.suffix ?? stat.suffix,
                label: override.label ?? stat.label,
            };
        }

        if (override !== undefined && override !== null) {
            return {
                ...stat,
                value: override,
            };
        }

        return stat;
    });
}

// ═══════════════════════════════════════════════════════════════════
// Main About Component
// ═══════════════════════════════════════════════════════════════════
export default function About() {
    const { platform, auth } = usePage().props;

    // Dynamic colors from platform
    const primaryColor = platform?.primaryColor || "#2563EB";
    const secondaryColor = platform?.secondaryColor || "#1E40AF";
    const institutionName = platform?.institutionName || "Our Institution";
    const publicContent =
        platform?.publicContent && typeof platform.publicContent === "object"
            ? platform.publicContent
            : {};
    const missionText =
        publicContent.mission ||
        `${institutionName} is a leading educational institution committed to providing world-class learning experiences. Our mission is to empower students with the knowledge, skills, and confidence they need to thrive in an ever-changing world.`;
    const visionText =
        publicContent.vision ||
        "Founded on the principles of academic excellence and innovation, we have grown into a vibrant community of learners, educators, and thought leaders. Our diverse programs span across multiple disciplines, ensuring that every student finds their path to success.";
    const impactSchools = Array.isArray(publicContent.impactSchools)
        ? publicContent.impactSchools.filter(Boolean)
        : [];
    const stats = buildAboutStats(publicContent.stats);

    return (
        <ThemeProvider theme={lightTheme}>
            <CssBaseline />
            <Head title={`About - ${institutionName}`} />

            <Box sx={{ minHeight: "100vh", bgcolor: "#FAFAFA", overflowX: "hidden" }}>
                {/* ═══════ NAVBAR ═══════ */}
                <PublicNavbar activeLink="/about/" auth={auth} />

                {/* ═══════ SECTION 1: Hero Banner ═══════ */}
                <Box
                    sx={{
                        position: "relative",
                        pt: { xs: 14, md: 16 },
                        pb: { xs: 8, md: 12 },
                        bgcolor: primaryColor,
                        overflow: "hidden",
                    }}
                >
                    <Container maxWidth="lg">
                        <Grid container spacing={6} alignItems="center" justifyContent="space-between">
                            {/* Title Side */}
                            <Grid size={{ xs: 12, md: 4 }}>
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.7, delay: 0.1 }}
                                >
                                    <Typography
                                        variant="h1"
                                        sx={{
                                            color: "white",
                                            fontSize: { xs: 42, md: 56 },
                                            fontWeight: 700,
                                            mb: 2,
                                        }}
                                    >
                                        About
                                    </Typography>
                                    <Box
                                        sx={{
                                            width: 60,
                                            height: 4,
                                            bgcolor: "white",
                                            borderRadius: 2,
                                            opacity: 0.7,
                                        }}
                                    />
                                </motion.div>
                            </Grid>

                            {/* Image Side — pushed right */}
                            <Grid size={{ xs: 12, md: 7 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, delay: 0.3 }}
                                    style={{ width: "100%", maxWidth: 520 }}
                                >
                                    <Box
                                        component="img"
                                        src={IMAGES.hero}
                                        alt="Students learning"
                                        sx={{
                                            width: "100%",
                                            height: { xs: 250, md: 320 },
                                            objectFit: "cover",
                                            borderRadius: 3,
                                            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                                        }}
                                    />
                                </motion.div>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* ═══════ SECTION 2: Who We Are ═══════ */}
                <Box sx={{ py: { xs: 8, md: 14 }, bgcolor: "white" }}>
                    <Container maxWidth="lg">
                        {/* Section Heading — centered */}
                        <motion.div {...fadeInUp}>
                            <Typography
                                variant="h2"
                                sx={{
                                    color: primaryColor,
                                    fontWeight: 700,
                                    textAlign: "center",
                                    mb: { xs: 5, md: 8 },
                                }}
                            >
                                Who We Are
                            </Typography>
                        </motion.div>

                        {/* Two-column grid */}
                        <Grid container spacing={{ xs: 4, md: 8 }}>
                            {/* LEFT COLUMN — Image + caption */}
                            <Grid size={{ xs: 12, md: 5 }}>
                                <motion.div {...fadeInLeft}>
                                    <Box
                                        component="img"
                                        src={IMAGES.whoWeAre}
                                        alt="Students in classroom"
                                        sx={{
                                            width: "100%",
                                            height: { xs: 280, md: 380 },
                                            objectFit: "cover",
                                            borderRadius: 3,
                                            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                                            mb: 3,
                                        }}
                                    />
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: "text.secondary",
                                            lineHeight: 1.8,
                                            fontStyle: "italic",
                                        }}
                                    >
                                        {`We are an outstanding institution dedicated to providing quality education, fostering creativity, and nurturing the leaders of tomorrow.`}
                                    </Typography>
                                </motion.div>
                            </Grid>

                            {/* RIGHT COLUMN — Sub-headed paragraphs */}
                            <Grid size={{ xs: 12, md: 7 }}>
                                <motion.div {...fadeInRight}>
                                    <Typography
                                        variant="h5"
                                        sx={{ fontWeight: 700, mb: 1.5, color: "text.primary" }}
                                    >
                                        {`Welcome to ${institutionName}`}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{ color: "text.secondary", mb: 4, lineHeight: 1.8 }}
                                    >
                                        {missionText}
                                    </Typography>

                                    <Typography
                                        variant="h5"
                                        sx={{ fontWeight: 700, mb: 1.5, color: "text.primary" }}
                                    >
                                        Our Vision
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{ color: "text.secondary", mb: 4, lineHeight: 1.8 }}
                                    >
                                        {visionText}
                                    </Typography>

                                    <Typography
                                        variant="h5"
                                        sx={{ fontWeight: 700, mb: 1.5, color: "text.primary" }}
                                    >
                                        A Holistic Approach
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{ color: "text.secondary", lineHeight: 1.8 }}
                                    >
                                        We believe in a holistic approach to education — one that goes beyond textbooks and exams. Through hands-on projects, collaborative learning, and real-world experience, we prepare our students not just for careers, but for life.
                                    </Typography>
                                </motion.div>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* ═══════ SECTION 3: Image Gallery Strip ═══════ */}
                <Box sx={{ overflow: "hidden" }}>
                    <Grid container spacing={0}>
                        {IMAGES.gallery.map((src, idx) => (
                            <Grid size={{ xs: 6, md: 3 }} key={idx}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                                >
                                    <Box
                                        component="img"
                                        src={src}
                                        alt={`Campus life ${idx + 1}`}
                                        sx={{
                                            width: "100%",
                                            height: { xs: 180, sm: 220, md: 260 },
                                            objectFit: "cover",
                                            display: "block",
                                            transition: "transform 0.4s ease",
                                            "&:hover": {
                                                transform: "scale(1.05)",
                                            },
                                        }}
                                    />
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* ═══════ SECTION 4: About Us + Stats ═══════ */}
                <Box sx={{ py: { xs: 8, md: 14 }, bgcolor: "#F9FAFB" }}>
                    <Container maxWidth="lg">
                        {/* Section Header */}
                        <motion.div {...fadeInUp}>
                            <Stack spacing={2} textAlign="center" sx={{ mb: { xs: 6, md: 10 } }}>
                                <Typography
                                    variant="h2"
                                    sx={{
                                        color: primaryColor,
                                        fontWeight: 700,
                                    }}
                                >
                                    About Us
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: "text.secondary",
                                        maxWidth: 600,
                                        mx: "auto",
                                        lineHeight: 1.8,
                                    }}
                                >
                                    Dedicated to excellence in education, we provide an inspiring environment
                                    where students can grow, learn, and achieve their dreams.
                                </Typography>
                            </Stack>
                        </motion.div>

                        {impactSchools.length > 0 && (
                            <Stack
                                spacing={2}
                                alignItems="center"
                                sx={{ mb: { xs: 5, md: 7 } }}
                            >
                                <Typography
                                    variant="overline"
                                    sx={{
                                        color: primaryColor,
                                        letterSpacing: 2,
                                        fontWeight: 700,
                                    }}
                                >
                                    Impact Highlights
                                </Typography>
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    useFlexGap
                                    flexWrap="wrap"
                                    justifyContent="center"
                                >
                                    {impactSchools.map((school) => (
                                        <Box
                                            key={school}
                                            sx={{
                                                px: 2.5,
                                                py: 1.25,
                                                bgcolor: "white",
                                                borderRadius: 999,
                                                border: "1px solid",
                                                borderColor: "grey.200",
                                                boxShadow:
                                                    "0 2px 12px rgba(0,0,0,0.04)",
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "text.secondary" }}
                                            >
                                                {school}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Stack>
                        )}

                        {/* Stats Grid */}
                        <Grid container spacing={3} justifyContent="center">
                            {stats.map((stat, idx) => (
                                <Grid size={{ xs: 6, sm: 3 }} key={idx}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                                    >
                                        <Box
                                            sx={{
                                                textAlign: "center",
                                                py: { xs: 3, md: 5 },
                                                px: 2,
                                                bgcolor: "white",
                                                borderRadius: 3,
                                                border: "1px solid",
                                                borderColor: "grey.200",
                                                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                                                transition: "all 0.3s ease",
                                                "&:hover": {
                                                    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                                                    transform: "translateY(-4px)",
                                                },
                                            }}
                                        >
                                            <AnimatedCounter
                                                value={stat.value}
                                                suffix={stat.suffix}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "text.secondary",
                                                    fontWeight: 500,
                                                    mt: 1,
                                                    textTransform: "uppercase",
                                                    letterSpacing: 0.5,
                                                    fontSize: { xs: 11, sm: 13 },
                                                }}
                                            >
                                                {stat.label}
                                            </Typography>
                                        </Box>
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </Container>
                </Box>

                {/* ═══════ SECTION 5: CTA Banner ═══════ */}
                <Box
                    sx={{
                        position: "relative",
                        py: { xs: 10, md: 16 },
                        backgroundImage: `url(${IMAGES.cta})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundAttachment: { md: "fixed" },
                    }}
                >
                    {/* Dark Overlay */}
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            bgcolor: "rgba(0, 0, 0, 0.65)",
                        }}
                    />

                    <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
                        <motion.div {...fadeInUp}>
                            <Stack spacing={4} textAlign="center" alignItems="center">
                                <Typography
                                    variant="overline"
                                    sx={{
                                        color: "rgba(255,255,255,0.7)",
                                        letterSpacing: 3,
                                        fontSize: 13,
                                    }}
                                >
                                    Choose Us
                                </Typography>

                                <Typography
                                    variant="h2"
                                    sx={{
                                        color: "white",
                                        fontWeight: 700,
                                        fontSize: { xs: 28, md: 42 },
                                        maxWidth: 600,
                                    }}
                                >
                                    Start Your New Career With Us!
                                </Typography>

                                <Button
                                    component={Link}
                                    href="/register/"
                                    variant="contained"
                                    size="large"
                                    sx={{
                                        mt: 2,
                                        px: 5,
                                        py: 1.5,
                                        borderRadius: 100,
                                        bgcolor: primaryColor,
                                        fontSize: 16,
                                        fontWeight: 600,
                                        textTransform: "none",
                                        boxShadow: `0 4px 20px ${primaryColor}66`,
                                        "&:hover": {
                                            bgcolor: secondaryColor,
                                            boxShadow: `0 8px 30px ${secondaryColor}88`,
                                            transform: "translateY(-2px)",
                                        },
                                        transition: "all 0.3s ease",
                                    }}
                                >
                                    Enroll Now
                                </Button>
                            </Stack>
                        </motion.div>
                    </Container>
                </Box>

                {/* ═══════ SECTION 6: Footer ═══════ */}
                <Footer />
            </Box>
        </ThemeProvider>
    );
}
