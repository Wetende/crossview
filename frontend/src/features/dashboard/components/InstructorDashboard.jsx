import { Link } from "@inertiajs/react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import GradingOutlinedIcon from "@mui/icons-material/GradingOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

import {
    EmptyPanel,
    MetricCard,
    SectionCard,
    StatusChip,
    WelcomePanel,
} from "./PortalDashboard";

const InstructorDashboard = ({
    firstName,
    gradingWorkload = {},
    pendingEnrollmentRequests = [],
    recentSubmissions = [],
    stats = {},
}) => (
    <Stack spacing={3}>
        <WelcomePanel
            firstName={firstName}
            title="Instructor dashboard"
            subtitle="Manage your programmes, review learner work, and keep every student moving forward."
            actions={
                <>
                    <Button
                        component={Link}
                        href="/instructor/programs/"
                        variant="contained"
                    >
                        My programmes
                    </Button>
                    <Button
                        component={Link}
                        href="/instructor/gradebook/"
                        variant="outlined"
                    >
                        Open gradebook
                    </Button>
                </>
            }
        />

        <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <MetricCard
                    color="primary"
                    href="/instructor/programs/"
                    icon={SchoolOutlinedIcon}
                    label="Programmes"
                    value={stats.programCount || 0}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <MetricCard
                    color="success"
                    href="/instructor/students/"
                    icon={GroupOutlinedIcon}
                    label="Active students"
                    value={stats.totalStudents || 0}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <MetricCard
                    color="warning"
                    href="/instructor/assignments/"
                    icon={GradingOutlinedIcon}
                    label="Grading workload"
                    value={stats.gradingWorkload || 0}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                <MetricCard
                    color="info"
                    href="/instructor/programs/"
                    icon={HowToRegOutlinedIcon}
                    label="Pending enrolments"
                    value={stats.pendingEnrollments || 0}
                />
            </Grid>
        </Grid>

        <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 8 }}>
                <SectionCard
                    title="Recent submissions"
                    subtitle="Learner work waiting for your attention"
                    action={
                        <Button
                            component={Link}
                            href="/instructor/practicum/"
                            size="small"
                        >
                            Review queue
                        </Button>
                    }
                >
                    {recentSubmissions.length > 0 ? (
                        <List disablePadding>
                            {recentSubmissions.map((submission) => (
                                <ListItem
                                    key={submission.id}
                                    divider
                                    secondaryAction={
                                        <Button
                                            component={Link}
                                            href={`/instructor/practicum/${submission.id}/review/`}
                                            variant="outlined"
                                            size="small"
                                        >
                                            Review
                                        </Button>
                                    }
                                    sx={{
                                        px: { xs: 2, md: 3 },
                                        py: 1.6,
                                        pr: 13,
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar
                                            sx={{
                                                bgcolor: "primary.lighter",
                                                color: "primary.main",
                                            }}
                                        >
                                            {(submission.studentName || "?")
                                                .charAt(0)
                                                .toUpperCase()}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={submission.studentName}
                                        secondary={`${submission.nodeTitle} · ${submission.programName}`}
                                        primaryTypographyProps={{
                                            fontWeight: 700,
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <EmptyPanel
                            title="No pending submissions"
                            description="New student submissions will appear here for review."
                            icon={AssignmentTurnedInOutlinedIcon}
                        />
                    )}
                </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
                <Stack spacing={3}>
                    <Box
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            color: "#FFFFFF",
                            background:
                                "linear-gradient(145deg, #166534 0%, #14532D 100%)",
                            boxShadow: "0 18px 34px rgba(33,64,154,0.24)",
                        }}
                    >
                        <Typography
                            variant="overline"
                            sx={{ color: "rgba(255,255,255,0.7)" }}
                        >
                            Grading queue
                        </Typography>
                        <Typography
                            variant="h4"
                            sx={{ color: "#FFFFFF", mt: 0.75, fontWeight: 700 }}
                        >
                            {stats.gradingWorkload || 0} items
                        </Typography>
                        <Stack
                            direction="row"
                            gap={1}
                            sx={{ mt: 2.5, flexWrap: "wrap" }}
                        >
                            <Chip
                                label={`${gradingWorkload.assignments || 0} assignments`}
                                sx={{
                                    bgcolor: "rgba(255,255,255,0.14)",
                                    color: "#FFFFFF",
                                }}
                            />
                            <Chip
                                label={`${gradingWorkload.manualQuizzes || 0} quizzes`}
                                sx={{
                                    bgcolor: "rgba(255,255,255,0.14)",
                                    color: "#FFFFFF",
                                }}
                            />
                            <Chip
                                label={`${gradingWorkload.practicum || 0} practicals`}
                                sx={{
                                    bgcolor: "rgba(255,255,255,0.14)",
                                    color: "#FFFFFF",
                                }}
                            />
                        </Stack>
                    </Box>

                    <SectionCard
                        title="Quick actions"
                        subtitle="Frequently used teaching tools"
                    >
                        <Stack spacing={1.25} sx={{ p: 2.5 }}>
                            <Button
                                component={Link}
                                href="/instructor/programs/"
                                variant="outlined"
                                startIcon={<SchoolOutlinedIcon />}
                                fullWidth
                            >
                                Manage programmes
                            </Button>
                            <Button
                                component={Link}
                                href="/instructor/assignments/"
                                variant="outlined"
                                startIcon={<AssignmentTurnedInOutlinedIcon />}
                                fullWidth
                            >
                                View assignments
                            </Button>
                            <Button
                                component={Link}
                                href="/instructor/practicum/"
                                variant="contained"
                                startIcon={<RateReviewOutlinedIcon />}
                                fullWidth
                            >
                                Review practical work
                            </Button>
                        </Stack>
                    </SectionCard>
                </Stack>
            </Grid>
        </Grid>

        <SectionCard
            title="Pending enrolment requests"
            subtitle="Students waiting for programme approval"
        >
            {pendingEnrollmentRequests.length > 0 ? (
                <List disablePadding>
                    {pendingEnrollmentRequests.map((request) => (
                        <ListItem
                            key={request.id}
                            divider
                            secondaryAction={
                                <Button
                                    component={Link}
                                    href={`/instructor/programs/${request.programId}/enrollment-requests/`}
                                    size="small"
                                >
                                    Review
                                </Button>
                            }
                            sx={{ px: { xs: 2, md: 3 }, py: 1.5, pr: 12 }}
                        >
                            <ListItemAvatar>
                                <Avatar
                                    sx={{
                                        bgcolor: "warning.lighter",
                                        color: "warning.dark",
                                    }}
                                >
                                    {(request.studentName || "?")
                                        .charAt(0)
                                        .toUpperCase()}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={request.studentName}
                                secondary={`${request.programName} · ${new Date(request.createdAt).toLocaleDateString()}`}
                                primaryTypographyProps={{ fontWeight: 700 }}
                            />
                            <Box sx={{ display: { xs: "none", sm: "block" } }}>
                                <StatusChip
                                    label="Awaiting review"
                                    tone="warning"
                                />
                            </Box>
                        </ListItem>
                    ))}
                </List>
            ) : (
                <EmptyPanel
                    title="No pending requests"
                    description="All programme enrolment requests have been handled."
                    icon={HowToRegOutlinedIcon}
                />
            )}
        </SectionCard>
    </Stack>
);

export default InstructorDashboard;
