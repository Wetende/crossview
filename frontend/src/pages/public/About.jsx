import { Head, Link } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    Card,
    CardContent,
    Avatar,
    useTheme,
    Button,
} from "@mui/material";
import {
    IconSchool,
    IconCertificate,
    IconDeviceAnalytics,
    IconBrandTabler,
    IconHierarchy,
    IconLayoutDashboard,
    IconRocket,
} from "@tabler/icons-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { getBackgroundDots } from "../../utils/getBackgroundDots";
import PublicNavbar from "../../components/common/PublicNavbar";

// --- Animation Variants ---
const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] },
};

// --- Helper Components ---
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

export default function About() {
    const theme = useTheme();
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);

    const philosophyItems = [
        {
            icon: IconHierarchy,
            title: "Structure First",
            description: "We believe education starts with a clear academic blueprint. Define your hierarchy once, and let the system adapt.",
        },
        {
            icon: IconCertificate,
            title: "Verifiable Trust",
            description: "In a digital world, credentials must be instantly verifiable. Every certificate we issue is cryptographically secure.",
        },
        {
            icon: IconDeviceAnalytics,
            title: "Data Driven",
            description: "Decisions should be based on real-time data. We provide granular insights into student progress and institutional health.",
        },
    ];

    return (
        <>
            <Head title="About Crossview LMS" />

            <Box sx={{ minHeight: "100vh", bgcolor: "background.default", overflowX: "hidden" }}>
                {/* Navbar */}
                <PublicNavbar activeLink="/about/" />

                {/* Hero Section */}
                <Box sx={{ position: "relative", pt: { xs: 16, md: 24 }, pb: { xs: 12, md: 20 }, overflow: "hidden" }}>
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
                                    <Typography variant="h1" gutterBottom sx={{ mb: 3 }}>
                                        We Build the <br />
                                        <Box component="span" sx={{ color: "primary.main" }}>Digital Infrastructure</Box>
                                        <br />for Education.
                                    </Typography>
                                    <Typography variant="h5" color="text.secondary" sx={{ mb: 5, fontWeight: 400, maxWidth: 500 }}>
                                        Crossview isn't just an LMS. It's a Chameleon Engine designed to adapt to the unique structure of any academic institution.
                                    </Typography>
                                </motion.div>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <motion.div style={{ y: heroY }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
                                    <GraphicsCard sx={{ bgcolor: "background.paper", p: 0, position: "relative", height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                         <Box sx={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: `radial-gradient(${theme.palette.primary.main} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
                                         <IconSchool size={80} color={theme.palette.primary.main} stroke={1} />
                                         <Typography variant="h4" fontWeight={700} sx={{ mt: 2 }}>For Every Institution</Typography>
                                    </GraphicsCard>
                                </motion.div>
                            </Grid>
                        </Grid>
                    </Container>
                </Box>

                {/* Philosophy Section */}
                <Container maxWidth="lg" sx={{ py: { xs: 10, md: 16 } }}>
                    <Stack spacing={2} textAlign="center" sx={{ mb: 10 }}>
                        <motion.div {...fadeInUp}>
                            <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ letterSpacing: 1, textTransform: 'uppercase' }}>Our Philosophy</Typography>
                            <Typography variant="h2">Built for the Future</Typography>
                        </motion.div>
                    </Stack>

                    <Grid container spacing={4}>
                        {philosophyItems.map((item, idx) => (
                            <Grid item xs={12} md={4} key={idx}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                                >
                                    <GraphicsCard sx={{ p: 4, height: "100%" }}>
                                        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "primary.lighter", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", mb: 3 }}>
                                            <item.icon size={24} />
                                        </Box>
                                        <Typography variant="h5" fontWeight={700} gutterBottom>{item.title}</Typography>
                                        <Typography variant="body1" color="text.secondary">{item.description}</Typography>
                                    </GraphicsCard>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Container>

                {/* Team/Mission Section (Placeholder) */}
                 <Box sx={{ bgcolor: "grey.50", py: { xs: 10, md: 16 } }}>
                    <Container maxWidth="lg">
                         <Grid container spacing={8} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <motion.div {...fadeInUp}>
                                    <GraphicsCard sx={{ height: 400, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <IconRocket size={64} color={theme.palette.grey[400]} />
                                    </GraphicsCard>
                                </motion.div>
                            </Grid>
                             <Grid item xs={12} md={6}>
                                <motion.div {...fadeInUp}>
                                    <Typography variant="h3" fontWeight={700} gutterBottom>Our Mission</Typography>
                                    <Typography variant="body1" color="text.secondary" paragraph>
                                        To empower educational institutions in Kenya and beyond with the digital tools they need to thrive in the 21st century.
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" paragraph>
                                        We are committed to bridging the gap between traditional academic structures and modern technological capabilities, ensuring that no institution is left behind.
                                    </Typography>
                                </motion.div>
                             </Grid>
                         </Grid>
                    </Container>
                 </Box>
                 
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
