import { Link } from "@inertiajs/react";
import PropTypes from "prop-types";
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Stack,
    Chip,
    Card,
} from "@mui/material";
import {
    IconArrowRight,
    IconCheck,
    IconUsers,
    IconSchool,
    IconCertificate,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import ButtonAnimationWrapper from "../../common/ButtonAnimationWrapper";
import heroBgImage from "../../../assets/images/hero1.jpg";

// --- Animation Variants ---
const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] },
};

const fadeInScale = {
    initial: { opacity: 0, scale: 0.95 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true },
    transition: { duration: 0.5 },
};

const statItem = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
};

// --- Helper: Color utilities ---
function hexToRgba(hex, alpha = 1) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
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

SectionLabel.propTypes = {
    children: PropTypes.node.isRequired,
    color: PropTypes.string,
    bgColor: PropTypes.string,
};

// --- Stats Highlight Card Component ---
function StatsHighlightCard({ primaryColor }) {
    const statItems = [
        {
            icon: IconUsers,
            value: "Growing",
            label: "Learning Community",
        },
        {
            icon: IconSchool,
            value: "Diverse",
            label: "Course Offerings",
        },
        {
            icon: IconCertificate,
            value: "Verified",
            label: "Upon Completion",
        },
    ];

    return (
        <Card
            component={motion.div}
            variants={fadeInScale}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            sx={{
                p: { xs: 3, md: 5 },
                background: `linear-gradient(135deg, ${hexToRgba("#ffffff", 0.98)} 0%, ${hexToRgba("#ffffff", 0.92)} 100%)`,
                backdropFilter: "blur(20px)",
                borderRadius: 4,
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.3)",
                maxWidth: 500,
                mx: "auto",
                width: "100%",
            }}
        >
            <Typography
                variant="h5"
                fontWeight={800}
                mb={1}
                sx={{ color: "#1F2937" }}
            >
                What We Offer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Quality education designed for your success.
            </Typography>

            <Stack spacing={3}>
                {statItems.map((item, index) => (
                    <motion.div
                        key={index}
                        variants={statItem}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2,
                                    bgcolor: hexToRgba(primaryColor, 0.1),
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: primaryColor,
                                }}
                            >
                                <item.icon size={24} />
                            </Box>
                            <Box>
                                <Typography
                                    variant="h5"
                                    fontWeight={700}
                                    sx={{ color: "#1F2937" }}
                                >
                                    {item.value}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {item.label}
                                </Typography>
                            </Box>
                        </Stack>
                    </motion.div>
                ))}
            </Stack>
        </Card>
    );
}

StatsHighlightCard.propTypes = {
    primaryColor: PropTypes.string.isRequired,
};

// --- Main HeroSection Component ---
export default function HeroSection({ platform }) {
    const primaryColor = platform?.primaryColor || "#3B82F6";
    const secondaryColor = platform?.secondaryColor || "#1E40AF";
    const publicContent =
        platform?.publicContent && typeof platform.publicContent === "object"
            ? platform.publicContent
            : {};
    const heroHeadline = publicContent.heroHeadline;

    return (
        <Box
            sx={{
                pt: { xs: 14, md: 16 },
                pb: { xs: 10, md: 14 },
                backgroundImage: `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.3)} 0%, ${hexToRgba(secondaryColor, 0.45)} 100%), url(${heroBgImage})`,
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
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
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
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                }}
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
                <Grid
                    container
                    spacing={{ xs: 4, md: 8 }}
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Grid size={{ xs: 12, md: 6 }}>
                        <motion.div {...fadeInUp}>
                            <SectionLabel
                                color="white"
                                bgColor="rgba(255,255,255,0.2)"
                            >
                                Welcome to{" "}
                                {platform?.institutionName || "Our Platform"}
                            </SectionLabel>
                            <Typography
                                variant="h1"
                                sx={{
                                    color: "white",
                                    fontWeight: 800,
                                    fontSize: {
                                        xs: "2.5rem",
                                        md: "3.5rem",
                                        lg: "4rem",
                                    },
                                    lineHeight: 1.1,
                                    mb: 3,
                                }}
                            >
                                {heroHeadline || (
                                    <>
                                        Unlock Your{" "}
                                        <Box
                                            component="span"
                                            sx={{
                                                background:
                                                    "linear-gradient(90deg, #FFD700, #FFA500)",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor:
                                                    "transparent",
                                            }}
                                        >
                                            Potential
                                        </Box>
                                        <br />
                                        Start Learning Today
                                    </>
                                )}
                            </Typography>
                            {platform?.tagline && (
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

                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2}
                                sx={{ mb: 5 }}
                            >
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
                                            borderColor:
                                                "rgba(255,255,255,0.5)",
                                            color: "white",
                                            "&:hover": {
                                                borderColor: "white",
                                                bgcolor:
                                                    "rgba(255,255,255,0.1)",
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
                            <Stack
                                direction="row"
                                spacing={4}
                                flexWrap="wrap"
                                useFlexGap
                            >
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{ color: "white" }}
                                >
                                    <IconCheck size={20} />
                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                    >
                                        Quality Education
                                    </Typography>
                                </Stack>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{ color: "white" }}
                                >
                                    <IconCheck size={20} />
                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                    >
                                        Verified Certificates
                                    </Typography>
                                </Stack>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{ color: "white" }}
                                >
                                    <IconCheck size={20} />
                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                    >
                                        Expert Instructors
                                    </Typography>
                                </Stack>
                            </Stack>
                        </motion.div>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                        <StatsHighlightCard
                            primaryColor={primaryColor}
                        />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

HeroSection.propTypes = {
    platform: PropTypes.shape({
        primaryColor: PropTypes.string,
        secondaryColor: PropTypes.string,
        institutionName: PropTypes.string,
        tagline: PropTypes.string,
        publicContent: PropTypes.object,
    }),
};

HeroSection.defaultProps = {
    platform: {},
};
