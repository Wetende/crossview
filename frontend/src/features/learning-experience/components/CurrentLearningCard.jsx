import { Link } from "@inertiajs/react";
import {
    ArrowForward,
    EventOutlined,
    PlayArrow,
    SchoolOutlined,
} from "@mui/icons-material";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Stack,
    Typography,
} from "@mui/material";

import CourseProgressSummary from "./CourseProgressSummary";
import LearningStatusBadge from "./LearningStatusBadge";

const formatDeadline = (deadline) => {
    if (!deadline?.dueAt) return null;
    return new Date(deadline.dueAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const CurrentLearningCard = ({ enrollment, featured = false }) => {
    const progress = Number(enrollment?.progressPercent || 0);
    const completed = progress >= 100;
    const currentPosition = enrollment?.currentPosition;
    const deadline = enrollment?.nextDeadline;
    const resumeUrl = `/student/programs/${enrollment.programId}/resume/`;

    return (
        <Card
            variant="outlined"
            sx={{
                display: "grid",
                gridTemplateColumns: featured
                    ? { xs: "1fr", md: "minmax(220px, 0.8fr) minmax(0, 1.2fr)" }
                    : "1fr",
                overflow: "hidden",
                borderRadius: 2.5,
                borderColor: "divider",
                boxShadow: featured
                    ? "0 14px 36px rgba(15, 23, 42, 0.08)"
                    : "none",
                height: "100%",
            }}
        >
            <Box sx={{ position: "relative", minHeight: featured ? 220 : 150 }}>
                <CardMedia
                    component="img"
                    image={
                        enrollment.thumbnail ||
                        "/static/images/course-placeholder.svg"
                    }
                    alt=""
                    sx={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(180deg, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.48))",
                    }}
                />
                <Box sx={{ position: "absolute", left: 16, bottom: 14 }}>
                    <LearningStatusBadge
                        status={enrollment.learnerState || enrollment.status}
                        progressPercent={progress}
                    />
                </Box>
            </Box>

            <CardContent
                sx={{
                    p: { xs: 2.25, sm: 3 },
                    "&:last-child": { pb: { xs: 2.25, sm: 3 } },
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                <Box>
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                        sx={{ mb: 0.75 }}
                    >
                        <SchoolOutlined color="primary" sx={{ fontSize: 18 }} />
                        <Typography variant="overline" color="text.secondary">
                            {enrollment.category || "Current course"}
                        </Typography>
                    </Stack>
                    <Typography
                        component="h2"
                        variant={featured ? "h4" : "h6"}
                        sx={{ overflowWrap: "anywhere" }}
                    >
                        {enrollment.programName}
                    </Typography>
                    {currentPosition?.title && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.75 }}
                        >
                            Continue with {currentPosition.title}
                        </Typography>
                    )}
                </Box>

                <CourseProgressSummary
                    progressPercent={progress}
                    completedCount={enrollment.completedNodes}
                    totalCount={enrollment.totalNodes}
                    compact={!featured}
                />

                {deadline && (
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                        <EventOutlined
                            color="warning"
                            sx={{ fontSize: 19, mt: 0.15 }}
                        />
                        <Box>
                            <Typography variant="body2" fontWeight={700}>
                                {deadline.title}
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {formatDeadline(deadline)}
                            </Typography>
                        </Box>
                    </Stack>
                )}

                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ mt: "auto" }}
                >
                    <Button
                        component={Link}
                        href={resumeUrl}
                        variant="contained"
                        startIcon={<PlayArrow />}
                        size={featured ? "large" : "medium"}
                    >
                        {completed
                            ? "Review course"
                            : progress > 0
                              ? "Resume learning"
                              : "Start learning"}
                    </Button>
                    {featured && (
                        <Button
                            component={Link}
                            href={`/student/programs/${enrollment.programId}/`}
                            variant="text"
                            endIcon={<ArrowForward />}
                        >
                            Course overview
                        </Button>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default CurrentLearningCard;
