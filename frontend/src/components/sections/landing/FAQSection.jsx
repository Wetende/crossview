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
    useTheme,
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

// Default FAQ data
const defaultFAQs = [
    {
        question: "How do I enroll in a program?",
        answer: "Enrolling is easy! Simply browse our programs, select the one that interests you, and click 'Enroll Now'. You'll be guided through the registration process step by step.",
    },
    {
        question: "Are the certificates recognized?",
        answer: "Yes! Our certificates are industry-recognized and come with unique QR verification codes. Employers can verify your credentials instantly.",
    },
    {
        question: "Can I study at my own pace?",
        answer: "Absolutely! Our platform supports self-paced learning. Access your courses anytime, anywhere, and complete them according to your schedule.",
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept various payment methods including credit/debit cards, mobile money, and bank transfers. Payment plans are also available for select programs.",
    },
    {
        question: "Is there support available if I get stuck?",
        answer: "Yes! Our instructors and support team are here to help. You can reach out through the discussion forums, email, or live chat during office hours.",
    },
];

export default function FAQSection({ platform, faqs }) {
    const theme = useTheme();
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
