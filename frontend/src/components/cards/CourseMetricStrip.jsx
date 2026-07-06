import { Box, Stack, Typography } from "@mui/material";
import { IconClock, IconList } from "@tabler/icons-react";
import {
    formatMetricNumber,
    pluralizeMetric,
    resolveCourseMetrics,
} from "@/utils/courseMetrics";

function MetricTile({ Icon, value, label }) {
    return (
        <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ minWidth: 0 }}
        >
            <Icon size={15} stroke={1.8} />
            <Typography
                variant="caption"
                fontWeight={600}
                sx={{
                    fontSize: "0.72rem",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                }}
            >
                {value} {label}
            </Typography>
        </Stack>
    );
}

export default function CourseMetricStrip({ source, sx }) {
    const { lecturesCount, durationHours } = resolveCourseMetrics(source);

    return (
        <Box
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
            <MetricTile
                Icon={IconList}
                value={formatMetricNumber(lecturesCount)}
                label={pluralizeMetric(lecturesCount, "Lecture")}
            />
            <MetricTile
                Icon={IconClock}
                value={formatMetricNumber(durationHours)}
                label={pluralizeMetric(durationHours, "Hour")}
            />
        </Box>
    );
}
