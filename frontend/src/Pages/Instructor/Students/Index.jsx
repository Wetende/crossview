/**
 * Instructor Student List Page
 * Requirements: US-3.1, US-3.3
 * 
 * This component handles two use cases:
 * 1. General students list (/instructor/students/) - shows all students across all programs
 * 2. Program-specific students list (when program prop is provided)
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

  // Determine if we're viewing a specific program or all students
  const isProgramView = !!program;
  
  // Handle case where no program is provided (general students list)
  const breadcrumbs = isProgramView ? [
    { label: 'Dashboard', href: '/dashboard/' },
    { label: 'My Programs', href: '/instructor/programs/' },
    { label: program.name, href: `/instructor/programs/${program.id}/` },
    { label: 'Students' },
  ] : [
    { label: 'Dashboard', href: '/dashboard/' },
    { label: 'My Students' },
  ];

  const pageTitle = isProgramView ? `Students - ${program.name}` : 'My Students';

  const handleFilterChange = (newFilters) => {
    const baseUrl = isProgramView 
      ? `/instructor/programs/${program.id}/students/`
      : '/instructor/students/';
    router.visit(baseUrl, {
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

  // Handle both data structures:
  // - Program view: students = { results: [...], pagination: {...} }
  // - General view: students = [{ id, name, email, programs: [...] }, ...]
  const isArrayFormat = Array.isArray(students);
  const studentsList = isArrayFormat ? students : (students?.results || []);
  const pagination = isArrayFormat ? {} : (students?.pagination || {});

  return (
    <InstructorLayout breadcrumbs={breadcrumbs}>
      <Head title={pageTitle} />
      
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight="bold">
          {pageTitle}
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
                {isProgramView && (
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
                )}
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
                    {isProgramView ? (
                      <>
                        <TableCell>Enrolled</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Activity</TableCell>
                      </>
                    ) : (
                      <TableCell>Programs</TableCell>
                    )}
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentsList.length > 0 ? (
                    studentsList.map((student) => (
                      <TableRow key={student.enrollmentId || student.id} hover>
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
                        {isProgramView ? (
                          <>
                            <TableCell>
                              <Typography variant="body2">
                                {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.5} sx={{ minWidth: 120 }}>
                                <Stack direction="row" justifyContent="space-between">
                                  <Typography variant="caption">
                                    {student.progress || 0}%
                                  </Typography>
                                </Stack>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={student.progress || 0} 
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={student.status || 'active'} 
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
                          </>
                        ) : (
                          <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                              {student.programs?.map((prog, idx) => (
                                <Chip
                                  key={idx}
                                  label={prog.name}
                                  size="small"
                                  color={statusColors[prog.status] || 'default'}
                                  variant="outlined"
                                />
                              ))}
                            </Stack>
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <IconButton
                            component={Link}
                            href={isProgramView 
                              ? `/instructor/programs/${program.id}/students/${student.enrollmentId}/`
                              : `/instructor/students/${student.id}/`
                            }
                            size="small"
                          >
                            <ViewIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isProgramView ? 6 : 3} align="center" sx={{ py: 4 }}>
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
