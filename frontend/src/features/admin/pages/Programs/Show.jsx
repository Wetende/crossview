/**
 * Admin Program Detail Page
 */

import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import CancelIcon from '@mui/icons-material/Cancel';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useState } from 'react';

export default function ProgramShow({ program, stats, instructors = [], readiness = {} }) {
  const [publishOpen, setPublishOpen] = useState(false);

  const handlePublish = () => {
    router.post(`/admin/programs/${program.id}/publish/`, {}, {
      onSuccess: () => setPublishOpen(false),
    });
  };

  const handleChipClick = () => {
    setPublishOpen(true);
  };

  const StatItem = ({ icon: Icon, value, label, color = 'primary' }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}.lighter`, color: `${color}.main` }}>
        <Icon fontSize="large" />
      </Box>
      <Box>
        <Typography variant="h4" fontWeight="bold" sx={{ lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[
        { label: 'Programs', href: '/admin/programs/' },
        { label: program.name },
      ]}
    >
      <Head title={`Program: ${program.name}`} />

      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Button
              component={Link}
              href="/admin/programs/"
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 1 }}
            >
              Back to Programs
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" fontWeight="bold">
                {program.name}
              </Typography>
              <Chip
                label={program.isPublished ? 'Published' : 'Draft'}
                color={program.isPublished ? 'success' : 'default'}
                onClick={handleChipClick}
                sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                icon={program.isPublished ? <CheckCircleIcon /> : <EditIcon />}
              />
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              component={Link}
              href={`/admin/programs/${program.id}/content/`}
              variant="outlined"
              startIcon={<DescriptionIcon />}
            >
              Content Setup
            </Button>
            <Button
              component={Link}
              href={`/admin/programs/${program.id}/edit/`}
              variant="outlined"
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
            <Button
              component={Link}
              href={`/instructor/programs/${program.id}/manage/`}
              variant="contained"
              startIcon={<AccountTreeIcon />}
            >
              Course Manager
            </Button>
          </Stack>
        </Box>

        {/* Wrapper for Animation */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
        >
            <Stack spacing={3}>
                {/* Stats Strip */}
                <Card>
                  <CardContent>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        divider={<Divider orientation="vertical" flexItem />}
                        spacing={3}
                        justifyContent="space-between"
                        alignItems={{ xs: 'center', md: 'stretch' }}
                    >
                        <StatItem
                            icon={PeopleIcon}
                            value={stats.enrollmentCount}
                            label="Total Enrollments"
                            color="primary"
                        />
                        <StatItem
                            icon={SchoolIcon}
                            value={stats.activeEnrollments}
                            label="Active Students"
                            color="success"
                        />
                        <StatItem
                            icon={CheckCircleIcon}
                            value={stats.completedEnrollments}
                            label="Completed"
                            color="info"
                        />
                    </Stack>
                  </CardContent>
                </Card>

                {/* Meta Details Strip */}
                <Card>
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Program Code
                        </Typography>
                        <Typography variant="body1" fontFamily={FONT_BODY} fontWeight="medium">
                          {program.code || '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Examining Body
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {program.examBody ? `${program.examBody} ${program.officialLevel ? `— ${program.officialLevel}` : ''}` : 'Independent Course'}
                        </Typography>
                      </Grid>
                      {program.awardType && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Award Type
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {program.awardType}
                          </Typography>
                        </Grid>
                      )}
                      {program.assessmentMode && (
                        <Grid item xs={12} sm={6} md={2}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Assessment Mode
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {program.assessmentMode}
                          </Typography>
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6} md={2}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Created On
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {new Date(program.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                          })}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Main Content Layout */}
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Stack spacing={3}>
                        {/* Description */}
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Description
                            </Typography>
                            {program.description ? (
                                <Typography variant="body1" color="text.secondary">
                                  {program.description}
                                </Typography>
                            ) : (
                                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                    No description provided for this program.
                                </Typography>
                            )}
                          </CardContent>
                        </Card>

                        {/* Instructors */}
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Assigned Instructors
                            </Typography>
                            {instructors.length === 0 ? (
                              <Typography color="text.secondary">
                                No instructors assigned yet.
                              </Typography>
                            ) : (
                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Name</TableCell>
                                      <TableCell>Email</TableCell>
                                      <TableCell>Role</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {instructors.map((instructor) => (
                                      <TableRow key={instructor.id}>
                                        <TableCell>{instructor.name}</TableCell>
                                        <TableCell>{instructor.email}</TableCell>
                                        <TableCell>
                                          <Chip
                                            label={instructor.role}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            )}
                          </CardContent>
                        </Card>
                    </Stack>
                  </Grid>
                </Grid>
            </Stack>
        </motion.div>
      </Stack>

      {/* Publish/Readiness Dialog */}
      <Dialog open={publishOpen} onClose={() => setPublishOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
           {program.isPublished ? 'Unpublish Program?' : 'Pre-Publish Checklist'}
        </DialogTitle>
        <DialogContent>
            {program.isPublished ? (
                <Typography>
                    Are you sure you want to unpublish <strong>{program.name}</strong>?
                    This will hide the course and all its content from students immediately.
                </Typography>
            ) : (
                <Stack spacing={2}>
                    <Typography gutterBottom>
                         Review the following requirements before publishing:
                    </Typography>

                    <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                        {readiness.checks && readiness.checks.map((check, index) => (
                            <ListItem key={index}>
                                <ListItemIcon>
                                    {check.passed ? (
                                        <CheckCircleIcon color="success" />
                                    ) : (
                                        <CancelIcon color="error" />
                                    )}
                                </ListItemIcon>
                                <ListItemText
                                    primary={check.label}
                                  secondary={!check.passed && (check.error || "Please complete this requirement before publishing.")}
                                    primaryTypographyProps={{
                                        color: check.passed ? 'text.primary' : 'error.main',
                                        fontWeight: check.passed ? 'medium' : 'bold'
                                    }}
                                />
                            </ListItem>
                        ))}
                    </List>

                    {!readiness.isReady && (
                        <Alert severity="error">
                            You cannot publish this program until all checks pass.
                        </Alert>
                    )}

                    {readiness.isReady && (
                        <Alert severity="success">
                            All systems go! This course is ready to be published.
                        </Alert>
                    )}
                </Stack>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setPublishOpen(false)}>Cancel</Button>
            <Button
                variant="contained"
                color={program.isPublished ? "error" : "success"}
                disabled={!program.isPublished && !readiness.isReady}
                onClick={handlePublish}
                autoFocus
            >
                {program.isPublished ? 'Unpublish' : 'Confirm Publish'}
            </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
