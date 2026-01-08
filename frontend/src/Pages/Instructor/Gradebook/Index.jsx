/**
 * Instructor Gradebook Index
 * Lists all programs with links to individual gradebooks
 */

import { Head, Link } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Grid,
  Chip,
  Stack,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import GradingIcon from '@mui/icons-material/Grading';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';

import DashboardLayout from '../../../components/layouts/DashboardLayout';

const gradingTypeLabels = {
  summative: 'Weighted',
  weighted: 'Weighted',
  cbet: 'Competency',
  competency: 'Competency',
  rubric: 'Rubric',
  percentage: 'Percentage',
  checklist: 'Checklist',
  pass_fail: 'Pass/Fail',
};

const gradingTypeColors = {
  summative: 'primary',
  weighted: 'primary',
  cbet: 'success',
  competency: 'success',
  rubric: 'warning',
  percentage: 'info',
  checklist: 'secondary',
  pass_fail: 'default',
};

export default function GradebookIndex({ programs = [] }) {
  const breadcrumbs = [{ label: 'Gradebook' }];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} role="instructor">
      <Head title="Gradebook" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              <GradingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Gradebook
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a program to view and manage student grades
            </Typography>
          </Box>

          {programs.length === 0 ? (
            <Alert severity="info">
              No programs assigned. Contact your administrator to be assigned to programs.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {programs.map((program) => (
                <Grid item xs={12} sm={6} md={4} key={program.id}>
                  <Card
                    component={motion.div}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardActionArea
                      component={Link}
                      href={`/instructor/programs/${program.id}/gradebook/`}
                    >
                      <CardContent>
                        <Stack spacing={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SchoolIcon color="primary" />
                            <Typography variant="h6" component="div" noWrap>
                              {program.name}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip
                              label={gradingTypeLabels[program.gradingType] || 'Standard'}
                              size="small"
                              color={gradingTypeColors[program.gradingType] || 'default'}
                              variant="outlined"
                            />
                          </Stack>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PeopleIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {program.studentCount} {program.studentCount === 1 ? 'student' : 'students'}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </motion.div>
    </DashboardLayout>
  );
}
