import {
    Box,
    Container,
    Typography,
    Stack,
    Card,
    Chip,
} from "@mui/material";
import {
    IconCpu,
    IconCode,
    IconBrain,
    IconWorldWww,
    IconDeviceMobile,
    IconPalette,
    IconPuzzle,
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

// DigikaTech Africa core programs — from DIGIKATECHAFRICA.md §2 & §4
// 7 programs: Robotics (flagship), Coding, AI, Web, Mobile, Graphics, Scratch
const features = [
    {
        icon: IconCpu,
        title: "Robotics & IoT",
        description:
            "Build intelligent robots and Internet of Things (IoT) devices. Master sensors, automation, and embedded systems. This flagship program combines hardware, programming, and real-world problem-solving — perfect for students aged 8–18.",
        highlight: true,
    },
    {
        icon: IconCode,
        title: "Coding & Algorithms",
        description:
            "From Python to JavaScript, learn programming languages used by tech giants globally. Solve complex problems with algorithms. Build games, applications, and software with real portfolio projects.",
    },
    {
        icon: IconBrain,
        title: "AI & Machine Learning",
        description:
            "Explore AI, neural networks, and machine learning. Understand how AI is reshaping healthcare, finance, agriculture, and education in Africa. Build AI applications that solve real-world problems.",
    },
    {
        icon: IconWorldWww,
        title: "Web Design & Development",
        description:
            "Create beautiful, responsive websites. Learn HTML, CSS, JavaScript, and modern web frameworks. Build portfolios and real projects for careers in tech and entrepreneurship.",
    },
    {
        icon: IconDeviceMobile,
        title: "Mobile App Development",
        description:
            "Develop iOS and Android applications. Learn mobile-first design and app development frameworks. Create apps that make a difference in African communities.",
    },
    {
        icon: IconPalette,
        title: "Graphics & 3D Design",
        description:
            "Master digital art, animation, and 3D modeling. Learn industry-standard software. Develop skills for careers in game design, film production, architecture visualization, and digital media.",
    },
    {
        icon: IconPuzzle,
        title: "Scratch & Block Coding",
        description:
            "Visual, drag-and-drop programming for ages 5–11. Build animated stories, simple games, and interactive art in Scratch before graduating to Python and JavaScript.",
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
                border: feature.highlight ? `2px solid ${primaryColor}` : "none",
                boxShadow: feature.highlight
                    ? `0 8px 30px ${hexToRgba(primaryColor, 0.15)}`
                    : "0 4px 20px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                position: "relative",
                overflow: "visible",
                "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                },
            }}
        >
            {feature.highlight && (
                <Chip
                    label="FLAGSHIP"
                    size="small"
                    sx={{
                        position: "absolute",
                        top: -12,
                        right: 16,
                        bgcolor: primaryColor,
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        letterSpacing: 1,
                    }}
                />
            )}
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

// Key benefits — from DIGIKATECHAFRICA.md §2 "Why Choose Us"
const keyBenefits = [
    "Hands-on, project-based learning in robotics, IoT, and AI",
    "Online LMS platform with supervised and self-paced courses",
    "Direct partnerships with schools across Africa for accessible tech education",
    "Tech hubs and innovation bootcamps in multiple counties and regions",
    "Mentorship from experienced tech professionals in Africa",
    "Career-ready skills development for primary and secondary students",
    "Flexible learning paths: in-person, online, and blended models",
];

export default function FeaturesSection({ platform }) {
    const primaryColor = platform.primaryColor || "#3B82F6";

    return (
        <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: "#F8FAFC" }}>
            <Container maxWidth="lg">
                {/* ── Why DigikaTech Africa ── */}
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
                            Transforming African Kids and Youth into Tech Innovators
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ maxWidth: 800, mx: "auto", lineHeight: 1.8 }}
                        >
                            The Fourth Industrial Revolution demands digital literacy
                            and technical skills. Africa is home to over 400 million
                            young people, yet there&apos;s a critical gap in quality tech
                            education. DigikaTech Africa is closing that gap by
                            delivering world-class STEM programs — Robotics, Coding,
                            AI, and Design — to schools, communities, and learners
                            online. Our mission: reach 500+ schools and 1 million
                            young Africans by 2030.
                        </Typography>
                    </motion.div>
                </Stack>

                {/* Key Benefits */}
                <motion.div {...fadeInUp}>
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1.5,
                            justifyContent: "center",
                            mb: 10,
                        }}
                    >
                        {keyBenefits.map((benefit, idx) => (
                            <Chip
                                key={idx}
                                label={`✓ ${benefit}`}
                                size="small"
                                sx={{
                                    bgcolor: "white",
                                    border: "1px solid",
                                    borderColor: "grey.200",
                                    color: "text.secondary",
                                    fontWeight: 500,
                                    fontSize: "0.8rem",
                                    py: 2,
                                    px: 0.5,
                                }}
                            />
                        ))}
                    </Box>
                </motion.div>

                {/* ── Core Programs ── */}
                <Stack spacing={2} textAlign="center" sx={{ mb: 6 }}>
                    <motion.div {...fadeInUp}>
                        <SectionLabel color={primaryColor}>
                            Core Programs
                        </SectionLabel>
                        <Typography
                            variant="h2"
                            fontWeight={700}
                            sx={{ mb: 2, color: "text.primary" }}
                        >
                            Core Programs Empowering Young Innovators
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ maxWidth: 700, mx: "auto" }}
                        >
                            Our comprehensive tech curriculum combines cutting-edge
                            robotics, programming, and artificial intelligence with
                            design thinking and entrepreneurship. Each program is
                            designed for African students of all levels, from complete
                            beginners to advanced learners.
                        </Typography>
                    </motion.div>
                </Stack>

                {/* Program cards grid — 3+3+1 layout */}
                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 3,
                        justifyContent: "center",
                    }}
                >
                    {features.map((feature, idx) => (
                        <Box
                            key={idx}
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
                                transition={{
                                    delay: idx * 0.08,
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
