/**
 * EnrolledCourseCard - Student dashboard course card
 * MasterStudy LMS inspired design for enrolled courses
 * Uses theme colors (Chameleon engine - no hardcoded colors)
 */

import { Link } from "@inertiajs/react";
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Button,
    Chip,
    LinearProgress,
    Stack,
    useTheme,
    Rating,
} from "@mui/material";
import CourseMetricStrip from "./CourseMetricStrip";

// Badge colors using theme palette
const getBadgeColor = (type, theme) => {
    switch (type) {
        case "hot":
            return theme.palette.error.main;
        case "new":
            return theme.palette.success.main;
        case "special":
            return theme.palette.warning.main;
        default:
            return theme.palette.primary.main;
    }
};

export default function EnrolledCourseCard({ enrollment }) {
    const theme = useTheme();
    const isCompleted = Number(enrollment.progressPercent || 0) >= 100;
    const progressColor = isCompleted
        ? theme.palette.success.main
        : theme.palette.primary.main;

    // Format enrollment date
    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <Card
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
                overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[8],
                },
            }}
        >
            {/* Thumbnail with optional badge */}
            <Box sx={{ position: "relative" }}>
                <CardMedia
                    component="img" loading="lazy"
                    height="140"
                    image={
                        enrollment.thumbnail ||
                        "/static/images/course-placeholder.svg"
                    }
                    alt={enrollment.programName}
                    sx={{ objectFit: "cover" }}
                />
                {enrollment.badgeType && (
                    <Chip
                        label={enrollment.badgeType.toUpperCase()}
                        size="small"
                        sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            bgcolor: getBadgeColor(enrollment.badgeType, theme),
                            color: "white",
                            fontWeight: 700,
                            fontSize: "0.65rem",
                            height: 22,
                        }}
                    />
                )}
            </Box>

            <CardContent
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    p: 2,
                }}
            >
                {/* Category */}
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                >
                    {enrollment.category || "General"}
                </Typography>

                {/* Title */}
                <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        minHeight: 48,
                    }}
                >
                    {enrollment.programName}
                </Typography>

                {/* Progress Bar & Text */}
                <Box sx={{ mb: 2 }}>
                    <LinearProgress
                        variant="determinate"
                        value={enrollment.progressPercent}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            mb: 1,
                            bgcolor: theme.palette.grey[200],
                            "& .MuiLinearProgress-bar": {
                                bgcolor: progressColor,
                                borderRadius: 3,
                            },
                        }}
                    />
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        Progress: {enrollment.progressPercent}%
                    </Typography>
                </Box>

                <CourseMetricStrip
                    source={enrollment}
                    sx={{
                        mb: 2,
                        bgcolor: theme.palette.grey[100],
                        borderColor: "transparent",
                    }}
                />

                {/* Star Rating */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Rating
                        value={enrollment.ratingAverage || 0}
                        precision={0.1}
                        readOnly
                        size="small"
                        sx={{ color: "#FFB300" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {enrollment.ratingAverage || "0.0"}
                    </Typography>
                </Stack>

                {/* Action Button - goes directly to student course player */}
                <Stack spacing={1}>
                    <Button
                        component={Link}
                        href={`/student/programs/${enrollment.programId}/resume/`}
                        variant="contained"
                        fullWidth
                        sx={{
                            bgcolor: isCompleted
                                ? theme.palette.success.main
                                : theme.palette.primary.main,
                            color: "white",
                            fontWeight: 700,
                            py: 1,
                            "&:hover": {
                                bgcolor: isCompleted
                                    ? theme.palette.success.dark
                                    : theme.palette.primary.dark,
                            },
                        }}
                    >
                        {isCompleted ? "COMPLETED" : "CONTINUE"}
                    </Button>
                </Stack>

                {/* Started Date */}
                {enrollment.enrolledAt && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1.5, textAlign: "center" }}
                    >
                        Started {formatDate(enrollment.enrolledAt)}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}
