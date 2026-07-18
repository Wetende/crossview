/**
 * Unified Dashboard Page
 * Shows different content and menus based on user role
 * Roles: student, instructor, admin
 */

import { Head, Link, usePage } from "@inertiajs/react";
import {
    Box,
    Stack,
    Typography,
    Paper,
    Grid,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    Chip,
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";

// Icons
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BusinessIcon from "@mui/icons-material/Business";
import SettingsIcon from "@mui/icons-material/Settings";
import GradingIcon from "@mui/icons-material/Grading";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GroupAddIcon from "@mui/icons-material/GroupAdd";

import HowToRegIcon from "@mui/icons-material/HowToReg";

import DashboardLayout from "@/layouts/DashboardLayout";
import LearningMomentum from "@/components/LearningMomentum";

// =============================================================================
// Shared Components
// =============================================================================

function StatCard({ title, value, icon: Icon, color = "primary" }) {
    return (
        <Paper sx={{ p: 3, height: "100%" }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: `${color}.light`,
                        color: `${color}.main`,
                    }}
                >
                    <Icon />
                </Box>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {title}
                    </Typography>
                </Box>
            </Stack>
        </Paper>
    );
}

// =============================================================================
// Student Dashboard Content
// =============================================================================

function StudentContent({ enrollments, assignments, quizzes, upcomingDeadlines }) {
    const enrollmentList = enrollments || [];
    const assignmentsList = assignments || [];
    const quizzesList = quizzes || [];
    const deadlineList = upcomingDeadlines || [];

    const activeEnrollments = enrollmentList.filter(
        (e) => e.progressPercent < 100,
    );
    const completedEnrollments = enrollmentList.filter(
        (e) => e.progressPercent >= 100,
    );
    const overallProgress =
        enrollmentList.length > 0
            ? Math.round(
                  enrollmentList.reduce(
                      (acc, curr) => acc + curr.progressPercent,
                      0,
                  ) / enrollmentList.length,
              )
            : 0;

    const totalAssignments = assignmentsList.length;
    const gradedAssignments = assignmentsList.filter(
        (a) => a.submissionStatus === "graded",
    ).length;
    const inReviewAssignments = assignmentsList.filter(
        (a) => a.submissionStatus === "submitted",
    ).length;
    const remainingAssignments = Math.max(
        totalAssignments - gradedAssignments - inReviewAssignments,
        0,
    );

    const upcomingQuizzes = quizzesList.filter((q) => !q.passed).length; // Placeholder logic for "Upcoming"
    const courseProgressDistribution = [...enrollmentList]
        .sort((a, b) => b.progressPercent - a.progressPercent)
        .slice(0, 6);

    return (
        <Stack spacing={3} sx={{ width: "100%" }}>
            <Box sx={{ mb: 2 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    fontWeight={700}
                    gutterBottom
                >
                    Student Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Welcome to your learning space. Here is your progress
                    overview.
                </Typography>
            </Box>

            {deadlineList.length > 0 && (
                <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="h6" gutterBottom>
                        Upcoming deadlines
                    </Typography>
                    <Stack spacing={1}>
                        {deadlineList.slice(0, 5).map((deadline) => (
                            <Stack
                                key={`${deadline.type}-${deadline.id}`}
                                direction={{ xs: "column", sm: "row" }}
                                justifyContent="space-between"
                                spacing={1}
                            >
                                <Typography variant="body2">
                                    {deadline.title} · {deadline.programName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {new Date(deadline.dueAt).toLocaleString()}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Paper>
            )}

            <LearningMomentum enrollments={enrollmentList} />

            {/* Top Row: 4 Summary Cards */}
            <Grid container spacing={3}>
                {/* Enrolled Courses */}
                <Grid item xs={12} sm={6} md={3}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow: "none",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                mb: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 1,
                                        bgcolor: "#f1f5f9",
                                        borderRadius: 2,
                                        display: "flex",
                                    }}
                                >
                                    <SchoolIcon
                                        sx={{
                                            fontSize: 20,
                                            color: "text.secondary",
                                        }}
                                    />
                                </Box>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    fontWeight={500}
                                >
                                    Enrolled Courses
                                </Typography>
                            </Box>
                            <Chip
                                label="• Active"
                                size="small"
                                sx={{
                                    bgcolor: "#dcfce7",
                                    color: "#16a34a",
                                    fontWeight: 600,
                                    fontSize: "0.65rem",
                                }}
                            />
                        </Box>
                        <Box>
                            <Typography
                                variant="h3"
                                fontWeight={700}
                                sx={{ mb: 1 }}
                            >
                                {enrollmentList.length}
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mb: 0.5,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    fontWeight={600}
                                    color="text.primary"
                                >
                                    Progress
                                </Typography>
                                <Typography
                                    variant="caption"
                                    fontWeight={600}
                                    color="text.primary"
                                >
                                    {overallProgress}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={overallProgress}
                                sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: "#e2e8f0",
                                    "& .MuiLinearProgress-bar": {
                                        bgcolor: "#3b82f6",
                                        borderRadius: 3,
                                    },
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* Total Assignments */}
                <Grid item xs={12} sm={6} md={3}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow: "none",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    p: 1,
                                    bgcolor: "#f1f5f9",
                                    borderRadius: 2,
                                    display: "flex",
                                }}
                            >
                                <AssignmentIcon
                                    sx={{
                                        fontSize: 20,
                                        color: "text.secondary",
                                    }}
                                />
                            </Box>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                fontWeight={500}
                            >
                                Total Assignments
                            </Typography>
                        </Box>
                        <Box>
                            <Typography
                                variant="h3"
                                fontWeight={700}
                                sx={{ mb: 2 }}
                            >
                                {totalAssignments}
                            </Typography>
                            <Button
                                component={Link}
                                href="/student/assignments/"
                                variant="text"
                                sx={{
                                    p: 0,
                                    color: "text.secondary",
                                    textTransform: "none",
                                    fontWeight: 500,
                                    "&:hover": {
                                        bgcolor: "transparent",
                                        color: "primary.main",
                                    },
                                }}
                                endIcon={<Typography>→</Typography>}
                            >
                                View All
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Completed Courses */}
                <Grid item xs={12} sm={6} md={3}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow: "none",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    p: 1,
                                    bgcolor: "#f1f5f9",
                                    borderRadius: 2,
                                    display: "flex",
                                }}
                            >
                                <CheckCircleIcon
                                    sx={{
                                        fontSize: 20,
                                        color: "text.secondary",
                                    }}
                                />
                            </Box>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                fontWeight={500}
                            >
                                Completed Courses
                            </Typography>
                        </Box>
                        <Box>
                            <Typography
                                variant="h3"
                                fontWeight={700}
                                sx={{ mb: 2 }}
                            >
                                {completedEnrollments.length}
                            </Typography>
                            <Button
                                component={Link}
                                href="/student/programs/?status=completed"
                                variant="text"
                                sx={{
                                    p: 0,
                                    color: "text.secondary",
                                    textTransform: "none",
                                    fontWeight: 500,
                                    "&:hover": {
                                        bgcolor: "transparent",
                                        color: "primary.main",
                                    },
                                }}
                                endIcon={<Typography>→</Typography>}
                            >
                                View Courses
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Upcoming Quiz */}
                <Grid item xs={12} sm={6} md={3}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow: "none",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    p: 1,
                                    bgcolor: "#f1f5f9",
                                    borderRadius: 2,
                                    display: "flex",
                                }}
                            >
                                <SchoolIcon
                                    sx={{
                                        fontSize: 20,
                                        color: "text.secondary",
                                    }}
                                />
                            </Box>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                fontWeight={500}
                            >
                                Upcoming Quiz
                            </Typography>
                        </Box>
                        <Box>
                            <Typography
                                variant="h3"
                                fontWeight={700}
                                sx={{ mb: 2 }}
                            >
                                {upcomingQuizzes}{" "}
                                <Typography
                                    component="span"
                                    variant="h5"
                                    color="text.secondary"
                                    fontWeight={600}
                                >
                                    Total
                                </Typography>
                            </Typography>
                            <Button
                                component={Link}
                                href="/student/quizzes/"
                                variant="text"
                                sx={{
                                    p: 0,
                                    color: "text.secondary",
                                    textTransform: "none",
                                    fontWeight: 500,
                                    "&:hover": {
                                        bgcolor: "transparent",
                                        color: "primary.main",
                                    },
                                }}
                                endIcon={<Typography>→</Typography>}
                            >
                                View Schedule
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Middle Row */}
            <Grid container spacing={3}>
                {/* Course Progress Distribution */}
                <Grid item xs={12} md={7}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow: "none",
                            height: "100%",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 3,
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight={700}>
                                Course Progress Distribution
                            </Typography>
                            <Chip
                                label={`${courseProgressDistribution.length} Courses`}
                                size="small"
                                sx={{
                                    bgcolor: "#f1f5f9",
                                    color: "text.secondary",
                                    fontWeight: 600,
                                }}
                            />
                        </Box>

                        <Stack spacing={2.5}>
                            {courseProgressDistribution.map((enrollment) => (
                                <Box key={enrollment.id}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{ mb: 1 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            sx={{ pr: 2 }}
                                        >
                                            {enrollment.programName}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            fontWeight={700}
                                        >
                                            {Math.round(
                                                enrollment.progressPercent,
                                            )}
                                            %
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(
                                            Math.max(
                                                enrollment.progressPercent,
                                                0,
                                            ),
                                            100,
                                        )}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            bgcolor: "#e2e8f0",
                                            "& .MuiLinearProgress-bar": {
                                                bgcolor: "#3b82f6",
                                                borderRadius: 4,
                                            },
                                        }}
                                    />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            mt: 0.75,
                                            display: "inline-block",
                                        }}
                                    >
                                        {enrollment.durationHours} Hours Total
                                    </Typography>
                                </Box>
                            ))}
                            {courseProgressDistribution.length === 0 && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ textAlign: "center", py: 3 }}
                                >
                                    No enrolled courses yet.
                                </Typography>
                            )}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Right Column: Current Courses & Assignment Breakdown */}
                <Grid item xs={12} md={5}>
                    <Stack spacing={3} sx={{ height: "100%" }}>
                        {/* Current Courses */}
                        <Paper
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: "none",
                                flex: 1,
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 3,
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={700}
                                >
                                    Current Courses
                                </Typography>
                                <Chip
                                    label={`• ${activeEnrollments.length} Active`}
                                    size="small"
                                    sx={{
                                        bgcolor: "transparent",
                                        color: "text.secondary",
                                        fontWeight: 500,
                                        border: "none",
                                    }}
                                />
                            </Box>

                            <Stack spacing={2}>
                                {activeEnrollments
                                    .slice(0, 3)
                                    .map((enrollment, index) => (
                                        <Box
                                            key={enrollment.id}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 2,
                                                    bgcolor:
                                                        index % 2 === 0
                                                            ? "#dcfce7"
                                                            : "#f1f5f9",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color:
                                                        index % 2 === 0
                                                            ? "#166534"
                                                            : "#475569",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {enrollment.programName
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight={700}
                                                    sx={{
                                                        display: "-webkit-box",
                                                        overflow: "hidden",
                                                        WebkitBoxOrient:
                                                            "vertical",
                                                        WebkitLineClamp: 1,
                                                    }}
                                                >
                                                    {enrollment.programName}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {enrollment.durationHours}{" "}
                                                    Hours Total
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: "right" }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight={700}
                                                    color={
                                                        index % 2 === 0
                                                            ? "success.main"
                                                            : "warning.main"
                                                    }
                                                >
                                                    ⚡{" "}
                                                    {enrollment.progressPercent}
                                                    %
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                {activeEnrollments.length === 0 && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ textAlign: "center", py: 2 }}
                                    >
                                        No active courses right now.
                                    </Typography>
                                )}
                            </Stack>
                        </Paper>

                        {/* Assignment Breakdown */}
                        <Paper
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "divider",
                                boxShadow: "none",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 3,
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={700}
                                >
                                    Assignment Breakdown
                                </Typography>
                                <AssignmentIcon
                                    sx={{
                                        color: "text.secondary",
                                        fontSize: 20,
                                    }}
                                />
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    height: 24,
                                    borderRadius: 1.5,
                                    overflow: "hidden",
                                    mb: 2,
                                }}
                            >
                                {totalAssignments > 0 ? (
                                    <>
                                        <Box
                                            sx={{
                                                width: `${(gradedAssignments / totalAssignments) * 100}%`,
                                                bgcolor: "#34d399",
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                width: `${(inReviewAssignments / totalAssignments) * 100}%`,
                                                bgcolor: "#8b5cf6",
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                width: `${(remainingAssignments / totalAssignments) * 100}%`,
                                                bgcolor: "#cbd5e1",
                                            }}
                                        />
                                    </>
                                ) : (
                                    <Box
                                        sx={{
                                            width: "100%",
                                            bgcolor: "#f1f5f9",
                                        }}
                                    />
                                )}
                            </Box>

                            <Stack
                                direction="row"
                                spacing={2}
                                justifyContent="space-between"
                                sx={{ px: 1 }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            bgcolor: "#34d399",
                                        }}
                                    />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={500}
                                    >
                                        Graded
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            bgcolor: "#8b5cf6",
                                        }}
                                    />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={500}
                                    >
                                        In Review
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            bgcolor: "#cbd5e1",
                                        }}
                                    />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={500}
                                    >
                                        Remaining
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>

            {/* Bottom Row: Continue Watching */}
            <Paper
                sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "none",
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={{
                        p: 3,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Typography variant="subtitle1" fontWeight={700}>
                        Continue Watching
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{
                                minWidth: "auto",
                                p: 1,
                                borderColor: "divider",
                                color: "text.secondary",
                            }}
                        >
                            🔍
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{
                                minWidth: "auto",
                                p: 1,
                                borderColor: "divider",
                                color: "text.secondary",
                            }}
                        >
                            ⋮
                        </Button>
                    </Box>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead
                            sx={{
                                "& th": {
                                    borderBottom: "none",
                                    color: "text.secondary",
                                    fontWeight: 600,
                                    fontSize: "0.8rem",
                                },
                            }}
                        >
                            <TableRow>
                                <TableCell>Id</TableCell>
                                <TableCell>Subject</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Progress</TableCell>
                                <TableCell align="right">View</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody
                            sx={{
                                "& td": {
                                    borderBottom: "1px solid",
                                    borderColor: "divider",
                                    py: 2,
                                },
                            }}
                        >
                            {activeEnrollments.map((enrollment) => (
                                <TableRow key={enrollment.id} hover>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            fontWeight={500}
                                        >
                                            {enrollment.programCode ||
                                                `C-${enrollment.programId}`}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                        >
                                            {enrollment.programName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {new Date(
                                                enrollment.enrolledAt,
                                            ).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 2,
                                            }}
                                        >
                                            <LinearProgress
                                                variant="determinate"
                                                value={
                                                    enrollment.progressPercent
                                                }
                                                sx={{
                                                    flex: 1,
                                                    height: 6,
                                                    borderRadius: 3,
                                                    bgcolor: "#e2e8f0",
                                                    "& .MuiLinearProgress-bar":
                                                        {
                                                            bgcolor: "#3b82f6",
                                                            borderRadius: 3,
                                                        },
                                                    maxWidth: 100,
                                                }}
                                            />
                                            <Typography
                                                variant="caption"
                                                fontWeight={600}
                                                sx={{ minWidth: 35 }}
                                            >
                                                {enrollment.progressPercent}%
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            justifyContent="flex-end"
                                        >
                                            <Button
                                                component={Link}
                                                href={`/student/programs/${enrollment.programId}/resume/`}
                                                variant="text"
                                                size="small"
                                                sx={{
                                                    minWidth: "auto",
                                                    p: 0.5,
                                                    color: "text.secondary",
                                                }}
                                            >
                                                👁
                                            </Button>
                                            <Button
                                                variant="text"
                                                size="small"
                                                sx={{
                                                    minWidth: "auto",
                                                    p: 0.5,
                                                    color: "text.secondary",
                                                }}
                                            >
                                                ⋮
                                            </Button>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {activeEnrollments.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        align="center"
                                        sx={{ py: 4 }}
                                    >
                                        <Typography color="text.secondary">
                                            You have no active courses right
                                            now.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Stack>
    );
}
// =============================================================================
// Instructor Dashboard Content
// =============================================================================

function InstructorContent({
    stats,
    gradingWorkload,
    recentSubmissions,
    pendingEnrollmentRequests,
}) {
    return (
        <Stack spacing={4}>
            <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                    Instructor Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage your programs and review student work
                </Typography>
            </Box>

            {/* Stats */}
            <Grid container spacing={5}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Programs"
                        value={stats?.programCount || 0}
                        icon={SchoolIcon}
                        color="primary"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Students"
                        value={stats?.totalStudents || 0}
                        icon={PeopleIcon}
                        color="success"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Grading workload"
                        value={stats?.gradingWorkload || 0}
                        icon={RateReviewIcon}
                        color="warning"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Pending Enrollments"
                        value={stats?.pendingEnrollments || 0}
                        icon={HowToRegIcon}
                        color="error"
                    />
                </Grid>
            </Grid>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Grading queue
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                    <Chip label={`${gradingWorkload?.assignments || 0} assignments`} />
                    <Chip label={`${gradingWorkload?.manualQuizzes || 0} manual quizzes`} />
                    <Chip label={`${gradingWorkload?.practicum || 0} practicum reviews`} />
                </Stack>
            </Paper>

            {/* Quick Actions & Submissions */}
            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 4, height: "100%" }}>
                        <Typography variant="h6" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 3 }}
                        >
                            Frequently used actions
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Button
                                    component={Link}
                                    href="/instructor/programs/"
                                    variant="outlined"
                                    startIcon={<SchoolIcon />}
                                    fullWidth
                                    size="large"
                                    sx={{ py: 2, height: "100%" }}
                                >
                                    Programs
                                </Button>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Button
                                    component={Link}
                                    href="/instructor/gradebook/"
                                    variant="outlined"
                                    startIcon={<AssignmentIcon />}
                                    fullWidth
                                    size="large"
                                    sx={{ py: 2, height: "100%" }}
                                >
                                    Gradebook
                                </Button>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Button
                                    component={Link}
                                    href="/instructor/practicum/"
                                    variant="contained"
                                    startIcon={<RateReviewIcon />}
                                    fullWidth
                                    size="large"
                                    sx={{ py: 2 }}
                                >
                                    Review Submissions
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 4, height: "100%" }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Submissions
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 3 }}
                        >
                            Latest student work
                        </Typography>
                        {recentSubmissions?.length > 0 ? (
                            <List dense>
                                {recentSubmissions.map((sub) => (
                                    <ListItem key={sub.id} divider>
                                        <ListItemText
                                            primary={sub.studentName}
                                            secondary={`${sub.nodeTitle} • ${sub.programName}`}
                                        />
                                        <Button
                                            component={Link}
                                            href={`/instructor/practicum/${sub.id}/review/`}
                                            size="small"
                                        >
                                            Review
                                        </Button>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Box
                                sx={{
                                    p: 4,
                                    textAlign: "center",
                                    bgcolor: "grey.50",
                                    borderRadius: 2,
                                    border: "1px dashed",
                                    borderColor: "divider",
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No pending submissions
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Pending Enrollment Requests */}
            <Paper sx={{ p: 4 }}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 2 }}
                >
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Pending Enrollment Requests
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Students waiting for your approval
                        </Typography>
                    </Box>
                </Stack>
                {pendingEnrollmentRequests?.length > 0 ? (
                    <List dense>
                        {pendingEnrollmentRequests.map((req) => (
                            <ListItem key={req.id} divider>
                                <ListItemIcon>
                                    <Avatar
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            bgcolor: "warning.main",
                                            fontSize: "0.875rem",
                                        }}
                                    >
                                        {req.studentName?.[0] || "?"}
                                    </Avatar>
                                </ListItemIcon>
                                <ListItemText
                                    primary={req.studentName}
                                    secondary={`${req.programName} • ${new Date(req.createdAt).toLocaleDateString()}`}
                                />
                                <Button
                                    component={Link}
                                    href={`/instructor/programs/${req.programId}/enrollment-requests/`}
                                    size="small"
                                    variant="outlined"
                                >
                                    Review
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Box
                        sx={{
                            p: 4,
                            textAlign: "center",
                            bgcolor: "grey.50",
                            borderRadius: 2,
                            border: "1px dashed",
                            borderColor: "divider",
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            No pending enrollment requests
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Stack>
    );
}

// =============================================================================
// Admin Dashboard Content
// =============================================================================

function ActionCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color = "primary",
    href,
    linkLabel,
}) {
    return (
        <Paper
            sx={{
                p: 3,
                height: "100%",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
            >
                <Box
                    sx={{
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: `${color}.light`,
                        color: `${color}.main`,
                        display: "flex",
                    }}
                >
                    <Icon fontSize="small" />
                </Box>
                {href && (
                    <Button
                        component={Link}
                        href={href}
                        size="small"
                        sx={{ minWidth: 0, fontSize: "0.75rem" }}
                    >
                        {linkLabel || "View"}
                    </Button>
                )}
            </Stack>
            <Box>
                <Typography variant="h4" fontWeight="bold">
                    {value}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}

function AdminContent({ stats, recentActivity }) {
    const completionRate =
        (stats?.activeEnrollments || 0) + (stats?.completedEnrollments || 0) > 0
            ? Math.round(
                  ((stats?.completedEnrollments || 0) /
                      ((stats?.activeEnrollments || 0) +
                          (stats?.completedEnrollments || 0))) *
                      100,
              )
            : 0;

    const hasPendingItems =
        (stats?.pendingEnrollmentRequests || 0) > 0 ||
        (stats?.pendingPracticumSubmissions || 0) > 0;

    return (
        <Stack spacing={3}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Admin Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your institution
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        component={Link}
                        href="/admin/users/create/"
                        variant="outlined"
                        startIcon={<PersonAddIcon />}
                    >
                        Add User
                    </Button>
                    <Button
                        component={Link}
                        href="/admin/programs/create/"
                        variant="contained"
                        startIcon={<AddIcon />}
                    >
                        New Program
                    </Button>
                </Stack>
            </Box>

            {/* Row 1 — Platform Overview */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Total Students"
                        value={stats?.totalStudents || 0}
                        icon={PeopleIcon}
                        color="primary"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Total Instructors"
                        value={stats?.totalInstructors || 0}
                        icon={SchoolIcon}
                        color="secondary"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Active Programs"
                        value={stats?.activePrograms || 0}
                        icon={BusinessIcon}
                        color="success"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Active Enrollments"
                        value={stats?.activeEnrollments || 0}
                        icon={AssignmentIcon}
                        color="info"
                    />
                </Grid>
            </Grid>

            {/* Row 2 — Outcomes & Action Items */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <ActionCard
                        title="Certificates Issued"
                        value={stats?.certificatesIssued || 0}
                        subtitle="All time"
                        icon={EmojiEventsIcon}
                        color="warning"
                        href="/admin/certificates/"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <ActionCard
                        title="Completed Enrollments"
                        value={stats?.completedEnrollments || 0}
                        subtitle={`${completionRate}% completion rate`}
                        icon={CardMembershipIcon}
                        color="success"
                        href="/admin/enrollments/"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <ActionCard
                        title="Pending Enrollment Requests"
                        value={stats?.pendingEnrollmentRequests || 0}
                        subtitle={
                            stats?.pendingEnrollmentRequests > 0
                                ? "Awaiting approval"
                                : "All caught up"
                        }
                        icon={GroupAddIcon}
                        color={
                            stats?.pendingEnrollmentRequests > 0
                                ? "error"
                                : "success"
                        }
                        href="/admin/enrollments/"
                        linkLabel="Review"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <ActionCard
                        title="Pending Practicum Reviews"
                        value={stats?.pendingPracticumSubmissions || 0}
                        subtitle={
                            stats?.pendingPracticumSubmissions > 0
                                ? "Submissions awaiting review"
                                : "All reviewed"
                        }
                        icon={GradingIcon}
                        color={
                            stats?.pendingPracticumSubmissions > 0
                                ? "warning"
                                : "success"
                        }
                        href="/instructor/practicum/"
                        linkLabel="Review"
                    />
                </Grid>
            </Grid>

            {/* Row 3 — Quick Actions + Recent Activity */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            height: "100%",
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Stack spacing={1.5} sx={{ mt: 1 }}>
                            <Button
                                component={Link}
                                href="/admin/programs/"
                                variant="outlined"
                                startIcon={<SchoolIcon />}
                                fullWidth
                                sx={{ justifyContent: "flex-start" }}
                            >
                                Manage Programs
                            </Button>
                            <Button
                                component={Link}
                                href="/admin/users/"
                                variant="outlined"
                                startIcon={<PeopleIcon />}
                                fullWidth
                                sx={{ justifyContent: "flex-start" }}
                            >
                                Manage Users
                            </Button>
                            <Button
                                component={Link}
                                href="/admin/enrollments/"
                                variant="outlined"
                                startIcon={<PendingActionsIcon />}
                                fullWidth
                                sx={{ justifyContent: "flex-start" }}
                                color={hasPendingItems ? "error" : "primary"}
                            >
                                Enrollment Requests
                                {stats?.pendingEnrollmentRequests > 0 && (
                                    <Box
                                        component="span"
                                        sx={{
                                            ml: "auto",
                                            bgcolor: "error.main",
                                            color: "white",
                                            borderRadius: "50%",
                                            width: 20,
                                            height: 20,
                                            fontSize: "0.7rem",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {stats.pendingEnrollmentRequests}
                                    </Box>
                                )}
                            </Button>
                            <Button
                                component={Link}
                                href="/admin/certificates/"
                                variant="outlined"
                                startIcon={<EmojiEventsIcon />}
                                fullWidth
                                sx={{ justifyContent: "flex-start" }}
                            >
                                Certificates
                            </Button>
                            <Button
                                component={Link}
                                href="/admin/general/"
                                variant="outlined"
                                startIcon={<SettingsIcon />}
                                fullWidth
                                sx={{ justifyContent: "flex-start" }}
                            >
                                General Settings
                            </Button>
                        </Stack>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            height: "100%",
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Recent Enrollments
                        </Typography>
                        {recentActivity?.length > 0 ? (
                            <List dense disablePadding>
                                {recentActivity.map((activity, index) => (
                                    <ListItem
                                        key={index}
                                        disableGutters
                                        sx={{ py: 1 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <Avatar
                                                sx={{
                                                    width: 28,
                                                    height: 28,
                                                    bgcolor: "primary.light",
                                                    color: "primary.main",
                                                    fontSize: "0.75rem",
                                                }}
                                            >
                                                {activity.description?.[0] ||
                                                    "U"}
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={activity.description}
                                            secondary={activity.timestamp}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Box
                                sx={{
                                    p: 3,
                                    textAlign: "center",
                                    bgcolor: "grey.50",
                                    borderRadius: 2,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    No recent activity
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Stack>
    );
}

// =============================================================================
// Main Dashboard Component
// =============================================================================

export default function Dashboard(props) {
    const { auth } = usePage().props;
    const role = props.role || auth?.user?.role || "student";

    const renderContent = () => {
        switch (role) {
            case "admin":
                return (
                    <AdminContent
                        stats={props.stats}
                        recentActivity={props.recentActivity}
                    />
                );
            case "instructor":
                return (
                    <InstructorContent
                        stats={props.stats}
                        gradingWorkload={props.gradingWorkload}
                        recentSubmissions={props.recentSubmissions}
                        pendingEnrollmentRequests={
                            props.pendingEnrollmentRequests
                        }
                    />
                );
            default:
                return (
                    <StudentContent
                        enrollments={props.enrollments}
                        assignments={props.assignments}
                        quizzes={props.quizzes}
                        upcomingDeadlines={props.upcomingDeadlines}
                    />
                );
        }
    };

    return (
        <DashboardLayout role={role}>
            <Head title="Dashboard" />
            <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>
                {renderContent()}
            </Box>
        </DashboardLayout>
    );
}
