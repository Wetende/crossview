/**
 * Rubric Create/Edit Form
 * Dynamic dimension editor with weights and max scores
 * Supports scope selection (global/program/course)
 */

import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  IconButton,
  Divider,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import DashboardLayout from '@/layouts/DashboardLayout';

const defaultDimension = { name: '', weight: 0.25, max_score: 100 };

export default function RubricForm({ 
  mode = 'create', 
  rubric = null, 
  formData = null,
  role = 'instructor',
  canCreateGlobal = false,
  canCreateProgram = false,
  userPrograms = []
}) {
  const [name, setName] = useState(formData?.name || rubric?.name || '');
  const [description, setDescription] = useState(formData?.description || rubric?.description || '');
  const [maxScore, setMaxScore] = useState(formData?.maxScore || rubric?.maxScore || 100);
  const [scope, setScope] = useState(formData?.scope || rubric?.scope || 'course');
  const [programId, setProgramId] = useState(formData?.programId || rubric?.program?.id || '');
  const [dimensions, setDimensions] = useState(
    formData?.dimensions || rubric?.dimensions || [{ ...defaultDimension }]
  );
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Calculate total weight
  const totalWeight = dimensions.reduce((sum, d) => sum + (parseFloat(d.weight) || 0), 0);
  const weightWarning = Math.abs(totalWeight - 1.0) > 0.01;

  const handleAddDimension = () => {
    setDimensions([...dimensions, { ...defaultDimension }]);
  };

  const handleRemoveDimension = (index) => {
    if (dimensions.length <= 1) {
      return; // Must have at least one dimension
    }
    setDimensions(dimensions.filter((_, i) => i !== index));
  };

  const handleDimensionChange = (index, field, value) => {
    const updated = [...dimensions];
    updated[index] = { ...updated[index], [field]: value };
    setDimensions(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (scope === 'program' && !programId) {
      newErrors.programId = 'Program is required for program-scoped rubrics';
    }
    if (dimensions.length === 0) {
      newErrors.dimensions = 'At least one dimension is required';
    }
    dimensions.forEach((d, i) => {
      if (!d.name.trim()) {
        newErrors[`dimension_${i}_name`] = 'Dimension name is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    const data = {
      name: name.trim(),
      description: description.trim(),
      maxScore: parseInt(maxScore, 10),
      scope,
      programId: scope === 'program' ? programId : null,
      dimensions: dimensions.map(d => ({
        name: d.name.trim(),
        weight: parseFloat(d.weight),
        max_score: parseInt(d.max_score, 10),
      })),
    };

    if (mode === 'edit' && rubric?.id) {
      router.post(`/rubrics/${rubric.id}/edit/`, data, {
        onFinish: () => setSubmitting(false),
      });
    } else {
      router.post('/rubrics/create/', data, {
        onFinish: () => setSubmitting(false),
      });
    }
  };

  const breadcrumbs = role === 'admin'
    ? [
        { label: 'Academic' },
        { label: 'Rubrics', href: '/rubrics/' },
        { label: mode === 'create' ? 'Create' : 'Edit' },
      ]
    : [
        { label: 'Teaching' },
        { label: 'Rubrics', href: '/rubrics/' },
        { label: mode === 'create' ? 'Create' : 'Edit' },
      ];

  return (
    <DashboardLayout role={role} breadcrumbs={breadcrumbs}>
      <Head title={mode === 'create' ? 'Create Rubric' : 'Edit Rubric'} />

      <Stack spacing={3} component="form" onSubmit={handleSubmit}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {mode === 'create' ? 'Create Rubric' : 'Edit Rubric'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Define grading criteria for practicum submissions
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              component={Link}
              href="/rubrics/"
              startIcon={<ArrowBackIcon />}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Rubric'}
            </Button>
          </Stack>
        </Box>

        {/* Weight Warning */}
        {weightWarning && dimensions.length > 0 && (
          <Alert severity="warning">
            Total weight is {(totalWeight * 100).toFixed(0)}%. Weights should sum to 100% for accurate scoring.
          </Alert>
        )}

        {/* Basic Info */}
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6">Basic Information</Typography>
              
              <TextField
                label="Rubric Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                error={!!errors.name}
                helperText={errors.name}
                placeholder="e.g., Ministry Practicum Evaluation"
              />

              {/* Scope Selector */}
              <FormControl fullWidth>
                <InputLabel>Scope</InputLabel>
                <Select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  label="Scope"
                >
                  <MenuItem value="course">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>Course</span>
                      <Chip label="Your assignments" size="small" />
                    </Stack>
                  </MenuItem>
                  {canCreateProgram && (
                    <MenuItem value="program">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>Program</span>
                        <Chip label="Program-wide" size="small" color="primary" />
                      </Stack>
                    </MenuItem>
                  )}
                  {canCreateGlobal && (
                    <MenuItem value="global">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>Global</span>
                        <Chip label="System-wide" size="small" color="secondary" />
                      </Stack>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              {/* Program Selector (for program scope) */}
              {scope === 'program' && userPrograms.length > 0 && (
                <FormControl fullWidth error={!!errors.programId}>
                  <InputLabel>Program *</InputLabel>
                  <Select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    label="Program *"
                    required
                  >
                    {userPrograms.map((prog) => (
                      <MenuItem key={prog.id} value={prog.id}>
                        {prog.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.programId && (
                    <Typography variant="caption" color="error">
                      {errors.programId}
                    </Typography>
                  )}
                </FormControl>
              )}
              
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={2}
                placeholder="Describe what this rubric evaluates..."
              />
              
              <TextField
                label="Max Total Score"
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                inputProps={{ min: 1, max: 1000 }}
                sx={{ maxWidth: 200 }}
                helperText="Maximum possible score for this rubric"
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Dimensions */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6">Grading Dimensions</Typography>
                <Typography variant="body2" color="text.secondary">
                  Define the criteria and their weights
                </Typography>
              </Box>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddDimension}
                variant="outlined"
                size="small"
              >
                Add Dimension
              </Button>
            </Box>

            {errors.dimensions && (
              <Alert severity="error" sx={{ mb: 2 }}>{errors.dimensions}</Alert>
            )}

            <Stack spacing={2}>
              <AnimatePresence>
                {dimensions.map((dim, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Paper 
                      variant="outlined" 
                      sx={{ p: 2, bgcolor: 'grey.50' }}
                    >
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <DragIndicatorIcon />
                        </Box>
                        
                        <TextField
                          label="Dimension Name"
                          value={dim.name}
                          onChange={(e) => handleDimensionChange(index, 'name', e.target.value)}
                          size="small"
                          sx={{ flex: 2 }}
                          required
                          error={!!errors[`dimension_${index}_name`]}
                          placeholder="e.g., Scripture Use"
                        />
                        
                        <TextField
                          label="Weight"
                          type="number"
                          value={dim.weight}
                          onChange={(e) => handleDimensionChange(index, 'weight', e.target.value)}
                          size="small"
                          sx={{ width: 120 }}
                          inputProps={{ min: 0, max: 1, step: 0.05 }}
                          helperText={`${(dim.weight * 100).toFixed(0)}%`}
                        />
                        
                        <TextField
                          label="Max Score"
                          type="number"
                          value={dim.max_score}
                          onChange={(e) => handleDimensionChange(index, 'max_score', e.target.value)}
                          size="small"
                          sx={{ width: 120 }}
                          inputProps={{ min: 1, max: 1000 }}
                        />
                        
                        <IconButton 
                          onClick={() => handleRemoveDimension(index)}
                          color="error"
                          disabled={dimensions.length <= 1}
                          sx={{ mt: { xs: 0, md: 0.5 } }}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                    </Paper>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Stack>

            {/* Weight Summary */}
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Typography 
                variant="body2" 
                color={weightWarning ? 'warning.main' : 'success.main'}
                fontWeight="medium"
              >
                Total Weight: {(totalWeight * 100).toFixed(0)}%
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </DashboardLayout>
  );
}
