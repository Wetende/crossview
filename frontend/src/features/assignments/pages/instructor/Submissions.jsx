/**
 * Instructor Assignment Submissions
 * Lists all student submissions for an assignment with status indicators
 * Design matches MasterStudy LMS reference
 */

import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Divider,
  Stack,
  IconButton,
  Pagination,
} from '@mui/material';
import {
  IconSearch,
  IconCheck,
  IconX,
  IconClock,
  IconArrowLeft,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

import DashboardLayout from '@/layouts/DashboardLayout';

// Status configuration
const STATUS_CONFIG = {
  submitted: { label: 'Pending', icon: IconClock, color: '#6b7280' },
  graded: { label: 'Passed', icon: IconCheck, color: '#10b981' }, // Will be overridden based on score
  returned: { label: 'Returned', icon: IconClock, color: '#f59e0b' },
};

export default function Submissions({ assignment, submissions = [], filter = 'all' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(filter);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const breadcrumbs = [
    { label: 'Assignments', href: '/instructor/assignments/' },
    { label: assignment.title },
  ];

  // Filter submissions based on search and status
  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch = searchTerm === '' || 
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'pending') return matchesSearch && s.status === 'submitted';
    if (statusFilter === 'passed') return matchesSearch && s.status === 'graded' && s.score >= 50;
    if (statusFilter === 'failed') return matchesSearch && s.status === 'graded' && s.score < 50;
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / perPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const getStatusDisplay = (submission) => {
    if (submission.status === 'submitted') {
      return { label: 'Pending', icon: IconClock, color: '#6b7280' };
    }
    if (submission.status === 'graded') {
      if (submission.score >= 50) {
        return { label: 'Passed', icon: IconCheck, color: '#10b981' };
      } else {
        return { label: 'Non Passed', icon: IconX, color: '#ef4444' };
      }
    }
    return STATUS_CONFIG[submission.status] || { label: submission.status, icon: IconClock, color: '#6b7280' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '.');
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} role="instructor">
      <Head title={`Student assignments: ${assignment.title}`} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              p: 3,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton
                component={Link}
                href="/instructor/assignments/"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <IconArrowLeft size={20} />
              </IconButton>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                Student assignments
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              {/* Search */}
              <TextField
                size="small"
                placeholder="Search by name"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconSearch size={18} style={{ opacity: 0.5 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 200 }}
              />

              {/* Status Filter */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={statusFilter}
                  onChange={handleFilterChange}
                  displayEmpty
                >
                  <MenuItem value="all">Status: all</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="passed">Passed</MenuItem>
                  <MenuItem value="failed">Non Passed</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <Divider />

          {/* Submissions Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Student name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Course
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Date ↕
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Attempt number ↕
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Status ↕
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        No submissions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSubmissions.map((submission) => {
                    const statusDisplay = getStatusDisplay(submission);
                    const StatusIcon = statusDisplay.icon;

                    return (
                      <TableRow key={submission.id} hover>
                        <TableCell>
                          <Box>
                            <Typography
                              sx={{
                                fontWeight: 500,
                                color: 'primary.main',
                              }}
                            >
                              {submission.studentName} on
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: 'primary.main' }}
                            >
                              "{assignment.title}"
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            — {assignment.programName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>
                            {formatDate(submission.submittedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>1</Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <StatusIcon size={16} color={statusDisplay.color} />
                            <Typography sx={{ color: statusDisplay.color }}>
                              {statusDisplay.label}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            component={Link}
                            href={`/instructor/submissions/${submission.id}/grade/`}
                            variant="outlined"
                            size="small"
                            sx={{ borderRadius: 1, textTransform: 'none' }}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <>
              <Divider />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                }}
              >
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                  shape="rounded"
                />
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(e.target.value);
                      setPage(1);
                    }}
                  >
                    <MenuItem value={10}>10 per page</MenuItem>
                    <MenuItem value={25}>25 per page</MenuItem>
                    <MenuItem value={50}>50 per page</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </>
          )}
        </Paper>
      </motion.div>
    </DashboardLayout>
  );
}
