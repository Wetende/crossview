import { Link } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Stack,
    Button,
    Chip,
    useTheme,
} from "@mui/material";
import { IconArrowRight } from "@tabler/icons-react";
import { motion } from "framer-motion";
import ButtonAnimationWrapper from "../../common/ButtonAnimationWrapper";
import PublicProgramCard from "../../cards/PublicProgramCard";

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

export default function ProgramsSection({ platform, programs = [] }) {
    const theme = useTheme();
    const primaryColor = platform.primaryColor || "#3B82F6";
    const secondaryColor = platform.secondaryColor || "#1E40AF";

    if (!programs.length) return null;

    return (
        <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: "#FAFAFA" }}>
            <Container maxWidth="lg">
                <Stack spacing={2} textAlign="center" sx={{ mb: 8 }}>
                    <motion.div {...fadeInUp}>
                        <SectionLabel color={primaryColor}>
                            Our Programs
                        </SectionLabel>
                        <Typography
                            variant="h2"
                            fontWeight={700}
                            sx={{ mb: 2 }}
                        >
                            Explore Our Courses
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ maxWidth: 600, mx: "auto" }}
                        >
                            Choose from our carefully designed programs to
                            advance your knowledge and skills.
                        </Typography>
                    </motion.div>
                </Stack>

                {/* Flexbox layout - 3 cards per row on desktop */}
                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 3,
                        justifyContent: "center",
                    }}
                >
                    {programs.slice(0, 6).map((program, idx) => (
                        <Box
                            key={program.id}
                            sx={{
                                flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 12px)", md: "1 1 calc(33.333% - 16px)" },
                                maxWidth: { xs: "100%", sm: "calc(50% - 12px)", md: "calc(33.333% - 16px)" },
                                minWidth: 0,
                            }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                style={{ height: "100%" }}
                            >
                                <PublicProgramCard program={program} />
                            </motion.div>
                        </Box>
                    ))}
                </Box>

                <Box sx={{ textAlign: "center", mt: 6 }}>
                    <ButtonAnimationWrapper>
                        <Button
                            component={Link}
                            href="/programs/"
                            variant="contained"
                            size="large"
                            endIcon={<IconArrowRight size={20} />}
                            sx={{
                                bgcolor: primaryColor,
                                "&:hover": { bgcolor: secondaryColor },
                                borderRadius: 100,
                                px: 5,
                                py: 1.5,
                            }}
                        >
                            View All Programs
                        </Button>
                    </ButtonAnimationWrapper>
                </Box>
            </Container>
        </Box>
    );
}
