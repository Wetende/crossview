import { useEffect, useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { IconSchool } from "@tabler/icons-react";

import DashboardLayout from "@/layouts/DashboardLayout";
import { CurrentLearningCard } from "@/features/learning-experience/components";
import { sortLearningPriority } from "@/features/learning-experience/learningSelection";
import { ReportToolbar } from "@/features/reports";

const FILTERS = [
    { id: "all", label: "All courses" },
    { id: "in_progress", label: "In progress" },
    { id: "not_started", label: "Not started" },
    { id: "completed", label: "Completed" },
    { id: "failed", label: "Needs attention" },
];

const matchesFilter = (enrollment, filter) => {
    const progress = Number(enrollment.progressPercent || 0);
    if (filter === "all") return true;
    if (filter === "completed") return progress >= 100;
    if (filter === "in_progress") return progress > 0 && progress < 100;
    if (filter === "not_started") return progress === 0;
    if (filter === "failed") {
        return ["failed", "stalled", "inactive"].includes(
            enrollment.learnerState || enrollment.status,
        );
    }
    return true;
};

const queryFilter = () => {
    const status = new URLSearchParams(window.location.search)
        .get("status")
        ?.trim()
        .toLowerCase();
    if (status === "active") return "in_progress";
    return FILTERS.some((filter) => filter.id === status) ? status : "all";
};

const EmptyState = ({ hasFilter }) => (
    <Box sx={{ textAlign: "center", py: 8 }}>
        <IconSchool
            size={64}
            stroke={1.5}
            aria-hidden="true"
            style={{ opacity: 0.5 }}
        />
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {hasFilter ? "No matching courses" : "No enrollments yet"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {hasFilter
                ? "Choose a different status to see more courses."
                : "Your enrolled courses will appear here."}
        </Typography>
        {!hasFilter && (
            <Button component={Link} href="/programs/" variant="contained">
                Browse courses
            </Button>
        )}
    </Box>
);

const ProgramList = ({ enrollments = [] }) => {
    const [courseFilter, setCourseFilter] = useState("all");

    useEffect(() => setCourseFilter(queryFilter()), []);

    const orderedEnrollments = useMemo(
        () => sortLearningPriority(enrollments),
        [enrollments],
    );
    const filteredEnrollments = orderedEnrollments.filter((enrollment) =>
        matchesFilter(enrollment, courseFilter),
    );
    const featuredEnrollment = filteredEnrollments[0] || null;
    const remainingEnrollments = featuredEnrollment
        ? filteredEnrollments.slice(1)
        : [];
    const reportStatus =
        courseFilter === "in_progress" ? "active" : courseFilter;

    return (
        <DashboardLayout role="student">
            <Head title="My courses" />

            <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ md: "flex-end" }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography component="h1" variant="h4" sx={{ mb: 0.5 }}>
                        My courses
                    </Typography>
                    <Typography color="text.secondary">
                        Continue learning, review progress, and revisit
                        completed work.
                    </Typography>
                </Box>
                <ReportToolbar
                    scope="student"
                    reportId="student.progress"
                    queryParams={{
                        status: reportStatus === "all" ? "" : reportStatus,
                    }}
                    printLabel="Progress"
                />
            </Stack>

            <Box
                component="nav"
                aria-label="Filter courses by status"
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 3,
                }}
            >
                {FILTERS.map((filter) => {
                    const count = enrollments.filter((enrollment) =>
                        matchesFilter(enrollment, filter.id),
                    ).length;
                    const selected = courseFilter === filter.id;
                    return (
                        <Button
                            key={filter.id}
                            type="button"
                            aria-pressed={selected}
                            variant={selected ? "contained" : "outlined"}
                            size="small"
                            onClick={() => setCourseFilter(filter.id)}
                            sx={{ borderRadius: 999 }}
                        >
                            {filter.label} ({count})
                        </Button>
                    );
                })}
            </Box>

            {filteredEnrollments.length === 0 ? (
                <EmptyState hasFilter={courseFilter !== "all"} />
            ) : (
                <Stack spacing={3}>
                    <Box
                        component="section"
                        aria-labelledby="course-focus-title"
                    >
                        <Typography
                            id="course-focus-title"
                            component="h2"
                            variant="h5"
                            sx={{ mb: 1.5 }}
                        >
                            {courseFilter === "completed"
                                ? "Most recent course"
                                : "Your learning focus"}
                        </Typography>
                        <CurrentLearningCard
                            featured
                            enrollment={featuredEnrollment}
                        />
                    </Box>

                    {remainingEnrollments.length > 0 && (
                        <Box
                            component="section"
                            aria-labelledby="more-courses-title"
                        >
                            <Typography
                                id="more-courses-title"
                                component="h2"
                                variant="h5"
                                sx={{ mb: 1.5 }}
                            >
                                More courses
                            </Typography>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        md: "repeat(2, minmax(0, 1fr))",
                                    },
                                    gap: 2,
                                }}
                            >
                                {remainingEnrollments.map((enrollment) => (
                                    <CurrentLearningCard
                                        key={enrollment.id}
                                        enrollment={enrollment}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </Stack>
            )}
        </DashboardLayout>
    );
};

export default ProgramList;
