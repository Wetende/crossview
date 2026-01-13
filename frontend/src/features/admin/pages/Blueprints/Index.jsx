/**
 * Admin Blueprints List Page
 * Requirements: FR-2.1, US-2.1
 */

import { Head, Link } from '@inertiajs/react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Stack,
  Divider,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import SchoolIcon from '@mui/icons-material/School';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';

import DashboardLayout from '@/layouts/DashboardLayout';

export default function BlueprintsIndex({ blueprints = [], presets = [] }) {
  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[{ label: 'Blueprints' }]}
    >
      <Head title="Blueprints" />

      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Academic Blueprints
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure academic structures, grading, and progression rules
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/admin/blueprints/create/"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Create Blueprint
          </Button>
        </Box>

        {/* Platform Blueprints */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Your Blueprints
          </Typography>
          {blueprints.length === 0 ? (
            <Alert severity="info">
              No blueprints created yet. Create one or use a preset below.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {blueprints.map((blueprint, index) => (
                <Grid item xs={12} sm={6} md={4} key={blueprint.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                          <ArchitectureIcon color="primary" />
                          <Typography variant="h6" fontWeight="medium">
                            {blueprint.name}
                          </Typography>
                        </Box>

                        {blueprint.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {blueprint.description}
                          </Typography>
                        )}

                        {/* Hierarchy Preview */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Hierarchy
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            {blueprint.hierarchyLabels?.map((label, i) => (
                              <Chip
                                key={i}
                                label={label}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                          </Stack>
                        </Box>

                        {/* Stats */}
                        <Stack direction="row" spacing={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <SchoolIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {blueprint.programCount} programs
                            </Typography>
                          </Box>
                          <Chip
                            label={blueprint.gradingMode}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        </Stack>
                      </CardContent>
                      <Divider />
                      <CardActions>
                        <Button
                          component={Link}
                          href={`/admin/blueprints/${blueprint.id}/`}
                          size="small"
                          endIcon={<ArrowForwardIcon />}
                        >
                          View Details
                        </Button>
                        {blueprint.programCount === 0 && (
                          <Button
                            component={Link}
                            href={`/admin/blueprints/${blueprint.id}/edit/`}
                            size="small"
                            color="secondary"
                          >
                            Edit
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Preset Blueprints */}
        {presets.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Preset Blueprints
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Pre-configured blueprints for common educational models
            </Typography>
            <Grid container spacing={2}>
              {presets.map((preset, index) => (
                <Grid item xs={12} sm={6} md={4} key={preset.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (blueprints.length + index) * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: 'grey.50',
                        border: '1px dashed',
                        borderColor: 'divider',
                      }}
                    >
                      <CardContent sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                          <VerifiedIcon color="success" />
                          <Box>
                            <Typography variant="h6" fontWeight="medium">
                              {preset.name}
                            </Typography>
                            {preset.regulatoryBody && (
                              <Typography variant="caption" color="text.secondary">
                                {preset.regulatoryBody}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {preset.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {preset.description}
                          </Typography>
                        )}

                        {/* Hierarchy Preview */}
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Hierarchy
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            {preset.hierarchyLabels?.map((label, i) => (
                              <Chip
                                key={i}
                                label={label}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      </CardContent>
                      <Divider />
                      <CardActions>
                        <Button
                          component={Link}
                          href={`/admin/blueprints/create/?preset=${preset.id}`}
                          size="small"
                          color="success"
                        >
                          Use This Preset
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Stack>
    </DashboardLayout>
  );
}
