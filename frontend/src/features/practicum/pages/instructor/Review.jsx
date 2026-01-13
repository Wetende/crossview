/**
 * Instructor Practicum Review Page
 * Requirements: US-5.2, US-5.3, US-5.4, US-5.5, US-5.6
 */

import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
  Box,
  Stack,
  Typography,
  Paper,
  Button,
  TextField,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import CancelIcon from '@mui/icons-material/Cancel';

import InstructorLayout from '@/layouts/InstructorLayout';
import MediaPlayer from '@/components/MediaPlayer';
import RubricGrader from '@/components/RubricGrader';

const statusColors = {
  pending: 'warning',
  approved: 'success',
  revision_required: 'info',
  rejected: 'error',
};

export default function PracticumReview({
  submission,
  rubric,
  previousSubmissions,
  existingReview,
}) {
  const [dimensionScores, setDimensionScores] = useState(
    existingReview?.dimensionScores || {}
  );
  const [comments, setComments] = useState(existingReview?.comments || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = (status) => {
    setSubmitting(true);
    router.post(
      `/instructor/practicum/${submission.id}/review/`,
      {
        status,
        comments,
        dimensionScores: rubric ? dimensionScores : null,
      },
      {
        onFinish: () => setSubmitting(false),
      }
    );
  };

  const breadcrumbs = [
    { label: 'Practicum', href: '/instructor/practicum/' },
    { label: 'Review Submission' },
  ];

  const isAlreadyReviewed = existingReview && submission.status !== 'pending';

  return (
    <InstructorLayout breadcrumbs={breadcrumbs}>
      <Head title={`Review - ${submission.nodeTitle}`} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
      >
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          {/* Main Content */}
          <Box sx={{ flex: 1 }}>
            <Stack spacing={3}>
              {/* Submission Info */}
              <Paper sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box>
                      <Typography variant="h5" gutterBottom>
                        {submission.nodeTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {submission.programName}
                      </Typography>
                    </Box>
                    <Chip
                      label={submission.status?.replace('_', ' ') || 'Pending'}
                      color={statusColors[submission.status] || 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>

                  <Divider />

                  <Stack direction="row" spacing={4}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Student
                      </Typography>
                      <Typography variant="body2">
                        {submission.studentName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Submitted
                      </Typography>
                      <Typography variant="body2">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        File Type
                      </Typography>
                      <Typography variant="body2">
                        {submission.type?.toUpperCase() || 'FILE'}
                      </Typography>
                    </Box>
                  </Stack>

                  {submission.notes && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Student Notes
                        </Typography>
                        <Typography variant="body2">{submission.notes}</Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              </Paper>

              {/* Media Player */}
              {submission.fileUrl && (
                <MediaPlayer
                  url={submission.fileUrl}
                  type={submission.type}
                  title={submission.nodeTitle}
                />
              )}

              {/* Rubric Grader */}
              {rubric && (
                <RubricGrader
                  rubric={rubric}
                  scores={dimensionScores}
                  onChange={setDimensionScores}
                  readOnly={isAlreadyReviewed}
                />
              )}

              {/* Feedback */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Feedback
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Provide feedback for the student..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  disabled={isAlreadyReviewed}
                />
              </Paper>

              {/* Already Reviewed Alert */}
              {isAlreadyReviewed && (
                <Alert severity="info">
                  This submission has already been reviewed. The review was submitted
                  on {new Date(existingReview.reviewedAt).toLocaleString()}.
                </Alert>
              )}

              {/* Action Buttons */}
              {!isAlreadyReviewed && (
                <Paper sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleSubmitReview('rejected')}
                      disabled={submitting}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<ReplayIcon />}
                      onClick={() => handleSubmitReview('revision_required')}
                      disabled={submitting}
                    >
                      Request Revision
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleSubmitReview('approved')}
                      disabled={submitting}
                    >
                      Approve
                    </Button>
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Box>

          {/* Sidebar */}
          <Box sx={{ width: { xs: '100%', lg: 300 } }}>
            <Stack spacing={2}>
              {/* Submission History */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Submission History
                </Typography>

                {previousSubmissions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    This is the first submission
                  </Typography>
                ) : (
                  <List dense>
                    {previousSubmissions.map((prev) => (
                      <ListItem key={prev.id} divider>
                        <ListItemText
                          primary={`Version ${prev.version}`}
                          secondary={
                            <>
                              <Typography variant="caption" display="block">
                                {new Date(prev.submittedAt).toLocaleDateString()}
                              </Typography>
                              {prev.review && (
                                <Chip
                                  label={prev.review.status.replace('_', ' ')}
                                  size="small"
                                  color={statusColors[prev.review.status]}
                                  sx={{ mt: 0.5, textTransform: 'capitalize' }}
                                />
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>

              {/* Previous Reviews Feedback - Only show if there are reviews */}
              {previousSubmissions.some((prev) => prev.review?.comments) && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Previous Feedback
                  </Typography>
                  <Stack spacing={2}>
                    {previousSubmissions
                      .filter((prev) => prev.review?.comments)
                      .map((prev) => (
                        <Box
                          key={prev.id}
                          sx={{
                            p: 1.5,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                            borderLeft: 3,
                            borderColor:
                              prev.review.status === 'approved'
                                ? 'success.main'
                                : prev.review.status === 'revision_required'
                                ? 'warning.main'
                                : 'error.main',
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Version {prev.version} •{' '}
                            {new Date(prev.review.reviewedAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {prev.review.comments}
                          </Typography>
                          {prev.review.totalScore && (
                            <Typography
                              variant="caption"
                              color="primary"
                              fontWeight="bold"
                              display="block"
                              sx={{ mt: 0.5 }}
                            >
                              Score: {prev.review.totalScore}%
                            </Typography>
                          )}
                        </Box>
                      ))}
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Box>
        </Stack>
      </motion.div>
    </InstructorLayout>
  );
}
