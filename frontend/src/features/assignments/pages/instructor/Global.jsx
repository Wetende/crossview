/**
 * Instructor Global Assignments Index
 * Lists all assignments across instructor's programs with stats
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
} from '@mui/material';
import {
  IconSearch,
  IconCheck,
  IconX,
  IconClock,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

import DashboardLayout from '@/layouts/DashboardLayout';

export default function Global({ assignments = [], search = '', filter = 'all' }) {
  const [searchTerm, setSearchTerm] = useState(search);
  const [statusFilter, setStatusFilter] = useState(filter);

  const breadcrumbs = [{ label: 'Assignments' }];

  const handleSearch = (e) => {
    e.preventDefault();
    router.visit(`/instructor/assignments/?search=${searchTerm}&status=${statusFilter}`, {
      preserveState: true,
    });
  };

  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setStatusFilter(newFilter);
    router.visit(`/instructor/assignments/?search=${searchTerm}&status=${newFilter}`, {
      preserveState: true,
    });
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} role="instructor">
      <Head title="Assignments" />
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
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                Assignments
              </Typography>
              <Divider sx={{ width: 40, borderBottomWidth: 3, borderColor: 'primary.main', mt: 1 }} />
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              {/* Search */}
              <form onSubmit={handleSearch}>
                <TextField
                  size="small"
                  placeholder="Search by assignment"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconSearch size={18} style={{ opacity: 0.5 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 200 }}
                />
              </form>

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
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <Divider />

          {/* Assignments Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Assignment
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Total ↕
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Passed ↕
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Non passed ↕
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Pending ↕
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        No assignments found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id} hover>
                      <TableCell>
                        <Box>
                          <Typography
                            component={Link}
                            href={`/instructor/assignments/${assignment.id}/submissions/`}
                            sx={{
                              fontWeight: 500,
                              color: 'primary.main',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {assignment.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            — {assignment.programName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography color="text.secondary">
                          Total: {assignment.totalCount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconCheck size={16} color="#10b981" />
                          <Typography sx={{ color: '#10b981' }}>
                            Passed: {assignment.passedCount}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconX size={16} color="#ef4444" />
                          <Typography sx={{ color: '#ef4444' }}>
                            Non passed: {assignment.failedCount}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <IconClock size={16} color="#6b7280" />
                          <Typography color="text.secondary">
                            Pending: {assignment.pendingCount}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          component={Link}
                          href={`/instructor/assignments/${assignment.id}/submissions/`}
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 1, textTransform: 'none' }}
                        >
                          More
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </motion.div>
    </DashboardLayout>
  );
}
