/**
 * Instructor Student List Page
 * Requirements: US-3.1, US-3.3
 */

import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { motion } from 'framer-motion';
import InstructorLayout from '../../../components/layouts/InstructorLayout';

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
};

export default function InstructorStudentsIndex({ program, students, filters }) {
  const [search, setSearch] = useState(filters?.search || '');
  const [status, setStatus] = useState(filters?.status || '');

  const breadcrumbs = [
    { label: 'Dashboard', href: '/instructor/dashboard/' },
    { label: 'My Programs', href: '/instructor/programs/' },
    { label: program.name, href: `/instructor/programs/${program.id}/` },
    { label: 'Students' },
  ];

  const handleFilterChange = (newFilters) => {
    router.visit(`/instructor/programs/${program.id}/students/`, {
      data: { ...filters, ...newFilters },
      preserveState: true,
      preserveScroll: true,
      only: ['students', 'filters'],
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleFilterChange({ search, page: 1 });
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    handleFilterChange({ status: newStatus, page: 1 });
  };

  const handlePageChange = (event, newPage) => {
    handleFilterChange({ page: newPage + 1 });
  };

  const { results = [], pagination = {} } = students || {};

  return (
    <InstructorLayout breadcrumbs={breadcrumbs}>
      <Head title={`Students - ${program.name}`} />
      
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight="bold">
          Students - {program.name}
        </Typography>
        
        {/* Filters */}
        <motion.div {...fadeInUp}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box component="form" onSubmit={handleSearchSubmit} sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <TextField
                  select
                  size="small"
                  value={status}
                  onChange={handleStatusChange}
                  sx={{ minWidth: 150 }}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="withdrawn">Withdrawn</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </TextField>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Students Table */}
        <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Enrolled</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Activity</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.length > 0 ? (
                    results.map((student) => (
                      <TableRow key={student.enrollmentId} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {student.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {student.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(student.enrolledAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5} sx={{ minWidth: 120 }}>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="caption">
                                {student.progress}%
                              </Typography>
                            </Stack>
                            <LinearProgress 
                              variant="determinate" 
                              value={student.progress} 
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={student.status} 
                            size="small" 
                            color={statusColors[student.status] || 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {student.lastActivity 
                              ? new Date(student.lastActivity).toLocaleDateString()
                              : 'No activity'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            component={Link}
                            href={`/instructor/programs/${program.id}/students/${student.enrollmentId}/`}
                            size="small"
                          >
                            <ViewIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No students found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {pagination.totalCount > 0 && (
              <TablePagination
                component="div"
                count={pagination.totalCount}
                page={(pagination.page || 1) - 1}
                rowsPerPage={pagination.perPage || 20}
                onPageChange={handlePageChange}
                rowsPerPageOptions={[20]}
              />
            )}
          </Card>
        </motion.div>
      </Stack>
    </InstructorLayout>
  );
}
