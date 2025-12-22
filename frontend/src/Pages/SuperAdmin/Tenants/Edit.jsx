import { Head, Link, useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import DashboardLayout from '../../../components/layouts/DashboardLayout';

export default function TenantEdit({ tenant, tiers, errors: serverErrors }) {
  const { data, setData, post, processing, errors } = useForm({
    name: tenant?.name || '',
    subdomain: tenant?.subdomain || '',
    adminEmail: tenant?.adminEmail || '',
    tierId: tenant?.tierId || '',
  });

  const allErrors = { ...serverErrors, ...errors };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(`/superadmin/tenants/${tenant.id}/edit/`);
  };

  return (
    <DashboardLayout role="superadmin">
      <Head title={`Edit Tenant: ${tenant?.name}`} />

      <Stack spacing={3}>
        <Typography variant="h4">Edit Tenant</Typography>

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
                      helperText={allErrors.subdomain}
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
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Subscription Tier</InputLabel>
                      <Select
                        value={data.tierId}
                        label="Subscription Tier"
                        onChange={(e) => setData('tierId', e.target.value)}
                      >
                        <MenuItem value="">Free (Default)</MenuItem>
                        {tiers?.map((tier) => (
                          <MenuItem key={tier.id} value={tier.id}>{tier.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Stack direction="row" spacing={2}>
                      <Button type="submit" variant="contained" disabled={processing}>
                        {processing ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Link href={`/superadmin/tenants/${tenant?.id}/`}>
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
