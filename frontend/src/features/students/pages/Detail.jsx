/**
 * Instructor Student Detail Page
 * Shows a student's enrollments across all of the instructor's programs
 * 
 * Requirements: US-3.2
 */

import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as BackIcon,
  Visibility as ViewIcon,
  Grade as GradeIcon,
  Message as MessageIcon,
  Block as SuspendIcon,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { motion } from 'framer-motion';
import InstructorLayout from '@/layouts/InstructorLayout';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

const statusColors = {
  active: 'success',
  completed: 'primary',
  withdrawn: 'error',
  suspended: 'warning',
  pending: 'info',
};

const statusLabels = {
  active: 'Active',
  suspended: 'Suspended',
  withdrawn: 'Withdrawn',
  completed: 'Completed',
};

export default function InstructorStudentDetail({ student, enrollments = [] }) {
  const [statusDialog, setStatusDialog] = useState({ open: false, enrollmentId: null });
  const [newStatus, setNewStatus] = useState('');
  const [statusError, setStatusError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Read the enrollment from current props so a redirect back after a
  // rejected change refreshes its status and allowed transitions.
  const dialogEnrollment = enrollments.find(
    (enrollment) => enrollment.id === statusDialog.enrollmentId,
  );
  const allowedStatuses = dialogEnrollment?.allowedStatuses || [];
  const canSubmitStatus = allowedStatuses.includes(newStatus) && !submitting;

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard/' },
    { label: 'My Students', href: '/instructor/students/' },
    { label: student?.name || 'Student' },
  ];

  const initials = student?.name
    ? student.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : 'S';

  const handleOpenStatusDialog = (enrollment) => {
    setStatusDialog({ open: true, enrollmentId: enrollment.id });
    setNewStatus('');
    setStatusError('');
  };

  const handleCloseStatusDialog = () => {
    setStatusDialog({ open: false, enrollmentId: null });
    setNewStatus('');
    setStatusError('');
  };

  const handleStatusChange = () => {
    if (!dialogEnrollment || !canSubmitStatus) {
      return;
    }
    setStatusError('');
    router.post(`/instructor/enrollments/${dialogEnrollment.id}/status/`, {
      status: newStatus,
    }, {
      preserveScroll: true,
      onStart: () => setSubmitting(true),
      onSuccess: () => handleCloseStatusDialog(),
      onError: (errors) => {
        setNewStatus('');
        setStatusError(
          errors?.status || 'Could not update the enrollment status.',
        );
      },
      onFinish: () => setSubmitting(false),
    });
  };

  if (!student) {
    return (
      <InstructorLayout breadcrumbs={breadcrumbs}>
        <Head title="Student Not Found" />
        <Typography>Student not found.</Typography>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout breadcrumbs={breadcrumbs}>
      <Head title={`${student.name} - Student Details`} />
      
      <Stack spacing={3}>
        {/* Back Button */}
        <Box>
          <Button
            component={Link}
            href="/instructor/students/"
            startIcon={<BackIcon />}
            size="small"
          >
            Back to Students
          </Button>
        </Box>

        {/* Student Header */}
        <motion.div {...fadeInUp}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: { sm: 'center' } }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'secondary.main', fontSize: 28 }}>
                  {initials}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }} gutterBottom>
                    {student.name}
                  </Typography>
                  <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }} useFlexGap>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="textSecondary">
                        {student.email}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
                <Box>
                  <Chip 
                    label={`${enrollments.length} Program${enrollments.length !== 1 ? 's' : ''}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Button
                    component={Link}
                    href={`/messages/new/?recipient_id=${student.id}`}
                    startIcon={<MessageIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Message Student
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Enrollments */}
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Program Enrollments
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {enrollments.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Program</TableCell>
                        <TableCell>Enrolled</TableCell>
                        <TableCell>Completions</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {enrollments.map((enrollment) => (
                        <TableRow key={enrollment.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {enrollment.programName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(enrollment.enrolledAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {enrollment.completions} items
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={enrollment.status} 
                              size="small" 
                              color={statusColors[enrollment.status] || 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                              <Tooltip title="View Program Progress">
                                <IconButton
                                  component={Link}
                                  href={`/instructor/programs/${enrollment.programId}/`}
                                  size="small"
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Gradebook">
                                <IconButton
                                  component={Link}
                                  href={`/instructor/programs/${enrollment.programId}/gradebook/`}
                                  size="small"
                                  color="primary"
                                >
                                  <GradeIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {enrollment.allowedStatuses?.length > 0 && (
                                <Tooltip title={enrollment.status === 'suspended' ? 'Activate' : 'Suspend'}>
                                  <IconButton
                                    size="small"
                                    color={enrollment.status === 'suspended' ? 'success' : 'warning'}
                                    onClick={() => handleOpenStatusDialog(enrollment)}
                                  >
                                    {enrollment.status === 'suspended' ? (
                                      <ActiveIcon fontSize="small" />
                                    ) : (
                                      <SuspendIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary" variant="body2">
                  No enrollments found for this student in your programs.
                </Typography>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Stack>

      {/* Status Change Dialog */}
      <Dialog open={statusDialog.open} onClose={handleCloseStatusDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Change Enrollment Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Change the enrollment status for {student.name} in {dialogEnrollment?.programName}
          </Typography>
          {allowedStatuses.length > 0 ? (
            <TextField
              select
              fullWidth
              label="New status"
              value={newStatus}
              onChange={(e) => {
                setNewStatus(e.target.value);
                setStatusError('');
              }}
              size="small"
              error={Boolean(statusError)}
              helperText={statusError || ' '}
            >
              {allowedStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {statusLabels[status] || status}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Typography
              variant="body2"
              color={statusError ? 'error' : 'textSecondary'}
              role={statusError ? 'alert' : undefined}
            >
              {statusError || "This enrollment's status can no longer be changed."}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>Cancel</Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            color="primary"
            disabled={!canSubmitStatus}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </InstructorLayout>
  );
}
