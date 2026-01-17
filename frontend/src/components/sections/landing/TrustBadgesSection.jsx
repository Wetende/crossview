import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    useTheme,
} from "@mui/material";
import {
    IconCheck,
    IconUsers,
    IconShieldCheck,
    IconAward,
    IconThumbUp,
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

export default function TrustBadgesSection({ platform, stats }) {
    const theme = useTheme();
    const primaryColor = platform.primaryColor || "#3B82F6";

    return (
        <Box
            sx={{
                py: { xs: 4, md: 6 },
                bgcolor: "white",
                borderBottom: "1px solid",
                borderColor: "grey.100",
            }}
        >
            <Container maxWidth="lg">
                <motion.div {...fadeInUp}>
                    <Grid
                        container
                        spacing={4}
                        justifyContent="center"
                        alignItems="center"
                    >
                        {[
                            {
                                icon: IconShieldCheck,
                                label: "Verified Institution",
                                sublabel: "Quality Assured",
                            },
                            {
                                icon: IconAward,
                                label: "Certified Programs",
                                sublabel: "Industry Recognized",
                            },
                            {
                                icon: IconUsers,
                                label: `${stats.studentCount || 500}+ Students`,
                                sublabel: "Active Learners",
                            },
                            {
                                icon: IconThumbUp,
                                label: "4.8/5 Rating",
                                sublabel: "Student Satisfaction",
                            },
                        ].map((badge, idx) => (
                            <Grid item xs={6} sm={3} key={idx}>
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                    justifyContent="center"
                                    sx={{ textAlign: "left" }}
                                >
                                    <Box
                                        sx={{
                                            width: 48,
                                            height: 48,
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
                                        <badge.icon size={24} stroke={1.5} />
                                    </Box>
                                    <Box>
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight={700}
                                            sx={{ lineHeight: 1.2 }}
                                        >
                                            {badge.label}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {badge.sublabel}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                        ))}
                    </Grid>
                </motion.div>
            </Container>
        </Box>
    );
}
