import {
    Box,
    Divider,
    Stack,
    Typography,
    useTheme,
} from "@mui/material";
import {
    IconAward,
    IconBook,
    IconBuildingBank,
    IconCalendarTime,
    IconCertificate,
    IconChartBar,
    IconClipboardCheck,
    IconClock,
    IconDeviceLaptop,
} from "@tabler/icons-react";

import {
    formatCourseDuration,
    formatMetricNumber,
    pluralizeMetric,
    resolveCourseMetrics,
} from "@/utils/courseMetrics";

function CourseDetailRow({ icon, label, value }) {
    return (
        <Stack
            data-testid={`course-detail-row-${label.toLowerCase().replace(/\s+/g, "-")}`}
            direction="row"
            sx={{ minHeight: 56, minWidth: 0, gap: 1.5, alignItems: "center" }}
        >
            <Box sx={{ display: "flex", color: "text.secondary", flexShrink: 0 }}>
                {icon}
            </Box>
            <Typography
                variant="body2"
                color="textSecondary"
                sx={{ minWidth: 0, flexShrink: 0 }}
            >
                {label}
            </Typography>
            <Typography
                variant="body2"
                sx={{
                    ml: "auto",
                    pl: 2,
                    minWidth: 0,
                    textAlign: "right",
                    overflowWrap: "anywhere",
                    fontWeight: 700,
                }}
            >
                {value}
            </Typography>
        </Stack>
    );
}

function formatAccessLength(days) {
    if (days === null || days === undefined || days === "") return "Lifetime access";
    return `${formatMetricNumber(days)} ${pluralizeMetric(days, "day")}`;
}

// Optional course facts; each row is left out when the course has no value.
function buildFactRows(facts, iconColor) {
    if (!facts) return [];

    return [
        // Certificate eligibility always requires a passing course result
        // (CertificateEligibilityService.compute_eligibility).
        facts.certificateOnCompletion && {
            icon: <IconCertificate size={20} color={iconColor} />,
            label: "Certificate",
            value: "On completion (pass required)",
        },
        facts.examBody && {
            icon: <IconBuildingBank size={20} color={iconColor} />,
            label: "Exam body",
            value: facts.examBody,
        },
        facts.awardType && {
            icon: <IconAward size={20} color={iconColor} />,
            label: "Award",
            value: facts.awardType,
        },
        facts.deliveryModeLabel && {
            icon: <IconDeviceLaptop size={20} color={iconColor} />,
            label: "Delivery",
            value: facts.deliveryModeLabel,
        },
        {
            icon: <IconCalendarTime size={20} color={iconColor} />,
            label: "Access",
            value: formatAccessLength(facts.accessDurationDays),
        },
    ].filter(Boolean);
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
        ...buildFactRows(program?.facts, iconColor),
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
            <Typography component="h2" variant="subtitle1" sx={{ py: 1, fontWeight: 700 }}>
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
