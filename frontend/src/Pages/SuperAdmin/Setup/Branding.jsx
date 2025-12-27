import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
  Grid,
} from '@mui/material';
import { motion } from 'framer-motion';

const STEPS = ['Institution', 'Mode', 'Branding', 'Features'];

const PRESET_COLORS = [
  { primary: '#3B82F6', secondary: '#1E40AF', name: 'Blue' },
  { primary: '#10B981', secondary: '#047857', name: 'Green' },
  { primary: '#8B5CF6', secondary: '#5B21B6', name: 'Purple' },
  { primary: '#F59E0B', secondary: '#D97706', name: 'Amber' },
  { primary: '#EF4444', secondary: '#B91C1C', name: 'Red' },
  { primary: '#EC4899', secondary: '#BE185D', name: 'Pink' },
];

export default function SetupBranding({ step, totalSteps, settings }) {
  const [formData, setFormData] = useState({
    primaryColor: settings?.primaryColor || '#3B82F6',
    secondaryColor: settings?.secondaryColor || '#1E40AF',
    customCss: settings?.customCss || '',
  });
  const [logo, setLogo] = useState(null);
  const [favicon, setFavicon] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleColorPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    data.append('primaryColor', formData.primaryColor);
    data.append('secondaryColor', formData.secondaryColor);
    data.append('customCss', formData.customCss);
    if (logo) data.append('logo', logo);
    if (favicon) data.append('favicon', favicon);

    router.post('/setup/branding/', data, {
      forceFormData: true,
      onFinish: () => setLoading(false),
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1e3a5f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Head title="Setup - Branding" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ maxWidth: 700, width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom align="center" fontWeight="bold">
              🎨 Branding Setup
            </Typography>

            <Stepper activeStep={step - 1} sx={{ mb: 4 }}>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Typography variant="h6" gutterBottom>
              Step {step}: Brand Your Platform
            </Typography>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Logo Upload */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Institution Logo
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogo(e.target.files[0])}
                  />
                  {settings?.logo && (
                    <Box mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        Current: {settings.logo}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Favicon Upload */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Favicon (Browser Tab Icon)
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFavicon(e.target.files[0])}
                  />
                </Box>

                {/* Color Presets */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Color Theme
                  </Typography>
                  <Grid container spacing={1}>
                    {PRESET_COLORS.map((preset) => (
                      <Grid item key={preset.name}>
                        <Box
                          onClick={() => handleColorPreset(preset)}
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: 1,
                            background: `linear-gradient(135deg, ${preset.primary} 50%, ${preset.secondary} 50%)`,
                            cursor: 'pointer',
                            border: formData.primaryColor === preset.primary ? '3px solid #000' : '1px solid #ccc',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.1)' },
                          }}
                          title={preset.name}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Custom Colors */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Primary Color"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      fullWidth
                      InputProps={{ sx: { height: 56 } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Secondary Color"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                      fullWidth
                      InputProps={{ sx: { height: 56 } }}
                    />
                  </Grid>
                </Grid>

                {/* Preview */}
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${formData.primaryColor} 0%, ${formData.secondaryColor} 100%)`,
                    color: '#fff',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h6">Preview</Typography>
                  <Typography variant="body2">This is how your brand colors will look</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => router.visit('/setup/mode/')}
                  >
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Next: Features →'}
                  </Button>
                </Box>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
