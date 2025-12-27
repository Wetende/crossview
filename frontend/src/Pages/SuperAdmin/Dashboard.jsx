/**
 * SuperAdmin Dashboard - Single-Tenant Mode
 * Shows platform configuration and basic stats
 */

import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Button,
  Chip,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layouts/DashboardLayout';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import BrushIcon from '@mui/icons-material/Brush';
import TuneIcon from '@mui/icons-material/Tune';
import ArchitectureIcon from '@mui/icons-material/Architecture';

function StatCard({ title, value, icon: Icon, color = 'primary' }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              color: `${color}.main`,
            }}
          >
            <Icon />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function FeatureChip({ label, enabled }) {
  return (
    <Chip
      label={label}
      size="small"
      color={enabled ? 'success' : 'default'}
      variant={enabled ? 'filled' : 'outlined'}
      icon={enabled ? <CheckCircleIcon /> : undefined}
    />
  );
}

const MODE_LABELS = {
  tvet: 'TVET Institution (CDACC)',
  theology: 'Theology/Bible School',
  nita: 'NITA Trade Test',
  driving: 'Driving School (NTSA)',
  cbc: 'CBC K-12 School',
  online: 'Online Courses (Self-Paced)',
  custom: 'Custom Configuration',
};

export default function SuperAdminDashboard({ platformSettings, stats, isSetupRequired }) {
  const settings = platformSettings || {};
  const features = settings.features || {};

  return (
    <DashboardLayout role="superadmin">
      <Head title="Platform Dashboard" />

      <Stack spacing={3}>
        {/* Setup Required Alert */}
        {isSetupRequired && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              action={
                <Button
                  color="inherit"
                  size="small"
                  component={Link}
                  href="/setup/"
                >
                  Run Setup Wizard
                </Button>
              }
            >
              <strong>Setup Required:</strong> Complete the setup wizard to configure your platform.
            </Alert>
          </motion.div>
        )}

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {settings.institutionName || 'Platform Dashboard'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {settings.tagline || 'Configure and manage your learning platform'}
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/superadmin/platform/"
            variant="outlined"
            startIcon={<SettingsIcon />}
          >
            Edit Settings
          </Button>
        </Box>

        {/* Stats */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={PeopleIcon} color="primary" />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <StatCard title="Programs" value={stats?.totalPrograms || 0} icon={SchoolIcon} color="success" />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: settings.isSetupComplete ? 'success.light' : 'warning.light',
                        color: settings.isSetupComplete ? 'success.main' : 'warning.main',
                      }}
                    >
                      {settings.isSetupComplete ? <CheckCircleIcon /> : <WarningIcon />}
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {settings.isSetupComplete ? 'Configured' : 'Pending'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Setup Status
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Platform Configuration */}
        <Grid container spacing={3}>
          {/* Deployment Mode */}
          <Grid item xs={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <TuneIcon color="primary" />
                    <Typography variant="h6">Deployment Mode</Typography>
                  </Stack>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="h6" fontWeight="bold">
                      {MODE_LABELS[settings.deploymentMode] || 'Not Set'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mode: {settings.deploymentMode || 'custom'}
                    </Typography>
                  </Paper>
                  <Button
                    component={Link}
                    href="/superadmin/platform/"
                    size="small"
                    sx={{ mt: 2 }}
                  >
                    Change Mode
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Branding Preview */}
          <Grid item xs={12} md={6}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <BrushIcon color="primary" />
                    <Typography variant="h6">Branding</Typography>
                  </Stack>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${settings.primaryColor || '#3B82F6'} 0%, ${settings.secondaryColor || '#1E40AF'} 100%)`,
                      color: '#fff',
                      textAlign: 'center',
                    }}
                  >
                    {settings.logo ? (
                      <Box
                        component="img"
                        src={settings.logo}
                        alt="Logo"
                        sx={{ maxHeight: 60, maxWidth: '100%', mb: 1 }}
                      />
                    ) : (
                      <Typography variant="h5" fontWeight="bold">
                        {settings.institutionName || 'Your Logo'}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {settings.tagline || 'Your Tagline'}
                    </Typography>
                  </Box>
                  <Button
                    component={Link}
                    href="/superadmin/platform/"
                    size="small"
                    sx={{ mt: 2 }}
                  >
                    Update Branding
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Enabled Features */}
          <Grid item xs={12}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <ArchitectureIcon color="primary" />
                    <Typography variant="h6">Enabled Features</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <FeatureChip label="Certificates" enabled={features.certificates} />
                    <FeatureChip label="Practicum" enabled={features.practicum} />
                    <FeatureChip label="Gamification" enabled={features.gamification} />
                    <FeatureChip label="Self Registration" enabled={features.self_registration} />
                    <FeatureChip label="Payments" enabled={features.payments} />
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Manage these features in{' '}
                    <Link href="/superadmin/platform/" style={{ color: 'inherit' }}>
                      Platform Settings
                    </Link>
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button
                  component={Link}
                  href="/superadmin/platform/"
                  variant="contained"
                  startIcon={<SettingsIcon />}
                >
                  Platform Settings
                </Button>
                <Button
                  component={Link}
                  href="/superadmin/presets/"
                  variant="outlined"
                  startIcon={<ArchitectureIcon />}
                >
                  Manage Blueprints
                </Button>
                <Button
                  component={Link}
                  href="/admin/programs/"
                  variant="outlined"
                  startIcon={<SchoolIcon />}
                >
                  Manage Programs
                </Button>
                <Button
                  component={Link}
                  href="/admin/users/"
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                >
                  Manage Users
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
      </Stack>
    </DashboardLayout>
  );
}
