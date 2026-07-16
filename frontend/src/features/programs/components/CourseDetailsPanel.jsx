import {
    Box,
    Divider,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import {
    IconBook,
    IconChartBar,
    IconClipboardCheck,
    IconClock,
} from "@tabler/icons-react";

import {
    formatCourseDuration,
    formatMetricNumber,
    resolveCourseMetrics,
} from "@/utils/courseMetrics";

function CourseDetailRow({ icon, label, value }) {
    return (
        <Stack
            data-testid={`course-detail-row-${label.toLowerCase()}`}
            direction="row"
            alignItems="center"
            sx={{ minHeight: 56, minWidth: 0, gap: 1.5 }}
        >
            <Box sx={{ display: "flex", color: "text.secondary", flexShrink: 0 }}>
                {icon}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0 }}>
                {label}
            </Typography>
            <Typography
                variant="body2"
                fontWeight={700}
                sx={{ ml: "auto", pl: 2, textAlign: "right", flexShrink: 0 }}
            >
                {value}
            </Typography>
        </Stack>
    );
}

export default function CourseDetailsPanel({ program }) {
    const theme = useTheme();
    const metrics = resolveCourseMetrics(program);
    const iconColor = theme.palette.text.secondary;
    const rows = [
        {
            icon: <IconClock size={20} color={iconColor} />,
            label: "Duration",
            value: formatCourseDuration(metrics.durationHours),
        },
        {
            icon: <IconBook size={20} color={iconColor} />,
            label: "Lessons",
            value: formatMetricNumber(metrics.lessonsCount),
        },
        {
            icon: <IconClipboardCheck size={20} color={iconColor} />,
            label: "Assessments",
            value: formatMetricNumber(metrics.assessmentsCount),
        },
        {
            icon: <IconChartBar size={20} color={iconColor} />,
            label: "Level",
            value: program?.level || "No level",
        },
    ];

    return (
        <Box
            data-testid="course-details-panel"
            sx={{
                mt: 2,
                px: { xs: 2, sm: 2.5 },
                py: 1.5,
                bgcolor: "grey.100",
                borderRadius: 1.5,
            }}
        >
            <Typography component="h2" variant="subtitle1" fontWeight={700} sx={{ py: 1 }}>
                Course details
            </Typography>
            <Divider />
            {rows.map((row, index) => (
                <Box key={row.label}>
                    <CourseDetailRow {...row} />
                    {index < rows.length - 1 && <Divider />}
                </Box>
            ))}
        </Box>
    );
}
