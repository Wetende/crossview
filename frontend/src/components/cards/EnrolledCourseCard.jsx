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
} from "@mui/material";
import { IconClock } from "@tabler/icons-react";

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
    const isCompleted =
        enrollment.status === "completed" || enrollment.progressPercent >= 100;
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
                    component="img"
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

                {/* Duration + Progress Row */}
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <IconClock
                            size={14}
                            color={theme.palette.text.secondary}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {enrollment.durationHours || 0} hours
                        </Typography>
                    </Stack>
                    <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{ color: progressColor }}
                    >
                        {enrollment.progressPercent}% Complete
                    </Typography>
                </Stack>

                {/* Progress Bar */}
                <LinearProgress
                    variant="determinate"
                    value={enrollment.progressPercent}
                    sx={{
                        height: 6,
                        borderRadius: 3,
                        mb: 2,
                        bgcolor: theme.palette.grey[200],
                        "& .MuiLinearProgress-bar": {
                            bgcolor: progressColor,
                            borderRadius: 3,
                        },
                    }}
                />

                {/* Action Button - goes to program detail page */}
                <Button
                    component={Link}
                    href={`/programs/${enrollment.programId}/`}
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
