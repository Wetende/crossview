import { Head, Link, usePage } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    ThemeProvider,
    CssBaseline,
    createTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import EventCard from "@/features/events/components/EventCard";
import Footer from "@/components/common/Footer";
import PublicNavbar from "@/components/common/PublicNavbar";

// ─── Hero image — African students studying together ─────────────
const HERO_IMAGE =
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80";

// ─── Light theme ─────────────────────────────────────────────────
const lightTheme = createTheme({
    palette: {
        mode: "light",
        background: { default: "#FAFAFA", paper: "#FFFFFF" },
        text: { primary: "#1F2937", secondary: "#6B7280" },
    },
});

// ─── Animation presets ───────────────────────────────────────────
const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] },
};

export default function Events({ events }) {
    const { auth, platform } = usePage().props;

    const primaryColor = platform?.primaryColor || "#2563EB";
    const institutionName = platform?.institutionName || "LMS";

    return (
        <ThemeProvider theme={lightTheme}>
            <CssBaseline />
            <Head title={`Upcoming Events - ${institutionName}`} />

            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "#FAFAFA",
                }}
            >
                {/* ═══════ NAVBAR ═══════ */}
                <PublicNavbar activeLink="/events/" auth={auth} />

                {/* ═══════ HERO BANNER ═══════ */}
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
                                        Upcoming Events
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

                            {/* Image Side */}
                            <Grid size={{ xs: 12, md: 7 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.8, delay: 0.3 }}
                                    style={{ width: "100%", maxWidth: 520 }}
                                >
                                    <Box
                                        component="img"
                                        src={HERO_IMAGE}
                                        alt="Students at a campus event"
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

                {/* ═══════ EVENTS GRID ═══════ */}
                <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, flexGrow: 1 }}>
                    {events && events.length > 0 ? (
                        <motion.div {...fadeInUp}>
                            <Grid container spacing={4}>
                                {events.map((event) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={event.id}>
                                        <EventCard event={event} />
                                    </Grid>
                                ))}
                            </Grid>
                        </motion.div>
                    ) : (
                        <motion.div {...fadeInUp}>
                            <Stack alignItems="center" spacing={2} sx={{ py: 10 }}>
                                <Typography variant="h5" color="text.secondary" fontWeight={600}>
                                    No upcoming events
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Check back later for new events and workshops.
                                </Typography>
                            </Stack>
                        </motion.div>
                    )}
                </Container>

                {/* ═══════ FOOTER ═══════ */}
                <Footer />
            </Box>
        </ThemeProvider>
    );
}
