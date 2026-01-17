import {
    Box,
    Container,
    Typography,
    Stack,
    Card,
    Avatar,
    Chip,
    useTheme,
} from "@mui/material";
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

// Instructors data
const instructors = [
    {
        name: "Dr. Sarah Kimani",
        role: "Lead Instructor, Data Science",
        bio: "Ph.D. in Computer Science with 10+ years of industry experience at top tech firms.",
        avatar: "SK",
    },
    {
        name: "James Mwangi",
        role: "Senior Trainer, Automotive Engineering",
        bio: "Certified Master Mechanic ensuring students gain practical, hands-on skills.",
        avatar: "JM",
    },
    {
        name: "Pastor David Omondi",
        role: "Head of Theology Department",
        bio: "Dedicated to guiding students in their spiritual and academic growth.",
        avatar: "DO",
    },
];

// Instructor Card Component
function InstructorCard({ instructor, primaryColor }) {
    return (
        <Card
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 4,
                bgcolor: "#FFFFFF",
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                overflow: "hidden",
                transition: "all 0.3s ease",
                "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                },
            }}
        >
            {/* Avatar placeholder */}
            <Box
                sx={{
                    height: 140,
                    bgcolor: hexToRgba(primaryColor, 0.1),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Avatar
                    sx={{
                        width: 70,
                        height: 70,
                        bgcolor: hexToRgba(primaryColor, 0.2),
                        color: primaryColor,
                        fontSize: "1.5rem",
                        fontWeight: 700,
                    }}
                >
                    {instructor.avatar}
                </Avatar>
            </Box>
            <Box sx={{ p: 2, textAlign: "left", flexGrow: 1 }}>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ color: "#1F2937", fontSize: "0.95rem" }}
                >
                    {instructor.name}
                </Typography>
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: primaryColor,
                        mb: 1,
                        fontSize: "0.75rem",
                    }}
                >
                    {instructor.role}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: "#6B7280",
                        lineHeight: 1.5,
                        fontSize: "0.8rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {instructor.bio}
                </Typography>
            </Box>
        </Card>
    );
}

export default function InstructorsSection({ platform }) {
    const theme = useTheme();
    const primaryColor = platform.primaryColor || "#3B82F6";

    return (
        <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: "#F8FAFC" }}>
            <Container maxWidth="lg">
                <Stack spacing={2} textAlign="center" sx={{ mb: 8 }}>
                    <motion.div {...fadeInUp}>
                        <SectionLabel color={primaryColor}>
                            Our Experts
                        </SectionLabel>
                        <Typography
                            variant="h2"
                            fontWeight={700}
                            sx={{ mb: 2 }}
                        >
                            Learn from the Best
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ maxWidth: 600, mx: "auto" }}
                        >
                            Our dedicated team of instructors are industry
                            veterans committed to your success.
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
                    {instructors.map((instructor, idx) => (
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
                                <InstructorCard
                                    instructor={instructor}
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
