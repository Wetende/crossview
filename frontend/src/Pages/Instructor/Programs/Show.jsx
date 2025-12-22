/**
 * Instructor Program Detail Page
 * Requirements: US-2.3
 */

import { Head, Link } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  Grading as GradingIcon,
  TrendingUp as TrendingIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import InstructorLayout from '../../../components/layouts/InstructorLayout';
import CurriculumTree from '../../../components/CurriculumTree';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

function StatCard({ title, value, icon: Icon, color = 'primary' }) {
  return (
    <Card>
      <CardContent sx={{ textAlign: 'center' }}>
        <Icon sx={{ fontSize: 40, color: `${color}.main`, mb: 1 }} />
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function InstructorProgramShow({ program, stats, curriculum }) {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/instructor/dashboard/' },
    { label: 'My Programs', href: '/instructor/programs/' },
    { label: program.name },
  ];

  return (
    <InstructorLayout breadcrumbs={breadcrumbs}>
      <Head title={program.name} />
      
      <Stack spacing={3}>
        {/* Header */}
        <motion.div {...fadeInUp}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {program.name}
              </Typography>
              <Stack direction="row" spacing={1}>
                {program.code && (
                  <Chip label={program.code} size="small" variant="outlined" />
                )}
                <Chip 
                  label={program.blueprint?.name || 'No Blueprint'} 
                  size="small" 
                  color="secondary"
                />
              </Stack>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                component={Link}
                href={`/instructor/programs/${program.id}/students/`}
                variant="outlined"
                startIcon={<PeopleIcon />}
              >
                Students
              </Button>
              <Button
                component={Link}
                href={`/instructor/programs/${program.id}/gradebook/`}
                variant="contained"
                startIcon={<GradingIcon />}
              >
                Gradebook
              </Button>
            </Stack>
          </Stack>
        </motion.div>
        
        {/* Stats */}
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
              <StatCard
                title="Total Enrolled"
                value={stats.totalEnrollments}
                icon={PeopleIcon}
                color="primary"
              />
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={3}>
            <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
              <StatCard
                title="Active Students"
                value={stats.activeStudents}
                icon={TrendingIcon}
                color="secondary"
              />
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={3}>
            <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
              <StatCard
                title="Completed"
                value={stats.completedStudents}
                icon={CheckIcon}
                color="success"
              />
            </motion.div>
          </Grid>
          <Grid item xs={6} sm={3}>
            <motion.div {...fadeInUp} transition={{ delay: 0.4 }}>
              <StatCard
                title="Avg Progress"
                value={`${stats.averageProgress}%`}
                icon={TrendingIcon}
                color="info"
              />
            </motion.div>
          </Grid>
        </Grid>
        
        {/* Program Info & Curriculum */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <motion.div {...fadeInUp} transition={{ delay: 0.5 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Program Details
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  {program.description && (
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body2">
                        {program.description}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Blueprint
                    </Typography>
                    <Typography variant="body2">
                      {program.blueprint?.name || 'No Blueprint'}
                    </Typography>
                  </Box>
                  
                  {program.blueprint?.hierarchyLabels && (
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Hierarchy
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {program.blueprint.hierarchyLabels.map((label, index) => (
                          <Chip 
                            key={label} 
                            label={label} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  
                  {program.blueprint?.gradingConfig && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Grading Mode
                      </Typography>
                      <Chip 
                        label={program.blueprint.gradingConfig.mode || 'Standard'} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <motion.div {...fadeInUp} transition={{ delay: 0.6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Curriculum Structure
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  {curriculum && curriculum.length > 0 ? (
                    <CurriculumTree 
                      nodes={curriculum} 
                      showProgress 
                      variant="instructor"
                    />
                  ) : (
                    <Typography color="text.secondary">
                      No curriculum content yet.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Stack>
    </InstructorLayout>
  );
}
