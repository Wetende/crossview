import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  IconCheck,
  IconClock,
  IconX,
  IconFileText,
  IconArrowLeft,
  IconExternalLink,
  IconDownload,
  IconLock,
  IconLockOpen,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  draft: { color: 'default', label: 'Draft', icon: IconFileText },
  pending_review: { color: 'warning', label: 'Pending Review', icon: IconClock },
  approved: { color: 'success', label: 'Approved', icon: IconCheck },
  rejected: { color: 'error', label: 'Rejected', icon: IconX },
};

export default function Detail({ application }) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const { data, setData, post, processing } = useForm({
    reason: '',
  });

  const statusConfig = STATUS_CONFIG[application.status];
  const StatusIcon = statusConfig.icon;

  const handleApprove = () => {
    if (confirm('Are you sure you want to approve this instructor application?')) {
      router.post(`/admin/instructor-applications/${application.id}/approve/`);
    }
  };

  const handleReject = () => {
    post(`/admin/instructor-applications/${application.id}/reject/`, {
      onSuccess: () => setRejectDialogOpen(false),
    });
  };

  const handleUnlock = () => {
    if (confirm('Allow this user to resubmit their application?')) {
      router.post(`/admin/instructor-applications/${application.id}/unlock/`);
    }
  };

  return (
    <>
      <Head title={`Application: ${application.name}`} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Button
              component={Link}
              href="/admin/instructor-applications/"
              startIcon={<IconArrowLeft size={18} />}
              variant="outlined"
            >
              Back to Queue
            </Button>
          </Stack>

          <Grid container spacing={3}>
            {/* Main Content */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 4 }}>
                {/* Applicant Header */}
                <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
                  <Avatar sx={{ width: 80, height: 80, fontSize: 32, bgcolor: 'primary.main' }}>
                    {application.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h4">{application.name}</Typography>
                    <Typography color="text.secondary">{application.email}</Typography>
                    {application.jobTitle && (
                      <Typography variant="body2" color="primary">
                        {application.jobTitle}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }} />
                  <Chip
                    icon={<StatusIcon size={16} />}
                    label={statusConfig.label}
                    color={statusConfig.color}
                    size="large"
                  />
                </Stack>

                <Divider sx={{ mb: 3 }} />

                {/* Bio */}
                <Typography variant="h6" gutterBottom>
                  About
                </Typography>
                <Typography paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {application.bio || 'No bio provided.'}
                </Typography>

                {/* Teaching Experience */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Teaching Experience
                </Typography>
                <Typography paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {application.teachingExperience || 'Not provided.'}
                </Typography>

                {/* Why Teach Here */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Why They Want to Teach Here
                </Typography>
                <Typography paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {application.whyTeachHere || 'Not provided.'}
                </Typography>

                {/* Rejection Reason (if rejected) */}
                {application.status === 'rejected' && application.rejectionReason && (
                  <Alert severity="error" sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Rejection Reason:
                    </Typography>
                    <Typography>{application.rejectionReason}</Typography>
                  </Alert>
                )}
              </Paper>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              {/* Actions Card */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Actions
                  </Typography>
                  <Stack spacing={2}>
                    {application.status === 'pending_review' && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          fullWidth
                          startIcon={<IconCheck size={18} />}
                          onClick={handleApprove}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          fullWidth
                          startIcon={<IconX size={18} />}
                          onClick={() => setRejectDialogOpen(true)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {application.status === 'rejected' && (
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<IconLockOpen size={18} />}
                        onClick={handleUnlock}
                      >
                        Unlock for Resubmission
                      </Button>
                    )}
                    {application.status === 'approved' && (
                      <Alert severity="success">
                        This instructor has been approved and can now create courses.
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Links Card */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Links & Documents
                  </Typography>
                  <List dense>
                    {application.linkedinUrl && (
                      <ListItem
                        component="a"
                        href={application.linkedinUrl}
                        target="_blank"
                        rel="noopener"
                        sx={{ color: 'primary.main' }}
                      >
                        <ListItemIcon>
                          <IconExternalLink size={18} />
                        </ListItemIcon>
                        <ListItemText primary="LinkedIn Profile" />
                      </ListItem>
                    )}
                    {application.hasResume && (
                      <ListItem>
                        <ListItemIcon>
                          <IconFileText size={18} />
                        </ListItemIcon>
                        <ListItemText primary="Resume Uploaded" secondary="File on server" />
                      </ListItem>
                    )}
                    {application.certifications?.map((cert) => (
                      <ListItem key={cert.id}>
                        <ListItemIcon>
                          <IconFileText size={18} />
                        </ListItemIcon>
                        <ListItemText primary={cert.fileName} />
                      </ListItem>
                    ))}
                    {!application.linkedinUrl &&
                      !application.hasResume &&
                      !application.certifications?.length && (
                        <ListItem>
                          <ListItemText
                            primary="No documents uploaded"
                            secondary="The applicant has not uploaded any files"
                          />
                        </ListItem>
                      )}
                  </List>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Application Info
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Applied:</strong>{' '}
                    {new Date(application.createdAt).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reject Application</DialogTitle>
          <DialogContent>
            <Typography paragraph color="text.secondary">
              Please provide a reason for rejection. This will be shown to the applicant.
            </Typography>
            <TextField
              label="Rejection Reason"
              value={data.reason}
              onChange={(e) => setData('reason', e.target.value)}
              fullWidth
              multiline
              rows={4}
              required
              placeholder="e.g., Insufficient teaching experience, incomplete application..."
            />
            <Alert severity="warning" sx={{ mt: 2 }}>
              Note: Rejecting this application will automatically delete the uploaded
              resume and certifications for privacy compliance.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleReject}
              color="error"
              variant="contained"
              disabled={!data.reason.trim() || processing}
            >
              {processing ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
