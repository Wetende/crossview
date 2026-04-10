import {
    Box,
    Container,
    Typography,
    Stack,
    Card,
    Avatar,
    Chip,
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

// Default instructors — DigikaTech Africa placeholder profiles
// These serve as fallback until real instructor data is passed from the backend
const defaultInstructors = [
    {
        name: "Robotics Instructor",
        role: "Lead, Robotics & IoT Program",
        bio: "Experienced robotics engineer guiding students through hands-on builds with Arduino, Raspberry Pi, and LEGO SPIKE kits.",
        avatar: "RI",
    },
    {
        name: "Coding Mentor",
        role: "Lead, Coding & Algorithms",
        bio: "Software developer teaching Python, JavaScript, and C++ through project-based learning and portfolio building.",
        avatar: "CM",
    },
    {
        name: "AI & Design Lead",
        role: "Lead, AI & Creative Tech",
        bio: "AI practitioner and digital artist bridging machine learning with creative design for African students.",
        avatar: "AD",
    },
];

// Instructor Card Component
function InstructorCard({ instructor, primaryColor }) {
    // Support both backend format (firstName/lastName) and static format (name)
    const displayName = instructor.name
        || `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim()
        || "Instructor";
    const initials = instructor.avatar
        || displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

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
                    src={instructor.avatarUrl || null}
                    sx={{
                        width: 70,
                        height: 70,
                        bgcolor: hexToRgba(primaryColor, 0.2),
                        color: primaryColor,
                        fontSize: "1.5rem",
                        fontWeight: 700,
                    }}
                >
                    {initials}
                </Avatar>
            </Box>
            <Box sx={{ p: 2, textAlign: "left", flexGrow: 1 }}>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ color: "#1F2937", fontSize: "0.95rem" }}
                >
                    {displayName}
                </Typography>
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: primaryColor,
                        mb: 1,
                        fontSize: "0.75rem",
                    }}
                >
                    {instructor.role || "Instructor"}
                </Typography>
                {instructor.bio && (
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
                )}
            </Box>
        </Card>
    );
}

export default function InstructorsSection({ platform, featuredInstructors }) {
    const primaryColor = platform.primaryColor || "#3B82F6";

    // Use real instructor data from backend if available, else defaults
    const instructors = featuredInstructors?.length > 0
        ? featuredInstructors
        : defaultInstructors;

    return (
        <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: "#F8FAFC" }}>
            <Container maxWidth="lg">
                <Stack spacing={2} textAlign="center" sx={{ mb: 8 }}>
                    <motion.div {...fadeInUp}>
                        <SectionLabel color={primaryColor}>
                            Our Mentors
                        </SectionLabel>
                        <Typography
                            variant="h2"
                            fontWeight={700}
                            sx={{ mb: 2 }}
                        >
                            Learn from African Tech Professionals
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ maxWidth: 600, mx: "auto" }}
                        >
                            Our instructors are practising engineers, developers,
                            and designers who understand local contexts and bring
                            real industry experience to the classroom.
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
