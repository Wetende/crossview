import { Link } from "@inertiajs/react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CardMembershipOutlinedIcon from "@mui/icons-material/CardMembershipOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

import {
    EmptyPanel,
    MetricCard,
    SectionCard,
    StatusChip,
    WelcomePanel,
} from "./PortalDashboard";

const AdminDashboard = ({ firstName, recentActivity = [], stats = {} }) => {
    const totalFinished =
        Number(stats.activeEnrollments || 0) +
        Number(stats.completedEnrollments || 0);
    const completionRate =
        totalFinished > 0
            ? Math.round(
                  (Number(stats.completedEnrollments || 0) / totalFinished) *
                      100,
              )
            : 0;

    return (
        <Stack spacing={3}>
            <WelcomePanel
                firstName={firstName}
                title="Administration dashboard"
                subtitle="Monitor the learning platform, manage the learning community, and act on the work that needs attention."
                actions={
                    <>
                        <Button
                            component={Link}
                            href="/admin/users/create/"
                            variant="outlined"
                            startIcon={<PersonAddOutlinedIcon />}
                        >
                            Add user
                        </Button>
                        <Button
                            component={Link}
                            href="/admin/programs/create/"
                            variant="contained"
                            startIcon={<AddIcon />}
                        >
                            New programme
                        </Button>
                    </>
                }
            />

            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <MetricCard
                        color="primary"
                        href="/admin/users/"
                        icon={GroupsOutlinedIcon}
                        label="Students"
                        value={stats.totalStudents || 0}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <MetricCard
                        color="success"
                        href="/admin/users/"
                        icon={SchoolOutlinedIcon}
                        label="Instructors"
                        value={stats.totalInstructors || 0}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <MetricCard
                        color="info"
                        href="/admin/programs/"
                        icon={MenuBookOutlinedIcon}
                        label="Active programmes"
                        value={stats.activePrograms || 0}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <MetricCard
                        color="warning"
                        href="/admin/enrollments/"
                        icon={AssignmentOutlinedIcon}
                        label="Active enrolments"
                        value={stats.activeEnrollments || 0}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <SectionCard
                        title="Recent activity"
                        subtitle="Latest enrolments across the platform"
                        action={
                            <Button
                                component={Link}
                                href="/admin/enrollments/"
                                size="small"
                            >
                                View enrolments
                            </Button>
                        }
                    >
                        {recentActivity.length > 0 ? (
                            <List disablePadding>
                                {recentActivity.map((activity, index) => (
                                    <ListItem
                                        key={`${activity.timestamp}-${index}`}
                                        divider
                                        sx={{ px: { xs: 2, md: 3 }, py: 1.55 }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                sx={{
                                                    bgcolor: "primary.lighter",
                                                    color: "primary.main",
                                                }}
                                            >
                                                <GroupAddOutlinedIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={activity.description}
                                            secondary={activity.timestamp}
                                            primaryTypographyProps={{
                                                variant: "body2",
                                                fontWeight: 700,
                                            }}
                                            secondaryTypographyProps={{
                                                variant: "caption",
                                            }}
                                        />
                                        <StatusChip
                                            label="Enrolment"
                                            tone="primary"
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <EmptyPanel
                                title="No recent activity"
                                description="New enrolments and platform activity will appear here."
                                icon={GroupAddOutlinedIcon}
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
                                Learning outcomes
                            </Typography>
                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="flex-end"
                                sx={{ mt: 1 }}
                            >
                                <Box>
                                    <Typography
                                        variant="h3"
                                        sx={{
                                            color: "#FFFFFF",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {completionRate}%
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "rgba(255,255,255,0.78)" }}
                                    >
                                        Completion rate
                                    </Typography>
                                </Box>
                                <CardMembershipOutlinedIcon
                                    sx={{ fontSize: 44, color: "#22C55E" }}
                                />
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={completionRate}
                                sx={{
                                    mt: 3,
                                    height: 10,
                                    borderRadius: 5,
                                    bgcolor: "rgba(255,255,255,0.24)",
                                    "& .MuiLinearProgress-bar": {
                                        bgcolor: "#22C55E",
                                        borderRadius: 5,
                                    },
                                }}
                            />
                            <Typography
                                variant="caption"
                                sx={{
                                    display: "block",
                                    mt: 1.5,
                                    color: "rgba(255,255,255,0.72)",
                                }}
                            >
                                {stats.completedEnrollments || 0} completed
                                enrolments
                            </Typography>
                        </Box>

                        <SectionCard
                            title="Quick actions"
                            subtitle="Common administration tasks"
                        >
                            <Stack spacing={1.25} sx={{ p: 2.5 }}>
                                <Button
                                    component={Link}
                                    href="/admin/users/"
                                    variant="outlined"
                                    startIcon={<GroupsOutlinedIcon />}
                                    fullWidth
                                >
                                    Manage users
                                </Button>
                                <Button
                                    component={Link}
                                    href="/admin/programs/"
                                    variant="outlined"
                                    startIcon={<MenuBookOutlinedIcon />}
                                    fullWidth
                                >
                                    Manage programmes
                                </Button>
                                <Button
                                    component={Link}
                                    href="/admin/enrollments/"
                                    variant="contained"
                                    startIcon={<HowToRegOutlinedIcon />}
                                    fullWidth
                                >
                                    Review enrolments
                                </Button>
                            </Stack>
                        </SectionCard>
                    </Stack>
                </Grid>
            </Grid>

            <SectionCard
                title="Items requiring attention"
                subtitle="Operational work still waiting to be completed"
            >
                <Grid container spacing={0}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                            sx={{
                                p: 3,
                                borderRight: { md: "1px solid" },
                                borderColor: "divider",
                            }}
                        >
                            <Avatar
                                sx={{
                                    bgcolor: "warning.lighter",
                                    color: "warning.dark",
                                }}
                            >
                                <HowToRegOutlinedIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="h5"
                                    color="primary.main"
                                    fontWeight={700}
                                >
                                    {stats.pendingEnrollmentRequests || 0}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Pending enrolment requests
                                </Typography>
                            </Box>
                            <Button
                                component={Link}
                                href="/admin/enrollments/"
                                size="small"
                            >
                                Review
                            </Button>
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                            sx={{
                                p: 3,
                                borderTop: { xs: "1px solid", md: 0 },
                                borderColor: "divider",
                            }}
                        >
                            <Avatar
                                sx={{
                                    bgcolor: "error.lighter",
                                    color: "error.main",
                                }}
                            >
                                <RateReviewOutlinedIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="h5"
                                    color="primary.main"
                                    fontWeight={700}
                                >
                                    {stats.pendingPracticumSubmissions || 0}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Pending practical reviews
                                </Typography>
                            </Box>
                            <Button
                                component={Link}
                                href="/instructor/practicum/"
                                size="small"
                            >
                                Review
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </SectionCard>
        </Stack>
    );
};

export default AdminDashboard;
