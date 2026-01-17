import { Link } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Stack,
    Grid,
    IconButton,
    Divider,
    useTheme,
} from "@mui/material";
import {
    IconSchool,
    IconBrandFacebook,
    IconBrandTwitter,
    IconBrandLinkedin,
    IconBrandYoutube,
    IconMail,
    IconPhone,
    IconMapPin,
} from "@tabler/icons-react";

// --- Helper: Color utilities ---
function hexToRgba(hex, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
}

export default function FooterSection({ platform }) {
    const theme = useTheme();
    const primaryColor = platform.primaryColor || "#3B82F6";
    const currentYear = new Date().getFullYear();

    const quickLinks = [
        { label: "Programs", href: "/programs/" },
        { label: "About Us", href: "/about/" },
        { label: "Contact", href: "/contact/" },
        { label: "Events", href: "/events/" },
    ];

    const supportLinks = [
        { label: "Help Center", href: "/help/" },
        { label: "FAQ", href: "#faq" },
        { label: "Privacy Policy", href: "/privacy/" },
        { label: "Terms of Service", href: "/terms/" },
    ];

    const socialLinks = [
        { icon: IconBrandFacebook, href: "#", label: "Facebook" },
        { icon: IconBrandTwitter, href: "#", label: "Twitter" },
        { icon: IconBrandLinkedin, href: "#", label: "LinkedIn" },
        { icon: IconBrandYoutube, href: "#", label: "YouTube" },
    ];

    return (
        <Box
            component="footer"
            sx={{
                bgcolor: "#1F2937",
                color: "white",
                pt: { xs: 8, md: 10 },
                pb: 4,
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={6}>
                    {/* Brand & Description */}
                    <Grid item xs={12} md={4}>
                        <Stack spacing={3}>
                            {/* Logo */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                {platform.logoUrl ? (
                                    <Box
                                        component="img"
                                        src={platform.logoUrl}
                                        alt={platform.institutionName}
                                        sx={{
                                            height: 40,
                                            maxWidth: 160,
                                            objectFit: "contain",
                                            filter: "brightness(0) invert(1)",
                                        }}
                                    />
                                ) : (
                                    <>
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                bgcolor: primaryColor,
                                                borderRadius: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <IconSchool size={24} />
                                        </Box>
                                        <Typography variant="h6" fontWeight={700}>
                                            {platform.institutionName}
                                        </Typography>
                                    </>
                                )}
                            </Stack>

                            <Typography
                                variant="body2"
                                sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}
                            >
                                {platform.description ||
                                    "Empowering learners with quality education and flexible learning options to achieve their goals."}
                            </Typography>

                            {/* Social Links */}
                            <Stack direction="row" spacing={1}>
                                {socialLinks.map((social, idx) => (
                                    <IconButton
                                        key={idx}
                                        component="a"
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={social.label}
                                        sx={{
                                            color: "rgba(255,255,255,0.7)",
                                            "&:hover": {
                                                color: primaryColor,
                                                bgcolor: hexToRgba(primaryColor, 0.1),
                                            },
                                        }}
                                    >
                                        <social.icon size={20} />
                                    </IconButton>
                                ))}
                            </Stack>
                        </Stack>
                    </Grid>

                    {/* Quick Links */}
                    <Grid item xs={6} sm={3} md={2}>
                        <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{ mb: 3 }}
                        >
                            Quick Links
                        </Typography>
                        <Stack spacing={1.5}>
                            {quickLinks.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.href}
                                    style={{
                                        color: "rgba(255,255,255,0.7)",
                                        textDecoration: "none",
                                        fontSize: "0.9rem",
                                    }}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </Stack>
                    </Grid>

                    {/* Support Links */}
                    <Grid item xs={6} sm={3} md={2}>
                        <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{ mb: 3 }}
                        >
                            Support
                        </Typography>
                        <Stack spacing={1.5}>
                            {supportLinks.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.href}
                                    style={{
                                        color: "rgba(255,255,255,0.7)",
                                        textDecoration: "none",
                                        fontSize: "0.9rem",
                                    }}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </Stack>
                    </Grid>

                    {/* Contact Info */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{ mb: 3 }}
                        >
                            Contact Us
                        </Typography>
                        <Stack spacing={2}>
                            {platform.email && (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <IconMail size={18} color={primaryColor} />
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "rgba(255,255,255,0.7)" }}
                                    >
                                        {platform.email}
                                    </Typography>
                                </Stack>
                            )}
                            {platform.phone && (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <IconPhone size={18} color={primaryColor} />
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "rgba(255,255,255,0.7)" }}
                                    >
                                        {platform.phone}
                                    </Typography>
                                </Stack>
                            )}
                            {platform.address && (
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <IconMapPin size={18} color={primaryColor} style={{ marginTop: 4 }} />
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "rgba(255,255,255,0.7)" }}
                                    >
                                        {platform.address}
                                    </Typography>
                                </Stack>
                            )}
                            {!platform.email && !platform.phone && !platform.address && (
                                <Typography
                                    variant="body2"
                                    sx={{ color: "rgba(255,255,255,0.7)" }}
                                >
                                    Contact information coming soon.
                                </Typography>
                            )}
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 6, borderColor: "rgba(255,255,255,0.1)" }} />

                {/* Copyright */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                >
                    <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.5)" }}
                    >
                        © {currentYear} {platform.institutionName}. All rights reserved.
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.5)" }}
                    >
                        Powered by Crossview LMS
                    </Typography>
                </Stack>
            </Container>
        </Box>
    );
}
