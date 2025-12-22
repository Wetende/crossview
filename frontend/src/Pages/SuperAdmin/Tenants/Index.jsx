import { Head, Link, router } from '@inertiajs/react';
import { Button, Card, CardContent, Chip, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../../../components/layouts/DashboardLayout';
import DataTable from '../../../components/DataTable';

export default function TenantsIndex({ tenants, filters, pagination }) {
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || '');

  const handleFilter = () => {
    router.visit('/superadmin/tenants/', {
      data: { search, status },
      preserveState: true,
    });
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      render: (row) => (
        <Link href={`/superadmin/tenants/${row.id}/`}>
          <Typography color="primary" sx={{ cursor: 'pointer' }}>{row.name}</Typography>
        </Link>
      )
    },
    { field: 'subdomain', headerName: 'Subdomain' },
    { field: 'adminEmail', headerName: 'Admin Email' },
    { field: 'userCount', headerName: 'Users' },
    { field: 'programCount', headerName: 'Programs' },
    {
      field: 'isActive',
      headerName: 'Status',
      render: (row) => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          color={row.isActive ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      render: (row) => (
        <Stack direction="row" spacing={1}>
          <Link href={`/superadmin/tenants/${row.id}/edit/`}>
            <Button size="small">Edit</Button>
          </Link>
          <Button
            size="small"
            color={row.isActive ? 'warning' : 'success'}
            onClick={() => router.post(`/superadmin/tenants/${row.id}/suspend/`)}
          >
            {row.isActive ? 'Suspend' : 'Activate'}
          </Button>
          <Button
            size="small"
            color="secondary"
            onClick={() => router.post(`/superadmin/tenants/${row.id}/impersonate/`)}
          >
            Impersonate
          </Button>
        </Stack>
      )
    },
  ];

  return (
    <DashboardLayout role="superadmin">
      <Head title="Manage Tenants" />

      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Tenants</Typography>
          <Link href="/superadmin/tenants/create/">
            <Button variant="contained" startIcon={<AddIcon />}>Add Tenant</Button>
          </Link>
        </Stack>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-end">
                <TextField
                  label="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="small"
                  sx={{ minWidth: 200 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="outlined" onClick={handleFilter}>Filter</Button>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <DataTable
            columns={columns}
            rows={tenants}
            pagination={pagination}
            onPageChange={(page) => router.visit('/superadmin/tenants/', { data: { ...filters, page }, preserveState: true })}
          />
        </motion.div>
      </Stack>
    </DashboardLayout>
  );
}
