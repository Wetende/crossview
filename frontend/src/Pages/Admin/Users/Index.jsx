/**
 * Admin Users List Page
 * Requirements: FR-5.1, US-6.1
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
} from '@mui/material';
import { useState } from 'react';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockResetIcon from '@mui/icons-material/LockReset';
import DeleteIcon from '@mui/icons-material/Delete';

import DashboardLayout from '@/layouts/DashboardLayout';
import DataTable from '@/components/DataTable';

const roleColors = {
  admin: 'error',
  instructor: 'success',
  student: 'primary',
};

export default function UsersIndex({ users = [], filters = {}, pagination = {} }) {
  const [search, setSearch] = useState(filters.search || '');
  const [role, setRole] = useState(filters.role || '');
  const [status, setStatus] = useState(filters.status || '');

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    if (status) params.set('status', status);

    router.visit(`/admin/users/?${params.toString()}`, {
      only: ['users', 'pagination'],
      preserveState: true,
    });
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page);
    router.visit(`/admin/users/?${params.toString()}`, {
      only: ['users', 'pagination'],
      preserveState: true,
      preserveScroll: true,
    });
  };

  const columns = [
    {
      id: 'fullName',
      label: 'Name',
      render: (row) => (
        <Box>
          <Typography fontWeight="medium">{row.fullName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.email}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'role',
      label: 'Role',
      render: (row) => (
        <Chip
          label={row.role}
          size="small"
          color={roleColors[row.role] || 'default'}
          variant="outlined"
        />
      ),
    },
    {
      id: 'isActive',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          size="small"
          color={row.isActive ? 'success' : 'default'}
        />
      ),
    },
    {
      id: 'dateJoined',
      label: 'Joined',
      render: (row) => new Date(row.dateJoined).toLocaleDateString(),
    },
    {
      id: 'lastLogin',
      label: 'Last Login',
      render: (row) =>
        row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : 'Never',
    },
  ];

  const actions = [
    {
      label: 'Edit',
      icon: <EditIcon fontSize="small" />,
      onClick: (row) => router.visit(`/admin/users/${row.id}/edit/`),
    },
    {
      label: 'Reset Password',
      icon: <LockResetIcon fontSize="small" />,
      onClick: (row) => {
        if (confirm(`Send password reset email to ${row.email}?`)) {
          router.post(`/admin/users/${row.id}/reset-password/`);
        }
      },
    },
    {
      label: (row) => (row.isActive ? 'Deactivate' : 'Activate'),
      icon: (row) => row.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />,
      onClick: (row) => {
        const action = row.isActive ? 'deactivate' : 'activate';
        if (confirm(`Are you sure you want to ${action} ${row.fullName}?`)) {
          router.post(`/admin/users/${row.id}/deactivate/`);
        }
      },
      color: (row) => row.isActive ? 'warning' : 'success',
    },
    {
      label: 'Delete',
      icon: <DeleteIcon fontSize="small" />,
      onClick: (row) => {
        if (row.role === 'superadmin') {
          alert('Cannot delete superadmin accounts');
          return;
        }
        if (confirm(`Are you sure you want to PERMANENTLY DELETE ${row.fullName}? This action cannot be undone.`)) {
          router.post(`/admin/users/${row.id}/delete/`);
        }
      },
      color: 'error',
    },
  ];

  return (
    <DashboardLayout role="admin" breadcrumbs={[{ label: 'Users' }]}>
      <Head title="Users" />

      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Users
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage students, instructors, and administrators
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/admin/users/create/"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add User
          </Button>
        </Box>

        {/* Filters */}
        <Card>
          <CardContent>
            <Stack 
              direction={{ xs: 'column', md: 'row' }} 
              spacing={2} 
              alignItems={{ xs: 'stretch', md: 'flex-end' }}
            >
              <TextField
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                fullWidth
                sx={{ 
                  minWidth: { xs: '100%', md: 200 },
                  maxWidth: { md: 300 },
                }}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
              />
              <FormControl size="small" fullWidth sx={{ minWidth: { xs: '100%', md: 150 }, maxWidth: { md: 180 } }}>
                <InputLabel>Role</InputLabel>
                <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="instructor">Instructor</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth sx={{ minWidth: { xs: '100%', md: 150 }, maxWidth: { md: 180 } }}>
                <InputLabel>Status</InputLabel>
                <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <Button 
                variant="outlined" 
                startIcon={<FilterListIcon />} 
                onClick={handleFilter}
                fullWidth
                sx={{ 
                  minWidth: { xs: '100%', md: 'auto' },
                  maxWidth: { md: 120 },
                }}
              >
                Filter
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Users Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <DataTable
            columns={columns}
            rows={users}
            pagination={pagination}
            onPageChange={handlePageChange}
            actions={actions}
            emptyMessage="No users found"
          />
        </motion.div>
      </Stack>
    </DashboardLayout>
  );
}
