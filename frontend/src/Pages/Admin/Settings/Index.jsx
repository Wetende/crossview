/**
 * Admin General Settings Page
 * Requirements: US-10.3, US-10.4, US-10.5
 */

import { Head, Link, useForm } from '@inertiajs/react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  FormControlLabel,
  Switch,
  Divider,
  LinearProgress,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import SettingsIcon from '@mui/icons-material/Settings';
import PaletteIcon from '@mui/icons-material/Palette';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';

import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function SettingsIndex({ platform, settings, subscription }) {
  const { data, setData, post, processing } = useForm({
    registrationEnabled: settings?.registrationEnabled ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/admin/settings/');
  };

  const usagePercent = (used, max) => Math.round((used / max) * 100);

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[{ label: 'Settings' }]}
    >
      <Head title="Settings" />

      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your institution settings
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Platform Info */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Institution Information
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">{platform?.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Subdomain
                      </Typography>
                      <Typography variant="body1">
                        {platform?.subdomain}.crossview.edu
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body1">
                        {platform?.createdAt
                          ? new Date(platform.createdAt).toLocaleDateString()
                          : '-'}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Subscription */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Subscription</Typography>
                    <Chip
                      label={subscription?.tierName || 'Free'}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <Stack spacing={2}>
                    {/* Students Usage */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="body2">Students</Typography>
                        </Box>
                        <Typography variant="body2">
                          {subscription?.currentStudents || 0} / {subscription?.maxStudents || 100}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={usagePercent(
                          subscription?.currentStudents || 0,
                          subscription?.maxStudents || 100
                        )}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Programs Usage */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon fontSize="small" color="action" />
                          <Typography variant="body2">Programs</Typography>
                        </Box>
                        <Typography variant="body2">
                          {subscription?.currentPrograms || 0} / {subscription?.maxPrograms || 10}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={usagePercent(
                          subscription?.currentPrograms || 0,
                          subscription?.maxPrograms || 10
                        )}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Storage Usage */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StorageIcon fontSize="small" color="action" />
                          <Typography variant="body2">Storage</Typography>
                        </Box>
                        <Typography variant="body2">
                          {subscription?.currentStorageMb || 0} MB / {subscription?.maxStorageMb || 5000} MB
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={usagePercent(
                          subscription?.currentStorageMb || 0,
                          subscription?.maxStorageMb || 5000
                        )}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Registration Settings */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card component="form" onSubmit={handleSubmit}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Registration Settings
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={data.registrationEnabled}
                        onChange={(e) => setData('registrationEnabled', e.target.checked)}
                      />
                    }
                    label="Allow public registration"
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    When enabled, new users can register on your institution's portal
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button type="submit" variant="contained" disabled={processing}>
                      {processing ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Links
                  </Typography>
                  <Stack spacing={1}>
                    <Button
                      component={Link}
                      href="/admin/settings/branding/"
                      startIcon={<PaletteIcon />}
                      variant="outlined"
                      fullWidth
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Branding & Appearance
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Stack>
    </DashboardLayout>
  );
}
