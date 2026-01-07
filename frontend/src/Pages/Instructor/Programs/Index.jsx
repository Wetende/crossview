/**
 * Instructor Programs List Page
 * Requirements: US-2.1, US-2.2
 */

import { Head, Link } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Typography,
  Stack,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import InstructorLayout from '../../../components/layouts/InstructorLayout';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

function ProgramCard({ program, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Card sx={{ height: '100%' }}>
        <CardActionArea
          component={Link}
          href={`/instructor/programs/${program.id}/`}
          sx={{ height: '100%' }}
        >
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {program.name}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {program.code && (
                    <Chip label={program.code} size="small" variant="outlined" />
                  )}
                  <Chip 
                    label={program.blueprintName} 
                    size="small" 
                    color="secondary"
                    variant="outlined"
                  />
                </Stack>
              </Box>
              
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {program.completionRate}%
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={program.completionRate} 
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
              
              <Stack direction="row" spacing={3}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PeopleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {program.enrollmentCount} enrolled
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <TrendingIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {program.activeStudents} active
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
    </motion.div>
  );
}

export default function InstructorProgramsIndex({ programs }) {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard/' },
    { label: 'My Programs' },
  ];

  return (
    <InstructorLayout breadcrumbs={breadcrumbs}>
      <Head title="My Programs" />
      
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight="bold">
          My Programs
        </Typography>
        
        {programs && programs.length > 0 ? (
          <Grid container spacing={3}>
            {programs.map((program, index) => (
              <Grid item xs={12} sm={6} md={4} key={program.id}>
                <ProgramCard program={program} index={index} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">
                No programs assigned yet.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </InstructorLayout>
  );
}
