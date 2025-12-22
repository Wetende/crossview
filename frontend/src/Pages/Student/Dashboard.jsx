import { Head, Link } from '@inertiajs/react';
import {
    Card,
    CardContent,
    Grid,
    LinearProgress,
    Stack,
    Typography,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Paper,
    Box,
} from '@mui/material';
import {
    IconBook,
    IconCheck,
    IconClock,
    IconSchool,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layouts/DashboardLayout';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

/**
 * Student Dashboard - Overview of enrollments and progress
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */
export default function Dashboard({
    enrollments = [],
    recentActivity = [],
    upcomingDeadlines = []
}) {
    const hasEnrollments = enrollments.length > 0;

    return (
        <DashboardLayout role="student">
            <Head title="Dashboard" />
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Welcome back! Here's your learning progress.
            </Typography>

            {!hasEnrollments ? (
                <EmptyState />
            ) : (
                <Grid container spacing={3}>
                    {/* Enrollments Section */}
                    <Grid item xs={12} lg={8}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                            My Programs
                        </Typography>
                        <Stack spacing={2}>
                            {enrollments.map((enrollment, index) => (
                                <motion.div
                                    key={enrollment.id}
                                    {...fadeInUp}
                                    transition={{ ...fadeInUp.transition, delay: index * 0.1 }}
                                >
                                    <EnrollmentCard enrollment={enrollment} />
                                </motion.div>
                            ))}
                        </Stack>
                    </Grid>

                    {/* Sidebar */}
                    <Grid item xs={12} lg={4}>
                        <Stack spacing={3}>
                            {/* Recent Activity */}
                            <motion.div {...fadeInUp}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                        Recent Activity
                                    </Typography>
                                    {recentActivity.length > 0 ? (
                                        <List dense disablePadding>
                                            {recentActivity.slice(0, 5).map((activity) => (
                                                <ListItem key={activity.id} disablePadding sx={{ py: 0.5 }}>
                                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                                        <IconCheck size={16} color="green" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={activity.nodeTitle}
                                                        secondary={activity.programName}
                                                        primaryTypographyProps={{ variant: 'body2' }}
                                                        secondaryTypographyProps={{ variant: 'caption' }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No recent activity
                                        </Typography>
                                    )}
                                </Paper>
                            </motion.div>

                            {/* Upcoming Deadlines */}
                            <motion.div {...fadeInUp}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                        Upcoming Deadlines
                                    </Typography>
                                    {upcomingDeadlines.length > 0 ? (
                                        <List dense disablePadding>
                                            {upcomingDeadlines.map((deadline, idx) => (
                                                <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                                        <IconClock size={16} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={deadline.title}
                                                        secondary={deadline.dueDate}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No upcoming deadlines
                                        </Typography>
                                    )}
                                </Paper>
                            </motion.div>
                        </Stack>
                    </Grid>
                </Grid>
            )}
        </DashboardLayout>
    );
}

function EnrollmentCard({ enrollment }) {
    const statusColors = {
        active: 'primary',
        completed: 'success',
        withdrawn: 'default',
    };

    return (
        <Card
            component={Link}
            href={`/student/programs/${enrollment.id}/`}
            sx={{
                textDecoration: 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                },
            }}
        >
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <IconSchool size={20} />
                            <Typography variant="h6" fontWeight={600}>
                                {enrollment.programName}
                            </Typography>
                        </Stack>
                        {enrollment.programCode && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {enrollment.programCode}
                            </Typography>
                        )}
                    </Box>
                    <Chip
                        label={enrollment.status}
                        color={statusColors[enrollment.status] || 'default'}
                        size="small"
                    />
                </Stack>

                <Box sx={{ mt: 2 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                            Progress
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                            {enrollment.progressPercent}%
                        </Typography>
                    </Stack>
                    <LinearProgress
                        variant="determinate"
                        value={enrollment.progressPercent}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}

function EmptyState() {
    return (
        <motion.div {...fadeInUp}>
            <Paper
                sx={{
                    p: 6,
                    textAlign: 'center',
                    backgroundColor: 'background.paper',
                }}
            >
                <IconBook size={64} stroke={1.5} style={{ opacity: 0.5 }} />
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    No Enrollments Yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    You haven't enrolled in any programs yet. Contact your administrator to get started.
                </Typography>
            </Paper>
        </motion.div>
    );
}
