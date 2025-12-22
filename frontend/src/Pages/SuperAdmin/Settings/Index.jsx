import { Head, useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import DashboardLayout from '../../../components/layouts/DashboardLayout';

export default function SuperAdminSettings({ settings }) {
  const { data, setData, post, processing } = useForm({
    platformName: settings?.platformName || 'Crossview LMS',
    supportEmail: settings?.supportEmail || '',
    maintenanceMode: settings?.maintenanceMode || false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/superadmin/settings/');
  };

  return (
    <DashboardLayout role="superadmin">
      <Head title="Platform Settings" />

      <Stack spacing={3}>
        <Typography variant="h4">Platform Settings</Typography>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Platform Name"
                      value={data.platformName}
                      onChange={(e) => setData('platformName', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Support Email"
                      type="email"
                      value={data.supportEmail}
                      onChange={(e) => setData('supportEmail', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={data.maintenanceMode}
                          onChange={(e) => setData('maintenanceMode', e.target.checked)}
                          color="warning"
                        />
                      }
                      label="Maintenance Mode"
                    />
                    <Typography variant="body2" color="text.secondary">
                      When enabled, only super admins can access the platform
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Button type="submit" variant="contained" disabled={processing}>
                      {processing ? 'Saving...' : 'Save Settings'}
                    </Button>
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
