import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import {
  IconUpload,
  IconCheck,
  IconClock,
  IconX,
  IconFileText,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  draft: { color: 'default', label: 'Draft', icon: IconFileText },
  pending_review: { color: 'warning', label: 'Pending Review', icon: IconClock },
  approved: { color: 'success', label: 'Approved', icon: IconCheck },
  rejected: { color: 'error', label: 'Rejected', icon: IconX },
};

export default function Apply({ profile, errors = {}, isPending = false }) {
  const { data, setData, post, processing } = useForm({
    bio: profile?.bio || '',
    jobTitle: profile?.jobTitle || '',
    linkedinUrl: profile?.linkedinUrl || '',
    teachingExperience: profile?.teachingExperience || '',
    whyTeachHere: profile?.whyTeachHere || '',
    action: 'save',
  });

  const handleSubmit = (action) => {
    setData('action', action);
    post('/instructor/apply/', {
      preserveScroll: true,
    });
  };

  const statusConfig = STATUS_CONFIG[profile?.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  // If pending, show status card
  if (isPending) {
    return (
      <>
        <Head title="Application Status" />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <IconClock size={64} color="orange" style={{ marginBottom: 16 }} />
              <Typography variant="h4" gutterBottom>
                Application Under Review
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Thank you for applying to become an instructor. Your application
                is currently being reviewed by our team. We'll notify you once a
                decision has been made.
              </Typography>
              <Chip
                icon={<StatusIcon size={16} />}
                label={statusConfig.label}
                color={statusConfig.color}
                size="large"
              />
            </Paper>
          </motion.div>
        </Container>
      </>
    );
  }

  // If rejected, show rejection notice with option to reapply (if unlocked)
  if (profile?.status === 'rejected') {
    return (
      <>
        <Head title="Application Rejected" />
        <Container maxWidth="md" sx={{ py: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper sx={{ p: 4 }}>
              <Stack spacing={3} alignItems="center">
                <IconX size={64} color="red" />
                <Typography variant="h4">Application Not Approved</Typography>
                <Alert severity="error" sx={{ width: '100%' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Reason for Rejection:
                  </Typography>
                  <Typography>{profile.rejectionReason}</Typography>
                </Alert>
                <Typography color="text.secondary">
                  If you believe this was in error or would like to reapply,
                  please contact the administration.
                </Typography>
              </Stack>
            </Paper>
          </motion.div>
        </Container>
      </>
    );
  }

  return (
    <>
      <Head title="Become an Instructor" />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h3" gutterBottom>
            Become an Instructor
          </Typography>
          <Typography color="text.secondary" paragraph>
            Complete this application to become an instructor on our platform.
            Share your expertise with students worldwide.
          </Typography>

          <Paper sx={{ p: 4, mt: 3 }}>
            <Stack spacing={3}>
              {/* Status Chip */}
              <Box>
                <Chip
                  icon={<StatusIcon size={16} />}
                  label={statusConfig.label}
                  color={statusConfig.color}
                  size="small"
                />
              </Box>

              {/* Professional Identity */}
              <Typography variant="h6">Professional Identity</Typography>

              <TextField
                label="Job Title"
                placeholder="e.g., Senior Mathematics Teacher"
                value={data.jobTitle}
                onChange={(e) => setData('jobTitle', e.target.value)}
                fullWidth
                error={!!errors.jobTitle}
                helperText={errors.jobTitle}
              />

              <TextField
                label="Bio / About Me"
                placeholder="Tell us about yourself and your background..."
                value={data.bio}
                onChange={(e) => setData('bio', e.target.value)}
                fullWidth
                multiline
                rows={4}
                error={!!errors.bio}
                helperText={errors.bio || 'Required'}
              />

              <TextField
                label="LinkedIn Profile URL"
                placeholder="https://linkedin.com/in/yourprofile"
                value={data.linkedinUrl}
                onChange={(e) => setData('linkedinUrl', e.target.value)}
                fullWidth
              />

              {/* Teaching Experience */}
              <Typography variant="h6" sx={{ mt: 2 }}>
                Teaching Experience
              </Typography>

              <TextField
                label="Describe Your Teaching Experience"
                placeholder="Share your teaching background, courses taught, certifications..."
                value={data.teachingExperience}
                onChange={(e) => setData('teachingExperience', e.target.value)}
                fullWidth
                multiline
                rows={4}
                error={!!errors.teachingExperience}
                helperText={errors.teachingExperience || 'Required'}
              />

              <TextField
                label="Why Do You Want to Teach Here?"
                placeholder="What motivates you to join our platform as an instructor?"
                value={data.whyTeachHere}
                onChange={(e) => setData('whyTeachHere', e.target.value)}
                fullWidth
                multiline
                rows={4}
                error={!!errors.whyTeachHere}
                helperText={errors.whyTeachHere || 'Required'}
              />

              {/* File Uploads Notice */}
              <Alert severity="info">
                <Typography variant="body2">
                  To upload your resume and certifications, please save your
                  application and then use the file upload feature. File uploads
                  are currently being implemented.
                </Typography>
              </Alert>

              {/* Existing Certifications */}
              {profile?.certifications?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Uploaded Certifications:
                  </Typography>
                  <List dense>
                    {profile.certifications.map((cert) => (
                      <ListItem key={cert.id}>
                        <ListItemText primary={cert.fileName} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => handleSubmit('save')}
                  disabled={processing}
                >
                  Save Draft
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSubmit('submit')}
                  disabled={processing}
                  startIcon={<IconUpload size={18} />}
                >
                  {processing ? 'Submitting...' : 'Submit Application'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </motion.div>
      </Container>
    </>
  );
}
