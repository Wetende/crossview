import { Head, Link, router } from '@inertiajs/react';
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
} from '@mui/material';
import { motion } from 'framer-motion';

const STEPS = ['Institution', 'Mode', 'Branding', 'Features'];

export default function SetupInstitution({ step, totalSteps, settings }) {
  const [formData, setFormData] = useState({
    institutionName: settings?.institutionName || '',
    tagline: settings?.tagline || '',
    contactEmail: settings?.contactEmail || '',
    contactPhone: settings?.contactPhone || '',
    address: settings?.address || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.post('/setup/institution/', formData, {
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
      <Head title="Setup - Institution Info" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ maxWidth: 600, width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom align="center" fontWeight="bold">
              🎓 Platform Setup
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" mb={4}>
              Let's configure your learning management system
            </Typography>

            <Stepper activeStep={step - 1} sx={{ mb: 4 }}>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Typography variant="h6" gutterBottom>
              Step {step}: Institution Information
            </Typography>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Institution Name"
                  value={formData.institutionName}
                  onChange={handleChange('institutionName')}
                  fullWidth
                  required
                  placeholder="e.g., Angel Beauty College"
                />
                
                <TextField
                  label="Tagline"
                  value={formData.tagline}
                  onChange={handleChange('tagline')}
                  fullWidth
                  placeholder="e.g., Excellence in Beauty Education"
                />
                
                <TextField
                  label="Contact Email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange('contactEmail')}
                  fullWidth
                  required
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

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || !formData.institutionName}
                  >
                    {loading ? 'Saving...' : 'Next: Deployment Mode →'}
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
