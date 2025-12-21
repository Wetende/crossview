import { Head, Link, usePage } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    Stack,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import {
    IconCheck,
    IconSchool,
    IconCertificate,
    IconUsers,
    IconDeviceAnalytics,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

const features = [
    {
        icon: IconSchool,
        title: "Flexible Blueprints",
        description: "Support multiple educational models - Theology, TVET, Vocational, K-12",
    },
    {
        icon: IconCertificate,
        title: "Digital Certificates",
        description: "Issue verifiable certificates with QR codes and public verification",
    },
    {
        icon: IconUsers,
        title: "Multi-Tenant",
        description: "Each institution gets their own branded portal and data isolation",
    },
    {
        icon: IconDeviceAnalytics,
        title: "Progress Tracking",
        description: "Real-time analytics on student progress and completion rates",
    },
];

/**
 * Landing Page - Platform marketing page with subscription tiers
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export default function Landing({ tiers }) {
    const { tenant } = usePage().props;

    // If on tenant subdomain, show tenant landing instead
    if (tenant) {
        return <TenantLanding tenant={tenant} />;
    }

    return (
        <>
            <Head title="Crossview LMS - Modern Learning Management" />

            <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
                {/* Hero Section */}
                <Box
                    sx={{
                        background: "linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)",
                        color: "white",
                        py: { xs: 8, md: 12 },
                    }}
                >
                    <Container maxWidth="lg">
                        <motion.div {...fadeInUp}>
                            <Stack spacing={4} alignItems="center" textAlign="center">
                                <Typography variant="h2" fontWeight={700}>
                                    Crossview LMS
                                </Typography>
                                <Typography variant="h5" sx={{ maxWidth: 600, opacity: 0.9 }}>
                                    A modern learning management system built for Kenyan educational institutions
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Button
                                        component={Link}
                                        href="/register/"
                                        variant="contained"
                                        size="large"
                                        sx={{
                                            bgcolor: "white",
                                            color: "primary.main",
                                            "&:hover": { bgcolor: "grey.100" },
                                        }}
                                    >
                                        Get Started
                                    </Button>
                                    <Button
                                        component={Link}
                                        href="/login/"
                                        variant="outlined"
                                        size="large"
                                        sx={{
                                            borderColor: "white",
                                            color: "white",
                                            "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.1)" },
                                        }}
                                    >
                                        Sign In
                                    </Button>
                                </Stack>
                            </Stack>
                        </motion.div>
                    </Container>
                </Box>

                {/* Features Section */}
                <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
                    <motion.div {...fadeInUp}>
                        <Typography variant="h4" textAlign="center" fontWeight={600} gutterBottom>
                            Why Choose Crossview?
                        </Typography>
                        <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
                            Built specifically for the Kenyan education market
                        </Typography>
                    </motion.div>

                    <Grid container spacing={4}>
                        {features.map((feature, index) => (
                            <Grid item xs={12} sm={6} md={3} key={feature.title}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <Card sx={{ height: "100%", textAlign: "center", p: 2 }}>
                                        <CardContent>
                                            <feature.icon size={48} color="#3B82F6" />
                                            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                                                {feature.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {feature.description}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Container>

                {/* Pricing Section */}
                <Box sx={{ bgcolor: "grey.50", py: { xs: 6, md: 10 } }}>
                    <Container maxWidth="lg">
                        <motion.div {...fadeInUp}>
                            <Typography variant="h4" textAlign="center" fontWeight={600} gutterBottom>
                                Simple, Transparent Pricing
                            </Typography>
                            <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
                                Choose the plan that fits your institution
                            </Typography>
                        </motion.div>

                        <Grid container spacing={4} justifyContent="center">
                            {tiers?.map((tier, index) => (
                                <Grid item xs={12} sm={6} md={4} key={tier.id}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                    >
                                        <PricingCard tier={tier} />
                                    </motion.div>
                                </Grid>
                            ))}
                        </Grid>
                    </Container>
                </Box>

                {/* CTA Section */}
                <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 }, textAlign: "center" }}>
                    <motion.div {...fadeInUp}>
                        <Typography variant="h4" fontWeight={600} gutterBottom>
                            Ready to Transform Your Institution?
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            Join hundreds of Kenyan institutions already using Crossview LMS
                        </Typography>
                        <Button
                            component={Link}
                            href="/register/"
                            variant="contained"
                            size="large"
                        >
                            Start Free Trial
                        </Button>
                    </motion.div>
                </Container>

                {/* Footer */}
                <Box sx={{ bgcolor: "grey.900", color: "grey.300", py: 4 }}>
                    <Container maxWidth="lg">
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={2}
                        >
                            <Typography variant="body2">
                                © 2024 Crossview LMS. All rights reserved.
                            </Typography>
                            <Stack direction="row" spacing={3}>
                                <Link href="/verify-certificate/" style={{ color: "inherit" }}>
                                    Verify Certificate
                                </Link>
                            </Stack>
                        </Stack>
                    </Container>
                </Box>
            </Box>
        </>
    );
}

/**
 * Pricing Card Component
 */
function PricingCard({ tier }) {
    const featureList = tier.features?.highlights || [];

    return (
        <Card
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "visible",
            }}
        >
            {tier.code === "professional" && (
                <Chip
                    label="Most Popular"
                    color="primary"
                    size="small"
                    sx={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                    }}
                />
            )}
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                    {tier.name}
                </Typography>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" component="span" fontWeight={700}>
                        KES {Number(tier.price_monthly).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" component="span" color="text.secondary">
                        /month
                    </Typography>
                </Box>

                <List dense>
                    <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <IconCheck size={18} color="#22c55e" />
                        </ListItemIcon>
                        <ListItemText primary={`Up to ${tier.max_students} students`} />
                    </ListItem>
                    <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <IconCheck size={18} color="#22c55e" />
                        </ListItemIcon>
                        <ListItemText primary={`${tier.max_programs} programs`} />
                    </ListItem>
                    <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <IconCheck size={18} color="#22c55e" />
                        </ListItemIcon>
                        <ListItemText primary={`${tier.max_storage_mb / 1000}GB storage`} />
                    </ListItem>
                    {featureList.map((feature, idx) => (
                        <ListItem key={idx} disableGutters>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <IconCheck size={18} color="#22c55e" />
                            </ListItemIcon>
                            <ListItemText primary={feature} />
                        </ListItem>
                    ))}
                </List>
            </CardContent>
            <Box sx={{ p: 3, pt: 0 }}>
                <Button
                    component={Link}
                    href="/register/"
                    variant="contained"
                    fullWidth
                >
                    Get Started
                </Button>
            </Box>
        </Card>
    );
}

/**
 * Tenant Landing Page - Branded landing for tenant subdomains
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
function TenantLanding({ tenant }) {
    return (
        <>
            <Head title={`${tenant.institutionName} - Learning Portal`} />

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
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        {tenant.logoUrl && (
                            <Box
                                component="img"
                                src={tenant.logoUrl}
                                alt={tenant.institutionName}
                                sx={{ height: 40 }}
                            />
                        )}
                        <Typography variant="h6" fontWeight={600}>
                            {tenant.institutionName}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <Button component={Link} href="/login/" variant="outlined">
                            Sign In
                        </Button>
                        {tenant.registrationEnabled && (
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
                        background: `linear-gradient(135deg, ${tenant.primaryColor} 0%, ${tenant.secondaryColor} 100%)`,
                        color: "white",
                        py: 8,
                    }}
                >
                    <Container maxWidth="md">
                        <motion.div {...fadeInUp}>
                            <Stack spacing={3} alignItems="center" textAlign="center">
                                <Typography variant="h3" fontWeight={700}>
                                    Welcome to {tenant.institutionName}
                                </Typography>
                                {tenant.tagline && (
                                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                        {tenant.tagline}
                                    </Typography>
                                )}
                                <Stack direction="row" spacing={2}>
                                    <Button
                                        component={Link}
                                        href="/login/"
                                        variant="contained"
                                        size="large"
                                        sx={{
                                            bgcolor: "white",
                                            color: tenant.primaryColor,
                                            "&:hover": { bgcolor: "grey.100" },
                                        }}
                                    >
                                        Sign In
                                    </Button>
                                    {tenant.registrationEnabled && (
                                        <Button
                                            component={Link}
                                            href="/register/"
                                            variant="outlined"
                                            size="large"
                                            sx={{
                                                borderColor: "white",
                                                color: "white",
                                                "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.1)" },
                                            }}
                                        >
                                            Register
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>
                        </motion.div>
                    </Container>
                </Box>

                {/* Footer */}
                <Box sx={{ py: 3, textAlign: "center", borderTop: 1, borderColor: "divider" }}>
                    <Typography variant="body2" color="text.secondary">
                        Powered by Crossview LMS
                    </Typography>
                </Box>
            </Box>

            {/* Custom CSS injection */}
            {tenant.customCss && (
                <style dangerouslySetInnerHTML={{ __html: tenant.customCss }} />
            )}
        </>
    );
}
