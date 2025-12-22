import { Head, Link, useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import DashboardLayout from '../../../components/layouts/DashboardLayout';

export default function TenantCreate({ tiers, errors: serverErrors, formData }) {
  const { data, setData, post, processing, errors } = useForm({
    name: formData?.name || '',
    subdomain: formData?.subdomain || '',
    adminEmail: formData?.adminEmail || '',
    adminName: formData?.adminName || '',
    tierId: formData?.tierId || '',
  });

  const allErrors = { ...serverErrors, ...errors };
  const selectedTier = tiers?.find(t => t.id === parseInt(data.tierId));

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

                  {selectedTier && (
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>Tier Limits</Typography>
                          <Typography variant="body2">Students: {selectedTier.maxStudents}</Typography>
                          <Typography variant="body2">Programs: {selectedTier.maxPrograms}</Typography>
                          <Typography variant="body2">Storage: {selectedTier.maxStorageMb} MB</Typography>
                          <Typography variant="body2" color="primary">
                            Price: KES {selectedTier.priceMonthly}/month
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

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
