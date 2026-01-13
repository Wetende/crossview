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
  Grid,
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

export default function InstructorStudentDetail({ student, enrollments = [] }) {
  const [statusDialog, setStatusDialog] = useState({ open: false, enrollment: null });
  const [newStatus, setNewStatus] = useState('');

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
    setStatusDialog({ open: true, enrollment });
    setNewStatus(enrollment.status);
  };

  const handleCloseStatusDialog = () => {
    setStatusDialog({ open: false, enrollment: null });
    setNewStatus('');
  };

  const handleStatusChange = () => {
    if (statusDialog.enrollment && newStatus) {
      router.post(`/instructor/enrollments/${statusDialog.enrollment.id}/status/`, {
        status: newStatus,
      }, {
        preserveScroll: true,
        onSuccess: () => handleCloseStatusDialog(),
      });
    }
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'secondary.main', fontSize: 28 }}>
                  {initials}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {student.name}
                  </Typography>
                  <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
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
                            <Typography variant="body2" fontWeight="medium">
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
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" variant="body2">
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Change the enrollment status for {student.name} in {statusDialog.enrollment?.programName}
          </Typography>
          <TextField
            select
            fullWidth
            label="Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            size="small"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
            <MenuItem value="withdrawn">Withdrawn</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>Cancel</Button>
          <Button onClick={handleStatusChange} variant="contained" color="primary">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </InstructorLayout>
  );
}
