/**
 * Admin Enrollment Create Page
 * Requirements: FR-6.2, US-7.2
 */

import { Head, Link, useForm } from '@inertiajs/react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function EnrollmentCreate({
  programs = [],
  students = [],
  errors = {},
  formData = {},
}) {
  const { data, setData, post, processing } = useForm({
    userId: formData.userId || '',
    programId: formData.programId || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/admin/enrollments/create/');
  };

  const selectedStudent = students.find((s) => s.id === data.userId);
  const selectedProgram = programs.find((p) => p.id === data.programId);

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[
        { label: 'Enrollments', href: '/admin/enrollments/' },
        { label: 'Enroll Student' },
      ]}
    >
      <Head title="Enroll Student" />

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Header */}
          <Box>
            <Button
              component={Link}
              href="/admin/enrollments/"
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 1 }}
            >
              Back to Enrollments
            </Button>
            <Typography variant="h4" fontWeight="bold">
              Enroll Student
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enroll a student in a program
            </Typography>
          </Box>

          {errors._form && <Alert severity="error">{errors._form}</Alert>}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent>
                <Stack spacing={3}>
                  {/* Student Selection */}
                  <Autocomplete
                    options={students}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    value={selectedStudent || null}
                    onChange={(_, newValue) => {
                      setData('userId', newValue?.id || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Student"
                        error={!!errors.userId}
                        helperText={errors.userId}
                        required
                      />
                    )}
                  />

                  {/* Program Selection */}
                  <FormControl fullWidth error={!!errors.programId}>
                    <InputLabel>Program</InputLabel>
                    <Select
                      value={data.programId}
                      label="Program"
                      onChange={(e) => setData('programId', e.target.value)}
                      required
                    >
                      {programs.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.programId && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.programId}
                      </Typography>
                    )}
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button component={Link} href="/admin/enrollments/" variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={processing || !data.userId || !data.programId}
            >
              {processing ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </DashboardLayout>
  );
}
