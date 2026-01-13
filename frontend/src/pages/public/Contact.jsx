import { Head, Link, useForm } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    Card,
    useTheme,
    Button,
    AppBar,
    Toolbar,
    useScrollTrigger,
    TextField,
    Alert,
} from "@mui/material";
import {
    IconBrandTabler,
    IconMapPin,
    IconPhone,
    IconMail,
    IconSend,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { getBackgroundDots } from "../../utils/getBackgroundDots";
import { cloneElement } from "react";
import ButtonAnimationWrapper from "../../components/common/ButtonAnimationWrapper";

// --- Helper Components ---
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

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] },
};

export default function Contact() {
    const theme = useTheme();
    const { data, setData, post, processing, wasSuccessful } = useForm({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/contact/");
    };

    return (
        <>
            <Head title="Contact Us - Crossview LMS" />

            <Box sx={{ minHeight: "100vh", bgcolor: "background.default", overflowX: "hidden" }}>
                {/* Navbar */}
                <ElevationScroll>
                    <AppBar position="fixed" color="transparent" sx={{ py: 2 }}>
                        <Container maxWidth="lg">
                            <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
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
                                            textDecoration: "none"
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

                                <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" } }}>
                                    <Link href="/programs/" style={{ textDecoration: 'none', color: theme.palette.text.primary, fontWeight: 500 }}>Programs</Link>
                                    <Link href="/about/" style={{ textDecoration: 'none', color: theme.palette.text.primary, fontWeight: 500 }}>About</Link>
                                    <Link href="/contact/" style={{ textDecoration: 'none', color: theme.palette.primary.main, fontWeight: 600 }}>Contact</Link>
                                </Stack>

                                <Stack direction="row" spacing={2}>
                                    <Button component={Link} href="/login/" color="inherit" sx={{ fontWeight: 600 }}>
                                        Sign In
                                    </Button>
                                    <ButtonAnimationWrapper>
                                        <Button component={Link} href="/register/" variant="contained" sx={{ borderRadius: 100, px: 3 }}>
                                            Get Started
                                        </Button>
                                    </ButtonAnimationWrapper>
                                </Stack>
                            </Toolbar>
                        </Container>
                    </AppBar>
                </ElevationScroll>

                {/* Hero Section */}
                <Box sx={{ position: "relative", pt: { xs: 16, md: 20 }, pb: { xs: 8, md: 12 } }}>
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
                        <motion.div {...fadeInUp}>
                            <Typography variant="h1" textAlign="center" gutterBottom>
                                Get in Touch
                            </Typography>
                            <Typography variant="h5" color="text.secondary" textAlign="center" sx={{ maxWidth: 600, mx: "auto", mb: 8 }}>
                                We'd love to hear from you. Whether you have a question about features, trials, or pricing, our team is ready to answer all your questions.
                            </Typography>
                        </motion.div>
                    </Container>
                </Box>

                {/* Content Section */}
                <Container maxWidth="lg" sx={{ pb: 16 }}>
                    <Grid container spacing={8}>
                        {/* Contact Info */}
                        <Grid item xs={12} md={4}>
                            <Stack spacing={4}>
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                    <GraphicsCard sx={{ p: 4 }}>
                                        <Stack spacing={4}>
                                            <Stack direction="row" spacing={2}>
                                                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "primary.lighter", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <IconMail size={20} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={700}>Email</Typography>
                                                    <Typography variant="body2" color="text.secondary">Our friendly team is here to help.</Typography>
                                                    <Typography variant="body1" color="primary.main" fontWeight={600} sx={{ mt: 0.5 }}>hello@crossview.co.ke</Typography>
                                                </Box>
                                            </Stack>

                                            <Stack direction="row" spacing={2}>
                                                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "primary.lighter", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <IconMapPin size={20} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={700}>Office</Typography>
                                                    <Typography variant="body2" color="text.secondary">Come say hello at our office headquarters.</Typography>
                                                    <Typography variant="body1" sx={{ mt: 0.5 }}>Westlands, Nairobi, Kenya</Typography>
                                                </Box>
                                            </Stack>

                                            <Stack direction="row" spacing={2}>
                                                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "primary.lighter", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <IconPhone size={20} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={700}>Phone</Typography>
                                                    <Typography variant="body2" color="text.secondary">Mon-Fri from 8am to 5pm.</Typography>
                                                    <Typography variant="body1" sx={{ mt: 0.5 }}>+254 700 000 000</Typography>
                                                </Box>
                                            </Stack>
                                        </Stack>
                                    </GraphicsCard>
                                </motion.div>
                            </Stack>
                        </Grid>

                        {/* Contact Form */}
                        <Grid item xs={12} md={8}>
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                                <GraphicsCard sx={{ p: { xs: 4, md: 6 } }}>
                                    {wasSuccessful ? (
                                        <Alert severity="success" sx={{ mb: 4 }}>
                                            Thank you! Your message has been sent successfully. We'll be in touch soon.
                                        </Alert>
                                    ) : (
                                        <form onSubmit={handleSubmit}>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        label="Name"
                                                        fullWidth
                                                        required
                                                        value={data.name}
                                                        onChange={(e) => setData("name", e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField
                                                        label="Email"
                                                        type="email"
                                                        fullWidth
                                                        required
                                                        value={data.email}
                                                        onChange={(e) => setData("email", e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        label="Subject"
                                                        fullWidth
                                                        required
                                                        value={data.subject}
                                                        onChange={(e) => setData("subject", e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        label="Message"
                                                        multiline
                                                        rows={4}
                                                        fullWidth
                                                        required
                                                        value={data.message}
                                                        onChange={(e) => setData("message", e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <ButtonAnimationWrapper>
                                                        <Button
                                                            type="submit"
                                                            variant="contained"
                                                            size="large"
                                                            disabled={processing}
                                                            endIcon={!processing && <IconSend size={18} />}
                                                            sx={{ borderRadius: 100, px: 4 }}
                                                        >
                                                            {processing ? "Sending..." : "Send Message"}
                                                        </Button>
                                                    </ButtonAnimationWrapper>
                                                </Grid>
                                            </Grid>
                                        </form>
                                    )}
                                </GraphicsCard>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>

                {/* Footer (Consistent) */}
                <Box sx={{ bgcolor: "grey.900", color: "grey.400", py: 8 }}>
                    <Container maxWidth="lg">
                        <Grid container spacing={8}>
                            <Grid item xs={12} md={4}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, color: "white" }}>
                                    <IconBrandTabler size={32} />
                                    <Typography variant="h5" fontWeight={700}>Crossview</Typography>
                                </Stack>
                                <Typography variant="body2" sx={{ maxWidth: 300 }}>
                                    Empowering Kenyan institutions with modern, flexible, and reliable educational technology.
                                </Typography>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <Typography variant="subtitle2" color="white" gutterBottom>Platform</Typography>
                                <Stack spacing={1}>
                                    <Link href="/programs/" style={{ color: "inherit", textDecoration: "none" }}>Programs</Link>
                                    <Link href="/about/" style={{ color: "inherit", textDecoration: "none" }}>About</Link>
                                </Stack>
                            </Grid>
                            <Grid item xs={6} md={2}>
                                <Typography variant="subtitle2" color="white" gutterBottom>Support</Typography>
                                <Stack spacing={1}>
                                    <Link href="/contact/" style={{ color: "inherit", textDecoration: "none" }}>Contact</Link>
                                    <Link href="/verify-certificate/" style={{ color: "inherit", textDecoration: "none" }}>Verify Certificate</Link>
                                </Stack>
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 8, pt: 4, borderTop: 1, borderColor: "grey.800", textAlign: "center" }}>
                            <Typography variant="caption">© 2025 Crossview LMS. All rights reserved.</Typography>
                        </Box>
                    </Container>
                </Box>
            </Box>
        </>
    );
}
