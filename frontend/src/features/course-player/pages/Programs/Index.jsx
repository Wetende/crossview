import { Head, Link } from "@inertiajs/react";
import { Box, Grid, Stack, Typography, Button } from "@mui/material";
import { IconSchool } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/layouts/DashboardLayout";
import { EnrolledCourseCard } from "@/components/cards";
import { ReportToolbar } from "@/features/reports";

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

/**
 * Program List - All enrolled programs with filtering
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export default function ProgramList({ enrollments = [] }) {
    const [courseFilter, setCourseFilter] = useState("all");
    const progressReportStatus =
        courseFilter === "completed"
            ? "completed"
            : courseFilter === "in_progress"
              ? "active"
              : "";

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = (params.get("status") || "").trim().toLowerCase();
        if (status === "completed") {
            setCourseFilter("completed");
            return;
        }
        if (status === "failed") {
            setCourseFilter("failed");
            return;
        }
        if (status === "active" || status === "in_progress") {
            setCourseFilter("in_progress");
            return;
        }
        setCourseFilter("all");
    }, []);

    // Filter enrollments on frontend so we have accurate counts for all categories
    const filteredEnrollments = enrollments.filter((enrollment) => {
        if (courseFilter === "all") return true;
        if (courseFilter === "completed")
            return enrollment.progressPercent >= 100;
        if (courseFilter === "in_progress")
            return (
                enrollment.progressPercent > 0 &&
                enrollment.progressPercent < 100
            );
        if (courseFilter === "failed") return enrollment.status === "failed";
        return true;
    });

    return (
        <DashboardLayout role="student">
            <Head title="Enrolled Courses" />

            {/* Header & Status Filter */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: 1,
                    borderColor: "divider",
                    mb: 4,
                    overflowX: "auto",
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        color: "text.primary",
                        pb: 1,
                        whiteSpace: "nowrap",
                        pr: 4,
                    }}
                >
                    Enrolled courses
                </Typography>
                <Stack
                    direction="row"
                    spacing={3}
                    sx={{ minWidth: "max-content" }}
                >
                    <ReportToolbar
                        scope="student"
                        reportId="student.progress"
                        queryParams={{ status: progressReportStatus }}
                        printLabel="Progress"
                    />
                    {[
                        { id: "all", label: "All", count: enrollments.length },
                        {
                            id: "completed",
                            label: "Completed",
                            count: enrollments.filter(
                                (e) => e.progressPercent >= 100,
                            ).length,
                        },
                        {
                            id: "in_progress",
                            label: "In progress",
                            count: enrollments.filter(
                                (e) =>
                                    e.progressPercent > 0 &&
                                    e.progressPercent < 100,
                            ).length,
                        },
                        {
                            id: "failed",
                            label: "Failed",
                            count: enrollments.filter(
                                (e) => e.status === "failed",
                            ).length,
                        },
                    ].map((filter) => {
                        const isActive = courseFilter === filter.id;
                        return (
                            <Box
                                key={filter.id}
                                onClick={() => setCourseFilter(filter.id)}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    cursor: "pointer",
                                    pb: 1.5,
                                    mb: "-1px",
                                    borderBottom: 2,
                                    borderColor: isActive
                                        ? "primary.main"
                                        : "transparent",
                                    color: isActive
                                        ? "primary.main"
                                        : "text.secondary",
                                    fontWeight: isActive ? 600 : 500,
                                    "&:hover": {
                                        color: "primary.main",
                                    },
                                }}
                            >
                                {filter.label}
                                <Box
                                    sx={{
                                        bgcolor: isActive
                                            ? "primary.main"
                                            : "grey.200",
                                        color: isActive
                                            ? "white"
                                            : "text.secondary",
                                        px: 1,
                                        py: 0.25,
                                        borderRadius: 4,
                                        fontSize: "0.75rem",
                                        fontWeight: 700,
                                    }}
                                >
                                    {filter.count}
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>

            {filteredEnrollments.length === 0 ? (
                <EmptyState hasFilter={courseFilter !== "all"} />
            ) : (
                <Grid container spacing={3}>
                    {filteredEnrollments.map((enrollment, index) => (
                        <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                            lg={3}
                            key={enrollment.id}
                        >
                            <motion.div
                                {...fadeInUp}
                                transition={{
                                    ...fadeInUp.transition,
                                    delay: index * 0.05,
                                }}
                            >
                                <EnrolledCourseCard enrollment={enrollment} />
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            )}
        </DashboardLayout>
    );
}

function EmptyState({ hasFilter }) {
    return (
        <Box sx={{ textAlign: "center", py: 8 }}>
            <IconSchool size={64} stroke={1.5} style={{ opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                {hasFilter ? "No Programs Found" : "No Enrollments Yet"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {hasFilter
                    ? "Try changing the filter to see more programs."
                    : "You haven't enrolled in any programs yet."}
            </Typography>
            {!hasFilter && (
                <Button component={Link} href="/programs/" variant="contained">
                    Browse Courses
                </Button>
            )}
        </Box>
    );
}
