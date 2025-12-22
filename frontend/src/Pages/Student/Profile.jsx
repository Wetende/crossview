/**
 * Profile Settings Page
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import { motion } from 'framer-motion';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

function ProfileForm({ user, errors, success }) {
  const { data, setData, post, processing } = useForm({
    action: 'update_profile',
    first_name: user.firstName || '',
    last_name: user.lastName || '',
    phone: user.phone || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/student/profile/');
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Profile Information
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Email"
              value={user.email}
              disabled
              helperText="Email cannot be changed. Contact admin if needed."
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="First Name"
                value={data.first_name}
                onChange={(e) => setData('first_name', e.target.value)}
                error={!!errors?.first_name}
                helperText={errors?.first_name}
                required
                fullWidth
              />
              <TextField
                label="Last Name"
                value={data.last_name}
                onChange={(e) => setData('last_name', e.target.value)}
                error={!!errors?.last_name}
                helperText={errors?.last_name}
                required
                fullWidth
              />
            </Stack>

            <TextField
              label="Phone Number"
              value={data.phone}
              onChange={(e) => setData('phone', e.target.value)}
              error={!!errors?.phone}
              helperText={errors?.phone}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={processing}
              sx={{ alignSelf: 'flex-start' }}
            >
              {processing ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

function PasswordForm({ errors }) {
  const { data, setData, post, processing, reset } = useForm({
    action: 'change_password',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [localSuccess, setLocalSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/student/profile/', {
      onSuccess: () => {
        reset();
        setLocalSuccess(true);
        setTimeout(() => setLocalSuccess(false), 3000);
      },
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Change Password
        </Typography>

        {localSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Password changed successfully
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Current Password"
              type="password"
              value={data.current_password}
              onChange={(e) => setData('current_password', e.target.value)}
              error={!!errors?.current_password}
              helperText={errors?.current_password}
              required
            />

            <TextField
              label="New Password"
              type="password"
              value={data.new_password}
              onChange={(e) => setData('new_password', e.target.value)}
              error={!!errors?.new_password}
              helperText={errors?.new_password || 'Minimum 8 characters'}
              required
            />

            <TextField
              label="Confirm New Password"
              type="password"
              value={data.confirm_password}
              onChange={(e) => setData('confirm_password', e.target.value)}
              error={!!errors?.confirm_password}
              helperText={errors?.confirm_password}
              required
            />

            <Button
              type="submit"
              variant="outlined"
              disabled={processing}
              sx={{ alignSelf: 'flex-start' }}
            >
              {processing ? 'Changing...' : 'Change Password'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Profile({ user, tenant, errors = {}, success }) {
  return (
    <>
      <Head title="Profile Settings" />

      <Stack spacing={3}>
        <motion.div {...fadeIn}>
          <Typography variant="h4" component="h1" gutterBottom>
            Profile Settings
          </Typography>
          {tenant && (
            <Typography variant="body1" color="text.secondary">
              Organization: {tenant.name}
            </Typography>
          )}
        </motion.div>

        <motion.div {...fadeIn}>
          <ProfileForm user={user} errors={errors} success={success} />
        </motion.div>

        <motion.div {...fadeIn}>
          <PasswordForm errors={errors} />
        </motion.div>
      </Stack>
    </>
  );
}
