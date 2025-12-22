/**
 * Admin Enrollments List Page
 * Requirements: FR-6.1, US-7.1
 */

import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
} from '@mui/material';
import { useState } from 'react';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import VisibilityIcon from '@mui/icons-material/Visibility';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import DataTable from '@/components/DataTable';

const statusColors = {
  active: 'success',
  completed: 'info',
  withdrawn: 'error',
  suspended: 'warning',
};

export default function EnrollmentsIndex({
  enrollments = [],
  programs = [],
  filters = {},
  pagination = {},
}) {
  const [search, setSearch] = useState(filters.search || '');
  const [program, setProgram] = useState(filters.program || '');
  const [status, setStatus] = useState(filters.status || '');

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (program) params.set('program', program);
    if (status) params.set('status', status);

    router.visit(`/admin/enrollments/?${params.toString()}`, {
      only: ['enrollments', 'pagination'],
      preserveState: true,
    });
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page);
    router.visit(`/admin/enrollments/?${params.toString()}`, {
      only: ['enrollments', 'pagination'],
      preserveState: true,
      preserveScroll: true,
    });
  };

  const columns = [
    {
      id: 'userName',
      label: 'Student',
      render: (row) => (
        <Box>
          <Typography fontWeight="medium">{row.userName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.userEmail}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'programName',
      label: 'Program',
    },
    {
      id: 'progressPercent',
      label: 'Progress',
      render: (row) => (
        <Box sx={{ minWidth: 100 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={row.progressPercent}
              sx={{ flex: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption">{row.progressPercent}%</Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          color={statusColors[row.status] || 'default'}
        />
      ),
    },
    {
      id: 'enrolledAt',
      label: 'Enrolled',
      render: (row) => new Date(row.enrolledAt).toLocaleDateString(),
    },
  ];

  const actions = [
    {
      label: 'View Student',
      icon: <VisibilityIcon fontSize="small" />,
      onClick: (row) => router.visit(`/admin/users/${row.userId}/edit/`),
    },
    {
      label: 'Withdraw',
      icon: <PersonRemoveIcon fontSize="small" />,
      onClick: (row) => {
        if (confirm(`Withdraw ${row.userName} from ${row.programName}?`)) {
          router.post(`/admin/enrollments/${row.id}/withdraw/`);
        }
      },
      disabled: (row) => row.status !== 'active',
      color: 'error',
    },
  ];

  return (
    <DashboardLayout role="admin" breadcrumbs={[{ label: 'Enrollments' }]}>
      <Head title="Enrollments" />

      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Enrollments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage student enrollments in programs
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              component={Link}
              href="/admin/enrollments/bulk/"
              variant="outlined"
              startIcon={<GroupAddIcon />}
            >
              Bulk Enroll
            </Button>
            <Button
              component={Link}
              href="/admin/enrollments/create/"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Enroll Student
            </Button>
          </Stack>
        </Box>

        {/* Filters */}
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-end">
              <TextField
                label="Search Student"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={{ minWidth: 200 }}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Program</InputLabel>
                <Select
                  value={program}
                  label="Program"
                  onChange={(e) => setProgram(e.target.value)}
                >
                  <MenuItem value="">All Programs</MenuItem>
                  {programs.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="withdrawn">Withdrawn</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" startIcon={<FilterListIcon />} onClick={handleFilter}>
                Filter
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Enrollments Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <DataTable
            columns={columns}
            rows={enrollments}
            pagination={pagination}
            onPageChange={handlePageChange}
            actions={actions}
            emptyMessage="No enrollments found"
          />
        </motion.div>
      </Stack>
    </DashboardLayout>
  );
}
