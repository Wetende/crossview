/**
 * Instructor Dashboard Page
 * Requirements: US-1.1, US-1.2, US-1.3
 */

import { Head, Link } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  RateReview as ReviewIcon,
  TrendingUp as TrendingIcon,
  VideoLibrary as VideoIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import InstructorLayout from '../../components/layouts/InstructorLayout';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

function StatCard({ title, value, icon: Icon, color = 'primary', suffix = '' }) {
  return (
    <motion.div {...fadeInUp}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {value}{suffix}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: `${color}.100`, color: `${color}.main`, width: 56, height: 56 }}>
              <Icon />
            </Avatar>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RecentSubmissions({ submissions }) {
  if (!submissions || submissions.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Recent Submissions</Typography>
          <Typography color="text.secondary">No pending submissions</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Recent Submissions</Typography>
          <Button component={Link} href="/instructor/practicum/" size="small">
            View All
          </Button>
        </Stack>
        <List disablePadding>
          {submissions.map((submission, index) => (
            <Box key={submission.id}>
              {index > 0 && <Divider />}
              <ListItem
                component={Link}
                href={`/instructor/practicum/${submission.id}/review/`}
                sx={{ 
                  px: 0, 
                  py: 1.5,
                  '&:hover': { bgcolor: 'action.hover' },
                  borderRadius: 1,
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'secondary.100', color: 'secondary.main' }}>
                    <VideoIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={submission.studentName}
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {submission.nodeTitle}
                      </Typography>
                      <Chip label={submission.type} size="small" variant="outlined" />
                    </Stack>
                  }
                />
                <Typography variant="caption" color="text.secondary">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </Typography>
              </ListItem>
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

function UpcomingDeadlines({ deadlines }) {
  if (!deadlines || deadlines.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Upcoming Deadlines</Typography>
          <Typography color="text.secondary">No upcoming deadlines</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Upcoming Deadlines</Typography>
        <List disablePadding>
          {deadlines.map((deadline, index) => (
            <Box key={deadline.id}>
              {index > 0 && <Divider />}
              <ListItem sx={{ px: 0, py: 1.5 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'warning.100', color: 'warning.main' }}>
                    <ScheduleIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={deadline.title}
                  secondary={deadline.programName}
                />
                <Stack alignItems="flex-end">
                  <Typography variant="caption" color="text.secondary">
                    {new Date(deadline.dueDate).toLocaleDateString()}
                  </Typography>
                  <Chip 
                    label={`${deadline.pendingCount} pending`} 
                    size="small" 
                    color="warning"
                    variant="outlined"
                  />
                </Stack>
              </ListItem>
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Quick Actions</Typography>
        <Stack spacing={1}>
          <Button
            component={Link}
            href="/instructor/practicum/"
            variant="outlined"
            startIcon={<ReviewIcon />}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            Review Submissions
          </Button>
          <Button
            component={Link}
            href="/instructor/programs/"
            variant="outlined"
            startIcon={<SchoolIcon />}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            View Programs
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function InstructorDashboard({ stats, recentSubmissions, upcomingDeadlines }) {
  return (
    <InstructorLayout>
      <Head title="Instructor Dashboard" />
      
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight="bold">
          Dashboard
        </Typography>
        
        {/* Stats Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="My Programs"
              value={stats?.programCount || 0}
              icon={SchoolIcon}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Students"
              value={stats?.totalStudents || 0}
              icon={PeopleIcon}
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Reviews"
              value={stats?.pendingReviews || 0}
              icon={ReviewIcon}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Completion Rate"
              value={stats?.completionRate || 0}
              icon={TrendingIcon}
              color="success"
              suffix="%"
            />
          </Grid>
        </Grid>
        
        {/* Content Grid */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <RecentSubmissions submissions={recentSubmissions} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <QuickActions />
              <UpcomingDeadlines deadlines={upcomingDeadlines} />
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </InstructorLayout>
  );
}
