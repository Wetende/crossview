/**
 * Instructor Student Progress Page
 * Requirements: US-3.2
 */

import { Head, Link } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import InstructorLayout from '../../../components/layouts/InstructorLayout';
import CurriculumTree from '../../../components/CurriculumTree';
import ProgressBar from '../../../components/ProgressBar';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

const statusColors = {
  Pass: 'success',
  Fail: 'error',
  Competent: 'success',
  'Not Yet Competent': 'warning',
  pending: 'warning',
  approved: 'success',
  revision_required: 'warning',
  rejected: 'error',
};

export default function InstructorStudentShow({ 
  program, 
  student, 
  progress, 
  curriculum, 
  assessmentResults, 
  practicumSubmissions 
}) {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/instructor/dashboard/' },
    { label: 'My Programs', href: '/instructor/programs/' },
    { label: program.name, href: `/instructor/programs/${program.id}/` },
    { label: 'Students', href: `/instructor/programs/${program.id}/students/` },
    { label: student.name },
  ];

  const initials = student.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <InstructorLayout breadcrumbs={breadcrumbs}>
      <Head title={`${student.name} - Progress`} />
      
      <Stack spacing={3}>
        {/* Student Header */}
        <motion.div {...fadeInUp}>
          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'secondary.main', fontSize: 28 }}>
                  {initials}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {student.name}
                  </Typography>
                  <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {student.email}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Enrolled {new Date(student.enrolledAt).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Overall Progress
                  </Typography>
                  <ProgressBar value={progress.overall} showLabel />
                  <Typography variant="caption" color="text.secondary">
                    {progress.completedNodes} of {progress.totalNodes} nodes completed
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
        
        <Grid container spacing={3}>
          {/* Curriculum Progress */}
          <Grid item xs={12} md={6}>
            <motion.div {...fadeInUp} transition={{ delay: 0.1 }}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Curriculum Progress
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  {curriculum && curriculum.length > 0 ? (
                    <CurriculumTree 
                      nodes={curriculum} 
                      showCompletion
                      variant="progress"
                    />
                  ) : (
                    <Typography color="text.secondary">
                      No curriculum content.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Assessment Results & Practicum */}
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              {/* Assessment Results */}
              <motion.div {...fadeInUp} transition={{ delay: 0.2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Assessment Results
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    
                    {assessmentResults && assessmentResults.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Assessment</TableCell>
                              <TableCell align="center">Score</TableCell>
                              <TableCell align="center">Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {assessmentResults.map((result) => (
                              <TableRow key={result.id}>
                                <TableCell>
                                  <Typography variant="body2">
                                    {result.nodeTitle}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" fontWeight="medium">
                                    {result.total ?? '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  {result.status ? (
                                    <Chip 
                                      label={result.status} 
                                      size="small" 
                                      color={statusColors[result.status] || 'default'}
                                    />
                                  ) : (
                                    <Chip label="Pending" size="small" variant="outlined" />
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography color="text.secondary" variant="body2">
                        No assessment results yet.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Practicum Submissions */}
              <motion.div {...fadeInUp} transition={{ delay: 0.3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Practicum Submissions
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    
                    {practicumSubmissions && practicumSubmissions.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Node</TableCell>
                              <TableCell align="center">Version</TableCell>
                              <TableCell align="center">Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {practicumSubmissions.map((submission) => (
                              <TableRow key={submission.id}>
                                <TableCell>
                                  <Typography variant="body2">
                                    {submission.nodeTitle}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(submission.submittedAt).toLocaleDateString()}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2">
                                    v{submission.version}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={submission.status.replace('_', ' ')} 
                                    size="small" 
                                    color={statusColors[submission.status] || 'default'}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography color="text.secondary" variant="body2">
                        No practicum submissions yet.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </InstructorLayout>
  );
}
