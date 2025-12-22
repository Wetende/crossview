/**
 * Admin User Create/Edit Form Page
 * Requirements: US-6.2, US-6.3
 */

import { Head, Link, useForm } from '@inertiajs/react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function UserForm({
  mode = 'create',
  user = null,
  currentRole = 'student',
  errors = {},
  formData = {},
}) {
  const isEdit = mode === 'edit';

  const { data, setData, post, processing } = useForm({
    email: user?.email || formData.email || '',
    firstName: user?.firstName || formData.firstName || '',
    lastName: user?.lastName || formData.lastName || '',
    password: '',
    role: currentRole || formData.role || 'student',
    isActive: user?.isActive ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEdit) {
      post(`/admin/users/${user.id}/edit/`);
    } else {
      post('/admin/users/create/');
    }
  };

  return (
    <DashboardLayout
      role="admin"
      breadcrumbs={[
        { label: 'Users', href: '/admin/users/' },
        { label: isEdit ? 'Edit User' : 'Add User' },
      ]}
    >
      <Head title={isEdit ? 'Edit User' : 'Add User'} />

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Header */}
          <Box>
            <Button
              component={Link}
              href="/admin/users/"
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 1 }}
            >
              Back to Users
            </Button>
            <Typography variant="h4" fontWeight="bold">
              {isEdit ? 'Edit User' : 'Add User'}
            </Typography>
          </Box>

          {errors._form && <Alert severity="error">{errors._form}</Alert>}

          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      User Information
                    </Typography>
                    <Stack spacing={3}>
                      <TextField
                        label="Email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={!!errors.email}
                        helperText={errors.email}
                        fullWidth
                        required
                      />
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="First Name"
                            value={data.firstName}
                            onChange={(e) => setData('firstName', e.target.value)}
                            error={!!errors.firstName}
                            helperText={errors.firstName}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Last Name"
                            value={data.lastName}
                            onChange={(e) => setData('lastName', e.target.value)}
                            error={!!errors.lastName}
                            helperText={errors.lastName}
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                      {!isEdit && (
                        <TextField
                          label="Password"
                          type="password"
                          value={data.password}
                          onChange={(e) => setData('password', e.target.value)}
                          error={!!errors.password}
                          helperText={
                            errors.password ||
                            'Min 8 characters with uppercase, lowercase, and number'
                          }
                          fullWidth
                          required
                        />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Role & Status */}
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Role & Status
                    </Typography>
                    <Stack spacing={3}>
                      <FormControl fullWidth>
                        <InputLabel>Role</InputLabel>
                        <Select
                          value={data.role}
                          label="Role"
                          onChange={(e) => setData('role', e.target.value)}
                        >
                          <MenuItem value="student">Student</MenuItem>
                          <MenuItem value="instructor">Instructor</MenuItem>
                          <MenuItem value="admin">Administrator</MenuItem>
                        </Select>
                      </FormControl>
                      {isEdit && (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={data.isActive}
                              onChange={(e) => setData('isActive', e.target.checked)}
                            />
                          }
                          label="Active"
                        />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button component={Link} href="/admin/users/" variant="outlined">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={processing}>
              {processing
                ? isEdit
                  ? 'Saving...'
                  : 'Creating...'
                : isEdit
                ? 'Save Changes'
                : 'Create User'}
            </Button>
          </Box>
        </Stack>
      </Box>
    </DashboardLayout>
  );
}
