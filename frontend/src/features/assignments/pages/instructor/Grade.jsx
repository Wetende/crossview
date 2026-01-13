import { Head, Link, useForm } from '@inertiajs/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  IconArrowLeft,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

export default function Grade({ submission, assignment }) {
  const { data, setData, post, processing } = useForm({
    score: submission.score || '',
    feedback: submission.feedback || '',
    status: 'graded',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(`/instructor/submissions/${submission.id}/grade/`);
  };

  return (
    <>
      <Head title={`Grade: ${submission.studentName}`} />
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
              href={`/instructor/assignments/${assignment.id}/submissions/`}
              startIcon={<IconArrowLeft />}
              variant="outlined"
            >
              Back
            </Button>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4">Grade Submission</Typography>
              <Typography color="text.secondary">
                {assignment.title}
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            {/* Submission Content */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 4 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Typography variant="h6">{submission.studentName}</Typography>
                  <Typography color="text.secondary">{submission.studentEmail}</Typography>
                </Stack>

                {submission.isLate && (
                  <Alert severity="warning" icon={<IconAlertTriangle />} sx={{ mb: 3 }}>
                    Late submission. {assignment.latePenalty}% penalty will be applied.
                  </Alert>
                )}

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Submitted: {new Date(submission.submittedAt).toLocaleString()}
                </Typography>

                {submission.fileName && (
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle2">Uploaded File</Typography>
                      <Typography>{submission.fileName}</Typography>
                      {/* TODO: Add download link */}
                    </CardContent>
                  </Card>
                )}

                {submission.textContent && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Text Response
                      </Typography>
                      <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                        {submission.textContent}
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                {/* Instructions Reference */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Assignment Instructions
                  </Typography>
                  <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {assignment.instructions}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Grading Form */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Grading
                  </Typography>
                  <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                      <TextField
                        label="Score (%)"
                        type="number"
                        value={data.score}
                        onChange={(e) => setData('score', e.target.value)}
                        inputProps={{ min: 0, max: 100 }}
                        fullWidth
                        required
                      />

                      {submission.isLate && assignment.latePenalty > 0 && data.score && (
                        <Alert severity="info">
                          Final score after penalty:{' '}
                          <strong>
                            {(parseFloat(data.score) * (1 - assignment.latePenalty / 100)).toFixed(1)}%
                          </strong>
                        </Alert>
                      )}

                      <TextField
                        label="Feedback"
                        value={data.feedback}
                        onChange={(e) => setData('feedback', e.target.value)}
                        multiline
                        rows={6}
                        fullWidth
                        placeholder="Written feedback for the student..."
                      />

                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={data.status}
                          label="Status"
                          onChange={(e) => setData('status', e.target.value)}
                        >
                          <MenuItem value="graded">Graded</MenuItem>
                          <MenuItem value="returned">Return for Revision</MenuItem>
                        </Select>
                      </FormControl>

                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<IconCheck />}
                        disabled={processing || !data.score}
                        fullWidth
                      >
                        {processing ? 'Saving...' : 'Save Grade'}
                      </Button>
                    </Stack>
                  </form>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </>
  );
}
