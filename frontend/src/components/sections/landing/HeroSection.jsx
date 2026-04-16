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
    IconRobot,
    IconCode,
    IconApps,
    IconWorld,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import ButtonAnimationWrapper from "../../common/ButtonAnimationWrapper";
import VisuallyHidden from "../../common/VisuallyHidden";

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
            icon: IconRobot,
            value: "Robotics & IoT",
            label: "Hands-on builds with sensors and microcontrollers",
        },
        {
            icon: IconCode,
            value: "Algorithms & Coding",
            label: "Python, logic, and problem-solving fundamentals",
        },
        {
            icon: IconApps,
            value: "Application Skills",
            label: "Productivity tools and digital literacy",
        },
        {
            icon: IconWorld,
            value: "Internet & E-communications",
            label: "Digital citizenship, safety, and collaboration",
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
                Future-ready tech skills for Africa&apos;s next generation.
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
                                    variant="h6"
                                    fontWeight={700}
                                    sx={{ color: "#1F2937", lineHeight: 1.2 }}
                                >
                                    {item.value}
                                </Typography>
                                {item.label && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 0.5, lineHeight: 1.4 }}
                                    >
                                        {item.label}
                                    </Typography>
                                )}
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
    const publicContent =
        platform?.publicContent && typeof platform.publicContent === "object"
            ? platform.publicContent
            : {};
    // Hero headline parts — configurable via SuperAdmin
    const heroHeadline =
        typeof publicContent.heroHeadline === "string" && publicContent.heroHeadline.trim()
            ? publicContent.heroHeadline
            : "Unlock the Future: Tech Education for Every African Child";
    // Hero subheadline comes from platform settings only.
    const heroSubheadline =
        typeof platform?.tagline === "string" ? platform.tagline : "";

    return (
        <Box
            sx={{
                pt: { xs: 14, md: 16 },
                pb: { xs: 12, md: 16 },
                backgroundColor: "#0B1120",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Layer 1 — Mesh grid */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `
                        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                    `,
                    backgroundSize: "40px 40px",
                }}
            />
            {/* Layer 2 — glow blob (top right-ish) */}
            <Box
                sx={{
                    position: "absolute",
                    top: "-150px",
                    right: "-100px",
                    width: 600,
                    height: 600,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(26,92,204,0.3) 0%, transparent 70%)",
                    pointerEvents: "none",
                }}
            />
            {/* Additional glow blob (bottom left-ish) for balance */}
            <Box
                sx={{
                    position: "absolute",
                    bottom: "-250px",
                    left: "-150px",
                    width: 600,
                    height: 600,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(26,92,204,0.15) 0%, transparent 70%)",
                    pointerEvents: "none",
                }}
            />

            <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, px: { xs: 2, sm: 4, md: 8 } }}>
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
                                {platform?.institutionName || "DigikaTech Africa"}
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
                                {/* Split headline at colon if present for styling */}
                                {heroHeadline.includes(":") ? (
                                    <>
                                        {heroHeadline.split(":")[0]}:{" "}
                                        <Box
                                            component="span"
                                            sx={{
                                                background:
                                                    "linear-gradient(90deg, #F5A623, #FFCA28)",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                            }}
                                        >
                                            {heroHeadline.split(":").slice(1).join(":").trim()}
                                        </Box>
                                    </>
                                ) : (
                                    heroHeadline
                                )}
                            </Typography>
                            {heroSubheadline && (
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
                                    {heroSubheadline}
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
                                        <VisuallyHidden>for Tech skills development and the Future of education in Africa</VisuallyHidden>
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


                        </motion.div>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                        <StatsHighlightCard primaryColor={primaryColor} />
                    </Grid>
                </Grid>
            </Container>

            {/* Ticker Tape */}
            <Box
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    bgcolor: "#F5A623",
                    overflow: "hidden",
                    py: 1.25,
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <Box
                    component={motion.div}
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 35,
                    }}
                    sx={{
                        display: "flex",
                        whiteSpace: "nowrap",
                    }}
                >
                    {[...Array(2)].map((_, i) => (
                        <Typography
                            key={i}
                            variant="button"
                            sx={{
                                color: "#0B1120",
                                fontWeight: 800,
                                fontSize: "0.85rem",
                                letterSpacing: 1,
                                px: 2,
                                display: "inline-block",
                            }}
                        >
                            ROBOTICS & IOT &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp; CODING & ALGORITHMS &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp; ARTIFICIAL INTELLIGENCE &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp; WEB DEVELOPMENT &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp; 3D DESIGN &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp; MOBILE APP DEV &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp; SCRATCH & BLOCK CODING &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp; INTERNET & ECOMMUNICATIONS &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;{" "}
                        </Typography>
                    ))}
                </Box>
            </Box>
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
