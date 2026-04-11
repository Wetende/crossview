import { Link, usePage } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Stack,
    Grid,
    IconButton,
    Divider,
} from "@mui/material";
import {
    IconBrandFacebook,
    IconBrandTwitter,
    IconBrandLinkedin,
    IconBrandYoutube,
    IconMail,
    IconMapPin,
    IconPhone,
} from "@tabler/icons-react";
import PlatformLogo from "./PlatformLogo";

// --- Helper: Color utilities ---
function hexToRgba(hex, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
}

/**
 * Shared Footer Component
 *
 * Reads platform data from Inertia shared props automatically,
 * so no props need to be passed. Uses the logo uploaded via SuperAdmin.
 */
export default function Footer() {
    const { platform } = usePage().props;

    // Provide sensible defaults if platform data is unavailable
    const p = platform || {};
    const primaryColor = p.primaryColor || "#3B82F6";
    const currentYear = new Date().getFullYear();
    const institutionName = p.institutionName || "Crossview LMS";
    const publicContent =
        p.publicContent && typeof p.publicContent === "object"
            ? p.publicContent
            : {};
    const contactEmail = p.email || "";
    const contactPhone = p.phone || "";
    const contactAddress = p.address || "";

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

    const platformSocials =
        p.socialLinks && typeof p.socialLinks === "object" ? p.socialLinks : {};
    const socialLinks = [
        platformSocials.facebook && {
            icon: IconBrandFacebook,
            href: platformSocials.facebook,
            label: "Facebook",
        },
        platformSocials.twitter && {
            icon: IconBrandTwitter,
            href: platformSocials.twitter,
            label: "Twitter",
        },
        platformSocials.linkedin && {
            icon: IconBrandLinkedin,
            href: platformSocials.linkedin,
            label: "LinkedIn",
        },
        platformSocials.youtube && {
            icon: IconBrandYoutube,
            href: platformSocials.youtube,
            label: "YouTube",
        },
    ].filter(Boolean);

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
                                <PlatformLogo
                                    platform={p}
                                    fallbackName={institutionName}
                                    logoHeight={40}
                                    logoMaxWidth={160}
                                    iconContainerSize={40}
                                    iconSize={24}
                                    iconBgColor={primaryColor}
                                    imageFilter="brightness(0) invert(1)"
                                    nameVariant="h6"
                                    nameColor="common.white"
                                />
                            </Stack>

                            <Typography
                                variant="body2"
                                sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}
                            >
                                {publicContent.footerDescription ||
                                    p.description ||
                                    "Empowering learners with quality education and flexible learning options to achieve their goals."}
                            </Typography>

                            {/* Social Links */}
                            {socialLinks.length > 0 && (
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
                            )}
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
                            {contactEmail && (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <IconMail size={18} color={primaryColor} />
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "rgba(255,255,255,0.7)" }}
                                    >
                                        {contactEmail}
                                    </Typography>
                                </Stack>
                            )}
                            {contactPhone && (
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <IconPhone size={18} color={primaryColor} />
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "rgba(255,255,255,0.7)" }}
                                    >
                                        {contactPhone}
                                    </Typography>
                                </Stack>
                            )}
                            {contactAddress && (
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <IconMapPin size={18} color={primaryColor} style={{ marginTop: 4 }} />
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "rgba(255,255,255,0.7)", whiteSpace: "pre-line" }}
                                    >
                                        {contactAddress}
                                    </Typography>
                                </Stack>
                            )}
                            {!contactEmail && !contactPhone && !contactAddress && (
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
                        © {currentYear} {institutionName}. All rights reserved.
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
