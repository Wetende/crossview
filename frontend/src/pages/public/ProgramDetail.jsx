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
    Snackbar,
    Alert as MuiAlert,
    useTheme,
    LinearProgress,
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
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useState } from "react";
import DOMPurify from "dompurify";
import { CourseDetailsModal } from "@/components/modals";
import PublicNavbar from "@/components/common/PublicNavbar";
import Footer from "@/components/common/Footer";
import * as commerceApi from "@/services/commerceApi";

// --- Helper Components ---

// Course Details Sidebar with Context-Aware CTAs
function CourseDetailsSidebar({
    program,
    enrollmentStatus,
    enrollmentData,
    enrollmentMode,
    ctaState,
    isAuthenticated,
    onShowDetails,
    onAddToCart,
    courseLevels = [],
}) {
    const theme = useTheme();
    const isEnrolled = enrollmentStatus === "enrolled";
    const isCompleted = enrollmentData?.isCompleted;
    const progressPercent = enrollmentData?.progressPercent || 0;

    // Get level label from courseLevels
    const getLevelLabel = () => {
        const level = courseLevels.find((l) => l.value === program.level);
        return level?.label || program.level || "Beginner";
    };

    // Determine CTA button text based on enrollment mode
    const getCtaText = () => {
        if (ctaState === "not_enrolled_paid") {
            return `BUY NOW - ${program.price}`;
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
                {isEnrolled ? (
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
                            href={`/student/programs/${program.id}/`}
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
                                    <IconHeartFilled
                                        size={18}
                                        color={theme.palette.error.main}
                                    />
                                }
                                size="small"
                                color="inherit"
                            >
                                Remove from wishlist
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
                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                startIcon={<IconShoppingCart size={18} />}
                                onClick={async () => {
                                    if (onAddToCart) {
                                        onAddToCart(program.id);
                                    }
                                }}
                                sx={{
                                    mb: 2,
                                    py: 1.5,
                                    fontWeight: 700,
                                    bgcolor: theme.palette.primary.main,
                                }}
                            >
                                {getCtaText()}
                            </Button>
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
                ) : (
                    <>
                        <Button
                            component={Link}
                            href={`/login/?next=/programs/${program.id}/`}
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
                )}

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
                            {getLevelLabel()}
                        </Typography>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

// Popular Courses Sidebar
function PopularCourses({ courses }) {
    if (!courses || courses.length === 0) return null;

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
                        href={`/programs/${course.id}/`}
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
                                {course.price > 0 ? `$${course.price}` : "Free"}
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
    enrollmentMode = "free",
    ctaState = "not_enrolled",
    courseLevels = [],
}) {
    const theme = useTheme();
    const { auth } = usePage().props;
    const [tabValue, setTabValue] = useState(0);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [cartSnackbar, setCartSnackbar] = useState({ open: false, message: "", severity: "success" });

    const handleShowDetails = () => setDetailsModalOpen(true);
    const handleCloseDetails = () => setDetailsModalOpen(false);

    const handleAddToCart = async (programId) => {
        const res = await commerceApi.addToCart(programId);
        if (res.ok || res.error === "program_in_cart") {
            router.visit("/checkout/");
        } else {
            setCartSnackbar({ open: true, message: res.message || "Could not add to cart.", severity: "error" });
        }
    };

    return (
        <>
            <Head title={`${program.name} - Crossview LMS`} />

            <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
                {/* Navbar */}
                <PublicNavbar activeLink="/programs/" auth={auth} />

                {/* Badge (if any) */}
                <Container maxWidth="lg" sx={{ pt: 12 }}>
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
                                isAuthenticated={!!auth?.user}
                                onShowDetails={handleShowDetails}
                                onAddToCart={handleAddToCart}
                                courseLevels={courseLevels}
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
                                    {program.description?.substring(0, 200)}
                                    {program.description?.length > 200 && "..."}
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
                                    <Typography
                                        variant="body1"
                                        sx={{ whiteSpace: "pre-wrap", mb: 4 }}
                                    >
                                        {program.description}
                                    </Typography>

                                    {program.what_you_learn_html && (
                                            <Box sx={{ mt: 4 }}>
                                                <Typography
                                                    variant="h5"
                                                    fontWeight={600}
                                                    sx={{ mb: 3 }}
                                                >
                                                    What you'll learn
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
