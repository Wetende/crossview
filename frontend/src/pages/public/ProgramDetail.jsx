import { Head, Link, usePage, router } from "@inertiajs/react";
import {
    Box,
    Container,
    Typography,
    Grid,
    Stack,
    Card,
    CardContent,
    CardMedia,
    Button,
    Chip,
    Rating,
    Tabs,
    Tab,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Snackbar,
    Alert as MuiAlert,
    useTheme,
} from "@mui/material";
import {
    IconClock,
    IconBook,
    IconChartBar,
    IconClipboardCheck,
    IconHeart,
    IconHeartFilled,
    IconShare,
    IconChevronDown,
    IconCheck,
    IconPlayerPlay,
    IconLock,
    IconFolder,
    IconShoppingCart,
    IconX,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useState } from "react";
import DOMPurify from "dompurify";
import { CourseDetailsModal } from "@/components/modals";
import PublicNavbar from "@/components/common/PublicNavbar";
import Footer from "@/components/common/Footer";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCurrency } from "@/hooks/useCurrency";
import { truncatePlainText } from "@/utils/htmlText";
import { resolvePriceDisplay } from "@/utils/priceDisplay";

// --- Helper Components ---

const emptyInterestForm = {
    fullName: "",
    email: "",
    phone: "",
};

function EnrollmentInterestModal({
    open,
    onClose,
    program,
    form,
    errors,
    submitting,
    onFieldChange,
    onSubmit,
}) {
    return (
        <Dialog
            open={open}
            onClose={submitting ? undefined : onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2, overflow: "hidden" },
            }}
        >
            <Box component="form" noValidate onSubmit={onSubmit}>
                <DialogTitle sx={{ pr: 6, pb: 1 }}>
                    <Typography variant="h6" fontWeight={800}>
                        Enroll now
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {program?.name}
                    </Typography>
                </DialogTitle>

                <IconButton
                    aria-label="Close enrollment form"
                    onClick={onClose}
                    disabled={submitting}
                    sx={{ position: "absolute", top: 10, right: 10 }}
                >
                    <IconX size={20} />
                </IconButton>

                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={2.25}>
                        <TextField
                            label="Full name"
                            name="fullName"
                            value={form.fullName}
                            onChange={(event) => onFieldChange("fullName", event.target.value)}
                            placeholder="e.g. Mary Wanjiku"
                            autoComplete="name"
                            required
                            fullWidth
                            error={!!errors.fullName}
                            helperText={errors.fullName}
                        />
                        <TextField
                            label="Email address"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={(event) => onFieldChange("email", event.target.value)}
                            placeholder="mary@example.com"
                            autoComplete="email"
                            required
                            fullWidth
                            error={!!errors.email}
                            helperText={errors.email}
                        />
                        <TextField
                            label="Phone number"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={(event) => onFieldChange("phone", event.target.value)}
                            placeholder="0715 000 111"
                            autoComplete="tel"
                            required
                            fullWidth
                            error={!!errors.phone}
                            helperText={errors.phone}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={onClose} disabled={submitting} color="inherit">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit details"}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}

// Course Details Sidebar with Context-Aware CTAs
function CourseDetailsSidebar({
    program,
    enrollmentStatus,
    enrollmentData,
    ctaState,
    prerequisiteStatus,
    isAuthenticated,
    onShowDetails,
    onAddToCart,
    onOpenEnrollmentInterest,
    onToggleWishlist,
    wishlisted,
    isPreview = false,
}) {
    const theme = useTheme();
    const isEnrolled = enrollmentStatus === "enrolled";
    const isCompleted = enrollmentData?.isCompleted;
    const progressPercent = enrollmentData?.progressPercent || 0;
    const ctaText = "ENROLL NOW";

    return (
        <Card sx={{ mb: 3, position: "sticky", top: 100 }}>
            <CardContent sx={{ p: 3 }}>
                {/* Enrolled User CTA */}
                {!isPreview && (isEnrolled ? (
                    <>
                        {/* Completion/Progress Badge */}
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                                mb: 2,
                                p: 1.5,
                                bgcolor: isCompleted
                                    ? "success.light"
                                    : "primary.light",
                                borderRadius: 2,
                            }}
                        >
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <IconCheck
                                    size={20}
                                    color={
                                        isCompleted
                                            ? theme.palette.success.main
                                            : theme.palette.primary.main
                                    }
                                />
                                <Box>
                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                    >
                                        {isCompleted
                                            ? "Course complete"
                                            : "In progress"}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Score: {progressPercent}%
                                    </Typography>
                                </Box>
                            </Stack>
                            <Button
                                size="small"
                                variant="contained"
                                onClick={onShowDetails}
                                sx={{
                                    bgcolor: theme.palette.primary.main,
                                    fontSize: "0.7rem",
                                    px: 1.5,
                                }}
                            >
                                Details
                            </Button>
                        </Stack>

                        {/* Continue Button */}
                        <Button
                            component={Link}
                            href={`/student/programs/${program.id}/resume/`}
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{
                                mb: 2,
                                py: 1.5,
                                fontWeight: 700,
                                bgcolor: theme.palette.primary.main,
                            }}
                        >
                            CONTINUE
                        </Button>

                        {/* Quick Actions for enrolled */}
                        <Stack
                            direction="row"
                            spacing={2}
                            justifyContent="center"
                            sx={{ mb: 3 }}
                        >
                            <Button
                                startIcon={
                                    wishlisted ? (
                                        <IconHeartFilled
                                            size={18}
                                            color={theme.palette.error.main}
                                        />
                                    ) : (
                                        <IconHeart size={18} />
                                    )
                                }
                                size="small"
                                color="inherit"
                                onClick={() =>
                                    onToggleWishlist && onToggleWishlist(program.id)
                                }
                            >
                                {wishlisted
                                    ? "Remove from wishlist"
                                    : "Add to wishlist"}
                            </Button>
                            <Button
                                startIcon={<IconShare size={18} />}
                                size="small"
                                color="inherit"
                            >
                                Share
                            </Button>
                        </Stack>
                    </>
                ) : ctaState === "prerequisites_required" ? (
                    <>
                        <MuiAlert
                            severity="warning"
                            icon={<IconLock size={18} />}
                            sx={{ mb: 2 }}
                        >
                            <Typography variant="body2" fontWeight={700}>
                                Prerequisites required
                            </Typography>
                            <Typography variant="caption" component="div">
                                {prerequisiteStatus?.blockingMessage ||
                                    "Complete the required courses first."}
                            </Typography>
                        </MuiAlert>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            disabled
                            sx={{ mb: 2, py: 1.5 }}
                        >
                            PREREQUISITES REQUIRED
                        </Button>
                        <List dense disablePadding sx={{ mb: 2 }}>
                            {(prerequisiteStatus?.requirements || []).map(
                                (item) => (
                                    <ListItem key={item.programId} disableGutters>
                                        <ListItemIcon sx={{ minWidth: 30 }}>
                                            {item.passed ? (
                                                <IconCheck size={18} />
                                            ) : (
                                                <IconLock size={18} />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.name}
                                            secondary={
                                                item.score == null
                                                    ? "No published score yet"
                                                    : `Score: ${item.score}%`
                                            }
                                        />
                                    </ListItem>
                                ),
                            )}
                        </List>
                    </>
                ) : ctaState === "pending_payment" ? (
                    <>
                        <Button
                            component={Link}
                            href="/student/orders/"
                            variant="outlined"
                            fullWidth
                            size="large"
                            sx={{ mb: 2, py: 1.5 }}
                        >
                            COMPLETE PAYMENT
                        </Button>
                    </>
                ) : enrollmentStatus === "pending" ? (
                    <>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            disabled
                            sx={{ mb: 2, py: 1.5 }}
                        >
                            ENROLLMENT PENDING
                        </Button>
                        <Stack
                            direction="row"
                            spacing={2}
                            justifyContent="center"
                            sx={{ mb: 3 }}
                        >
                            <Button
                                startIcon={<IconHeart size={18} />}
                                size="small"
                                color="inherit"
                            >
                                Add to wishlist
                            </Button>
                            <Button
                                startIcon={<IconShare size={18} />}
                                size="small"
                                color="inherit"
                            >
                                Share
                            </Button>
                        </Stack>
                    </>
                ) : isAuthenticated ? (
                    <>
                        {ctaState === "not_enrolled_paid" ? (
                            <>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    onClick={() =>
                                        onOpenEnrollmentInterest &&
                                        onOpenEnrollmentInterest()
                                    }
                                    sx={{
                                        mb: 1.5,
                                        py: 1.5,
                                        fontWeight: 700,
                                        bgcolor: theme.palette.primary.main,
                                    }}
                                >
                                    {ctaText}
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    size="large"
                                    startIcon={<IconShoppingCart size={18} />}
                                    onClick={() =>
                                        onAddToCart && onAddToCart(program.id)
                                    }
                                    sx={{
                                        mb: 2,
                                        py: 1.5,
                                        fontWeight: 700,
                                    }}
                                >
                                    Add to Cart
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                onClick={() =>
                                    onOpenEnrollmentInterest &&
                                    onOpenEnrollmentInterest()
                                }
                                sx={{
                                    mb: 2,
                                    py: 1.5,
                                    fontWeight: 700,
                                    bgcolor: theme.palette.primary.main,
                                }}
                            >
                                {ctaText}
                            </Button>
                        )}
                        <Stack
                            direction="row"
                            spacing={2}
                            justifyContent="center"
                            sx={{ mb: 3 }}
                        >
                            <Button
                                startIcon={
                                    wishlisted ? (
                                        <IconHeartFilled size={18} color={theme.palette.error.main} />
                                    ) : (
                                        <IconHeart size={18} />
                                    )
                                }
                                size="small"
                                color="inherit"
                                onClick={() => onToggleWishlist && onToggleWishlist(program.id)}
                            >
                                {wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                            </Button>
                            <Button
                                startIcon={<IconShare size={18} />}
                                size="small"
                                color="inherit"
                            >
                                Share
                            </Button>
                        </Stack>
                    </>
                ) : (
                    <>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={() =>
                                onOpenEnrollmentInterest &&
                                onOpenEnrollmentInterest()
                            }
                            sx={{
                                mb: 2,
                                py: 1.5,
                                fontWeight: 700,
                                bgcolor: theme.palette.primary.main,
                            }}
                        >
                            {ctaText}
                        </Button>
                        <Stack
                            direction="row"
                            spacing={2}
                            justifyContent="center"
                            sx={{ mb: 3 }}
                        >
                            <Button
                                startIcon={
                                    wishlisted ? (
                                        <IconHeartFilled size={18} color={theme.palette.error.main} />
                                    ) : (
                                        <IconHeart size={18} />
                                    )
                                }
                                size="small"
                                color="inherit"
                                onClick={() => onToggleWishlist && onToggleWishlist(program.id)}
                            >
                                {wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                            </Button>
                            <Button
                                startIcon={<IconShare size={18} />}
                                size="small"
                                color="inherit"
                            >
                                Share
                            </Button>
                        </Stack>
                    </>
                ))}

                <Divider sx={{ my: 2 }} />

                {/* Course Details */}
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    Course details
                </Typography>

                <Stack spacing={2}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <IconClock
                                size={18}
                                color={theme.palette.text.secondary}
                            />
                            <Typography variant="body2" color="text.secondary">
                                Duration
                            </Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={600}>
                            {program.duration_hours} hours
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <IconBook
                                size={18}
                                color={theme.palette.text.secondary}
                            />
                            <Typography variant="body2" color="text.secondary">
                                Lessons
                            </Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={600}>
                            {program.lecture_count}
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <IconClipboardCheck
                                size={18}
                                color={theme.palette.text.secondary}
                            />
                            <Typography variant="body2" color="text.secondary">
                                Assessments
                            </Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={600}>
                            {program.assessment_count || 0}
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <IconChartBar
                                size={18}
                                color={theme.palette.text.secondary}
                            />
                            <Typography variant="body2" color="text.secondary">
                                Level
                            </Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={600}>
                            {program.level || "No level"}
                        </Typography>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

// Popular Courses Sidebar
function PopularCourses({ courses }) {
    const { formatCurrency } = useCurrency();

    if (!courses || courses.length === 0) return null;

    const getPriceLabel = (course) => {
        const priceDisplay = resolvePriceDisplay(course);
        if (priceDisplay.showPrice) {
            return formatCurrency(priceDisplay.price);
        }
        return priceDisplay.showFree ? "Free" : "";
    };

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Popular courses
            </Typography>
            <Stack spacing={2}>
                {courses.map((course) => (
                    <Card
                        key={course.id}
                        component={Link}
                        href={course.publicUrl}
                        sx={{
                            textDecoration: "none",
                            display: "flex",
                            "&:hover": { boxShadow: 3 },
                        }}
                    >
                        <CardMedia
                            component="img"
                            sx={{ width: 80, height: 60, objectFit: "cover" }}
                            image={
                                course.thumbnail ||
                                "/static/images/course-placeholder.svg"
                            }
                            alt={course.name}
                        />
                        <CardContent sx={{ p: 1.5, flex: 1 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                                {course.name}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {getPriceLabel(course)}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Stack>
        </Box>
    );
}

// Curriculum Tree Component
function CurriculumSection({ section, index }) {
    const [expanded, setExpanded] = useState(index === 0);

    return (
        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
            <AccordionSummary expandIcon={<IconChevronDown />}>
                <Typography fontWeight={600}>{section.title}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
                <List dense>
                    {section.children?.map((lesson) => (
                        <ListItem key={lesson.id} sx={{ py: 1, px: 3 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                {lesson.isPreview ? (
                                    <IconPlayerPlay size={18} color="#2196F3" />
                                ) : (
                                    <IconLock size={18} color="#999" />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary={lesson.title}
                                secondary={
                                    lesson.duration
                                        ? `${lesson.duration} min`
                                        : null
                                }
                                primaryTypographyProps={{ variant: "body2" }}
                            />
                            {lesson.isPreview && (
                                <Chip
                                    label="Preview"
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            )}
                        </ListItem>
                    ))}
                </List>
            </AccordionDetails>
        </Accordion>
    );
}

// Tab Panel Component
function TabPanel({ children, value, index }) {
    return (
        <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
            {value === index && children}
        </Box>
    );
}

export default function ProgramDetail({
    program,
    curriculum = [],
    instructors = [],
    popularPrograms = [],
    enrollmentStatus,
    enrollmentData,
    ctaState = "not_enrolled",
    prerequisiteStatus = null,
    isPreview = false,
    builderUrl = null,
}) {
    const { auth, platform } = usePage().props;
    const { addToCart } = useCart();
    const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const [tabValue, setTabValue] = useState(0);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [interestModalOpen, setInterestModalOpen] = useState(false);
    const [interestForm, setInterestForm] = useState(emptyInterestForm);
    const [interestErrors, setInterestErrors] = useState({});
    const [interestSubmitting, setInterestSubmitting] = useState(false);
    const [cartSnackbar, setCartSnackbar] = useState({ open: false, message: "", severity: "success" });
    const shortDescription = truncatePlainText(program.description, 200);

    const handleShowDetails = () => setDetailsModalOpen(true);
    const handleCloseDetails = () => setDetailsModalOpen(false);

    const isWishlisted = (wishlist?.items || []).some((item) => item.program?.id === program.id);

    const handleBuyNow = (programId) => {
        router.visit(`/checkout/?mode=direct&programId=${programId}`);
    };

    const getDefaultInterestForm = () => ({
        fullName: auth?.user?.fullName || auth?.user?.name || "",
        email: auth?.user?.email || "",
        phone: auth?.user?.phone || "",
    });

    const handleOpenEnrollmentInterest = () => {
        setInterestForm(getDefaultInterestForm());
        setInterestErrors({});
        setInterestModalOpen(true);
    };

    const handleCloseEnrollmentInterest = () => {
        if (interestSubmitting) return;
        setInterestModalOpen(false);
    };

    const handleInterestFieldChange = (field, value) => {
        setInterestForm((current) => ({ ...current, [field]: value }));
        setInterestErrors((current) => {
            if (!current[field]) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
    };

    const validateInterestForm = () => {
        const nextErrors = {};
        const email = interestForm.email.trim();

        if (!interestForm.fullName.trim()) {
            nextErrors.fullName = "Full name is required.";
        }
        if (!email) {
            nextErrors.email = "Email address is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            nextErrors.email = "Enter a valid email address.";
        }
        if (!interestForm.phone.trim()) {
            nextErrors.phone = "Phone number is required.";
        }

        setInterestErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmitEnrollmentInterest = (event) => {
        event.preventDefault();
        if (!validateInterestForm()) return;

        router.post(`/programs/${program.id}/interest/`, {
            fullName: interestForm.fullName.trim(),
            email: interestForm.email.trim(),
            phone: interestForm.phone.trim(),
        }, {
            preserveScroll: true,
            onStart: () => setInterestSubmitting(true),
            onSuccess: () => {
                setInterestModalOpen(false);
                setCartSnackbar({
                    open: true,
                    message: "Thanks. Our admissions team will contact you soon.",
                    severity: "success",
                });

                if (!auth?.user) return;

                if (ctaState === "not_enrolled_paid") {
                    handleBuyNow(program.id);
                    return;
                }

                router.post(
                    `/programs/${program.id}/enroll/`,
                    {
                        message: "Enrollment interest submitted from the course detail page.",
                    },
                    { preserveScroll: true },
                );
            },
            onError: (errors) => {
                setInterestErrors(errors || {});
                setCartSnackbar({
                    open: true,
                    message: "Could not submit your details. Please check the form.",
                    severity: "error",
                });
            },
            onFinish: () => setInterestSubmitting(false),
        });
    };

    const handleAddToCart = async (programId) => {
        const res = await addToCart(programId);
        if (res.ok) {
            setCartSnackbar({ open: true, message: "Added to cart.", severity: "success" });
            return;
        }
        if (res.error === "program_in_cart") {
            setCartSnackbar({ open: true, message: "Program is already in your cart.", severity: "info" });
            return;
        }
        setCartSnackbar({ open: true, message: res.message || "Could not add to cart.", severity: "error" });
    };

    const handleToggleWishlist = async (programId) => {
        if (isWishlisted) {
            const res = await removeFromWishlist(programId);
            if (!res.ok) {
                setCartSnackbar({ open: true, message: res.message || "Could not update wishlist.", severity: "error" });
            }
            return;
        }
        const res = await addToWishlist(programId);
        if (!res.ok) {
            setCartSnackbar({ open: true, message: res.message || "Could not update wishlist.", severity: "error" });
        }
    };

    return (
        <>
            <Head title={`${program.name} - ${platform?.institutionName || "LMS"}`} />

            <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
                {/* Navbar */}
                <PublicNavbar activeLink="/programs/" auth={auth} />

                {isPreview && (
                    <Box
                        sx={{
                            position: "relative",
                            zIndex: 2,
                            bgcolor: "warning.light",
                            borderBottom: 1,
                            borderColor: "warning.main",
                            pt: 9,
                            pb: 1,
                        }}
                    >
                        <Container maxWidth="lg">
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ xs: "stretch", sm: "center" }}
                                justifyContent="space-between"
                            >
                                <Typography variant="body2" fontWeight={700}>
                                    Draft preview. This course is not visible to students.
                                </Typography>
                                {builderUrl && (
                                    <Button
                                        component={Link}
                                        href={builderUrl}
                                        variant="outlined"
                                        color="inherit"
                                        size="small"
                                    >
                                        Back to Course Builder
                                    </Button>
                                )}
                            </Stack>
                        </Container>
                    </Box>
                )}

                {/* Badge (if any) */}
                <Container maxWidth="lg" sx={{ pt: isPreview ? 3 : 12 }}>
                    {program.badge_type && (
                        <Chip
                            label={program.badge_type.toUpperCase()}
                            size="small"
                            sx={{
                                mb: 2,
                                bgcolor:
                                    program.badge_type === "hot"
                                        ? "error.main"
                                        : program.badge_type === "new"
                                          ? "success.main"
                                          : "warning.main",
                                color: "white",
                                fontWeight: 700,
                            }}
                        />
                    )}
                </Container>

                {/* Main Content */}
                <Container maxWidth="lg" sx={{ pb: 8 }}>
                    <Grid container spacing={4}>
                        {/* Left Sidebar */}
                        <Grid size={{ xs: 12, md: 4 }} order={{ xs: 2, md: 1 }}>
                            <CourseDetailsSidebar
                                program={program}
                                enrollmentStatus={enrollmentStatus}
                                enrollmentData={enrollmentData}
                                ctaState={ctaState}
                                prerequisiteStatus={prerequisiteStatus}
                                isAuthenticated={!!auth?.user}
                                onShowDetails={handleShowDetails}
                                onOpenEnrollmentInterest={handleOpenEnrollmentInterest}
                                onAddToCart={handleAddToCart}
                                onToggleWishlist={handleToggleWishlist}
                                wishlisted={isWishlisted}
                                isPreview={isPreview}
                            />
                            <PopularCourses courses={popularPrograms} />
                        </Grid>

                        {/* Main Content Area */}
                        <Grid size={{ xs: 12, md: 8 }} order={{ xs: 1, md: 2 }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* Category & Instructor Row */}
                                <Stack
                                    direction="row"
                                    spacing={3}
                                    alignItems="center"
                                    flexWrap="wrap"
                                    sx={{ mb: 2 }}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                    >
                                        <IconBook size={18} />
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Category
                                        </Typography>
                                        <Chip
                                            label={
                                                program.category || "General"
                                            }
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Stack>

                                    {instructors.length > 0 && (
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                        >
                                            <Avatar
                                                sx={{
                                                    width: 24,
                                                    height: 24,
                                                    fontSize: 12,
                                                }}
                                            >
                                                {instructors[0].name.charAt(0)}
                                            </Avatar>
                                            <Typography variant="body2">
                                                <strong>Instructor</strong>{" "}
                                                {instructors[0].name}
                                            </Typography>
                                        </Stack>
                                    )}

                                    <Stack
                                        direction="row"
                                        spacing={0.5}
                                        alignItems="center"
                                    >
                                        <Rating
                                            value={program.rating || 0}
                                            precision={0.1}
                                            size="small"
                                            readOnly
                                        />
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                        >
                                            {program.rating?.toFixed(1)}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            ({program.review_count} reviews)
                                        </Typography>
                                    </Stack>
                                </Stack>

                                {/* Title */}
                                <Typography
                                    variant="h4"
                                    fontWeight={700}
                                    sx={{ mb: 2 }}
                                >
                                    {program.name}
                                </Typography>

                                {/* Short Description */}
                                <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{ mb: 3 }}
                                >
                                    {shortDescription}
                                </Typography>

                                {/* Featured Image */}
                                {program.thumbnail && (
                                    <Box
                                        component="img"
                                        src={program.thumbnail}
                                        alt={program.name}
                                        sx={{
                                            width: "100%",
                                            height: 350,
                                            objectFit: "cover",
                                            borderRadius: 2,
                                            mb: 3,
                                        }}
                                    />
                                )}

                                {/* Tabs */}
                                <Box
                                    sx={{
                                        borderBottom: 1,
                                        borderColor: "divider",
                                    }}
                                >
                                    <Tabs
                                        value={tabValue}
                                        onChange={(e, v) => setTabValue(v)}
                                    >
                                        <Tab label="Description" />
                                        <Tab label="Curriculum" />
                                        <Tab label="Resources" />
                                        <Tab label="FAQ" />
                                        <Tab label="Notice" />
                                        <Tab label="Reviews" />
                                    </Tabs>
                                </Box>

                                {/* Description Tab */}
                                <TabPanel value={tabValue} index={0}>
                                    <Box
                                        sx={{
                                            mb: 4,
                                            "& p": { mb: 1 },
                                            "& ul, & ol": { pl: 3, mb: 1.5 },
                                            "& li": { mb: 0.5 },
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(program.description || ""),
                                        }}
                                    />

                                    {program.what_you_learn_html && (
                                            <Box sx={{ mt: 4 }}>
                                                <Typography
                                                    variant="h5"
                                                    fontWeight={600}
                                                    sx={{ mb: 3 }}
                                                >
                                                    What you&apos;ll learn
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        "& ul, & ol": { pl: 3, mb: 2 },
                                                        "& li": { mb: 0.75 },
                                                        "& h1, & h2, & h3": { mb: 1.5, mt: 2 },
                                                        "& p": { mb: 1 },
                                                    }}
                                                    dangerouslySetInnerHTML={{
                                                        __html: DOMPurify.sanitize(
                                                            program.what_you_learn_html,
                                                        ),
                                                    }}
                                                />
                                            </Box>
                                        )}
                                </TabPanel>

                                {/* Curriculum Tab */}
                                <TabPanel value={tabValue} index={1}>
                                    {curriculum.length === 0 ? (
                                        <Typography color="text.secondary">
                                            Curriculum details coming soon.
                                        </Typography>
                                    ) : (
                                        <Stack spacing={1}>
                                            {curriculum.map((section, idx) => (
                                                <CurriculumSection
                                                    key={section.id}
                                                    section={section}
                                                    index={idx}
                                                />
                                            ))}
                                        </Stack>
                                    )}
                                </TabPanel>

                                {/* Resources Tab */}
                                <TabPanel value={tabValue} index={2}>
                                    {!program.resources ||
                                    program.resources.length === 0 ? (
                                        <Typography color="text.secondary">
                                            No downloadable resources available.
                                        </Typography>
                                    ) : (
                                        <List>
                                            {program.resources.map((res) => (
                                                <ListItem key={res.id} divider>
                                                    <ListItemIcon>
                                                        <IconFolder size={24} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={
                                                            <a
                                                                href={res.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    textDecoration:
                                                                        "none",
                                                                    color: "inherit",
                                                                    fontWeight: 500,
                                                                }}
                                                            >
                                                                {res.title}
                                                            </a>
                                                        }
                                                        secondary={res.type}
                                                    />
                                                    <Button
                                                        component="a"
                                                        href={res.url}
                                                        target="_blank"
                                                        variant="outlined"
                                                        size="small"
                                                    >
                                                        Download
                                                    </Button>
                                                </ListItem>
                                            ))}
                                        </List>
                                    )}
                                </TabPanel>

                                {/* FAQ Tab */}
                                <TabPanel value={tabValue} index={3}>
                                    {!program.faq ||
                                    program.faq.length === 0 ? (
                                        <Typography color="text.secondary">
                                            No FAQs available for this course.
                                        </Typography>
                                    ) : (
                                        <Stack spacing={1}>
                                            {program.faq.map((item, idx) => (
                                                <Accordion key={idx}>
                                                    <AccordionSummary
                                                        expandIcon={
                                                            <IconChevronDown />
                                                        }
                                                    >
                                                        <Typography
                                                            fontWeight={600}
                                                        >
                                                            {item.question}
                                                        </Typography>
                                                    </AccordionSummary>
                                                    <AccordionDetails>
                                                        <Typography variant="body2">
                                                            {item.answer}
                                                        </Typography>
                                                    </AccordionDetails>
                                                </Accordion>
                                            ))}
                                        </Stack>
                                    )}
                                </TabPanel>

                                {/* Notice Tab */}
                                <TabPanel value={tabValue} index={4}>
                                    {!program.notices ||
                                    program.notices.length === 0 ? (
                                        <Typography color="text.secondary">
                                            No notices for this course.
                                        </Typography>
                                    ) : (
                                        <Stack spacing={2}>
                                            {program.notices.map(
                                                (notice, idx) => (
                                                    <Card
                                                        key={idx}
                                                        variant="outlined"
                                                    >
                                                        <CardContent>
                                                            <Typography
                                                                variant="subtitle1"
                                                                fontWeight={600}
                                                            >
                                                                {typeof notice === "string"
                                                                    ? `Notice ${idx + 1}`
                                                                    : notice.title}
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                                component="div"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: DOMPurify.sanitize(
                                                                        (typeof notice === "string"
                                                                            ? notice
                                                                            : notice.content) || "",
                                                                    ),
                                                                }}
                                                            />
                                                        </CardContent>
                                                    </Card>
                                                ),
                                            )}
                                        </Stack>
                                    )}
                                </TabPanel>

                                {/* Reviews Tab */}
                                <TabPanel value={tabValue} index={5}>
                                    {!program.reviews ||
                                    program.reviews.length === 0 ? (
                                        <Typography color="text.secondary">
                                            No reviews yet.
                                        </Typography>
                                    ) : (
                                        <Stack spacing={2}>
                                            {program.reviews.map((review) => (
                                                <Card
                                                    key={review.id}
                                                    variant="outlined"
                                                >
                                                    <CardContent>
                                                        <Stack spacing={1}>
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                                alignItems="center"
                                                            >
                                                                <Rating
                                                                    value={
                                                                        review.rating ||
                                                                        0
                                                                    }
                                                                    precision={
                                                                        1
                                                                    }
                                                                    size="small"
                                                                    readOnly
                                                                />
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight={
                                                                        600
                                                                    }
                                                                >
                                                                    {review.user
                                                                        ?.name ||
                                                                        "Anonymous"}
                                                                </Typography>
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                >
                                                                    {review.updatedAt
                                                                        ? new Date(
                                                                              review.updatedAt,
                                                                          ).toLocaleDateString()
                                                                        : ""}
                                                                </Typography>
                                                            </Stack>
                                                            <Typography
                                                                variant="body2"
                                                                component="div"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: DOMPurify.sanitize(
                                                                        review.reviewText || "",
                                                                    ),
                                                                }}
                                                            />
                                                        </Stack>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Stack>
                                    )}
                                </TabPanel>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>

                {/* Footer */}
                <Footer />
            </Box>

            {/* Modals */}
            <EnrollmentInterestModal
                open={interestModalOpen}
                onClose={handleCloseEnrollmentInterest}
                program={program}
                form={interestForm}
                errors={interestErrors}
                submitting={interestSubmitting}
                onFieldChange={handleInterestFieldChange}
                onSubmit={handleSubmitEnrollmentInterest}
            />

            <CourseDetailsModal
                open={detailsModalOpen}
                onClose={handleCloseDetails}
                program={program}
                enrollmentData={enrollmentData}
            />

            {/* Cart Snackbar */}
            <Snackbar
                open={cartSnackbar.open}
                autoHideDuration={4000}
                onClose={() => setCartSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <MuiAlert
                    severity={cartSnackbar.severity}
                    onClose={() => setCartSnackbar((s) => ({ ...s, open: false }))}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {cartSnackbar.message}
                </MuiAlert>
            </Snackbar>
        </>
    );
}
