import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Grid,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import SchoolIcon from '@mui/icons-material/School';
import ComputerIcon from '@mui/icons-material/Computer';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BuildIcon from '@mui/icons-material/Build';
import SettingsIcon from '@mui/icons-material/Settings';

const STEPS = ['Institution', 'Mode', 'Branding', 'Features'];

const MODE_ICONS = {
  tvet: <BuildIcon sx={{ fontSize: 40 }} />,
  theology: <MenuBookIcon sx={{ fontSize: 40 }} />,
  nita: <BuildIcon sx={{ fontSize: 40 }} />,
  driving: <DirectionsCarIcon sx={{ fontSize: 40 }} />,
  cbc: <SchoolIcon sx={{ fontSize: 40 }} />,
  online: <ComputerIcon sx={{ fontSize: 40 }} />,
  custom: <SettingsIcon sx={{ fontSize: 40 }} />,
};

const MODE_DESCRIPTIONS = {
  tvet: 'CDACC/KNEC compliant with competency-based assessment',
  theology: 'Session-based with CAT + Exam grading',
  nita: 'Trade test with practical verification',
  driving: 'NTSA curriculum with instructor checklists',
  cbc: 'Rubric-based with core competencies',
  online: 'Self-paced with gamification and progress tracking',
  custom: 'Build your own blueprint from scratch',
};

export default function SetupMode({ step, totalSteps, settings, modes, blueprints }) {
  const [selectedMode, setSelectedMode] = useState(settings?.deploymentMode || 'custom');
  const [blueprintId, setBlueprintId] = useState(settings?.activeBlueprintId || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    router.post('/setup/mode/', { deploymentMode: selectedMode, blueprintId }, {
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
      <Head title="Setup - Deployment Mode" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card sx={{ maxWidth: 800, width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom align="center" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <SchoolIcon sx={{ fontSize: 36 }} color="primary" /> Platform Setup
            </Typography>

            <Stepper activeStep={step - 1} sx={{ mb: 4 }}>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Typography variant="h6" gutterBottom>
              Step {step}: Select Deployment Mode
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Choose a preset that matches your institution type. This will configure terminology, grading, and features automatically.
            </Typography>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {modes?.map((mode) => (
                  <Grid item xs={12} sm={6} md={4} key={mode.value}>
                    <Paper
                      elevation={selectedMode === mode.value ? 8 : 1}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedMode === mode.value ? '2px solid' : '2px solid transparent',
                        borderColor: selectedMode === mode.value ? 'primary.main' : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => setSelectedMode(mode.value)}
                    >
                      <Stack alignItems="center" spacing={1}>
                        <Box sx={{ color: selectedMode === mode.value ? 'primary.main' : 'text.secondary' }}>
                          {MODE_ICONS[mode.value]}
                        </Box>
                        <Typography fontWeight="bold" align="center">
                          {mode.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" align="center">
                          {MODE_DESCRIPTIONS[mode.value]}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {selectedMode === 'custom' && blueprints?.length > 0 && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Select Blueprint (Optional)</InputLabel>
                  <Select
                    value={blueprintId}
                    label="Select Blueprint (Optional)"
                    onChange={(e) => setBlueprintId(e.target.value)}
                  >
                    <MenuItem value="">None - Create Later</MenuItem>
                    {blueprints.map((bp) => (
                      <MenuItem key={bp.id} value={bp.id}>{bp.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => router.visit('/setup/institution/')}
                >
                  ← Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Next: Branding →'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
