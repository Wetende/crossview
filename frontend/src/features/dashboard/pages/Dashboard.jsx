/**
 * Unified Dashboard Page
 * Shows different content and menus based on user role
 * Roles: student, instructor, admin, superadmin
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
  Card,
  CardContent,
  CardActions,
  Avatar,
} from '@mui/material';
import { motion } from 'framer-motion';

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
import WarningIcon from '@mui/icons-material/Warning';

import DashboardLayout from '@/layouts/DashboardLayout';

// =============================================================================
// Shared Components
// =============================================================================

function StatCard({ title, value, icon: Icon, color = 'primary', subtitle }) {
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

function UsageBar({ label, used, max, unit = '' }) {
  const percentage = max > 0 ? Math.round((used / max) * 100) : 0;
  const isWarning = percentage >= 80;
  const isError = percentage >= 95;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" color="text.secondary">
          {used.toLocaleString()} / {max.toLocaleString()} {unit}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(percentage, 100)}
        color={isError ? 'error' : isWarning ? 'warning' : 'primary'}
        sx={{ height: 8, borderRadius: 1 }}
      />
    </Box>
  );
}

function ProgressCard({ enrollment }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom noWrap>
          {enrollment.programName}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {enrollment.programCode}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">Progress</Typography>
            <Typography variant="body2" fontWeight="medium">
              {enrollment.progressPercent}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={enrollment.progressPercent}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>
      </CardContent>
      <CardActions>
        <Button
          component={Link}
          href={`/student/programs/${enrollment.id}/`}
          size="small"
        >
          Continue
        </Button>
      </CardActions>
    </Card>
  );
}

// =============================================================================
// Student Dashboard Content
// =============================================================================

function StudentContent({ enrollments, recentActivity }) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          My Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your progress and continue learning
        </Typography>
      </Box>

      {/* Enrollments */}
      <Box>
        <Typography variant="h6" gutterBottom>
          My Programs
        </Typography>
        {enrollments?.length > 0 ? (
          <Grid container spacing={2}>
            {enrollments.map((enrollment, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={enrollment.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProgressCard enrollment={enrollment} />
                </motion.div>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              You are not enrolled in any programs yet.
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Recent Activity */}
      {recentActivity?.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <List dense>
            {recentActivity.map((activity, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={activity.nodeTitle}
                  secondary={`${activity.programName} • ${new Date(activity.completedAt).toLocaleDateString()}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Stack>
  );
}

// =============================================================================
// Instructor Dashboard Content
// =============================================================================

function InstructorContent({ stats, recentSubmissions }) {
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
          <StatCard title="Completion Rate" value={`${stats?.completionRate || 0}%`} icon={TrendingUpIcon} color="info" />
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
    </Stack>
  );
}

// =============================================================================
// Admin Dashboard Content
// =============================================================================

function AdminContent({ stats, usage, recentActivity }) {
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

      {/* Stats */}
      <Grid container spacing={5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={PeopleIcon} color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Active Programs" value={stats?.activePrograms || 0} icon={SchoolIcon} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Certificates" value={stats?.certificatesIssued || 0} icon={CardMembershipIcon} color="warning" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Enrollments" value={stats?.activeEnrollments || 0} icon={AssignmentIcon} color="info" />
        </Grid>
      </Grid>

      {/* Usage & Activity */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Usage & Limits</Typography>
            <UsageBar label="Students" used={usage?.studentsUsed || 0} max={usage?.studentsMax || 100} />
            <UsageBar label="Programs" used={usage?.programsUsed || 0} max={usage?.programsMax || 10} />
            <UsageBar label="Storage" used={usage?.storageUsedMb || 0} max={usage?.storageMaxMb || 5000} unit="MB" />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Recent Activity</Typography>
            {recentActivity?.length > 0 ? (
              <List dense>
                {recentActivity.map((activity, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={activity.description} secondary={activity.timestamp} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">No recent activity</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}

// =============================================================================
// Super Admin Dashboard Content (Single-Platform Mode)
// =============================================================================

function SuperAdminContent({ platformSettings, stats, isSetupRequired }) {
  const settings = platformSettings || {};
  const features = settings.features || {};

  return (
    <Stack spacing={3}>
      {/* Setup Required Alert */}
      {isSetupRequired && (
        <Paper sx={{ p: 3, bgcolor: 'warning.light' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" /> Setup Required
            </Typography>
            <Button component={Link} href="/setup/" variant="contained" size="small">
              Run Setup Wizard
            </Button>
          </Stack>
        </Paper>
      )}

      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {settings.institutionName || 'Platform Dashboard'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {settings.tagline || 'Configure and manage your learning platform'}
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={PeopleIcon} color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title="Programs" value={stats?.totalPrograms || 0} icon={SchoolIcon} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: settings.isSetupComplete ? 'success.light' : 'warning.light' }}>
                {settings.isSetupComplete ? <CheckCircleIcon color="success" /> : <SettingsIcon color="warning" />}
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {settings.deploymentMode || 'Custom'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Deployment Mode
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Quick Actions</Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Button component={Link} href="/superadmin/platform/" variant="contained" startIcon={<SettingsIcon />}>
                Platform Settings
              </Button>
              <Button component={Link} href="/superadmin/presets/" variant="outlined" startIcon={<SchoolIcon />}>
                Blueprints
              </Button>
              <Button component={Link} href="/admin/programs/" variant="outlined" startIcon={<AddIcon />}>
                Manage Programs
              </Button>
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Enabled Features</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {features.certificates && <Button size="small" variant="outlined" color="success">Certificates</Button>}
              {features.practicum && <Button size="small" variant="outlined" color="success">Practicum</Button>}
              {features.gamification && <Button size="small" variant="outlined" color="success">Gamification</Button>}
              {features.self_registration && <Button size="small" variant="outlined" color="success">Self-Registration</Button>}
            </Stack>
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
      case 'superadmin':
        return (
          <SuperAdminContent
            platformSettings={props.platformSettings}
            stats={props.stats}
            isSetupRequired={props.isSetupRequired}
          />
        );
      case 'admin':
        return <AdminContent stats={props.stats} usage={props.usage} recentActivity={props.recentActivity} />;
      case 'instructor':
        return <InstructorContent stats={props.stats} recentSubmissions={props.recentSubmissions} />;
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
