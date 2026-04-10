import { useState } from "react";
import {
    Box,
    Container,
    Typography,
    Stack,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
} from "@mui/material";
import { IconChevronDown } from "@tabler/icons-react";
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

// Default FAQ data — DigikaTech Africa specific
const defaultFAQs = [
    {
        question: "What is DigikaTech Africa?",
        answer: "DigikaTech Africa is a tech education initiative dedicated to empowering African youth (ages 8-18) with skills in robotics, coding, AI, web design, and digital innovation. We deliver education through online platforms, school partnerships, tech hubs, and bootcamps.",
    },
    {
        question: "Why focus on robotics and IoT?",
        answer: "Robotics and IoT are transformative technologies. They teach hands-on engineering, programming, and problem-solving. They're in high demand across industries and exciting for young learners. We've made robotics and IoT our primary focus because they unlock broader tech understanding and create pathways to multiple careers.",
    },
    {
        question: "Who can enroll in courses?",
        answer: "Our programs are designed for kids and teens aged 8-18, including primary school, secondary school, and high school students. We offer courses for beginners with no tech background as well as advanced learners. Teachers and educators can also enroll in professional development programs.",
    },
    {
        question: "Is there a scholarship or financial aid?",
        answer: "Yes. We're committed to affordability. We offer scholarships and subsidized courses for students from low-income backgrounds. School partnerships often offer free or low-cost programs to students. Contact us to discuss options.",
    },
    {
        question: "Do I need a computer at home?",
        answer: "For online courses, reliable internet and a computer are helpful but not always required. Many students use smartphones. School-based and hub-based programs provide computers and equipment. We work to minimize barriers to access.",
    },
    {
        question: "How long do courses take?",
        answer: "Course duration varies. Introductory courses might be 4-8 weeks. Full programs can be 3-6 months. Bootcamps are intensive 2-8 week experiences. Self-paced courses let you progress at your speed.",
    },
    {
        question: "Will I get a certificate?",
        answer: "Yes. Upon course completion, students receive certificates verifying skills learned. These are recognized by employers and educational institutions.",
    },
    {
        question: "How can my school partner with DigikaTech?",
        answer: "Contact us! We'll discuss your school's needs and goals. We can arrange teacher training, classroom programs, tech club setup, or hybrid models. Most partnerships start with a conversation about vision and feasibility.",
    },
];

export default function FAQSection({ platform, faqs }) {
    const primaryColor = platform.primaryColor || "#3B82F6";
    const [expanded, setExpanded] = useState(0);

    const faqData = faqs?.length > 0 ? faqs : defaultFAQs;

    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: "#F8FAFC" }}>
            <Container maxWidth="md">
                <Stack spacing={2} textAlign="center" sx={{ mb: 8 }}>
                    <motion.div {...fadeInUp}>
                        <SectionLabel color={primaryColor}>
                            FAQ
                        </SectionLabel>
                        <Typography
                            variant="h2"
                            fontWeight={700}
                            sx={{ mb: 2 }}
                        >
                            Frequently Asked Questions
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ maxWidth: 600, mx: "auto" }}
                        >
                            Find answers to common questions about our programs
                            and learning platform.
                        </Typography>
                    </motion.div>
                </Stack>

                <Stack spacing={2}>
                    {faqData.map((faq, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                        >
                            <Accordion
                                expanded={expanded === idx}
                                onChange={handleChange(idx)}
                                sx={{
                                    borderRadius: 3,
                                    border: "1px solid",
                                    borderColor: expanded === idx 
                                        ? primaryColor 
                                        : "divider",
                                    boxShadow: expanded === idx 
                                        ? `0 4px 20px ${hexToRgba(primaryColor, 0.15)}` 
                                        : "0 2px 8px rgba(0,0,0,0.04)",
                                    "&:before": { display: "none" },
                                    mb: 1,
                                    overflow: "hidden",
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={
                                        <IconChevronDown
                                            size={24}
                                            color={expanded === idx ? primaryColor : "#6B7280"}
                                        />
                                    }
                                    sx={{
                                        px: 3,
                                        py: 1,
                                        "& .MuiAccordionSummary-content": {
                                            my: 2,
                                        },
                                    }}
                                >
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={600}
                                        sx={{
                                            color: expanded === idx 
                                                ? primaryColor 
                                                : "text.primary",
                                        }}
                                    >
                                        {faq.question}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ px: 3, pb: 3 }}>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ lineHeight: 1.8 }}
                                    >
                                        {faq.answer}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        </motion.div>
                    ))}
                </Stack>
            </Container>
        </Box>
    );
}
