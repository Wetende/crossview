/**
 * Admin Blueprint Create Page
 * Requirements: US-2.2
 */

import { useState, useEffect } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  Chip,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function BlueprintCreate({ presets = [], errors = {}, formData = {} }) {
  const { data, setData, post, processing } = useForm({
    name: formData.name || '',
    description: formData.description || '',
    hierarchyLabels: formData.hierarchyLabels || ['Year', 'Unit', 'Session'],
    gradingConfig: formData.gradingConfig || { mode: 'summative', passingScore: 50 },
    progressionRules: formData.progressionRules || {},
    certificateEnabled: formData.certificateEnabled || false,
    gamificationEnabled: formData.gamificationEnabled || false,
  });

  const [newLabel, setNewLabel] = useState('');

  // Check for preset in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const presetId = params.get('preset');
    if (presetId) {
      const preset = presets.find(p => p.id === parseInt(presetId));
      if (preset) {
        setData({
          ...data,
          name: `${preset.name} (Copy)`,
          description: preset.description || '',
          hierarchyLabels: preset.hierarchyLabels || [],
          gradingConfig: preset.gradingConfig || { mode: 'summative' },
        });
      }
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/admin/blueprints/create/');
  };

  const addHierarchyLabel = () => {
    if (newLabel.trim() && !data.hierarchyLabels.includes(newLabel.trim())) {
      setData('hierarchyLabels', [...data.hierarchyLabels, newLabel.trim()]);
      setNewLabel('');
    }
  };

  const removeHierarchyLabel = (index) => {
    setData('hierarchyLabels', data.hierarchyLabels.filter((_, i) => i !== index));
  };

  const moveLabel = (index, direction) => {
    const newLabels = [...data.hierarchyLabels];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < newLabels.length) {
      [newLabels[index], newLabels[newIndex]] = [newLabels[newIndex], newLabels[index]];
      setData('hierarchyLabels', newLabels);
    }
  };

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[
        { label: 'Blueprints', href: '/admin/blueprints/' },
        { label: 'Create' },
      ]}
    >
      <Head title="Create Blueprint" />

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Header */}
          <Box>
            <Button
              component={Link}
              href="/admin/blueprints/"
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 1 }}
            >
              Back to Blueprints
            </Button>
            <Typography variant="h4" fontWeight="bold">
              Create Blueprint
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Define the academic structure for your programs
            </Typography>
          </Box>

          {errors._form && (
            <Alert severity="error">{errors._form}</Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <Stack spacing={3}>
                      <TextField
                        label="Blueprint Name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        error={!!errors.name}
                        helperText={errors.name}
                        fullWidth
                        required
                      />
                      <TextField
                        label="Description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Features */}
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Features
                    </Typography>
                    <Stack spacing={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={data.certificateEnabled}
                            onChange={(e) => setData('certificateEnabled', e.target.checked)}
                          />
                        }
                        label="Enable Certificates"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={data.gamificationEnabled}
                            onChange={(e) => setData('gamificationEnabled', e.target.checked)}
                          />
                        }
                        label="Enable Gamification"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Hierarchy */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Hierarchy Structure
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Define the levels of your curriculum (e.g., Year → Unit → Session)
                    </Typography>

                    {errors.hierarchyLabels && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {errors.hierarchyLabels}
                      </Alert>
                    )}

                    {/* Current Labels */}
                    <Stack spacing={1} sx={{ mb: 2 }}>
                      {data.hierarchyLabels.map((label, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                          }}
                        >
                          <DragIndicatorIcon color="action" />
                          <Chip
                            label={`Level ${index + 1}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Typography sx={{ flex: 1 }}>{label}</Typography>
                          <IconButton
                            size="small"
                            onClick={() => moveLabel(index, -1)}
                            disabled={index === 0}
                          >
                            ↑
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => moveLabel(index, 1)}
                            disabled={index === data.hierarchyLabels.length - 1}
                          >
                            ↓
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeHierarchyLabel(index)}
                            disabled={data.hierarchyLabels.length <= 1}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>

                    {/* Add New Label */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        label="Add Level"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        size="small"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHierarchyLabel())}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={addHierarchyLabel}
                      >
                        Add
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Grading Config */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Grading Configuration
                    </Typography>
                    <Stack spacing={3}>
                      <FormControl fullWidth>
                        <InputLabel>Grading Mode</InputLabel>
                        <Select
                          value={data.gradingConfig.mode || 'summative'}
                          label="Grading Mode"
                          onChange={(e) => setData('gradingConfig', {
                            ...data.gradingConfig,
                            mode: e.target.value,
                          })}
                        >
                          <MenuItem value="summative">Summative</MenuItem>
                          <MenuItem value="formative">Formative</MenuItem>
                          <MenuItem value="competency">Competency-Based</MenuItem>
                          <MenuItem value="weighted">Weighted Average</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Passing Score (%)"
                        type="number"
                        value={data.gradingConfig.passingScore || 50}
                        onChange={(e) => setData('gradingConfig', {
                          ...data.gradingConfig,
                          passingScore: parseInt(e.target.value) || 50,
                        })}
                        inputProps={{ min: 0, max: 100 }}
                        fullWidth
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              component={Link}
              href="/admin/blueprints/"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={processing}
            >
              {processing ? 'Creating...' : 'Create Blueprint'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </DashboardLayout>
  );
}
