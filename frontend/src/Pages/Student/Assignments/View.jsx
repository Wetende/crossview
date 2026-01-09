import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  IconArrowLeft,
  IconUpload,
  IconCheck,
  IconClock,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

export default function View({ assignment, submission }) {
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isPastDue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    if (file) formData.append('file', file);
    if (textContent) formData.append('text_content', textContent);

    router.post(`/student/assignment/${assignment.id}/submit/`, formData, {
      forceFormData: true,
      onFinish: () => setSubmitting(false),
    });
  };

  return (
    <>
      <Head title={assignment.title} />
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
              href="/dashboard/"
              startIcon={<IconArrowLeft />}
              variant="outlined"
            >
              Back
            </Button>
          </Stack>

          <Grid container spacing={3}>
            {/* Main Content */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                  {assignment.title}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {assignment.programName} • Weight: {assignment.weight}%
                </Typography>

                {assignment.dueDate && (
                  <Chip
                    icon={<IconClock size={16} />}
                    label={`Due: ${new Date(assignment.dueDate).toLocaleString()}`}
                    color={isPastDue ? 'error' : 'default'}
                    sx={{ mb: 2 }}
                  />
                )}

                <Typography variant="h6" sx={{ mt: 3 }}>
                  Description
                </Typography>
                <Typography paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {assignment.description}
                </Typography>

                <Typography variant="h6" sx={{ mt: 3 }}>
                  Instructions
                </Typography>
                <Typography paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {assignment.instructions}
                </Typography>

                {assignment.allowLateSubmission && assignment.latePenalty > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Late submissions incur a {assignment.latePenalty}% penalty.
                  </Alert>
                )}
              </Paper>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              {/* Submission Status */}
              {submission ? (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Your Submission
                    </Typography>
                    <Stack spacing={1}>
                      <Chip
                        icon={submission.status === 'graded' ? <IconCheck size={14} /> : <IconClock size={14} />}
                        label={submission.status === 'graded' ? 'Graded' : submission.status === 'returned' ? 'Returned' : 'Submitted'}
                        color={submission.status === 'graded' ? 'success' : 'default'}
                      />
                      {submission.isLate && (
                        <Chip
                          icon={<IconAlertTriangle size={14} />}
                          label="Late Submission"
                          color="warning"
                          size="small"
                        />
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Submitted: {new Date(submission.submittedAt).toLocaleString()}
                      </Typography>
                      {submission.fileName && (
                        <Typography variant="body2">
                          File: {submission.fileName}
                        </Typography>
                      )}
                      {submission.score !== null && (
                        <Typography variant="h5" color="primary">
                          Score: {submission.score}%
                        </Typography>
                      )}
                      {submission.feedback && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2">Feedback:</Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {submission.feedback}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ) : null}

              {/* Submit Form */}
              {(!submission || submission.status !== 'graded') && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {submission ? 'Resubmit' : 'Submit Assignment'}
                    </Typography>

                    {isPastDue && !assignment.allowLateSubmission ? (
                      <Alert severity="error">
                        The deadline has passed. Submissions are closed.
                      </Alert>
                    ) : (
                      <form onSubmit={handleSubmit}>
                        <Stack spacing={2}>
                          {isPastDue && (
                            <Alert severity="warning" icon={<IconAlertTriangle />}>
                              Submitting late. Penalty: {assignment.latePenalty}%
                            </Alert>
                          )}

                          {(assignment.submissionType === 'file' || assignment.submissionType === 'both') && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Upload File
                              </Typography>
                              <input
                                type="file"
                                onChange={(e) => setFile(e.target.files[0])}
                                accept={assignment.allowedFileTypes?.map(t => `.${t}`).join(',')}
                              />
                              {assignment.allowedFileTypes?.length > 0 && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Allowed: {assignment.allowedFileTypes.join(', ')}
                                </Typography>
                              )}
                            </Box>
                          )}

                          {(assignment.submissionType === 'text' || assignment.submissionType === 'both') && (
                            <TextField
                              label="Text Response"
                              value={textContent}
                              onChange={(e) => setTextContent(e.target.value)}
                              multiline
                              rows={6}
                              fullWidth
                            />
                          )}

                          <Button
                            type="submit"
                            variant="contained"
                            startIcon={<IconUpload />}
                            disabled={submitting || (!file && !textContent)}
                          >
                            {submitting ? 'Submitting...' : submission ? 'Resubmit' : 'Submit'}
                          </Button>
                        </Stack>
                      </form>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </>
  );
}
