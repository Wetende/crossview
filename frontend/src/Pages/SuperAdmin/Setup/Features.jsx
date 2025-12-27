import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Switch,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import VideocamIcon from '@mui/icons-material/Videocam';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PaymentsIcon from '@mui/icons-material/Payments';

const STEPS = ['Institution', 'Mode', 'Branding', 'Features'];

const FEATURE_CONFIG = [
  {
    key: 'certificates',
    label: 'Certificates & Verification',
    description: 'Auto-generate PDF certificates with verification URLs',
    icon: <CardMembershipIcon />,
    default: true,
  },
  {
    key: 'practicum',
    label: 'Practicum / Media Uploads',
    description: 'Students can upload audio/video for assessment',
    icon: <VideocamIcon />,
    default: true,
  },
  {
    key: 'gamification',
    label: 'Gamification & Badges',
    description: 'Points, badges, and leaderboards for engagement',
    icon: <EmojiEventsIcon />,
    default: false,
  },
  {
    key: 'selfRegistration',
    label: 'Self Registration',
    description: 'Allow students to register themselves',
    icon: <PersonAddIcon />,
    default: true,
  },
  {
    key: 'payments',
    label: 'Payment Processing',
    description: 'Accept payments via M-Pesa and card (coming soon)',
    icon: <PaymentsIcon />,
    default: false,
    disabled: true,
  },
];

export default function SetupFeatures({ step, totalSteps, settings }) {
  const existingFeatures = settings?.features || {};
  
  const [features, setFeatures] = useState(
    FEATURE_CONFIG.reduce((acc, feat) => ({
      ...acc,
      [feat.key]: existingFeatures[feat.key] ?? feat.default,
    }), {})
  );
  const [loading, setLoading] = useState(false);

  const handleToggle = (key) => () => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.post('/setup/features/', features, {
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
      <Head title="Setup - Features" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ maxWidth: 600, width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom align="center" fontWeight="bold">
              ⚙️ Feature Setup
            </Typography>

            <Stepper activeStep={step - 1} sx={{ mb: 4 }}>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Typography variant="h6" gutterBottom>
              Step {step}: Enable Features
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Choose which features to enable for your platform. You can change these later.
            </Typography>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {FEATURE_CONFIG.map((feat) => (
                  <Box
                    key={feat.key}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: features[feat.key] ? 'primary.main' : 'grey.300',
                      bgcolor: features[feat.key] ? 'primary.50' : 'background.paper',
                      opacity: feat.disabled ? 0.5 : 1,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={features[feat.key]}
                          onChange={handleToggle(feat.key)}
                          disabled={feat.disabled}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {feat.icon}
                          <Box>
                            <Typography fontWeight="bold">{feat.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {feat.description}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      sx={{ width: '100%', m: 0 }}
                    />
                  </Box>
                ))}
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={() => router.visit('/setup/branding/')}
                >
                  ← Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  color="success"
                  disabled={loading}
                >
                  {loading ? 'Finishing...' : '🚀 Complete Setup'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
