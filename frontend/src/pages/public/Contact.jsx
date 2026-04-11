import { Head, usePage } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    Button,
    TextField,
    ThemeProvider,
    createTheme,
    CssBaseline,
} from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";
import PublicNavbar from "../../components/common/PublicNavbar";
import Footer from "@/components/common/Footer";

// ─── Unsplash hero image ──────────────────────────────────────────
const HERO_IMAGE =
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80";

// ─── Animation variants ───────────────────────────────────────────
const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] },
};

// Force light theme for public pages
const lightTheme = createTheme({
    palette: {
        mode: "light",
        background: { default: "#FAFAFA", paper: "#FFFFFF" },
        text: { primary: "#1F2937", secondary: "#6B7280" },
    },
});

export default function Contact() {
    const { platform, auth } = usePage().props;

    const primaryColor = platform?.primaryColor || "#2563EB";
    const secondaryColor = platform?.secondaryColor || "#1E40AF";
    const institutionName = platform?.institutionName || "Our Institution";
    const contactEmail = platform?.email || "admin@example.com";
    const contactPhone = platform?.phone || "";
    const contactAddress = platform?.address || "";

    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: integrate with backend contact endpoint
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
        setForm({ name: "", email: "", message: "" });
    };

    return (
        <ThemeProvider theme={lightTheme}>
            <CssBaseline />
            <Head title={`Contact - ${institutionName}`}>
                <meta
                    name="description"
                    content={`Contact ${institutionName} to learn more about programs, enrollment, and learner support.`}
                />
            </Head>

            <Box sx={{ minHeight: "100vh", bgcolor: "#FAFAFA", overflowX: "hidden" }}>
                {/* ═══════ NAVBAR ═══════ */}
                <PublicNavbar activeLink="/contact/" auth={auth} />

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
                                        Contact
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
                                        src={HERO_IMAGE}
                                        alt="Contact us"
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

                {/* ═══════ SECTION 2: Contact Us — Info + Form ═══════ */}
                <Box sx={{ py: { xs: 8, md: 14 }, bgcolor: "white" }}>
                    <Container maxWidth="lg">
                        {/* Section Heading — centered */}
                        <motion.div {...fadeInUp}>
                            <Stack spacing={1.5} textAlign="center" alignItems="center" sx={{ mb: { xs: 6, md: 10 } }}>
                                <Typography
                                    variant="h2"
                                    sx={{ color: primaryColor, fontWeight: 700 }}
                                >
                                    Contact Us
                                </Typography>
                                <Box
                                    sx={{
                                        width: 50,
                                        height: 4,
                                        bgcolor: primaryColor,
                                        borderRadius: 2,
                                    }}
                                />
                            </Stack>
                        </motion.div>

                        {/* Two-column grid: info left, form right */}
                        <Grid container spacing={{ xs: 6, md: 10 }}>
                            {/* LEFT — Contact Info */}
                            <Grid size={{ xs: 12, md: 5 }}>
                                <motion.div {...fadeInUp}>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontStyle: "italic",
                                            color: "text.secondary",
                                            mb: 5,
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        If you have any questions, feel free to reach out to us. We&apos;d love to hear from you.
                                    </Typography>

                                    {/* Address */}
                                    <Box sx={{ mb: 4 }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ fontWeight: 700, color: primaryColor, mb: 0.5 }}
                                        >
                                            Address
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            color="text.secondary"
                                            sx={{ whiteSpace: "pre-line" }}
                                        >
                                            {contactAddress || "Address details coming soon."}
                                        </Typography>
                                    </Box>

                                    {/* Email */}
                                    <Box>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ fontWeight: 700, color: primaryColor, mb: 0.5 }}
                                        >
                                            Email
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary">
                                            {contactEmail}
                                        </Typography>
                                    </Box>

                                    {contactPhone && (
                                        <Box sx={{ mt: 4 }}>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    fontWeight: 700,
                                                    color: primaryColor,
                                                    mb: 0.5,
                                                }}
                                            >
                                                Phone
                                            </Typography>
                                            <Typography
                                                variant="body1"
                                                color="text.secondary"
                                            >
                                                {contactPhone}
                                            </Typography>
                                        </Box>
                                    )}
                                </motion.div>
                            </Grid>

                            {/* RIGHT — Contact Form */}
                            <Grid size={{ xs: 12, md: 7 }}>
                                <motion.div {...fadeInUp}>
                                    <Typography
                                        variant="h4"
                                        sx={{ fontWeight: 700, mb: 4, color: "text.primary" }}
                                    >
                                        Leave A Message
                                    </Typography>

                                    <Box
                                        component="form"
                                        onSubmit={handleSubmit}
                                        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                                    >
                                        <TextField
                                            name="name"
                                            label="Name"
                                            variant="outlined"
                                            fullWidth
                                            required
                                            value={form.name}
                                            onChange={handleChange}
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: 1,
                                                    bgcolor: "#F9FAFB",
                                                },
                                            }}
                                        />
                                        <TextField
                                            name="email"
                                            label="Email"
                                            type="email"
                                            variant="outlined"
                                            fullWidth
                                            required
                                            value={form.email}
                                            onChange={handleChange}
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: 1,
                                                    bgcolor: "#F9FAFB",
                                                },
                                            }}
                                        />
                                        <TextField
                                            name="message"
                                            label="Message"
                                            variant="outlined"
                                            fullWidth
                                            required
                                            multiline
                                            rows={5}
                                            value={form.message}
                                            onChange={handleChange}
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: 1,
                                                    bgcolor: "#F9FAFB",
                                                },
                                            }}
                                        />

                                        <Box>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                size="large"
                                                sx={{
                                                    px: 5,
                                                    py: 1.5,
                                                    borderRadius: 1,
                                                    bgcolor: primaryColor,
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    letterSpacing: 1,
                                                    textTransform: "uppercase",
                                                    "&:hover": {
                                                        bgcolor: secondaryColor,
                                                        transform: "translateY(-2px)",
                                                    },
                                                    transition: "all 0.3s ease",
                                                }}
                                            >
                                                Send Message
                                            </Button>
                                        </Box>

                                        {submitted && (
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "success.main", fontWeight: 600 }}
                                            >
                                                ✓ Message sent! We&apos;ll get back to you soon.
                                            </Typography>
                                        )}
                                    </Box>
                                </motion.div>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* ═══════ SECTION 3: Map ═══════ */}
                <Box sx={{ width: "100%", height: { xs: 300, md: 450 } }}>
                    <iframe
                        title="Location Map"
                        src="https://www.google.com/maps?q=0.5119850,35.2689220&z=16&output=embed"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                </Box>

                {/* ═══════ SECTION 4: Footer ═══════ */}
                <Footer />
            </Box>
        </ThemeProvider>
    );
}
