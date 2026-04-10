import { Head, Link, usePage } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    Button,
    Card,
    Chip,
    ThemeProvider,
    createTheme,
    CssBaseline,
} from "@mui/material";
import {
    IconTarget,
    IconEye,
    IconBulb,
    IconSchool,
    IconMapPin,
    IconPhone,
    IconMail,
} from "@tabler/icons-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import VisuallyHidden from "../../components/common/VisuallyHidden";
import PublicNavbar from "../../components/common/PublicNavbar";
import Footer from "@/components/common/Footer";

// ─── Placeholder images — will be replaced with uploads via SuperAdmin later ──
const IMAGES = {
    hero: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
    whoWeAre: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
    gallery: [
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=600&q=80",
    ],
    cta: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=80",
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

// Helper
function hexToRgba(hex, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
}

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

// Fallback impact schools — overrideable via platform.publicContent.impactSchools
const DEFAULT_IMPACT_SCHOOLS = [
    "DevKi Secondary School — Ruiru",
    "Giakanja Boys — Nyeri",
    "Murera Secondary School",
];

// Fallback mission/vision text — overrideable via platform.publicContent.mission / .vision
const DEFAULT_MISSION = (name) =>
    `${name}'s mission is to empower African youth with world-class technology education and skills development. We believe every young person — regardless of geography, socioeconomic status, or background — deserves access to quality STEM learning. Through robotics, coding, AI, and design education, we're building the next generation of African tech innovators, entrepreneurs, and leaders.`;

const DEFAULT_VISION = (name) =>
    `By 2030, ${name} will reach 500+ schools and empower 1 million African kids and teens with tech skills. We envision a continent where every young person has the tools, knowledge, and confidence to participate in — and lead — the digital revolution.`;

// ═══════════════════════════════════════════════════════════════════
// Main About Component — DigikaTech Africa
// ═══════════════════════════════════════════════════════════════════
export default function About() {
    const { platform, auth } = usePage().props;

    // Dynamic colors from platform
    const primaryColor = platform?.primaryColor || "#2563EB";
    const secondaryColor = platform?.secondaryColor || "#1E40AF";
    const institutionName = platform?.institutionName || "DigikaTech Africa";

    // Content from platform.publicContent (DB/SuperAdmin) with Digika defaults
    const publicContent = platform?.publicContent || {};
    const missionText = publicContent.mission || DEFAULT_MISSION(institutionName);
    const visionText = publicContent.vision || DEFAULT_VISION(institutionName);
    const impactSchools = publicContent.impactSchools || DEFAULT_IMPACT_SCHOOLS;

    // Stats — mix of real DB queries (future) and admin overrides
    const statsOverrides = publicContent.stats || {};
    const stats = [
        { value: statsOverrides.partnerSchools ?? 3, suffix: "", label: "Partner Schools" },
        { value: statsOverrides.targetSchools ?? 500, suffix: "+", label: "Target Schools by 2030" },
        { value: statsOverrides.corePrograms ?? 7, suffix: "", label: "Core Programs" },
        { value: statsOverrides.goalStudents ?? 1000000, suffix: "", label: "Goal: Young Africans" },
    ];

    return (
        <ThemeProvider theme={lightTheme}>
            <CssBaseline />
            <Head
                title={`About - ${institutionName}`}
            >
                <meta
                    name="description"
                    content={`About ${institutionName} | Youth Tech Empowerment | Reaching 1 Million Young Africans with Quality Education in Robotics, AI & Digital Skills by 2030.`}
                />
            </Head>

            <Box sx={{ minHeight: "100vh", bgcolor: "#FAFAFA", overflowX: "hidden" }}>
                {/* Global SEO Injection */}
                <VisuallyHidden component="h1">
                    About DigikaTech Africa: Tech education Africa, STEM learning Africa, STEM careers Africa, Tech mentorship, Digital transformation Africa.
                </VisuallyHidden>

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
                                        About Us
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: "rgba(255,255,255,0.8)",
                                            fontWeight: 400,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Empowering African Youth Through Technology
                                    </Typography>
                                    <Box
                                        sx={{
                                            width: 60,
                                            height: 4,
                                            bgcolor: "white",
                                            borderRadius: 2,
                                            opacity: 0.7,
                                            mt: 2,
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
                                        alt="DigikaTech students in a tech workshop"
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

                {/* ═══════ SECTION 2: Mission, Vision & Philosophy ═══════ */}
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
                            {/* LEFT COLUMN — Image + motto */}
                            <Grid size={{ xs: 12, md: 5 }}>
                                <motion.div {...fadeInLeft}>
                                    <Box
                                        component="img"
                                        src={IMAGES.whoWeAre}
                                        alt="Students building robots"
                                        sx={{
                                            width: "100%",
                                            height: { xs: 280, md: 380 },
                                            objectFit: "cover",
                                            borderRadius: 3,
                                            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                                            mb: 3,
                                        }}
                                    />
                                    <Card
                                        sx={{
                                            p: 3,
                                            borderRadius: 3,
                                            bgcolor: hexToRgba(primaryColor, 0.05),
                                            border: `1px solid ${hexToRgba(primaryColor, 0.15)}`,
                                        }}
                                    >
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <IconBulb size={28} color={primaryColor} />
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                                                    Our Core Philosophy
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                                                    &quot;Awareness is the Mother of Knowledge&quot;
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Card>
                                </motion.div>
                            </Grid>

                            {/* RIGHT COLUMN — Mission, Vision, Why We Exist */}
                            <Grid size={{ xs: 12, md: 7 }}>
                                <motion.div {...fadeInRight}>
                                    {/* Mission */}
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                                        <IconTarget size={22} color={primaryColor} />
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>
                                            Our Mission
                                        </Typography>
                                    </Stack>
                                    <Typography
                                        variant="body1"
                                        sx={{ color: "text.secondary", mb: 4, lineHeight: 1.8 }}
                                    >
                                        {missionText}
                                    </Typography>

                                    {/* Vision */}
                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                                        <IconEye size={22} color={primaryColor} />
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary" }}>
                                            Our Vision
                                        </Typography>
                                    </Stack>
                                    <Typography
                                        variant="body1"
                                        sx={{ color: "text.secondary", mb: 4, lineHeight: 1.8 }}
                                    >
                                        {visionText}
                                    </Typography>

                                    {/* The Challenge & Our Solution */}
                                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: "text.primary" }}>
                                        Why We Exist
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{ color: "text.secondary", mb: 2, lineHeight: 1.8 }}
                                    >
                                        Africa is home to over 400 million young people under 25 — the world&apos;s youngest
                                        population. Yet there&apos;s a critical shortage of quality tech education. Many schools
                                        lack STEM resources. The digital skills gap threatens economic opportunity.
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{ color: "text.secondary", lineHeight: 1.8 }}
                                    >
                                        We deliver culturally relevant, practical tech education through multiple
                                        channels — online platforms, school partnerships, tech hubs, and bootcamps.
                                        Our instructors are African tech professionals who understand local contexts.
                                        We&apos;re not just teaching tech; we&apos;re building inclusive learning communities.
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
                                        alt={`Tech education ${idx + 1}`}
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

                {/* ═══════ SECTION 4: Impact & Stats ═══════ */}
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
                                    Our Impact
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
                                    We&apos;re scaling rapidly — building tech hubs, creating pathways from
                                    awareness to skills to employment, and fostering a culture of innovation
                                    across Africa.
                                </Typography>
                            </Stack>
                        </motion.div>

                        {/* Impact Schools */}
                        <motion.div {...fadeInUp}>
                            <Card
                                sx={{
                                    p: { xs: 3, md: 4 },
                                    mb: 6,
                                    borderRadius: 3,
                                    bgcolor: "white",
                                    border: "1px solid",
                                    borderColor: "grey.200",
                                }}
                            >
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                                    <IconSchool size={24} color={primaryColor} />
                                    <Typography variant="h6" fontWeight={700}>
                                        Schools We&apos;ve Reached
                                    </Typography>
                                </Stack>
                                <Stack spacing={1}>
                                    {impactSchools.map((school, idx) => (
                                        <Stack key={idx} direction="row" spacing={1.5} alignItems="center">
                                            <IconMapPin size={16} color={primaryColor} />
                                            <Typography variant="body1" color="text.secondary">
                                                {school}
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            </Card>
                        </motion.div>

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

                        {/* SDG Alignment */}
                        <motion.div {...fadeInUp}>
                            <Card
                                sx={{
                                    p: { xs: 3, md: 4 },
                                    mt: 6,
                                    borderRadius: 3,
                                    bgcolor: hexToRgba(primaryColor, 0.03),
                                    border: `1px solid ${hexToRgba(primaryColor, 0.1)}`,
                                }}
                            >
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: "text.primary" }}>
                                    UN Sustainable Development Goals
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {[
                                        "SDG 4 — Quality Education",
                                        "SDG 5 — Gender Equality",
                                        "SDG 8 — Decent Work",
                                        "SDG 9 — Innovation",
                                        "SDG 10 — Reduced Inequalities",
                                    ].map((sdg, idx) => (
                                        <Chip
                                            key={idx}
                                            label={sdg}
                                            size="small"
                                            sx={{
                                                bgcolor: hexToRgba(primaryColor, 0.1),
                                                color: primaryColor,
                                                fontWeight: 600,
                                                fontSize: "0.75rem",
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Card>
                        </motion.div>
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
                                    Join the Tech Revolution
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
                                    Ready to Master Robotics, Coding, or AI?
                                </Typography>

                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: "rgba(255,255,255,0.8)",
                                        maxWidth: 500,
                                        lineHeight: 1.8,
                                    }}
                                >
                                    Learn from expert instructors. Build real projects. Join
                                    a community of young African innovators. Start your tech
                                    journey today.
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
                                    Enroll Now — Start Free
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
