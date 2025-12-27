/**
 * Platform Settings Page
 * Edit platform configuration after initial setup
 */

import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import SaveIcon from '@mui/icons-material/Save';

const PRESET_COLORS = [
  { primary: '#3B82F6', secondary: '#1E40AF', name: 'Blue' },
  { primary: '#10B981', secondary: '#047857', name: 'Green' },
  { primary: '#8B5CF6', secondary: '#5B21B6', name: 'Purple' },
  { primary: '#F59E0B', secondary: '#D97706', name: 'Amber' },
  { primary: '#EF4444', secondary: '#B91C1C', name: 'Red' },
  { primary: '#EC4899', secondary: '#BE185D', name: 'Pink' },
];

export default function PlatformSettings({ settings, modes, blueprints }) {
  const [formData, setFormData] = useState({
    institutionName: settings?.institutionName || '',
    tagline: settings?.tagline || '',
    contactEmail: settings?.contactEmail || '',
    contactPhone: settings?.contactPhone || '',
    address: settings?.address || '',
    deploymentMode: settings?.deploymentMode || 'custom',
    blueprintId: settings?.activeBlueprintId || '',
    primaryColor: settings?.primaryColor || '#3B82F6',
    secondaryColor: settings?.secondaryColor || '#1E40AF',
  });
  
  const [features, setFeatures] = useState({
    certificates: settings?.features?.certificates ?? true,
    practicum: settings?.features?.practicum ?? true,
    gamification: settings?.features?.gamification ?? false,
    selfRegistration: settings?.features?.self_registration ?? true,
    payments: settings?.features?.payments ?? false,
  });
  
  const [logo, setLogo] = useState(null);
  const [favicon, setFavicon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleColorPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
    }));
  };

  const handleFeatureToggle = (key) => () => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });
    Object.entries(features).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (logo) data.append('logo', logo);
    if (favicon) data.append('favicon', favicon);

    router.post('/superadmin/platform/', data, {
      forceFormData: true,
      onSuccess: () => setSuccess(true),
      onFinish: () => setLoading(false),
    });
  };

  return (
    <DashboardLayout role="superadmin">
      <Head title="Platform Settings" />

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" fontWeight="bold">
              Platform Settings
            </Typography>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>

          {success && (
            <Alert severity="success" onClose={() => setSuccess(false)}>
              Settings saved successfully!
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Institution Info */}
            <Grid item xs={12} md={6}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Institution Information</Typography>
                    <Stack spacing={2}>
                      <TextField
                        label="Institution Name"
                        value={formData.institutionName}
                        onChange={handleChange('institutionName')}
                        fullWidth
                        required
                      />
                      <TextField
                        label="Tagline"
                        value={formData.tagline}
                        onChange={handleChange('tagline')}
                        fullWidth
                      />
                      <TextField
                        label="Contact Email"
                        type="email"
                        value={formData.contactEmail}
                        onChange={handleChange('contactEmail')}
                        fullWidth
                      />
                      <TextField
                        label="Contact Phone"
                        value={formData.contactPhone}
                        onChange={handleChange('contactPhone')}
                        fullWidth
                      />
                      <TextField
                        label="Address"
                        value={formData.address}
                        onChange={handleChange('address')}
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Deployment Mode */}
            <Grid item xs={12} md={6}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Deployment Mode</Typography>
                    <Stack spacing={2}>
                      <FormControl fullWidth>
                        <InputLabel>Mode</InputLabel>
                        <Select
                          value={formData.deploymentMode}
                          label="Mode"
                          onChange={handleChange('deploymentMode')}
                        >
                          {modes?.map((mode) => (
                            <MenuItem key={mode.value} value={mode.value}>
                              {mode.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      {formData.deploymentMode === 'custom' && blueprints?.length > 0 && (
                        <FormControl fullWidth>
                          <InputLabel>Blueprint</InputLabel>
                          <Select
                            value={formData.blueprintId}
                            label="Blueprint"
                            onChange={handleChange('blueprintId')}
                          >
                            <MenuItem value="">None</MenuItem>
                            {blueprints.map((bp) => (
                              <MenuItem key={bp.id} value={bp.id}>{bp.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                      
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Changing mode will update default terminology and feature settings.
                      </Alert>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Branding */}
            <Grid item xs={12} md={6}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Branding</Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Logo</Typography>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setLogo(e.target.files[0])}
                        />
                        {settings?.logo && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Current: {settings.logo}
                          </Typography>
                        )}
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Favicon</Typography>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFavicon(e.target.files[0])}
                        />
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>Color Theme</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {PRESET_COLORS.map((preset) => (
                            <Box
                              key={preset.name}
                              onClick={() => handleColorPreset(preset)}
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1,
                                background: `linear-gradient(135deg, ${preset.primary} 50%, ${preset.secondary} 50%)`,
                                cursor: 'pointer',
                                border: formData.primaryColor === preset.primary ? '3px solid #000' : '1px solid #ccc',
                              }}
                              title={preset.name}
                            />
                          ))}
                        </Stack>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            label="Primary"
                            type="color"
                            value={formData.primaryColor}
                            onChange={handleChange('primaryColor')}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Secondary"
                            type="color"
                            value={formData.secondaryColor}
                            onChange={handleChange('secondaryColor')}
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Features */}
            <Grid item xs={12} md={6}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Features</Typography>
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={<Switch checked={features.certificates} onChange={handleFeatureToggle('certificates')} />}
                        label="Certificates & Verification"
                      />
                      <FormControlLabel
                        control={<Switch checked={features.practicum} onChange={handleFeatureToggle('practicum')} />}
                        label="Practicum / Media Uploads"
                      />
                      <FormControlLabel
                        control={<Switch checked={features.gamification} onChange={handleFeatureToggle('gamification')} />}
                        label="Gamification & Badges"
                      />
                      <FormControlLabel
                        control={<Switch checked={features.selfRegistration} onChange={handleFeatureToggle('selfRegistration')} />}
                        label="Self Registration"
                      />
                      <FormControlLabel
                        control={<Switch checked={features.payments} onChange={handleFeatureToggle('payments')} disabled />}
                        label="Payment Processing (Coming Soon)"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </Stack>
      </form>
    </DashboardLayout>
  );
}
