/**
 * Admin Program Detail Page
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
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function ProgramShow({ program, stats, instructors = [] }) {
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this program?')) {
      router.post(`/admin/programs/${program.id}/delete/`);
    }
  };

  const handlePublish = () => {
    router.post(`/admin/programs/${program.id}/publish/`);
  };

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[
        { label: 'Programs', href: '/admin/programs/' },
        { label: program.name },
      ]}
    >
      <Head title={`Program: ${program.name}`} />

      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Button
              component={Link}
              href="/admin/programs/"
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 1 }}
            >
              Back to Programs
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" fontWeight="bold">
                {program.name}
              </Typography>
              <Chip
                label={program.isPublished ? 'Published' : 'Draft'}
                color={program.isPublished ? 'success' : 'default'}
              />
            </Box>
            {program.code && (
              <Typography variant="body1" color="text.secondary">
                Code: {program.code}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={program.isPublished ? <UnpublishedIcon /> : <PublishIcon />}
              onClick={handlePublish}
            >
              {program.isPublished ? 'Unpublish' : 'Publish'}
            </Button>
            <Button
              component={Link}
              href={`/admin/programs/${program.id}/edit/`}
              variant="outlined"
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
            <Button
              component={Link}
              href={`/admin/curriculum/?program=${program.id}`}
              variant="contained"
              startIcon={<AccountTreeIcon />}
            >
              Curriculum Builder
            </Button>
          </Stack>
        </Box>

        <Grid container spacing={3}>
          {/* Stats Cards */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <PeopleIcon color="primary" fontSize="large" />
                      <Typography variant="h4" fontWeight="bold">
                        {stats.enrollmentCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Enrollments
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              <Grid item xs={6} sm={3}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <SchoolIcon color="success" fontSize="large" />
                      <Typography variant="h4" fontWeight="bold">
                        {stats.activeEnrollments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Students
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              <Grid item xs={6} sm={3}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <CheckCircleIcon color="info" fontSize="large" />
                      <Typography variant="h4" fontWeight="bold">
                        {stats.completedEnrollments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              <Grid item xs={6} sm={3}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <AccountTreeIcon color="secondary" fontSize="large" />
                      <Typography variant="h4" fontWeight="bold">
                        {stats.nodeCount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Curriculum Nodes
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>
          </Grid>

          {/* Program Info */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Program Details
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Blueprint
                      </Typography>
                      <Typography variant="body1">
                        {program.blueprintName || 'None'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Created
                      </Typography>
                      <Typography variant="body1">
                        {new Date(program.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Description */}
          {program.description && (
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {program.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          )}

          {/* Instructors */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Assigned Instructors
                  </Typography>
                  {instructors.length === 0 ? (
                    <Typography color="text.secondary">
                      No instructors assigned yet.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {instructors.map((instructor) => (
                            <TableRow key={instructor.id}>
                              <TableCell>{instructor.name}</TableCell>
                              <TableCell>{instructor.email}</TableCell>
                              <TableCell>
                                <Chip
                                  label={instructor.role}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Delete Button */}
        {stats.enrollmentCount === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Delete Program
            </Button>
          </Box>
        )}
      </Stack>
    </DashboardLayout>
  );
}
