import { useMemo } from "react";
import { Link } from "@inertiajs/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

import LearningMomentum from "@/components/LearningMomentum";
import { CurrentLearningCard } from "@/features/learning-experience/components";
import { sortLearningPriority } from "@/features/learning-experience/learningSelection";
import {
    EmptyPanel,
    MetricCard,
    ProgressPanel,
    SectionCard,
    StatusChip,
    WelcomePanel,
} from "./PortalDashboard";

const formatDate = (value) => {
    if (!value) {
        return "No date";
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
        ? "No date"
        : parsed.toLocaleDateString();
};

const assignmentStatus = (status) => {
    if (status === "graded") {
        return { label: "Graded", tone: "success" };
    }
    if (status === "submitted") {
        return { label: "In review", tone: "warning" };
    }
    return { label: "To do", tone: "primary" };
};

const StudentDashboard = ({
    assignments = [],
    enrollments = [],
    firstName,
    quizzes = [],
    upcomingDeadlines = [],
}) => {
    const summary = useMemo(() => {
        const completed = enrollments.filter(
            (item) => Number(item.progressPercent || 0) >= 100,
        );
        const active = enrollments.filter(
            (item) => Number(item.progressPercent || 0) < 100,
        );
        const progress =
            enrollments.length > 0
                ? Math.round(
                      enrollments.reduce(
                          (total, item) =>
                              total + Number(item.progressPercent || 0),
                          0,
                      ) / enrollments.length,
                  )
                : 0;
        return {
            active,
            completed,
            progress,
            pendingQuizzes: quizzes.filter((quiz) => !quiz.passed).length,
        };
    }, [enrollments, quizzes]);

    const sortedEnrollments = useMemo(
        () =>
            [...enrollments].sort(
                (a, b) =>
                    Number(b.progressPercent || 0) -
                    Number(a.progressPercent || 0),
            ),
        [enrollments],
    );
    const primaryEnrollment = useMemo(
        () => sortLearningPriority(summary.active)[0],
        [summary.active],
    );
    const primaryDeadline = primaryEnrollment
        ? upcomingDeadlines.find(
              (deadline) => deadline.programId === primaryEnrollment.programId,
          )
        : null;

    return (
        <Stack spacing={3}>
            <WelcomePanel
                firstName={firstName}
                title="Student dashboard"
                subtitle="Continue your learning journey, keep track of coursework, and pick up exactly where you left off."
            />

            {primaryEnrollment ? (
                <Box
                    component="section"
                    aria-labelledby="continue-learning-title"
                >
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={0.75}
                        sx={{
                            mb: 1.5,
                            alignItems: { xs: "flex-start", sm: "baseline" },
                            justifyContent: "space-between",
                        }}
                    >
                        <Box>
                            <Typography
                                id="continue-learning-title"
                                component="h2"
                                variant="h5"
                            >
                                Continue learning
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.35 }}
                            >
                                Pick up from your most relevant active course.
                            </Typography>
                        </Box>
                        <Button
                            component={Link}
                            href="/student/programs/"
                            size="small"
                        >
                            View all courses
                        </Button>
                    </Stack>
                    <CurrentLearningCard
                        featured
                        enrollment={{
                            ...primaryEnrollment,
                            nextDeadline: primaryDeadline,
                        }}
                    />
                </Box>
            ) : null}

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <MetricCard
                        color="primary"
                        href="/student/programs/"
                        icon={SchoolOutlinedIcon}
                        label="Enrolled courses"
                        value={enrollments.length}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <MetricCard
                        color="info"
                        href="/student/assignments/"
                        icon={AssignmentOutlinedIcon}
                        label="Total assignments"
                        value={assignments.length}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <MetricCard
                        color="success"
                        href="/student/programs/?status=completed"
                        icon={CheckCircleOutlineIcon}
                        label="Completed courses"
                        value={summary.completed.length}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <MetricCard
                        color="warning"
                        href="/student/quizzes/"
                        icon={QuizOutlinedIcon}
                        label="Upcoming quizzes"
                        value={summary.pendingQuizzes}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8.25 }}>
                    <SectionCard
                        title="Current Courses"
                        subtitle="Your active self-paced learning programmes"
                        action={
                            <Button
                                component={Link}
                                href="/student/programs/"
                                size="small"
                            >
                                View all
                            </Button>
                        }
                    >
                        {summary.active.length > 0 ? (
                            <TableContainer>
                                <Table sx={{ minWidth: 650 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Course</TableCell>
                                            <TableCell>Code</TableCell>
                                            <TableCell>Started</TableCell>
                                            <TableCell>Progress</TableCell>
                                            <TableCell align="right">
                                                Action
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {summary.active.map((enrollment) => (
                                            <TableRow key={enrollment.id} hover>
                                                <TableCell>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={700}
                                                    >
                                                        {enrollment.programName}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {enrollment.durationHours ||
                                                            0}{" "}
                                                        hours
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {enrollment.programCode ||
                                                        `C-${enrollment.programId}`}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(
                                                        enrollment.enrolledAt,
                                                    )}
                                                </TableCell>
                                                <TableCell
                                                    sx={{ minWidth: 170 }}
                                                >
                                                    <Stack
                                                        direction="row"
                                                        spacing={1.25}
                                                        sx={{
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={Number(
                                                                enrollment.progressPercent ||
                                                                    0,
                                                            )}
                                                            sx={{
                                                                flex: 1,
                                                                height: 7,
                                                                borderRadius: 4,
                                                                bgcolor:
                                                                    "action.selected",
                                                                "& .MuiLinearProgress-bar":
                                                                    {
                                                                        borderRadius: 4,
                                                                    },
                                                            }}
                                                        />
                                                        <Typography
                                                            variant="caption"
                                                            fontWeight={700}
                                                        >
                                                            {Number(
                                                                enrollment.progressPercent ||
                                                                    0,
                                                            )}
                                                            %
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        component={Link}
                                                        href={`/student/programs/${enrollment.programId}/resume/`}
                                                        variant="outlined"
                                                        size="small"
                                                    >
                                                        Resume
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <EmptyPanel
                                title="No active courses"
                                description="Your active courses will appear here after you enrol."
                                icon={SchoolOutlinedIcon}
                            />
                        )}
                    </SectionCard>
                </Grid>

                <Grid size={{ xs: 12, lg: 3.75 }}>
                    <Stack spacing={3}>
                        <ProgressPanel
                            label="Average across enrolled courses"
                            value={summary.progress}
                        />
                        <SectionCard
                            title="Upcoming deadlines"
                            subtitle="Your next five due items"
                        >
                            {upcomingDeadlines.length > 0 ? (
                                <List disablePadding>
                                    {upcomingDeadlines
                                        .slice(0, 5)
                                        .map((deadline) => (
                                            <ListItem
                                                key={`${deadline.type}-${deadline.id}`}
                                                divider
                                                sx={{
                                                    px: 2.5,
                                                    py: 1.5,
                                                    alignItems: "flex-start",
                                                }}
                                            >
                                                <CalendarMonthOutlinedIcon
                                                    sx={{
                                                        mr: 1.5,
                                                        mt: 0.25,
                                                        color: "warning.main",
                                                    }}
                                                />
                                                <ListItemText
                                                    primary={deadline.title}
                                                    secondary={`${deadline.programName} · ${formatDate(deadline.dueAt)}`}
                                                    slotProps={{
                                                        primary: {
                                                            variant: "body2",
                                                            fontWeight: 700,
                                                        },
                                                        secondary: {
                                                            variant: "caption",
                                                        },
                                                    }}
                                                />
                                            </ListItem>
                                        ))}
                                </List>
                            ) : (
                                <EmptyPanel
                                    title="No upcoming deadlines"
                                    description="You are all caught up for now."
                                    icon={CalendarMonthOutlinedIcon}
                                />
                            )}
                        </SectionCard>
                    </Stack>
                </Grid>
            </Grid>

            <LearningMomentum enrollments={enrollments} />

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 7 }}>
                    <SectionCard
                        title="Course Progress Distribution"
                        subtitle="Progress across all your enrolled courses"
                    >
                        {sortedEnrollments.length > 0 ? (
                            <Stack spacing={2.25} sx={{ p: 3 }}>
                                {sortedEnrollments
                                    .slice(0, 6)
                                    .map((enrollment) => (
                                        <Box key={enrollment.id}>
                                            <Stack
                                                direction="row"
                                                spacing={2}
                                                sx={{
                                                    mb: 0.8,
                                                    justifyContent:
                                                        "space-between",
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={700}
                                                >
                                                    {enrollment.programName}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    color="primary.main"
                                                    fontWeight={700}
                                                >
                                                    {Number(
                                                        enrollment.progressPercent ||
                                                            0,
                                                    )}
                                                    %
                                                </Typography>
                                            </Stack>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Number(
                                                    enrollment.progressPercent ||
                                                        0,
                                                )}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 5,
                                                    bgcolor: "action.selected",
                                                    "& .MuiLinearProgress-bar":
                                                        { borderRadius: 5 },
                                                }}
                                            />
                                        </Box>
                                    ))}
                            </Stack>
                        ) : (
                            <EmptyPanel
                                title="No progress to show"
                                description="Course progress appears after you start learning."
                            />
                        )}
                    </SectionCard>
                </Grid>

                <Grid size={{ xs: 12, lg: 5 }}>
                    <Stack spacing={3}>
                        <SectionCard
                            title="Assignment Breakdown"
                            subtitle="Your latest coursework status"
                            action={
                                <Button
                                    component={Link}
                                    href="/student/assignments/"
                                    size="small"
                                >
                                    View all
                                </Button>
                            }
                        >
                            {assignments.length > 0 ? (
                                <List disablePadding>
                                    {assignments
                                        .slice(0, 5)
                                        .map((assignment) => {
                                            const status = assignmentStatus(
                                                assignment.submissionStatus,
                                            );
                                            return (
                                                <ListItem
                                                    key={assignment.id}
                                                    divider
                                                    sx={{ px: 2.5, py: 1.4 }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            assignment.title
                                                        }
                                                        secondary={
                                                            assignment.programName
                                                        }
                                                        slotProps={{
                                                            primary: {
                                                                variant:
                                                                    "body2",
                                                                fontWeight: 700,
                                                            },
                                                            secondary: {
                                                                variant:
                                                                    "caption",
                                                            },
                                                        }}
                                                    />
                                                    <StatusChip
                                                        label={status.label}
                                                        tone={status.tone}
                                                    />
                                                </ListItem>
                                            );
                                        })}
                                </List>
                            ) : (
                                <EmptyPanel
                                    title="No assignments"
                                    description="Assignments from your courses will appear here."
                                    icon={AssignmentOutlinedIcon}
                                />
                            )}
                        </SectionCard>

                        <SectionCard
                            title="Quiz activity"
                            subtitle="Your latest recorded quiz attempts"
                            action={
                                <Button
                                    component={Link}
                                    href="/student/quizzes/"
                                    size="small"
                                >
                                    View all
                                </Button>
                            }
                        >
                            {quizzes.length > 0 ? (
                                <List disablePadding>
                                    {quizzes.slice(0, 4).map((quiz) => (
                                        <ListItem
                                            key={quiz.id}
                                            divider
                                            sx={{ px: 2.5, py: 1.4 }}
                                        >
                                            <ListItemText
                                                primary={quiz.title}
                                                secondary={`${quiz.programName} · ${quiz.attempts || 0} attempt${quiz.attempts === 1 ? "" : "s"}`}
                                                slotProps={{
                                                    primary: {
                                                        variant: "body2",
                                                        fontWeight: 700,
                                                    },
                                                    secondary: {
                                                        variant: "caption",
                                                    },
                                                }}
                                            />
                                            <StatusChip
                                                label={
                                                    quiz.bestScore == null
                                                        ? "No score"
                                                        : `${quiz.bestScore}%`
                                                }
                                                tone={
                                                    quiz.passed
                                                        ? "success"
                                                        : "warning"
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <EmptyPanel
                                    title="No quiz activity"
                                    description="Quiz attempts and results will appear here."
                                    icon={QuizOutlinedIcon}
                                />
                            )}
                        </SectionCard>
                    </Stack>
                </Grid>
            </Grid>
        </Stack>
    );
};

export default StudentDashboard;
