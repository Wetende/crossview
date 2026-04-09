/**
 * Unified Dashboard Page
 * Shows different content and menus based on user role
 * Roles: student, instructor, admin
 */

import { Head, Link, usePage } from '@inertiajs/react';
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
} from '@mui/material';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RateReviewIcon from '@mui/icons-material/RateReview';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BusinessIcon from '@mui/icons-material/Business';
import SettingsIcon from '@mui/icons-material/Settings';
import GradingIcon from '@mui/icons-material/Grading';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

import HowToRegIcon from '@mui/icons-material/HowToReg';

import DashboardLayout from '@/layouts/DashboardLayout';

// =============================================================================
// Shared Components
// =============================================================================

function StatCard({ title, value, icon: Icon, color = 'primary' }) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
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

function StudentSummaryCard({ title, value, subtitle, icon: Icon, progress }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
          {title}
        </Typography>
        <Icon color="action" fontSize="small" />
      </Stack>

      <Typography variant="h4" fontWeight="bold" sx={{ mb: progress !== undefined ? 1.5 : 0.5 }}>
        {value}
      </Typography>

      {progress !== undefined && (
        <LinearProgress
          variant="determinate"
          value={Math.min(progress, 100)}
          sx={{
            height: 8,
            borderRadius: 4,
            mb: 1.5,
          }}
        />
      )}

      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Paper>
  );
}

// =============================================================================
// Student Dashboard Content
// =============================================================================

function StudentContent({ enrollments, recentActivity }) {
  const enrollmentList = enrollments || [];
  const activityList = recentActivity || [];

  const totalCourses = enrollmentList.length;
  const inProgressCourses = enrollmentList.filter(
    (enrollment) => enrollment.progressPercent > 0 && enrollment.progressPercent < 100
  );
  const completedCourses = enrollmentList.filter(
    (enrollment) => Number(enrollment.progressPercent || 0) >= 100
  );

  const globalProgress =
    totalCourses > 0
      ? Math.round(
          enrollmentList.reduce((total, enrollment) => total + Number(enrollment.progressPercent || 0), 0) /
            totalCourses
        )
      : 0;
  const successRate = totalCourses > 0 ? Math.round((completedCourses.length / totalCourses) * 100) : 0;

  const recentlyCompleted =
    activityList.length > 0
      ? activityList.slice(0, 4)
      : completedCourses.slice(0, 4).map((enrollment) => ({
          nodeTitle: enrollment.programName,
          programName: enrollment.programCode || 'Program',
          completedAt: null,
        }));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Student Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Welcome to your learning space. Here is your progress overview.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StudentSummaryCard
            title="Overall Progress"
            value={`${globalProgress}%`}
            subtitle={
              totalCourses > 0
                ? `${inProgressCourses.length} active of ${totalCourses} total`
                : 'No active programs yet'
            }
            progress={globalProgress}
            icon={TrendingUpIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StudentSummaryCard
            title="Courses In Progress"
            value={inProgressCourses.length}
            subtitle={
              totalCourses > 0
                ? `Out of ${totalCourses} enrolled programs`
                : 'Start a program to begin'
            }
            icon={SchoolIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StudentSummaryCard
            title="Courses Completed"
            value={completedCourses.length}
            subtitle={
              totalCourses > 0 ? `Success rate: ${successRate}%` : 'No completions yet'
            }
            icon={CheckCircleIcon}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StudentSummaryCard
            title="Recent Updates"
            value={activityList.length}
            subtitle="Latest learning activity"
            icon={AssignmentIcon}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              Courses in Progress
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5 }}>
              Your currently active courses
            </Typography>

            {inProgressCourses.length > 0 ? (
              <Stack spacing={2.5}>
                {inProgressCourses.slice(0, 4).map((enrollment) => (
                  <Box key={enrollment.id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
                          {enrollment.programName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {enrollment.programCode || 'Program'}
                        </Typography>
                      </Box>
                      <Chip label={`${Math.round(enrollment.progressPercent)}%`} size="small" />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(enrollment.progressPercent, 100)}
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                    />
                    <Button
                      component={Link}
                      href={`/student/programs/${enrollment.programId}/`}
                      size="small"
                      sx={{ px: 0 }}
                    >
                      Continue
                    </Button>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography color="text.secondary">No courses in progress yet.</Typography>
              </Paper>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              Recently Completed
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5 }}>
              Your latest successful learning steps
            </Typography>

            {recentlyCompleted.length > 0 ? (
              <List dense disablePadding>
                {recentlyCompleted.map((activity, index) => (
                  <ListItem
                    key={`${activity.nodeTitle}-${index}`}
                    disableGutters
                    sx={{ py: 1.25, alignItems: 'flex-start' }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
                          {activity.nodeTitle}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {activity.completedAt
                            ? `${activity.programName} • Completed ${new Date(activity.completedAt).toLocaleDateString()}`
                            : `${activity.programName} • Completed`}
                        </Typography>
                      }
                    />
                    <Chip label="Done" color="success" variant="outlined" size="small" />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography color="text.secondary">No completed items yet.</Typography>
              </Paper>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}

// =============================================================================
// Instructor Dashboard Content
// =============================================================================

function InstructorContent({ stats, recentSubmissions, pendingEnrollmentRequests }) {
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
          <StatCard title="Programs" value={stats?.programCount || 0} icon={SchoolIcon} color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Students" value={stats?.totalStudents || 0} icon={PeopleIcon} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Pending Reviews" value={stats?.pendingReviews || 0} icon={RateReviewIcon} color="warning" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Pending Enrollments" value={stats?.pendingEnrollments || 0} icon={HowToRegIcon} color="error" />
        </Grid>
      </Grid>

      {/* Quick Actions & Submissions */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
                  sx={{ py: 2, height: '100%' }}
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
                  sx={{ py: 2, height: '100%' }}
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
          <Paper sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Recent Submissions</Typography>
             <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Latest student work
            </Typography>
            {recentSubmissions?.length > 0 ? (
              <List dense>
                {recentSubmissions.map((sub) => (
                  <ListItem key={sub.id} divider>
                    <ListItemText primary={sub.studentName} secondary={`${sub.nodeTitle} • ${sub.programName}`} />
                    <Button component={Link} href={`/instructor/practicum/${sub.id}/review/`} size="small">Review</Button>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider'
              }}>
                <Typography variant="body2" color="text.secondary">No pending submissions</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Pending Enrollment Requests */}
      <Paper sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
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
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'warning.main', fontSize: '0.875rem' }}>
                    {req.studentName?.[0] || '?'}
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
          <Box sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: 'grey.50',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
          }}>
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

function ActionCard({ title, value, subtitle, icon: Icon, color = 'primary', href, linkLabel }) {
  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box
          sx={{
            p: 1.25,
            borderRadius: 2,
            bgcolor: `${color}.light`,
            color: `${color}.main`,
            display: 'flex',
          }}
        >
          <Icon fontSize="small" />
        </Box>
        {href && (
          <Button component={Link} href={href} size="small" sx={{ minWidth: 0, fontSize: '0.75rem' }}>
            {linkLabel || 'View'}
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
            ((stats?.activeEnrollments || 0) + (stats?.completedEnrollments || 0))) *
            100
        )
      : 0;

  const hasPendingItems =
    (stats?.pendingEnrollmentRequests || 0) > 0 || (stats?.pendingPracticumSubmissions || 0) > 0;

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>Admin Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Manage your institution</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/admin/users/create/" variant="outlined" startIcon={<PersonAddIcon />}>Add User</Button>
          <Button component={Link} href="/admin/programs/create/" variant="contained" startIcon={<AddIcon />}>New Program</Button>
        </Stack>
      </Box>

      {/* Row 1 — Platform Overview */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={PeopleIcon} color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Instructors" value={stats?.totalInstructors || 0} icon={SchoolIcon} color="secondary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Active Programs" value={stats?.activePrograms || 0} icon={BusinessIcon} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Active Enrollments" value={stats?.activeEnrollments || 0} icon={AssignmentIcon} color="info" />
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
            subtitle={stats?.pendingEnrollmentRequests > 0 ? 'Awaiting approval' : 'All caught up'}
            icon={GroupAddIcon}
            color={stats?.pendingEnrollmentRequests > 0 ? 'error' : 'success'}
            href="/admin/enrollments/"
            linkLabel="Review"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ActionCard
            title="Pending Practicum Reviews"
            value={stats?.pendingPracticumSubmissions || 0}
            subtitle={stats?.pendingPracticumSubmissions > 0 ? 'Submissions awaiting review' : 'All reviewed'}
            icon={GradingIcon}
            color={stats?.pendingPracticumSubmissions > 0 ? 'warning' : 'success'}
            href="/instructor/practicum/"
            linkLabel="Review"
          />
        </Grid>
      </Grid>

      {/* Row 3 — Quick Actions + Recent Activity */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Button
                component={Link}
                href="/admin/programs/"
                variant="outlined"
                startIcon={<SchoolIcon />}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                Manage Programs
              </Button>
              <Button
                component={Link}
                href="/admin/users/"
                variant="outlined"
                startIcon={<PeopleIcon />}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                Manage Users
              </Button>
              <Button
                component={Link}
                href="/admin/enrollments/"
                variant="outlined"
                startIcon={<PendingActionsIcon />}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
                color={hasPendingItems ? 'error' : 'primary'}
              >
                Enrollment Requests
                {stats?.pendingEnrollmentRequests > 0 && (
                  <Box
                    component="span"
                    sx={{
                      ml: 'auto',
                      bgcolor: 'error.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                sx={{ justifyContent: 'flex-start' }}
              >
                Certificates
              </Button>
              <Button
                component={Link}
                href="/admin/general/"
                variant="outlined"
                startIcon={<SettingsIcon />}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                General Settings
              </Button>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" gutterBottom>Recent Enrollments</Typography>
            {recentActivity?.length > 0 ? (
              <List dense disablePadding>
                {recentActivity.map((activity, index) => (
                  <ListItem key={index} disableGutters sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', color: 'primary.main', fontSize: '0.75rem' }}>
                        {activity.description?.[0] || 'U'}
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
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">No recent activity</Typography>
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
  const role = props.role || auth?.user?.role || 'student';

  const renderContent = () => {
    switch (role) {
      case 'admin':
        return <AdminContent stats={props.stats} recentActivity={props.recentActivity} />;
      case 'instructor':
        return <InstructorContent stats={props.stats} recentSubmissions={props.recentSubmissions} pendingEnrollmentRequests={props.pendingEnrollmentRequests} />;
      default:
        return <StudentContent enrollments={props.enrollments} recentActivity={props.recentActivity} />;
    }
  };

  return (
    <DashboardLayout role={role}>
      <Head title="Dashboard" />
      {renderContent()}
    </DashboardLayout>
  );
}
