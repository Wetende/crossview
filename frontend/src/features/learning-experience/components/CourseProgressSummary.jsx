import { Box, LinearProgress, Stack, Typography } from "@mui/material";

const clampPercent = (value) => Math.min(100, Math.max(0, Number(value || 0)));

const CourseProgressSummary = ({
    progressPercent = 0,
    completedCount,
    totalCount,
    label = "Course progress",
    compact = false,
}) => {
    const progress = clampPercent(progressPercent);
    const hasCounts =
        Number.isFinite(completedCount) && Number.isFinite(totalCount);
    const countLabel = hasCounts
        ? `${completedCount}/${totalCount} ${totalCount === 1 ? "item" : "items"} completed`
        : `${Math.round(progress)}% completed`;

    return (
        <Box>
            <Stack
                direction="row"
                alignItems="baseline"
                justifyContent="space-between"
                spacing={2}
                sx={{ mb: compact ? 0.75 : 1 }}
            >
                <Typography
                    variant={compact ? "caption" : "body2"}
                    color="text.secondary"
                    fontWeight={600}
                >
                    {label}
                </Typography>
                <Typography
                    variant={compact ? "caption" : "body2"}
                    color="text.primary"
                    fontWeight={800}
                >
                    {Math.round(progress)}%
                </Typography>
            </Stack>
            <LinearProgress
                aria-label={`${label}: ${Math.round(progress)} percent`}
                variant="determinate"
                value={progress}
                color={progress >= 100 ? "success" : "primary"}
                sx={{
                    height: compact ? 6 : 8,
                    borderRadius: 999,
                    bgcolor: "action.hover",
                    "& .MuiLinearProgress-bar": { borderRadius: 999 },
                }}
            />
            {!compact && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.75 }}
                >
                    {countLabel}
                </Typography>
            )}
        </Box>
    );
};

export default CourseProgressSummary;
