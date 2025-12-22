import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, CardContent, Grid, Stack, TextField, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import DashboardLayout from '../../../components/layouts/DashboardLayout';

export default function TenantCreate({ errors: serverErrors, formData }) {
  const { data, setData, post, processing, errors } = useForm({
    name: formData?.name || '',
    subdomain: formData?.subdomain || '',
    adminEmail: formData?.adminEmail || '',
    adminName: formData?.adminName || '',
  });

  const allErrors = { ...serverErrors, ...errors };

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/superadmin/tenants/create/');
  };

  return (
    <DashboardLayout role="superadmin">
      <Head title="Create Tenant" />

      <Stack spacing={3}>
        <Typography variant="h4">Create New Tenant</Typography>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tenant Name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      error={!!allErrors.name}
                      helperText={allErrors.name}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Subdomain"
                      value={data.subdomain}
                      onChange={(e) => setData('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      error={!!allErrors.subdomain}
                      helperText={allErrors.subdomain || 'e.g., crossview → crossview.lms.edu'}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Admin Email"
                      type="email"
                      value={data.adminEmail}
                      onChange={(e) => setData('adminEmail', e.target.value)}
                      error={!!allErrors.adminEmail}
                      helperText={allErrors.adminEmail}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Admin Name"
                      value={data.adminName}
                      onChange={(e) => setData('adminName', e.target.value)}
                      error={!!allErrors.adminName}
                      helperText={allErrors.adminName}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Stack direction="row" spacing={2}>
                      <Button type="submit" variant="contained" disabled={processing}>
                        {processing ? 'Creating...' : 'Create Tenant'}
                      </Button>
                      <Link href="/superadmin/tenants/">
                        <Button>Cancel</Button>
                      </Link>
                    </Stack>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </Stack>
    </DashboardLayout>
  );
}
