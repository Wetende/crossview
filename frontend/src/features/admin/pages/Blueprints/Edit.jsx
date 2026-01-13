/**
 * Admin Blueprint Edit Page
 * Requirements: FR-2.4, US-2.4
 */

import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
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
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import DashboardLayout from '@/layouts/DashboardLayout';
import GradingSchemaBuilder from '@/components/GradingSchemaBuilder';

export default function BlueprintEdit({ blueprint, canEdit, errors = {} }) {
  const { data, setData, post, processing } = useForm({
    name: blueprint.name || '',
    description: blueprint.description || '',
    hierarchyLabels: blueprint.hierarchyLabels || [],
    gradingConfig: blueprint.gradingConfig || { mode: 'summative', passingScore: 50 },
    progressionRules: blueprint.progressionRules || {},
    certificateEnabled: blueprint.certificateEnabled || false,
    gamificationEnabled: blueprint.gamificationEnabled || false,
  });

  const [newLabel, setNewLabel] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    post(`/admin/blueprints/${blueprint.id}/edit/`);
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

  if (!canEdit) {
    return (
      <DashboardLayout
        role="admin"
        breadcrumbs={[
          { label: 'Blueprints', href: '/admin/blueprints/' },
          { label: blueprint.name, href: `/admin/blueprints/${blueprint.id}/` },
          { label: 'Edit' },
        ]}
      >
        <Head title={`Edit Blueprint: ${blueprint.name}`} />
        <Stack spacing={3}>
          <Box>
            <Button
              component={Link}
              href={`/admin/blueprints/${blueprint.id}/`}
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 1 }}
            >
              Back to Blueprint
            </Button>
            <Typography variant="h4" fontWeight="bold">
              Edit Blueprint
            </Typography>
          </Box>
          <Alert severity="warning">
            This blueprint cannot be edited because it has associated programs.
            To make changes, you must first remove all programs using this blueprint.
          </Alert>
        </Stack>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[
        { label: 'Blueprints', href: '/admin/blueprints/' },
        { label: blueprint.name, href: `/admin/blueprints/${blueprint.id}/` },
        { label: 'Edit' },
      ]}
    >
      <Head title={`Edit Blueprint: ${blueprint.name}`} />

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Header */}
          <Box>
            <Button
              component={Link}
              href={`/admin/blueprints/${blueprint.id}/`}
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 1 }}
            >
              Back to Blueprint
            </Button>
            <Typography variant="h4" fontWeight="bold">
              Edit Blueprint
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
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GradingSchemaBuilder
                  value={data.gradingConfig}
                  onChange={(config) => setData('gradingConfig', config)}
                />
              </motion.div>
            </Grid>
          </Grid>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              component={Link}
              href={`/admin/blueprints/${blueprint.id}/`}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={processing}
            >
              {processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </DashboardLayout>
  );
}
