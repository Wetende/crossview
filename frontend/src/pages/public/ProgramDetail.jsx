import { Head, Link, usePage } from "@inertiajs/react";
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
    useTheme,
    AppBar,
    Toolbar,
    useScrollTrigger,
    LinearProgress,
} from "@mui/material";
import {
    IconBrandTabler,
    IconClock,
    IconVideo,
    IconBook,
    IconChartBar,
    IconHeart,
    IconHeartFilled,
    IconShare,
    IconChevronDown,
    IconCheck,
    IconPlayerPlay,
    IconLock,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cloneElement, useState } from "react";
import { CourseDetailsModal } from "@/components/modals";

// --- Helper Components ---
function ElevationScroll({ children }) {
    const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 0 });
    return cloneElement(children, {
        elevation: trigger ? 4 : 0,
        sx: {
            bgcolor: trigger ? "rgba(255, 255, 255, 0.95)" : "white",
            backdropFilter: trigger ? "blur(20px)" : "none",
            transition: "all 0.3s ease",
        },
    });
}

// Course Details Sidebar with Context-Aware CTAs
function CourseDetailsSidebar({ 
    program, 
    enrollmentStatus, 
    enrollmentData,
    enrollmentMode,
    isAuthenticated,
    onShowDetails,
    courseLevels = [],
}) {
    const theme = useTheme();
    const isEnrolled = enrollmentStatus === "enrolled";
    const isCompleted = enrollmentData?.isCompleted;
    const progressPercent = enrollmentData?.progressPercent || 0;

    // Get level label from courseLevels
    const getLevelLabel = () => {
        const level = courseLevels.find(l => l.value === program.level);
        return level?.label || program.level || 'Beginner';
    };

    // Determine CTA button text based on enrollment mode
    const getCtaText = () => {
        if (program.price > 0) {
            return `BUY NOW - $${program.price}`;
        }
        if (enrollmentMode === "approval") {
            return "REQUEST ENROLLMENT";
        }
        return "ENROLL NOW";
    };

    return (
        <Card sx={{ mb: 3, position: 'sticky', top: 100 }}>
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
                                bgcolor: isCompleted ? 'success.light' : 'primary.light',
                                borderRadius: 2,
                            }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center">
                                <IconCheck size={20} color={isCompleted ? theme.palette.success.main : theme.palette.primary.main} />
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                        {isCompleted ? 'Course complete' : 'In progress'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
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
                                    fontSize: '0.7rem',
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
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                            <Button startIcon={<IconHeartFilled size={18} color={theme.palette.error.main} />} size="small" color="inherit">
                                Remove from wishlist
                            </Button>
                            <Button startIcon={<IconShare size={18} />} size="small" color="inherit">
                                Share
                            </Button>
                        </Stack>
                    </>
                ) : enrollmentStatus === "pending" ? (
                    <>
                        <Button variant="outlined" fullWidth size="large" disabled sx={{ mb: 2, py: 1.5 }}>
                            ENROLLMENT PENDING
                        </Button>
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                            <Button startIcon={<IconHeart size={18} />} size="small" color="inherit">
                                Add to wishlist
                            </Button>
                            <Button startIcon={<IconShare size={18} />} size="small" color="inherit">
                                Share
                            </Button>
                        </Stack>
                    </>
                ) : isAuthenticated ? (
                    <>
                        <Button
                            component={Link}
                            href={`/programs/${program.id}/enroll/`}
                            method="post"
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{ mb: 2, py: 1.5, fontWeight: 700, bgcolor: theme.palette.primary.main }}
                        >
                            {getCtaText()}
                        </Button>
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                            <Button startIcon={<IconHeart size={18} />} size="small" color="inherit">
                                Add to wishlist
                            </Button>
                            <Button startIcon={<IconShare size={18} />} size="small" color="inherit">
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
                            sx={{ mb: 2, py: 1.5, fontWeight: 700, bgcolor: theme.palette.primary.main }}
                        >
                            LOGIN TO ENROLL
                        </Button>
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                            <Button startIcon={<IconHeart size={18} />} size="small" color="inherit">
                                Add to wishlist
                            </Button>
                            <Button startIcon={<IconShare size={18} />} size="small" color="inherit">
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
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <IconClock size={18} color={theme.palette.text.secondary} />
                            <Typography variant="body2" color="text.secondary">Duration</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={600}>
                            {program.duration_hours} hours
                        </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <IconBook size={18} color={theme.palette.text.secondary} />
                            <Typography variant="body2" color="text.secondary">Lectures</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={600}>
                            {program.lecture_count}
                        </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <IconVideo size={18} color={theme.palette.text.secondary} />
                            <Typography variant="body2" color="text.secondary">Video</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={600}>
                            {program.video_hours} hours
                        </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                            <IconChartBar size={18} color={theme.palette.text.secondary} />
                            <Typography variant="body2" color="text.secondary">Level</Typography>
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
                        sx={{ textDecoration: 'none', display: 'flex', '&:hover': { boxShadow: 3 } }}
                    >
                        <CardMedia
                            component="img"
                            sx={{ width: 80, height: 60, objectFit: 'cover' }}
                            image={course.thumbnail || '/static/images/course-placeholder.jpg'}
                            alt={course.name}
                        />
                        <CardContent sx={{ p: 1.5, flex: 1 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                                {course.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {course.price > 0 ? `$${course.price}` : 'Free'}
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
                                secondary={lesson.duration ? `${lesson.duration} min` : null}
                                primaryTypographyProps={{ variant: 'body2' }}
                            />
                            {lesson.isPreview && (
                                <Chip label="Preview" size="small" color="primary" variant="outlined" />
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
    courseLevels = [],
}) {
    const theme = useTheme();
    const { auth } = usePage().props;
    const [tabValue, setTabValue] = useState(0);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    const handleShowDetails = () => setDetailsModalOpen(true);
    const handleCloseDetails = () => setDetailsModalOpen(false);

    return (
        <>
            <Head title={`${program.name} - Crossview LMS`} />

            <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
                {/* Navbar */}
                <ElevationScroll>
                    <AppBar position="fixed" color="inherit">
                        <Container maxWidth="lg">
                            <Toolbar disableGutters sx={{ py: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                                    <Box
                                        component={Link}
                                        href="/"
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            bgcolor: "primary.main",
                                            borderRadius: 2,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                            textDecoration: "none"
                                        }}
                                    >
                                        <IconBrandTabler size={24} />
                                    </Box>
                                    <Typography
                                        component={Link}
                                        href="/"
                                        variant="h6"
                                        fontWeight={700}
                                        sx={{ color: "text.primary", textDecoration: "none" }}
                                    >
                                        Crossview
                                    </Typography>
                                </Stack>

                                <Stack direction="row" spacing={2}>
                                    {auth?.user ? (
                                        <Button component={Link} href="/dashboard/" variant="contained" size="small">
                                            Dashboard
                                        </Button>
                                    ) : (
                                        <>
                                            <Button component={Link} href="/login/" color="inherit" size="small">
                                                Sign In
                                            </Button>
                                            <Button component={Link} href="/register/" variant="contained" size="small">
                                                Get Started
                                            </Button>
                                        </>
                                    )}
                                </Stack>
                            </Toolbar>
                        </Container>
                    </AppBar>
                </ElevationScroll>

                {/* Badge (if any) */}
                <Container maxWidth="lg" sx={{ pt: 12 }}>
                    {program.badge_type && (
                        <Chip
                            label={program.badge_type.toUpperCase()}
                            size="small"
                            sx={{
                                mb: 2,
                                bgcolor: program.badge_type === 'hot' ? 'error.main' : 
                                         program.badge_type === 'new' ? 'success.main' : 'warning.main',
                                color: 'white',
                                fontWeight: 700,
                            }}
                        />
                    )}
                </Container>

                {/* Main Content */}
                <Container maxWidth="lg" sx={{ pb: 8 }}>
                    <Grid container spacing={4}>
                        {/* Left Sidebar */}
                        <Grid item xs={12} md={4} order={{ xs: 2, md: 1 }}>
                            <CourseDetailsSidebar
                                program={program}
                                enrollmentStatus={enrollmentStatus}
                                enrollmentData={enrollmentData}
                                enrollmentMode={enrollmentMode}
                                isAuthenticated={!!auth?.user}
                                onShowDetails={handleShowDetails}
                                courseLevels={courseLevels}
                            />
                            <PopularCourses courses={popularPrograms} />
                        </Grid>

                        {/* Main Content Area */}
                        <Grid item xs={12} md={8} order={{ xs: 1, md: 2 }}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* Category & Instructor Row */}
                                <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <IconBook size={18} />
                                        <Typography variant="body2" color="text.secondary">
                                            Category
                                        </Typography>
                                        <Chip label={program.category || 'General'} size="small" variant="outlined" />
                                    </Stack>

                                    {instructors.length > 0 && (
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                                                {instructors[0].name.charAt(0)}
                                            </Avatar>
                                            <Typography variant="body2">
                                                <strong>Instructor</strong> {instructors[0].name}
                                            </Typography>
                                        </Stack>
                                    )}

                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <Rating value={program.rating || 0} precision={0.1} size="small" readOnly />
                                        <Typography variant="body2" fontWeight={600}>
                                            {program.rating?.toFixed(1)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            ({program.review_count} reviews)
                                        </Typography>
                                    </Stack>
                                </Stack>

                                {/* Title */}
                                <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
                                    {program.name}
                                </Typography>

                                {/* Short Description */}
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    {program.description?.substring(0, 200)}
                                    {program.description?.length > 200 && '...'}
                                </Typography>

                                {/* Featured Image */}
                                {program.thumbnail && (
                                    <Box
                                        component="img"
                                        src={program.thumbnail}
                                        alt={program.name}
                                        sx={{
                                            width: '100%',
                                            height: 350,
                                            objectFit: 'cover',
                                            borderRadius: 2,
                                            mb: 3,
                                        }}
                                    />
                                )}

                                {/* Tabs */}
                                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                    <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                                        <Tab label="Description" />
                                        <Tab label="Curriculum" />
                                        <Tab label="FAQ" />
                                        <Tab label="Notice" />
                                        <Tab label="Reviews" />
                                    </Tabs>
                                </Box>

                                {/* Description Tab */}
                                <TabPanel value={tabValue} index={0}>
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 4 }}>
                                        {program.description}
                                    </Typography>

                                    {program.what_you_learn && program.what_you_learn.length > 0 && (
                                        <Box sx={{ mt: 4 }}>
                                            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                                                What you'll learn
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {program.what_you_learn.map((item, idx) => (
                                                    <Grid item xs={12} sm={6} key={idx}>
                                                        <Stack direction="row" spacing={1}>
                                                            <IconCheck size={20} color={theme.palette.success.main} />
                                                            <Typography variant="body2">{item}</Typography>
                                                        </Stack>
                                                    </Grid>
                                                ))}
                                            </Grid>
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
                                                <CurriculumSection key={section.id} section={section} index={idx} />
                                            ))}
                                        </Stack>
                                    )}
                                </TabPanel>

                                {/* FAQ Tab */}
                                <TabPanel value={tabValue} index={2}>
                                    {!program.faq || program.faq.length === 0 ? (
                                        <Typography color="text.secondary">
                                            No FAQs available for this course.
                                        </Typography>
                                    ) : (
                                        <Stack spacing={1}>
                                            {program.faq.map((item, idx) => (
                                                <Accordion key={idx}>
                                                    <AccordionSummary expandIcon={<IconChevronDown />}>
                                                        <Typography fontWeight={600}>{item.question}</Typography>
                                                    </AccordionSummary>
                                                    <AccordionDetails>
                                                        <Typography variant="body2">{item.answer}</Typography>
                                                    </AccordionDetails>
                                                </Accordion>
                                            ))}
                                        </Stack>
                                    )}
                                </TabPanel>

                                {/* Notice Tab */}
                                <TabPanel value={tabValue} index={3}>
                                    {!program.notices || program.notices.length === 0 ? (
                                        <Typography color="text.secondary">
                                            No notices for this course.
                                        </Typography>
                                    ) : (
                                        <Stack spacing={2}>
                                            {program.notices.map((notice, idx) => (
                                                <Card key={idx} variant="outlined">
                                                    <CardContent>
                                                        <Typography variant="subtitle1" fontWeight={600}>
                                                            {notice.title}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {notice.content}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </Stack>
                                    )}
                                </TabPanel>

                                {/* Reviews Tab */}
                                <TabPanel value={tabValue} index={4}>
                                    <Typography color="text.secondary">
                                        Reviews feature coming soon.
                                    </Typography>
                                </TabPanel>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Container>

                {/* Footer */}
                <Box sx={{ bgcolor: "grey.900", color: "grey.400", py: 6 }}>
                    <Container maxWidth="lg">
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                            <IconBrandTabler size={24} color="white" />
                            <Typography variant="body2" color="white">Crossview LMS</Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                            © 2025 Crossview LMS. All rights reserved.
                        </Typography>
                    </Container>
                </Box>
            </Box>

            {/* Modals */}
            <CourseDetailsModal
                open={detailsModalOpen}
                onClose={handleCloseDetails}
                program={program}
                enrollmentData={enrollmentData}
            />
        </>
    );
}
