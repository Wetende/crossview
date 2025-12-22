import { Head, Link } from '@inertiajs/react';
import { Box, Card, CardContent, Grid, Stack, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import GrowthChart from '../../components/charts/GrowthChart';

export default function SuperAdminDashboard({ stats, tenantGrowth, userGrowth, recentTenants }) {
  return (
    <DashboardLayout role="superadmin">
      <Head title="Super Admin Dashboard" />

      <Stack spacing={3}>
        <Typography variant="h4">Platform Overview</Typography>

        {/* Stats Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Total Tenants</Typography>
                  <Typography variant="h3">{stats?.totalTenants || 0}</Typography>
                  <Typography variant="body2" color="success.main">{stats?.activeTenants || 0} active</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Total Users</Typography>
                  <Typography variant="h3">{stats?.totalUsers || 0}</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Active Rate</Typography>
                  <Typography variant="h3">
                    {stats?.totalTenants > 0 ? Math.round((stats.activeTenants / stats.totalTenants) * 100) : 0}%
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Tenant Growth</Typography>
                  <Box sx={{ height: 300 }}>
                    <GrowthChart
                      data={tenantGrowth}
                      dataKey="count"
                      label="Tenants"
                      color="#2563EB"
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>User Growth</Typography>
                  <Box sx={{ height: 300 }}>
                    <GrowthChart
                      data={userGrowth}
                      dataKey="count"
                      label="Users"
                      color="#7C3AED"
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Recent Tenants */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Tenants</Typography>
                <Link href="/superadmin/tenants/">
                  <Typography color="primary" sx={{ cursor: 'pointer' }}>View All</Typography>
                </Link>
              </Stack>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Subdomain</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTenants?.map((tenant) => (
                    <TableRow key={tenant.id} hover>
                      <TableCell>
                        <Link href={`/superadmin/tenants/${tenant.id}/`}>
                          <Typography color="primary" sx={{ cursor: 'pointer' }}>{tenant.name}</Typography>
                        </Link>
                      </TableCell>
                      <TableCell>{tenant.subdomain}</TableCell>
                      <TableCell>
                        <Chip
                          label={tenant.isActive ? 'Active' : 'Inactive'}
                          color={tenant.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </Stack>
    </DashboardLayout>
  );
}
