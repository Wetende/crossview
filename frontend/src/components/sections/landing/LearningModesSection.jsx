import {
    Box,
    Container,
    Typography,
    Stack,
    Button,
    Chip,
    Card,
} from "@mui/material";
import {
    IconDeviceLaptop,
    IconSchool,
    IconBulb,
    IconRocket,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import ButtonAnimationWrapper from "../../common/ButtonAnimationWrapper";

// Import image
import learningImage from "@/assets/images/learning.jpg";

// --- Animation Variants ---
const fadeInLeft = {
    initial: { opacity: 0, x: -50 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] },
};

const fadeInRight = {
    initial: { opacity: 0, x: 50 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] },
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

// Delivery methods from DIGIKATECHAFRICA.md §5
const deliveryMethods = [
    {
        icon: IconDeviceLaptop,
        title: "Online LMS Platform",
        description:
            "Learn at your own pace from any device. Supervised live classes or self-paced courses with interactive coding environments.",
    },
    {
        icon: IconSchool,
        title: "School Partnerships",
        description:
            "We partner with primary and secondary schools to deliver tech courses directly — during or after school hours.",
    },
    {
        icon: IconBulb,
        title: "Tech Hubs & Clubs",
        description:
            "Innovation hubs with robotics labs, maker spaces, and mentorship from local tech professionals.",
    },
    {
        icon: IconRocket,
        title: "Bootcamps",
        description:
            "Intensive 2–8 week programs for accelerated skill-building. Summer camps, weekend workshops, and regional bootcamps.",
    },
];

export default function LearningModesSection({ platform }) {
    const primaryColor = platform.primaryColor || "#3B82F6";
    const secondaryColor = platform.secondaryColor || "#1E40AF";

    return (
        <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: "#FAFAFA" }}>
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", md: "row" },
                        alignItems: "center",
                        gap: { xs: 6, md: 8 },
                    }}
                >
                    {/* Left: Image */}
                    <Box
                        sx={{
                            flex: 1,
                            width: "100%",
                            maxWidth: { xs: "100%", md: "45%" },
                        }}
                    >
                        <motion.div {...fadeInLeft}>
                            <Box
                                sx={{
                                    borderRadius: 4,
                                    overflow: "hidden",
                                    minHeight: 350,
                                }}
                            >
                                <Box
                                    component="img"
                                    src={learningImage}
                                    alt="How We Deliver Tech Education"
                                    sx={{
                                        width: "100%",
                                        height: "100%",
                                        minHeight: 350,
                                        objectFit: "cover",
                                        borderRadius: 4,
                                    }}
                                />
                            </Box>
                        </motion.div>
                    </Box>

                    {/* Right: Content */}
                    <Box
                        sx={{
                            flex: 1,
                            width: "100%",
                            maxWidth: { xs: "100%", md: "55%" },
                        }}
                    >
                        <motion.div {...fadeInRight}>
                            <SectionLabel color={primaryColor}>
                                How We Deliver
                            </SectionLabel>
                            <Typography
                                variant="h2"
                                fontWeight={700}
                                sx={{ mb: 2, color: "text.primary" }}
                            >
                                We Meet Learners{" "}
                                <Box
                                    component="span"
                                    sx={{ color: primaryColor }}
                                >
                                    Where They Are
                                </Box>
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mb: 4, lineHeight: 1.8 }}
                            >
                                African students have diverse needs and
                                circumstances. We deliver quality tech education
                                through flexible methods — ensuring every learner
                                is reached, whether online or in-person.
                            </Typography>

                            {/* Delivery method cards */}
                            <Stack spacing={2} sx={{ mb: 4 }}>
                                {deliveryMethods.map((method, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: 30 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            delay: idx * 0.1,
                                            duration: 0.4,
                                        }}
                                    >
                                        <Card
                                            sx={{
                                                p: 2,
                                                borderRadius: 3,
                                                border: "1px solid",
                                                borderColor: "grey.100",
                                                boxShadow: "none",
                                                transition: "all 0.3s ease",
                                                "&:hover": {
                                                    borderColor: primaryColor,
                                                    boxShadow: `0 4px 16px ${hexToRgba(primaryColor, 0.1)}`,
                                                },
                                            }}
                                        >
                                            <Stack
                                                direction="row"
                                                spacing={2}
                                                alignItems="flex-start"
                                            >
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 2,
                                                        bgcolor: hexToRgba(
                                                            primaryColor,
                                                            0.1,
                                                        ),
                                                        color: primaryColor,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <method.icon
                                                        size={20}
                                                        stroke={1.5}
                                                    />
                                                </Box>
                                                <Box>
                                                    <Typography
                                                        variant="subtitle2"
                                                        fontWeight={700}
                                                        sx={{
                                                            color: "text.primary",
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        {method.title}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            lineHeight: 1.5,
                                                            fontSize: "0.8rem",
                                                        }}
                                                    >
                                                        {method.description}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Card>
                                    </motion.div>
                                ))}
                            </Stack>

                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                <ButtonAnimationWrapper>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        sx={{
                                            bgcolor: primaryColor,
                                            "&:hover": {
                                                bgcolor: secondaryColor,
                                            },
                                            borderRadius: 2,
                                            px: 3,
                                            py: 1.5,
                                        }}
                                    >
                                        Explore Programs
                                    </Button>
                                </ButtonAnimationWrapper>
                            </Stack>
                        </motion.div>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
