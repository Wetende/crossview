/**
 * Instructor Practicum List Page
 * Requirements: US-5.1
 */

import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Stack,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from '@mui/material';
import { motion } from 'framer-motion';
import RateReviewIcon from '@mui/icons-material/RateReview';

import InstructorLayout from '../../../components/layouts/InstructorLayout';

const statusColors = {
  pending: 'warning',
  approved: 'success',
  revision_required: 'info',
  rejected: 'error',
};

const statusLabels = {
  pending: 'Pending Review',
  approved: 'Approved',
  revision_required: 'Revision Required',
  rejected: 'Rejected',
};

export default function PracticumIndex({ submissions, filters, programs }) {
  const handleFilterChange = (key, value) => {
    router.visit('/instructor/practicum/', {
      data: { ...filters, [key]: value, page: 1 },
      only: ['submissions', 'filters'],
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handlePageChange = (event, page) => {
    router.visit('/instructor/practicum/', {
      data: { ...filters, page },
      only: ['submissions', 'filters'],
      preserveState: true,
      preserveScroll: true,
    });
  };

  const breadcrumbs = [{ label: 'Practicum Submissions' }];

  return (
    <InstructorLayout breadcrumbs={breadcrumbs}>
      <Head title="Practicum Submissions" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <Stack spacing={3}>
          {/* Header */}
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Practicum Submissions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review student practicum submissions
            </Typography>
          </Box>

          {/* Filters */}
          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || 'pending'}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="revision_required">Revision Required</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Program</InputLabel>
                <Select
                  value={filters.program || ''}
                  label="Program"
                  onChange={(e) => handleFilterChange('program', e.target.value)}
                >
                  <MenuItem value="">All Programs</MenuItem>
                  {programs.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          {/* Submissions Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Program</TableCell>
                  <TableCell>Assignment</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.results.map((submission) => (
                  <TableRow key={submission.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {submission.studentName}
                      </Typography>
                    </TableCell>
                    <TableCell>{submission.programName}</TableCell>
                    <TableCell>{submission.nodeTitle}</TableCell>
                    <TableCell>
                      <Chip
                        label={submission.type?.toUpperCase() || 'FILE'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[submission.status] || submission.status}
                        color={statusColors[submission.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        component={Link}
                        href={`/instructor/practicum/${submission.id}/review/`}
                        size="small"
                        startIcon={<RateReviewIcon />}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {submissions.results.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No submissions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {submissions.pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={submissions.pagination.totalPages}
                page={submissions.pagination.page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </Stack>
      </motion.div>
    </InstructorLayout>
  );
}
