import {
    Box,
    Container,
    Typography,
    Stack,
    Card,
    Chip,
    useTheme,
} from "@mui/material";
import {
    IconSchool,
    IconCertificate,
    IconBook,
    IconDeviceAnalytics,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

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

// Features data
const features = [
    {
        icon: IconSchool,
        title: "Expert Instructors",
        description:
            "Learn from industry professionals with years of hands-on experience in their fields.",
    },
    {
        icon: IconCertificate,
        title: "Verified Certificates",
        description:
            "Earn recognized certificates upon completion with unique QR verification codes.",
    },
    {
        icon: IconBook,
        title: "Comprehensive Curriculum",
        description:
            "Structured learning paths designed to take you from beginner to expert.",
    },
];

// Feature Card Component
function FeatureCard({ feature, primaryColor }) {
    return (
        <Card
            sx={{
                p: 3,
                height: "100%",
                textAlign: "center",
                borderRadius: 4,
                bgcolor: "white",
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                },
            }}
        >
            <Box
                sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: hexToRgba(primaryColor, 0.1),
                    color: primaryColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                }}
            >
                <feature.icon size={24} stroke={1.5} />
            </Box>
            <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
                sx={{ color: "text.primary", fontSize: "1rem" }}
            >
                {feature.title}
            </Typography>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.6, fontSize: "0.85rem" }}
            >
                {feature.description}
            </Typography>
        </Card>
    );
}

export default function FeaturesSection({ platform }) {
    const theme = useTheme();
    const primaryColor = platform.primaryColor || "#3B82F6";

    return (
        <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: "#F8FAFC" }}>
            <Container maxWidth="lg">
                <Stack spacing={2} textAlign="center" sx={{ mb: 8 }}>
                    <motion.div {...fadeInUp}>
                        <SectionLabel color={primaryColor}>
                            Why Choose Us
                        </SectionLabel>
                        <Typography
                            variant="h2"
                            fontWeight={700}
                            sx={{ mb: 2, color: "text.primary" }}
                        >
                            Why Join this Program?
                        </Typography>
                    </motion.div>
                </Stack>

                {/* Flexbox layout - 3 cards in a row */}
                <Box
                    sx={{
                        display: "flex",
                        flexWrap: { xs: "wrap", md: "nowrap" },
                        gap: 3,
                        justifyContent: "center",
                    }}
                >
                    {features.map((feature, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 12px)", md: "1 1 0" },
                                maxWidth: { xs: "100%", sm: "calc(50% - 12px)", md: "none" },
                                minWidth: 0,
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                    delay: idx * 0.1,
                                    duration: 0.5,
                                }}
                                style={{ height: "100%" }}
                            >
                                <FeatureCard
                                    feature={feature}
                                    primaryColor={primaryColor}
                                />
                            </motion.div>
                        </Box>
                    ))}
                </Box>
            </Container>
        </Box>
    );
}
