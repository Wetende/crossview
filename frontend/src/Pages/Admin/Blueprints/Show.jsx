/**
 * Admin Blueprint Detail Page
 * Requirements: FR-2.2, US-2.3, US-2.4
 */

import { Head, Link, router } from '@inertiajs/react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function BlueprintShow({ blueprint, programs = [], canEdit }) {
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this blueprint?')) {
      router.post(`/admin/blueprints/${blueprint.id}/delete/`);
    }
  };

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[
        { label: 'Blueprints', href: '/admin/blueprints/' },
        { label: blueprint.name },
      ]}
    >
      <Head title={`Blueprint: ${blueprint.name}`} />

      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
              {blueprint.name}
            </Typography>
            {blueprint.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {blueprint.description}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            {canEdit && (
              <>
                <Button
                  component={Link}
                  href={`/admin/blueprints/${blueprint.id}/edit/`}
                  variant="outlined"
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </>
            )}
          </Stack>
        </Box>

        {!canEdit && (
          <Alert severity="info">
            This blueprint cannot be edited because it has associated programs.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Configuration */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configuration
                  </Typography>

                  {/* Hierarchy */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Hierarchy Structure
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {blueprint.hierarchyLabels?.map((label, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip label={label} color="primary" variant="outlined" />
                          {i < blueprint.hierarchyLabels.length - 1 && (
                            <Typography sx={{ mx: 1 }} color="text.secondary">
                              →
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Grading Config */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Grading Configuration
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Mode
                        </Typography>
                        <Typography variant="body1">
                          {blueprint.gradingConfig?.mode || 'Summative'}
                        </Typography>
                      </Grid>
                      {blueprint.gradingConfig?.passingScore && (
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Passing Score
                          </Typography>
                          <Typography variant="body1">
                            {blueprint.gradingConfig.passingScore}%
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Features */}
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Features
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Chip
                        icon={blueprint.certificateEnabled ? <CheckCircleIcon /> : <CancelIcon />}
                        label="Certificates"
                        color={blueprint.certificateEnabled ? 'success' : 'default'}
                        variant={blueprint.certificateEnabled ? 'filled' : 'outlined'}
                      />
                      <Chip
                        icon={blueprint.gamificationEnabled ? <CheckCircleIcon /> : <CancelIcon />}
                        label="Gamification"
                        color={blueprint.gamificationEnabled ? 'success' : 'default'}
                        variant={blueprint.gamificationEnabled ? 'filled' : 'outlined'}
                      />
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Stats */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Usage
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon color="primary" fontSize="large" />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {programs.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Programs using this blueprint
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Programs List */}
        {programs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Programs Using This Blueprint
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {programs.map((program) => (
                        <TableRow key={program.id}>
                          <TableCell>{program.name}</TableCell>
                          <TableCell>{program.code}</TableCell>
                          <TableCell>
                            <Chip
                              label={program.is_published ? 'Published' : 'Draft'}
                              size="small"
                              color={program.is_published ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              component={Link}
                              href={`/admin/programs/${program.id}/`}
                              size="small"
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </Stack>
    </DashboardLayout>
  );
}
