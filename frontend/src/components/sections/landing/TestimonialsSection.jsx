import {
    Box,
    Container,
    Typography,
    Stack,
    Card,
    Avatar,
    Rating,
    Chip,
} from "@mui/material";
import { IconQuote } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

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

// Default testimonials — DigikaTech Africa context
// These act as placeholders until real reviews are added via SuperAdmin
const defaultTestimonials = [
    {
        name: "Amara K.",
        role: "Student, Robotics & IoT Program",
        quote: "Last month I knew nothing about coding. Today I've built my first robot and programmed it with Python. DigikaTech changed everything for me.",
        avatar: "AK",
        rating: 5,
    },
    {
        name: "James O.",
        role: "Student, Coding & Algorithms",
        quote: "The hands-on approach is incredible. I'm building real web apps and games, not just reading theory. The instructors actually care about our progress.",
        avatar: "JO",
        rating: 5,
    },
    {
        name: "Grace M.",
        role: "Teacher, Partner School",
        quote: "DigikaTech brought tech education to our school when we had nothing. Now our students are competing in robotics challenges and dreaming bigger.",
        avatar: "GM",
        rating: 5,
    },
];

// Testimonial Card Component (reusable)
function TestimonialCard({ testimonial, primaryColor }) {
    return (
        <Card
            sx={{
                p: 4,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 4,
                bgcolor: "#FFFFFF",
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                position: "relative",
            }}
        >
            <IconQuote
                size={40}
                color={hexToRgba(primaryColor, 0.2)}
                style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                }}
            />

            <Rating
                value={testimonial.rating}
                readOnly
                size="small"
                sx={{ mb: 2 }}
            />

            <Typography
                variant="body1"
                sx={{
                    mb: 3,
                    lineHeight: 1.8,
                    color: "#6B7280",
                    fontStyle: "italic",
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    flexGrow: 1,
                }}
            >
                &quot;{testimonial.quote}&quot;
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                    sx={{
                        width: 48,
                        height: 48,
                        bgcolor: primaryColor,
                        fontWeight: 700,
                    }}
                >
                    {testimonial.avatar}
                </Avatar>
                <Box>
                    <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{ color: "#1F2937" }}
                    >
                        {testimonial.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6B7280" }}>
                        {testimonial.role}
                    </Typography>
                </Box>
            </Stack>
        </Card>
    );
}

export default function TestimonialsSection({ platform }) {
    const primaryColor = platform.primaryColor || "#3B82F6";

    // Use platform testimonials if available, otherwise fall back to defaults
    const testimonials = platform.testimonials?.length > 0
        ? platform.testimonials
        : defaultTestimonials;

    return (
        <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: "white" }}>
            <Container maxWidth="lg">
                <Stack spacing={2} textAlign="center" sx={{ mb: 8 }}>
                    <motion.div {...fadeInUp}>
                        <SectionLabel color={primaryColor}>
                            Testimonials
                        </SectionLabel>
                        <Typography
                            variant="h2"
                            fontWeight={700}
                            sx={{ mb: 2 }}
                        >
                            What Our Community Says
                        </Typography>
                    </motion.div>
                </Stack>

                {/* Swiper Carousel - 3 slides on desktop, 1 on mobile */}
                <Swiper
                    modules={[Pagination, Navigation, Autoplay]}
                    spaceBetween={24}
                    slidesPerView={1}
                    breakpoints={{
                        600: {
                            slidesPerView: 2,
                            spaceBetween: 20,
                        },
                        900: {
                            slidesPerView: 3,
                            spaceBetween: 24,
                        },
                    }}
                    pagination={{ clickable: true }}
                    navigation
                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                    style={{ paddingBottom: "50px" }}
                >
                    {testimonials.map((testimonial, idx) => (
                        <SwiperSlide key={idx}>
                            <TestimonialCard
                                testimonial={testimonial}
                                primaryColor={primaryColor}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </Container>
        </Box>
    );
}
