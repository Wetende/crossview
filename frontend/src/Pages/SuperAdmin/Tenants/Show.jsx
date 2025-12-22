import { Head, Link, router } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import DashboardLayout from '../../../components/layouts/DashboardLayout';

export default function TenantShow({ tenant, stats, admin }) {
  return (
    <DashboardLayout role="superadmin">
      <Head title={`Tenant: ${tenant.name}`} />

      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4">{tenant.name}</Typography>
            <Typography color="text.secondary">{tenant.subdomain}.crossview.edu</Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Link href={`/superadmin/tenants/${tenant.id}/edit/`}>
              <Button variant="outlined">Edit</Button>
            </Link>
            <Button
              variant="outlined"
              color={tenant.isActive ? 'warning' : 'success'}
              onClick={() => router.post(`/superadmin/tenants/${tenant.id}/suspend/`)}
            >
              {tenant.isActive ? 'Suspend' : 'Activate'}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => router.post(`/superadmin/tenants/${tenant.id}/impersonate/`)}
            >
              Impersonate Admin
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {/* Tenant Info */}
          <Grid item xs={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Tenant Information</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip
                        label={tenant.isActive ? 'Active' : 'Inactive'}
                        color={tenant.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Admin Email</Typography>
                      <Typography>{tenant.adminEmail}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Created</Typography>
                      <Typography>{new Date(tenant.createdAt).toLocaleDateString()}</Typography>
                    </Box>
                    {tenant.activatedAt && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Activated</Typography>
                        <Typography>{new Date(tenant.activatedAt).toLocaleDateString()}</Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Stats */}
          <Grid item xs={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Statistics</Typography>
                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Typography variant="h4">{stats?.userCount || 0}</Typography>
                      <Typography variant="body2" color="text.secondary">Total Users</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4">{stats?.programCount || 0}</Typography>
                      <Typography variant="body2" color="text.secondary">Programs</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Admin User */}
          {admin?.id && (
            <Grid item xs={12} md={6}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Admin User</Typography>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography>{admin.name || 'Not set'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography>{admin.email}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          )}
        </Grid>

        <Box>
          <Link href="/superadmin/tenants/">
            <Button>← Back to Tenants</Button>
          </Link>
        </Box>
      </Stack>
    </DashboardLayout>
  );
}
