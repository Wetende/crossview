import { Head, Link, useForm } from '@inertiajs/react';
import { Box, Button, Card, CardContent, Chip, FormControlLabel, Grid, IconButton, Stack, Switch, TextField, Typography } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';

export default function PresetForm({ mode, preset, errors: serverErrors, formData }) {
  const isEdit = mode === 'edit';
  const initialData = preset || formData || {};

  const { data, setData, post, processing, errors } = useForm({
    name: initialData.name || '',
    code: initialData.code || '',
    description: initialData.description || '',
    regulatoryBody: initialData.regulatoryBody || '',
    hierarchyLabels: initialData.hierarchyLabels || ['Year', 'Unit', 'Session'],
    gradingConfig: initialData.gradingConfig || { mode: 'percentage', passMark: 50 },
    isActive: initialData.isActive !== false,
  });

  const [newLabel, setNewLabel] = useState('');
  const allErrors = { ...serverErrors, ...errors };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = isEdit ? `/superadmin/presets/${preset.id}/edit/` : '/superadmin/presets/create/';
    post(url);
  };

  const addLabel = () => {
    if (newLabel.trim()) {
      setData('hierarchyLabels', [...data.hierarchyLabels, newLabel.trim()]);
      setNewLabel('');
    }
  };

  const removeLabel = (index) => {
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
    <DashboardLayout role="superadmin">
      <Head title={isEdit ? `Edit Preset: ${preset?.name}` : 'Create Preset'} />

      <Stack spacing={3}>
        <Typography variant="h4">{isEdit ? 'Edit Preset Blueprint' : 'Create Preset Blueprint'}</Typography>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Preset Name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      error={!!allErrors.name}
                      helperText={allErrors.name}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Code"
                      value={data.code}
                      onChange={(e) => setData('code', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      error={!!allErrors.code}
                      helperText={allErrors.code || 'Unique identifier (e.g., tvet-kenya, theology-standard)'}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Regulatory Body"
                      value={data.regulatoryBody}
                      onChange={(e) => setData('regulatoryBody', e.target.value)}
                      helperText="e.g., TVETA, KNEC, Ministry of Education"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={data.isActive}
                          onChange={(e) => setData('isActive', e.target.checked)}
                        />
                      }
                      label="Active"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>

                  {/* Hierarchy Labels */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Hierarchy Structure</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Define the levels of your curriculum structure (e.g., Year → Unit → Session)
                    </Typography>

                    {allErrors.hierarchyLabels && (
                      <Typography color="error" variant="body2" gutterBottom>
                        {allErrors.hierarchyLabels}
                      </Typography>
                    )}

                    <Stack spacing={1} sx={{ mb: 2 }}>
                      {data.hierarchyLabels.map((label, index) => (
                        <Stack key={index} direction="row" spacing={1} alignItems="center">
                          <Chip label={`Level ${index + 1}`} size="small" color="primary" />
                          <Typography sx={{ flex: 1 }}>{label}</Typography>
                          <IconButton
                            size="small"
                            onClick={() => moveLabel(index, -1)}
                            disabled={index === 0}
                          >
                            <ArrowUpward fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => moveLabel(index, 1)}
                            disabled={index === data.hierarchyLabels.length - 1}
                          >
                            <ArrowDownward fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeLabel(index)}
                            disabled={data.hierarchyLabels.length <= 1}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        label="Add Level"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                      />
                      <Button variant="outlined" onClick={addLabel} startIcon={<AddIcon />}>
                        Add
                      </Button>
                    </Stack>
                  </Grid>

                  {/* Grading Config */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Grading Configuration</Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Pass Mark (%)"
                      type="number"
                      value={data.gradingConfig.passMark || 50}
                      onChange={(e) => setData('gradingConfig', {
                        ...data.gradingConfig,
                        passMark: parseInt(e.target.value) || 50
                      })}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Stack direction="row" spacing={2}>
                      <Button type="submit" variant="contained" disabled={processing}>
                        {processing ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Preset')}
                      </Button>
                      <Link href="/superadmin/presets/">
                        <Button>Cancel</Button>
                      </Link>
                    </Stack>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </Stack>
    </DashboardLayout>
  );
}
