import { PLAYER_RADII } from "../../playerRadii";
import { useState } from "react";
import { Link, router } from "@inertiajs/react";
import {
    DashboardOutlined,
    EmojiEventsOutlined,
    FileDownloadOutlined,
    HourglassEmptyOutlined,
    QuizOutlined,
    RateReviewOutlined,
    ScheduleOutlined,
    SchoolOutlined,
    TaskAltOutlined,
    VerifiedOutlined,
    WorkspacePremiumOutlined,
} from "@mui/icons-material";
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Chip,
    Grid,
    Link as MuiLink,
    Paper,
    Rating,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

// Matches the 5000-character limit in core.views.program_review_submit.
const REVIEW_MAX_LENGTH = 5000;

const CERTIFICATE_CHIPS = {
    issued: { label: "Issued", color: "success" },
    pending: { label: "Pending", color: "warning" },
    not_offered: { label: "Not offered", color: "default" },
    ineligible: { label: "Not eligible", color: "default" },
};

const formatCompletionDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest} min`;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
};

const plural = (count, singular, pluralForm) =>
    `${count} ${count === 1 ? singular : pluralForm}`;

const IconBadge = ({ color, children }) => (
    <Box
        aria-hidden="true"
        sx={(theme) => ({
            display: "inline-grid",
            placeItems: "center",
            flexShrink: 0,
            width: 44,
            height: 44,
            borderRadius: "50%",
            color: `${color}.main`,
            bgcolor: alpha(theme.palette[color].main, 0.12),
        })}
    >
        {children}
    </Box>
);

const CertificateCard = ({ certificate }) => {
    const status = certificate?.status || "not_offered";
    const chip = CERTIFICATE_CHIPS[status] || CERTIFICATE_CHIPS.not_offered;
    const isIssued = status === "issued";

    return (
        <Paper
            component="section"
            aria-labelledby="course-certificate-title"
            variant="outlined"
            sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: PLAYER_RADII.surface, height: "100%" }}
        >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
                <IconBadge color={status === "pending" ? "warning" : "primary"}>
                    {status === "pending" ? (
                        <HourglassEmptyOutlined />
                    ) : (
                        <WorkspacePremiumOutlined />
                    )}
                </IconBadge>
                <Typography
                    id="course-certificate-title"
                    component="h2"
                    variant="h6"
                    sx={{ flexGrow: 1 }}
                >
                    Certificate
                </Typography>
                <Chip
                    size="small"
                    label={chip.label}
                    color={chip.color}
                    variant={chip.color === "default" ? "outlined" : "filled"}
                />
            </Stack>

            <Typography color="textSecondary">{certificate?.message}</Typography>

            {isIssued && (certificate.downloadUrl || certificate.verifyUrl) && (
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ alignItems: { sm: "center" }, mt: 2.5 }}
                >
                    {certificate.downloadUrl && (
                        <Button
                            component="a"
                            href={certificate.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="contained"
                            startIcon={<FileDownloadOutlined />}
                        >
                            Download certificate
                        </Button>
                    )}
                    {certificate.verifyUrl && (
                        <MuiLink
                            href={certificate.verifyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.5,
                                fontWeight: 600,
                            }}
                        >
                            <VerifiedOutlined fontSize="small" aria-hidden="true" />
                            Verify certificate
                        </MuiLink>
                    )}
                </Stack>
            )}
        </Paper>
    );
};

const ReviewCard = ({ review, returnUrl }) => {
    const [rating, setRating] = useState(0);
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (review?.hasReviewed) {
        return (
            <Paper
                component="section"
                aria-labelledby="course-review-thanks"
                variant="outlined"
                sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: PLAYER_RADII.surface, height: "100%" }}
            >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
                    <IconBadge color="success">
                        <TaskAltOutlined />
                    </IconBadge>
                    <Typography id="course-review-thanks" component="h2" variant="h6">
                        Thanks for your review
                    </Typography>
                </Stack>
                <Typography color="textSecondary">
                    Your feedback helps other learners decide what to study next.
                </Typography>
            </Paper>
        );
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!rating || submitting || !review?.submitUrl) return;
        router.post(
            review.submitUrl,
            {
                rating,
                review: text.trim(),
                next: returnUrl || window.location.pathname,
            },
            {
                preserveScroll: true,
                onStart: () => setSubmitting(true),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <Paper
            component="section"
            aria-labelledby="course-review-title"
            variant="outlined"
            sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: PLAYER_RADII.surface, height: "100%" }}
        >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
                <IconBadge color="warning">
                    <RateReviewOutlined />
                </IconBadge>
                <Typography id="course-review-title" component="h2" variant="h6">
                    Leave a review
                </Typography>
            </Stack>

            <Box component="form" noValidate onSubmit={handleSubmit}>
                <Typography
                    id="course-review-rating-label"
                    component="p"
                    variant="subtitle2"
                    sx={{ mb: 0.5 }}
                >
                    Your rating
                </Typography>
                <Box
                    role="radiogroup"
                    aria-labelledby="course-review-rating-label"
                    aria-describedby={rating ? undefined : "course-review-rating-hint"}
                    aria-required="true"
                    sx={{ mb: rating ? 2 : 0.5 }}
                >
                    <Rating
                        name="course-review-rating"
                        value={rating}
                        onChange={(_event, value) => setRating(value || 0)}
                        getLabelText={(value) => plural(value, "star", "stars")}
                        size="large"
                        sx={{
                            "& .MuiRating-iconFilled": { color: "warning.main" },
                            "& .MuiRating-iconHover": { color: "warning.dark" },
                        }}
                    />
                </Box>
                {!rating && (
                    <Typography
                        id="course-review-rating-hint"
                        variant="caption"
                        color="textSecondary"
                        sx={{ display: "block", mb: 2 }}
                    >
                        Select a rating to submit your review.
                    </Typography>
                )}

                <TextField
                    label="Your review (optional)"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                    helperText={`${text.length}/${REVIEW_MAX_LENGTH}`}
                    slotProps={{ htmlInput: { maxLength: REVIEW_MAX_LENGTH } }}
                />

                <Button
                    type="submit"
                    variant="contained"
                    disabled={!rating || submitting}
                    aria-describedby={rating ? undefined : "course-review-rating-hint"}
                    sx={{ mt: 2 }}
                >
                    Submit review
                </Button>
            </Box>
        </Paper>
    );
};

const NextCourseCard = ({ course }) => {
    const meta = [
        course.level,
        course.durationHours ? plural(course.durationHours, "hour", "hours") : null,
    ]
        .filter(Boolean)
        .join(" · ");

    return (
        <Card variant="outlined" sx={{ height: "100%", borderRadius: PLAYER_RADII.surface }}>
            <CardActionArea
                component={Link}
                href={course.url}
                sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    justifyContent: "flex-start",
                }}
            >
                {course.thumbnailUrl ? (
                    <CardMedia
                        component="img"
                        image={course.thumbnailUrl}
                        alt=""
                        loading="lazy"
                        sx={{ aspectRatio: "16 / 9", objectFit: "cover" }}
                    />
                ) : (
                    <Box
                        aria-hidden="true"
                        sx={{
                            aspectRatio: "16 / 9",
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "action.hover",
                            color: "text.disabled",
                        }}
                    >
                        <SchoolOutlined fontSize="large" />
                    </Box>
                )}
                <CardContent>
                    <Typography
                        component="h3"
                        variant="subtitle1"
                        sx={{ fontWeight: 700, lineHeight: 1.3 }}
                    >
                        {course.title}
                    </Typography>
                    {meta && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                            {meta}
                        </Typography>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

const CourseCompletionView = ({ program, completion, returnUrl = null }) => {
    const stats = completion?.stats || {};
    const review = completion?.review || {};
    const nextCourses = completion?.nextCourses || [];
    const showReview = Boolean(review.hasReviewed || review.canReview);
    const courseName = program?.name || "this course";
    const completedOn = formatCompletionDate(completion?.completedAt);

    return (
        <Box sx={{ maxWidth: 1040, mx: "auto" }}>
            <Paper
                component="section"
                aria-labelledby="course-complete-title"
                variant="outlined"
                sx={{
                    p: { xs: 3, sm: 4 },
                    mb: 2.5,
                    borderRadius: PLAYER_RADII.surface,
                    textAlign: "center",
                }}
            >
                <Box
                    aria-hidden="true"
                    sx={(theme) => ({
                        display: "inline-grid",
                        placeItems: "center",
                        width: 72,
                        height: 72,
                        mb: 2,
                        borderRadius: "50%",
                        color: "success.main",
                        bgcolor: alpha(theme.palette.success.main, 0.12),
                    })}
                >
                    <EmojiEventsOutlined sx={{ fontSize: 40 }} />
                </Box>
                <Typography component="p" variant="overline" color="primary">
                    Course complete
                </Typography>
                <Typography
                    id="course-complete-title"
                    component="h1"
                    variant="h4"
                    sx={{ mb: 1 }}
                >
                    Congratulations!
                </Typography>
                <Typography color="textSecondary" sx={{ maxWidth: 560, mx: "auto" }}>
                    {completedOn
                        ? `You completed ${courseName} on ${completedOn}.`
                        : `You completed ${courseName}.`}
                </Typography>

                <Stack
                    direction="row"
                    useFlexGap
                    sx={{ flexWrap: "wrap", justifyContent: "center", gap: 1, mt: 2.5 }}
                >
                    <Chip
                        variant="outlined"
                        icon={<TaskAltOutlined />}
                        label={`${stats.lessonsCompleted ?? 0}/${stats.totalLessons ?? 0} lessons completed`}
                    />
                    <Chip
                        variant="outlined"
                        icon={<QuizOutlined />}
                        label={`${plural(stats.quizzesPassed ?? 0, "quiz", "quizzes")} passed`}
                    />
                    {stats.timeSpentMinutes > 0 && (
                        <Chip
                            variant="outlined"
                            icon={<ScheduleOutlined />}
                            label={`${formatMinutes(stats.timeSpentMinutes)} tracked study time`}
                        />
                    )}
                </Stack>
            </Paper>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        md: showReview ? "repeat(2, minmax(0, 1fr))" : "1fr",
                    },
                    gap: 2.5,
                    mb: 3,
                }}
            >
                <CertificateCard certificate={completion?.certificate} />
                {showReview && <ReviewCard review={review} returnUrl={returnUrl} />}
            </Box>

            {nextCourses.length > 0 && (
                <Box
                    component="section"
                    aria-labelledby="continue-learning-title"
                    sx={{ mb: 3 }}
                >
                    <Typography
                        id="continue-learning-title"
                        component="h2"
                        variant="h5"
                        sx={{ mb: 1.5 }}
                    >
                        Continue learning
                    </Typography>
                    <Grid container spacing={2}>
                        {nextCourses.map((course) => (
                            <Grid key={course.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <NextCourseCard course={course} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "center", pb: 2 }}>
                <Button
                    component={Link}
                    href={completion?.dashboardUrl || "/dashboard/"}
                    variant="outlined"
                    startIcon={<DashboardOutlined />}
                >
                    Back to dashboard
                </Button>
            </Box>
        </Box>
    );
};

export default CourseCompletionView;
