import { Box, Stack, Typography } from "@mui/material";
import { IconChartBar, IconClock, IconList } from "@tabler/icons-react";
import {
    formatMetricNumber,
    pluralizeMetric,
    resolveCourseMetricAvailability,
    resolveCourseMetrics,
} from "@/utils/courseMetrics";

const metricTextSx = {
    fontWeight: 600,
    fontSize: "0.72rem",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
};

function MetricTile({ Icon, value, label }) {
    return (
        <Stack
            direction="row"
            spacing={0.5}
            sx={{ alignItems: "center", minWidth: 0 }}
        >
            <Icon size={15} stroke={1.8} />
            <Typography variant="caption" sx={metricTextSx}>
                {value} {label}
            </Typography>
        </Stack>
    );
}

// Free-text levels can be long, so this tile shrinks and truncates.
function LevelTile({ level }) {
    return (
        <Stack
            direction="row"
            spacing={0.5}
            sx={{ alignItems: "center", minWidth: 0, flexShrink: 1 }}
        >
            <IconChartBar size={15} stroke={1.8} style={{ flexShrink: 0 }} />
            <Typography
                variant="caption"
                title={level}
                sx={{ ...metricTextSx, overflow: "hidden", textOverflow: "ellipsis" }}
            >
                {level}
            </Typography>
        </Stack>
    );
}

export default function CourseMetricStrip({
    source,
    sx,
    level = "",
    hideMissing = false,
}) {
    const { lecturesCount, durationHours } = resolveCourseMetrics(source);
    const { hasLectures, hasDuration } = hideMissing
        ? resolveCourseMetricAvailability(source)
        : { hasLectures: true, hasDuration: true };
    const levelLabel = String(level || "").trim();

    if (!levelLabel && !hasLectures && !hasDuration) {
        return null;
    }

    return (
        <Box
            data-testid="course-metric-strip"
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                width: "100%",
                border: 1,
                borderColor: "divider",
                bgcolor: "grey.50",
                borderRadius: 2,
                px: 2,
                py: 0.75,
                color: "text.secondary",
                ...sx,
            }}
        >
            {levelLabel ? <LevelTile level={levelLabel} /> : null}
            {hasLectures ? (
                <MetricTile
                    Icon={IconList}
                    value={formatMetricNumber(lecturesCount)}
                    label={pluralizeMetric(lecturesCount, "Lecture")}
                />
            ) : null}
            {hasDuration ? (
                <MetricTile
                    Icon={IconClock}
                    value={formatMetricNumber(durationHours)}
                    label={pluralizeMetric(durationHours, "Hour")}
                />
            ) : null}
        </Box>
    );
}
