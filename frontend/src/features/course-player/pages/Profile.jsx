import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  Avatar,
  Container,
} from '@mui/material';
import { motion } from 'framer-motion';
import DashboardLayout from '@/layouts/DashboardLayout';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

function LabeledField({ label, required, helperText, errorText, ...props }) {
  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      {label && (
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: -0.5 }}>
          {label} {required && <Typography component="span" color="error.main">*</Typography>}
        </Typography>
      )}
      <TextField
        {...props}
        error={!!errorText}
        fullWidth
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
            bgcolor: 'background.paper',
          }
        }}
      />
      {(helperText || errorText) && (
        <Typography variant="caption" color={errorText ? 'error.main' : 'text.secondary'} sx={{ mt: 0.5 }}>
          {errorText || helperText}
        </Typography>
      )}
    </Stack>
  );
}

function ProfileForm({ user, errors, success }) {
  const { data, setData, post, processing } = useForm({
    action: 'update_profile',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone: user.phone || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/student/profile/');
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider', boxShadow: 'none' }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography 
          variant="overline" 
          color="text.secondary" 
          sx={{ fontWeight: 600, letterSpacing: 1, display: 'block', mb: 3 }}
        >
          Profile Information
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 1.5 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <LabeledField
              label="Email"
              value={user.email || ''}
              disabled
              placeholder="e.g. user@example.com"
              helperText="Email cannot be changed. Contact admin if needed."
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <LabeledField
                label="First name"
                required
                placeholder="e.g. Peter"
                value={data.first_name}
                onChange={(e) => setData('first_name', e.target.value)}
                errorText={errors?.first_name}
              />
              <LabeledField
                label="Last name"
                required
                placeholder="e.g. Smith"
                value={data.last_name}
                onChange={(e) => setData('last_name', e.target.value)}
                errorText={errors?.last_name}
              />
            </Stack>

            <LabeledField
              label="Phone number"
              placeholder="+1 (555) 000-0000"
              value={data.phone}
              onChange={(e) => setData('phone', e.target.value)}
              errorText={errors?.phone}
            />

            <Box pt={1}>
              <Button
                type="submit"
                variant="contained"
                disabled={processing}
                disableElevation
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  fontWeight: 600, 
                  px: 3, 
                  py: 1 
                }}
              >
                {processing ? 'Saving...' : 'Save changes'}
              </Button>
            </Box>
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
    <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider', boxShadow: 'none' }}>
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography 
          variant="overline" 
          color="text.secondary" 
          sx={{ fontWeight: 600, letterSpacing: 1, display: 'block', mb: 3 }}
        >
          Change Password
        </Typography>

        {localSuccess && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 1.5 }}>
            Password changed successfully
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <LabeledField
              label="Current password"
              required
              type="password"
              placeholder="Enter current password"
              value={data.current_password}
              onChange={(e) => setData('current_password', e.target.value)}
              errorText={errors?.current_password}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <LabeledField
                label="New password"
                required
                type="password"
                placeholder="Min. 8 characters"
                value={data.new_password}
                onChange={(e) => setData('new_password', e.target.value)}
                errorText={errors?.new_password}
                helperText="Minimum 8 characters"
              />
              <LabeledField
                label="Confirm new password"
                required
                type="password"
                placeholder="Repeat new password"
                value={data.confirm_password}
                onChange={(e) => setData('confirm_password', e.target.value)}
                errorText={errors?.confirm_password}
              />
            </Stack>

            <Box pt={1}>
              <Button
                type="submit"
                variant="outlined"
                disabled={processing}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  fontWeight: 600, 
                  px: 3, 
                  py: 1 
                }}
              >
                {processing ? 'Changing...' : 'Change password'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Profile({ user, errors = {}, success }) {
  const getInitials = (first, last, email) => {
    if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
    if (first) return first[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return 'U';
  };

  return (
    <DashboardLayout role="student">
      <Head title="Profile Settings" />

      <Container maxWidth="md" disableGutters sx={{ mt: 2, mb: 8 }}>
        <Stack spacing={4}>
          <motion.div {...fadeIn}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h5" component="h1" fontWeight={700} gutterBottom>
                  Profile settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your account details and security
                </Typography>
              </Box>
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.light', 
                  color: 'primary.contrastText', 
                  fontWeight: 600,
                  width: 48,
                  height: 48
                }}
              >
                {getInitials(user?.first_name, user?.last_name, user?.email)}
              </Avatar>
            </Stack>
          </motion.div>

          <motion.div {...fadeIn}>
            <ProfileForm user={user} errors={errors} success={success} />
          </motion.div>

          <motion.div {...fadeIn}>
            <PasswordForm errors={errors} />
          </motion.div>
        </Stack>
      </Container>
    </DashboardLayout>
  );
}
