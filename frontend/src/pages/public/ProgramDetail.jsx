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
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Avatar,
    Snackbar,
    Alert as MuiAlert,
    useTheme,
} from "@mui/material";
import {
    IconBook,
    IconHeart,
    IconHeartFilled,
    IconShare,
    IconCheck,
    IconLock,
    IconShoppingCart,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { CourseDetailsModal } from "@/components/modals";
import PublicNavbar from "@/components/common/PublicNavbar";
import Footer from "@/components/common/Footer";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCurrency } from "@/hooks/useCurrency";
import { truncatePlainText } from "@/utils/htmlText";
import { resolvePriceDisplay } from "@/utils/priceDisplay";
import CourseContentTabs from "@/features/programs/components/CourseContentTabs";
import CourseDetailsPanel from "@/features/programs/components/CourseDetailsPanel";

// --- Helper Components ---

// Course Details Sidebar with Context-Aware CTAs
function CourseDetailsSidebar({
    program,
    enrollmentStatus,
    enrollmentData,
    enrollmentMode,
    ctaState,
    prerequisiteStatus,
    isAuthenticated,
    onShowDetails,
    onBuyNow,
    onAddToCart,
    onToggleWishlist,
    wishlisted,
    isPreview = false,
}) {
    const theme = useTheme();
    const isEnrolled = enrollmentStatus === "enrolled";
    const isCompleted = enrollmentData?.isCompleted;
    const progressPercent = enrollmentData?.progressPercent || 0;
    const { formatCurrency } = useCurrency();
    const priceDisplay = resolvePriceDisplay(program);

    // Determine CTA button text based on enrollment mode
    const getCtaText = () => {
        if (ctaState === "not_enrolled_paid") {
            const amount = formatCurrency(priceDisplay.price);
            return priceDisplay.paymentCollection === "offline"
                ? `PAY OFFLINE - ${amount}`
                : `GET COURSE - ${amount}`;
        }
        if (enrollmentMode === "approval") {
            return "REQUEST ENROLLMENT";
        }
        return "ENROLL NOW";
    };

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
                                    onClick={() => onBuyNow && onBuyNow(program.id)}
                                    sx={{
                                        mb: 1.5,
                                        py: 1.5,
                                        fontWeight: 700,
                                        bgcolor: theme.palette.primary.main,
                                    }}
                                >
                                    {getCtaText()}
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
                                component={Link}
                                href={`/programs/${program.id}/enroll/`}
                                method="post"
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
                                {getCtaText()}
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
                            component={Link}
                            href={`/login/?next=${encodeURIComponent(program.publicUrl)}`}
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
                            LOGIN TO ENROLL
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

                <CourseDetailsPanel program={program} />
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

export default function ProgramDetail({
    program,
    curriculum = [],
    instructors = [],
    popularPrograms = [],
    enrollmentStatus,
    enrollmentData,
    enrollmentMode = "free",
    ctaState = "not_enrolled",
    prerequisiteStatus = null,
    isPreview = false,
    builderUrl = null,
}) {
    const { auth, platform } = usePage().props;
    const { addToCart } = useCart();
    const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [cartSnackbar, setCartSnackbar] = useState({ open: false, message: "", severity: "success" });
    const shortDescription = truncatePlainText(program.description, 200);

    const handleShowDetails = () => setDetailsModalOpen(true);
    const handleCloseDetails = () => setDetailsModalOpen(false);

    const isWishlisted = (wishlist?.items || []).some((item) => item.program?.id === program.id);

    const handleBuyNow = (programId) => {
        router.visit(`/checkout/?mode=direct&programId=${programId}`);
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
                                enrollmentMode={enrollmentMode}
                                ctaState={ctaState}
                                prerequisiteStatus={prerequisiteStatus}
                                isAuthenticated={!!auth?.user}
                                onShowDetails={handleShowDetails}
                                onBuyNow={handleBuyNow}
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

                                <CourseContentTabs
                                    program={program}
                                    curriculum={curriculum}
                                />
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>

                {/* Footer */}
                <Footer />
            </Box>

            {/* Modals */}
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
