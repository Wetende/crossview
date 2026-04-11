import {
    Box,
    Container,
    Typography,
    Stack,
    Card,
    Chip,
} from "@mui/material";
import {
    IconCode,
    IconRobot,
    IconRocket,
    IconSettings,
    IconWifi,
    IconCheck,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import VisuallyHidden from "../../common/VisuallyHidden";

// --- Animation Variants ---
const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] },
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

// Key benefits — rebuilt to map onto UI cards
const keyBenefitsCards = [
    { title: "Algorithms and Coding", icon: IconCode, color: "#0B30E5" },
    { title: "Robotics", icon: IconRobot, color: "#F5A623" },
    { title: "Application Skills", icon: IconSettings, color: "#9E9E9E" },
    { title: "Internet and Ecommunications", icon: IconWifi, color: "#0e2f1d" },
];

const textBenefits = [
    "Hands-on, project-based learning in robotics, IoT, and AI",
    "Online LMS platform with supervised and self-paced courses",
    "Direct partnerships with schools across Africa-Kenya for accessible tech education",
    "Tech hubs and innovation bootcamps in multiple counties and regions",
    "Mentorship from experienced tech professionals in Africa - Kenya",
    "Career-ready skills development for high school and primary students",
    "Flexible learning paths: in-person classes, online courses, and blended models",
    "Industry-recognized certification upon successful program completion",
];

export default function FeaturesSection({ platform }) {
    const primaryColor = platform.primaryColor || "#3B82F6";

    return (
        <Box sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 2, md: 3 }, bgcolor: "#f7f4ee" }}>
            <Container maxWidth="lg">
                {/* ── Why DigikaTech Africa ── */}
                <Box>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                            gap: { xs: 6, md: 8 },
                            alignItems: "stretch",
                        }}
                    >
                        {/* Left Side: Text Content */}
                        <motion.div {...fadeInUp}>
                            <Stack spacing={3} sx={{ height: "100%" }}>
                                <Box>
                                    <SectionLabel color={primaryColor}>
                                        Why DigikaTech
                                    </SectionLabel>
                                </Box>
                                <Typography
                                    variant="h2"
                                    fontWeight={800}
                                    sx={{ 
                                        color: "text.primary",
                                        letterSpacing: "-0.02em", 
                                        lineHeight: 1.2
                                    }}
                                >
                                    Transforming African Kids and Youth into{" "}
                                    <Box component="span" sx={{ color: "#F5A623" }}>
                                        Tech Innovators
                                    </Box>
                                </Typography>
                                
                                <VisuallyHidden component="div">
                                    The Fourth Industrial Revolution demands digital literacy and technical skills. Africa is home to over 400 million young people, yet there&apos;s a critical gap in quality tech education. DigikaTech Africa is closing that gap by delivering world-class STEM programs: Robotics, Coding, AI, and Design-to schools, communities, and learners online. Our mission: reach 500+ schools and 1 million young Africans by 2030.
                                </VisuallyHidden>

                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.8, fontSize: "1.05rem" }}
                                >
                                    The Fourth Industrial Revolution demands digital literacy and technical skills. Africa is home to over 400 million young people, yet there&apos;s a critical gap in quality tech education.
                                </Typography>
                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.8, fontSize: "1.05rem" }}
                                >
                                    DigikaTech Africa is closing that gap by delivering world-class STEM programs: Robotics, Coding, AI, and Design—to schools, communities, and learners online.
                                </Typography>

                                {/* Compact Dark Mission Card */}
                                <Card
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        mt: { xs: 2, md: "auto" },
                                        borderRadius: 3,
                                        bgcolor: "#0B1120",
                                        color: "white",
                                        boxShadow: "0 10px 30px rgba(11, 17, 32, 0.15)"
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                        <Box sx={{ bgcolor: "rgba(245, 166, 35, 0.1)", p: 1.5, borderRadius: 2 }}>
                                            <IconRocket size={28} color="#F5A623" />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#F5A623", mb: 0.5, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                                Our 2030 Mission
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
                                                Empowering 1 million young Africans in 500+ schools to build the continent&apos;s tech pipeline.
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Card>
                            </Stack>
                        </motion.div>

                        {/* Right Side: Key Benefits Grid */}
                        <motion.div {...fadeInUp}>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                    gap: 2,
                                }}
                            >
                                {keyBenefitsCards.map((card, idx) => (
                                    <Card
                                        key={idx}
                                        elevation={0}
                                        sx={{
                                            p: 4,
                                            borderRadius: 3,
                                            bgcolor: card.color,
                                            color: "white",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            textAlign: "center",
                                            minHeight: { xs: 160, md: 200 },
                                            transition: "all 0.3s ease",
                                            boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                                            "&:hover": {
                                                transform: "translateY(-6px)",
                                                boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
                                            }
                                        }}
                                    >
                                        <card.icon size={48} stroke={1.5} />
                                        <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2, lineHeight: 1.3 }}>
                                            {card.title}
                                        </Typography>
                                    </Card>
                                ))}
                            </Box>

                            {/* 2-Column Benefits Grid positioned below the 4 vibrant cards */}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                                    gap: 2,
                                    mt: 4
                                }}
                            >
                                {textBenefits.map((benefit, idx) => (
                                    <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                                        <Box sx={{ color: "#00E676", mt: 0.5, flexShrink: 0 }}>
                                            <IconCheck size={18} stroke={3} />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4, fontSize: "0.9rem" }}>
                                            {benefit}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </motion.div>
                    </Box>
                </Box>



            </Container>
        </Box>
    );
}
