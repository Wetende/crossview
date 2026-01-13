/**
 * Admin Branding Settings Page
 * Requirements: US-10.1, US-10.2
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
  TextField,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import DashboardLayout from '@/layouts/DashboardLayout';

export default function BrandingSettings({ branding = {}, errors = {} }) {
  const { data, setData, post, processing } = useForm({
    primaryColor: branding.primaryColor || '#2563EB',
    secondaryColor: branding.secondaryColor || '#7C3AED',
    customCss: branding.customCss || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/admin/settings/branding/');
  };

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[
        { label: 'Settings', href: '/admin/settings/' },
        { label: 'Branding' },
      ]}
    >
      <Head title="Branding Settings" />

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Header */}
          <Box>
            <Button
              component={Link}
              href="/admin/settings/"
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 1 }}
            >
              Back to Settings
            </Button>
            <Typography variant="h4" fontWeight="bold">
              Branding & Appearance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customize your institution's look and feel
            </Typography>
          </Box>

          {errors._form && <Alert severity="error">{errors._form}</Alert>}

          <Grid container spacing={3}>
            {/* Colors */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Brand Colors
                    </Typography>
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Primary Color
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <input
                            type="color"
                            value={data.primaryColor}
                            onChange={(e) => setData('primaryColor', e.target.value)}
                            style={{
                              width: 60,
                              height: 40,
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          />
                          <TextField
                            value={data.primaryColor}
                            onChange={(e) => setData('primaryColor', e.target.value)}
                            size="small"
                            sx={{ width: 120 }}
                          />
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Secondary Color
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <input
                            type="color"
                            value={data.secondaryColor}
                            onChange={(e) => setData('secondaryColor', e.target.value)}
                            style={{
                              width: 60,
                              height: 40,
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          />
                          <TextField
                            value={data.secondaryColor}
                            onChange={(e) => setData('secondaryColor', e.target.value)}
                            size="small"
                            sx={{ width: 120 }}
                          />
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Preview */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Preview
                    </Typography>
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: 'grey.100',
                      }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: data.primaryColor,
                          color: 'white',
                          borderRadius: 1,
                          mb: 2,
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="bold">
                          Primary Color
                        </Typography>
                        <Typography variant="body2">
                          Used for buttons, links, and accents
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: data.secondaryColor,
                          color: 'white',
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="bold">
                          Secondary Color
                        </Typography>
                        <Typography variant="body2">
                          Used for highlights and secondary elements
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Custom CSS */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Custom CSS
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Add custom CSS to further customize the appearance (advanced)
                    </Typography>
                    <TextField
                      value={data.customCss}
                      onChange={(e) => setData('customCss', e.target.value)}
                      multiline
                      rows={8}
                      fullWidth
                      placeholder={`/* Custom CSS */
.my-class {
  color: red;
}`}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button component={Link} href="/admin/settings/" variant="outlined">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={processing}>
              {processing ? 'Saving...' : 'Save Branding'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </DashboardLayout>
  );
}
