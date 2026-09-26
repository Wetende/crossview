/**
 * Instructor course analytics: enrollment trend, learner status, lesson
 * engagement and assessment performance for one course.
 */

import { Head, Link, router } from "@inertiajs/react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Paper,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import GradingOutlinedIcon from "@mui/icons-material/GradingOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";

import InstructorLayout from "@/layouts/InstructorLayout";
import {
    EnrollmentTrendChart,
    StatusBreakdownChart,
} from "../components/analytics/AnalyticsCharts";
import {
    AssessmentTable,
    LessonEngagementTable,
} from "../components/analytics/AnalyticsTables";
import {
    HIGH_DROP_OFF_PERCENT,
    RANGE_LABELS,
    RANGE_PHRASES,
    formatCount,
    formatPercent,
} from "../components/analytics/format";

const DEFAULT_RANGES = ["7d", "30d", "90d", "all"];

function StatCard({ label, value, caption }) {
    return (
        <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
            <Typography variant="body2" color="textSecondary">
                {label}
            </Typography>
            <Typography
                variant="h4"
                component="p"
                sx={{
                    fontWeight: 700,
                    mt: 0.5,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {value}
            </Typography>
            {caption && (
                <Typography variant="caption" color="textSecondary">
                    {caption}
                </Typography>
            )}
        </Paper>
    );
}

function Section({ title, subtitle, children }) {
    return (
        <Card sx={{ height: "100%" }}>
            <CardContent>
                <Typography variant="h6" component="h2">
                    {title}
                </Typography>
                {subtitle && (
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mb: 2 }}
                    >
                        {subtitle}
                    </Typography>
                )}
                {children}
            </CardContent>
        </Card>
    );
}

export default function Analytics({
    program,
    range = "30d",
    ranges = DEFAULT_RANGES,
    summary = {},
    statusBreakdown = [],
    enrollmentTrend = null,
    lessonEngagement = null,
    assessments = [],
    links = {},
}) {
    const analyticsUrl = `${program.url}analytics/`;
    const hasLearners = (summary.totalLearners || 0) > 0;
    const rangePhrase = RANGE_PHRASES[range] || "";

    const handleRangeChange = (_event, nextRange) => {
        if (!nextRange || nextRange === range) return;
        router.get(
            analyticsUrl,
            { range: nextRange },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const stats = [
        { label: "Total learners", value: formatCount(summary.totalLearners) },
        {
            label: "New enrollments",
            value: formatCount(summary.newLearners),
            caption: rangePhrase,
        },
        {
            label: "Active learners",
            value: formatCount(summary.activeLearners),
            caption: "Learning in the last 7 days",
        },
        {
            label: "Completed",
            value: formatCount(summary.completedLearners),
            caption: `${formatCount(summary.certificatesIssued)} certificates issued`,
        },
        {
            label: "Needs attention",
            value: formatCount(summary.needsAttention),
            caption: "Not started, stalled or inactive",
        },
        {
            label: "Average progress",
            value: formatPercent(summary.averageProgress ?? 0),
            caption: "Published lessons completed",
        },
    ];

    return (
        <InstructorLayout
            breadcrumbs={[
                { label: "My Programs", href: "/instructor/programs/" },
                { label: program.title, href: program.url },
                { label: "Analytics" },
            ]}
        >
            <Head title={`Analytics - ${program.title}`} />

            <Stack spacing={3}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{ fontWeight: 700 }}
                        >
                            Course analytics
                        </Typography>
                        <Typography color="textSecondary">
                            {program.title}
                        </Typography>
                        <Stack
                            direction="row"
                            spacing={1}
                            useFlexGap
                            sx={{ flexWrap: "wrap", mt: 1.5 }}
                        >
                            {links.roster && (
                                <Button
                                    component={Link}
                                    href={links.roster}
                                    size="small"
                                    variant="outlined"
                                    startIcon={<PeopleOutlinedIcon />}
                                >
                                    Manage learners
                                </Button>
                            )}
                            {links.gradebook && (
                                <Button
                                    component={Link}
                                    href={links.gradebook}
                                    size="small"
                                    variant="outlined"
                                    startIcon={<GradingOutlinedIcon />}
                                >
                                    Gradebook
                                </Button>
                            )}
                            {links.builder && (
                                <Button
                                    component={Link}
                                    href={links.builder}
                                    size="small"
                                    variant="outlined"
                                    startIcon={<ViewListOutlinedIcon />}
                                >
                                    Course builder
                                </Button>
                            )}
                        </Stack>
                    </Box>
                    <ToggleButtonGroup
                        value={range}
                        exclusive
                        size="small"
                        onChange={handleRangeChange}
                        aria-label="Date range"
                    >
                        {ranges.map((key) => (
                            <ToggleButton key={key} value={key}>
                                {RANGE_LABELS[key] || key}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>

                {!hasLearners ? (
                    <Paper
                        variant="outlined"
                        sx={{ p: { xs: 3, md: 5 }, textAlign: "center" }}
                    >
                        <InsightsOutlinedIcon
                            color="primary"
                            sx={{ fontSize: 40, mb: 1 }}
                        />
                        <Typography variant="h6" component="h2">
                            No learners yet
                        </Typography>
                        <Typography color="textSecondary" sx={{ mt: 1, mb: 3 }}>
                            Analytics appear once learners enroll in this
                            course. Invite or enroll learners to start seeing
                            progress.
                        </Typography>
                        {links.roster && (
                            <Button
                                component={Link}
                                href={links.roster}
                                variant="contained"
                            >
                                Manage learners
                            </Button>
                        )}
                    </Paper>
                ) : (
                    <>
                        <Grid container spacing={2}>
                            {stats.map((stat) => (
                                <Grid
                                    key={stat.label}
                                    size={{ xs: 12, sm: 6, md: 4, lg: 2 }}
                                >
                                    <StatCard {...stat} />
                                </Grid>
                            ))}
                        </Grid>

                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <Section
                                    title="New enrollments"
                                    subtitle={`${formatCount(enrollmentTrend?.total)} ${rangePhrase}`}
                                >
                                    <EnrollmentTrendChart
                                        trend={enrollmentTrend}
                                        rangeKey={range}
                                    />
                                </Section>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Section
                                    title="Learner status"
                                    subtitle="All learners, by current state"
                                >
                                    <StatusBreakdownChart
                                        breakdown={statusBreakdown}
                                    />
                                </Section>
                            </Grid>
                        </Grid>

                        <Section
                            title="Lesson engagement"
                            subtitle={`Published lessons in course order, all time. Drop-off compares learners who started a lesson with the lesson before it; above ${HIGH_DROP_OFF_PERCENT}% is highlighted.`}
                        >
                            <LessonEngagementTable
                                lessons={lessonEngagement}
                                builderUrl={links.builder}
                            />
                        </Section>

                        <Section
                            title="Assessments"
                            subtitle={`Quizzes and assignments from the gradebook, all time. ${formatCount(summary.awaitingGrading)} submissions awaiting grading.`}
                        >
                            <AssessmentTable
                                assessments={assessments}
                                gradebookUrl={links.gradebook}
                            />
                        </Section>
                    </>
                )}
            </Stack>
        </InstructorLayout>
    );
}
