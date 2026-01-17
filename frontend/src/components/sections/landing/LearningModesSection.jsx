import {
    Box,
    Container,
    Typography,
    Stack,
    Button,
    Chip,
    useTheme,
} from "@mui/material";
import { IconPlayerPlay, IconEye } from "@tabler/icons-react";
import { motion } from "framer-motion";
import ButtonAnimationWrapper from "../../common/ButtonAnimationWrapper";

// Import image
import learningImage from "@/assets/images/learning.jpg";

// --- Animation Variants ---
const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] },
};

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

export default function LearningModesSection({ platform }) {
    const theme = useTheme();
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
                            maxWidth: { xs: "100%", md: "50%" },
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
                                    alt="Choose Your Learning Path"
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
                            maxWidth: { xs: "100%", md: "50%" },
                        }}
                    >
                        <motion.div {...fadeInRight}>
                            <SectionLabel color={primaryColor}>
                                Learning Modes
                            </SectionLabel>
                            <Typography
                                variant="h2"
                                fontWeight={700}
                                sx={{ mb: 3, color: "text.primary" }}
                            >
                                Choose Your{" "}
                                <Box
                                    component="span"
                                    sx={{ color: primaryColor }}
                                >
                                    Learning Path
                                </Box>
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mb: 4, lineHeight: 1.8 }}
                            >
                                Whether you prefer live online classes, 
                                self-paced learning, or hands-on in-person 
                                training, we have options to suit your 
                                lifestyle and learning preferences. Our 
                                flexible approach ensures you can study 
                                effectively, wherever you are.
                            </Typography>

                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                <ButtonAnimationWrapper>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={<IconEye size={20} />}
                                        sx={{
                                            bgcolor: primaryColor,
                                            "&:hover": { bgcolor: secondaryColor },
                                            borderRadius: 2,
                                            px: 3,
                                            py: 1.5,
                                        }}
                                    >
                                        Explore Programs
                                    </Button>
                                </ButtonAnimationWrapper>
                                <ButtonAnimationWrapper>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        startIcon={<IconPlayerPlay size={20} />}
                                        sx={{
                                            borderColor: primaryColor,
                                            color: primaryColor,
                                            "&:hover": {
                                                borderColor: secondaryColor,
                                                bgcolor: hexToRgba(primaryColor, 0.05),
                                            },
                                            borderRadius: 2,
                                            px: 3,
                                            py: 1.5,
                                        }}
                                    >
                                        Watch Video
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
