import {
    Box,
    Container,
    Typography,
    Stack,
    Card,
    Avatar,
    Rating,
    Chip,
    useTheme,
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

// Testimonials data
const testimonials = [
    {
        name: "Mary Wanjiku",
        role: "Graduate, Certificate in IT",
        quote: "The structured curriculum and supportive instructors helped me land my dream job within 3 months of graduating.",
        avatar: "MW",
        rating: 5,
    },
    {
        name: "John Ochieng",
        role: "Current Student",
        quote: "The practical approach to learning is incredible. I'm already applying what I've learned at my workplace.",
        avatar: "JO",
        rating: 5,
    },
    {
        name: "Grace Muthoni",
        role: "Graduate, Diploma Program",
        quote: "The certificate I earned opened new doors for my career. Highly recommend for anyone looking to upskill.",
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
                "{testimonial.quote}"
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
    const theme = useTheme();
    const primaryColor = platform.primaryColor || "#3B82F6";

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
                            What Our Students Say
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
