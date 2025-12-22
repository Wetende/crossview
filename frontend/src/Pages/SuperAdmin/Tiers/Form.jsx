import { Head, Link, useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import DashboardLayout from '../../../components/layouts/DashboardLayout';

export default function TierForm({ mode, tier, errors: serverErrors, formData }) {
  const isEdit = mode === 'edit';
  const initialData = tier || formData || {};

  const { data, setData, post, processing, errors } = useForm({
    name: initialData.name || '',
    code: initialData.code || '',
    priceMonthly: initialData.priceMonthly || 0,
    maxStudents: initialData.maxStudents || 100,
    maxPrograms: initialData.maxPrograms || 10,
    maxStorageMb: initialData.maxStorageMb || 5000,
    isActive: initialData.isActive !== false,
  });

  const allErrors = { ...serverErrors, ...errors };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = isEdit ? `/superadmin/tiers/${tier.id}/edit/` : '/superadmin/tiers/create/';
    post(url);
  };

  return (
    <DashboardLayout role="superadmin">
      <Head title={isEdit ? `Edit Tier: ${tier?.name}` : 'Create Tier'} />

      <Stack spacing={3}>
        <Typography variant="h4">{isEdit ? 'Edit Tier' : 'Create New Tier'}</Typography>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tier Name"
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
                      label="Code"
                      value={data.code}
                      onChange={(e) => setData('code', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      error={!!allErrors.code}
                      helperText={allErrors.code || 'Unique identifier (e.g., basic, pro, enterprise)'}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Monthly Price (KES)"
                      type="number"
                      value={data.priceMonthly}
                      onChange={(e) => setData('priceMonthly', parseFloat(e.target.value) || 0)}
                      inputProps={{ min: 0, step: 100 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={data.isActive}
                          onChange={(e) => setData('isActive', e.target.checked)}
                        />
                      }
                      label="Active"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Limits</Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Max Students"
                      type="number"
                      value={data.maxStudents}
                      onChange={(e) => setData('maxStudents', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Max Programs"
                      type="number"
                      value={data.maxPrograms}
                      onChange={(e) => setData('maxPrograms', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Max Storage (MB)"
                      type="number"
                      value={data.maxStorageMb}
                      onChange={(e) => setData('maxStorageMb', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 100 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Stack direction="row" spacing={2}>
                      <Button type="submit" variant="contained" disabled={processing}>
                        {processing ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Tier')}
                      </Button>
                      <Link href="/superadmin/tiers/">
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
