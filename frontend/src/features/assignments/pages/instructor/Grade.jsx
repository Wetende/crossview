/**
 * Instructor Assignment Grade/Review
 * Review and grade a student's assignment submission
 * Design matches MasterStudy LMS reference
 */

import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
  Box,
  Typography,
  Paper,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Stack,
  IconButton,
  Chip,
  Alert,
  TextField,
} from '@mui/material';
import {
  IconArrowLeft,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

import DashboardLayout from '@/layouts/DashboardLayout';

export default function Grade({ submission, assignment }) {
  const passThreshold = assignment.passThreshold ?? 50;
  const [gradeStatus, setGradeStatus] = useState(
    submission.passed === true ||
      (submission.score !== null && submission.score >= passThreshold)
      ? 'passed'
      : 'failed'
  );
  
  const { data, setData, post, processing, transform } = useForm({
    score: submission.score ?? '',
    feedback: submission.feedback || '',
    status: 'graded',
    review_attachments: [],
    review_audio: null,
    review_video: null,
  });

  const resolveMediaUrl = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
    return `/media/${path}`;
  };

  const breadcrumbs = [
    { label: 'Assignments', href: '/instructor/assignments/' },
    { label: assignment.title, href: `/instructor/assignments/${assignment.id}/submissions/` },
    { label: 'Review' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    transform((currentData) => {
      const enteredScore = parseFloat(currentData.score) || 0;
      const passingFloor = Math.max(0, passThreshold);
      const failingCeiling = Math.max(passingFloor - 1, 0);
      const finalScore =
        gradeStatus === 'passed'
          ? Math.max(enteredScore || passingFloor, passingFloor)
          : Math.min(enteredScore || 0, failingCeiling);
      return {
        ...currentData,
        score: finalScore,
      };
    });
    post(`/instructor/submissions/${submission.id}/grade/`, {
      forceFormData: true,
    });
  };

  const getStatusBadge = () => {
    if (submission.status === 'graded') {
      if (submission.passed === true || submission.finalScore >= passThreshold) {
        return <Chip label="PASSED" size="small" sx={{ bgcolor: '#10b981', color: 'white', fontWeight: 600 }} />;
      } else {
        return <Chip label="FAILED" size="small" sx={{ bgcolor: '#ef4444', color: 'white', fontWeight: 600 }} />;
      }
    }
    return <Chip label="PENDING" size="small" sx={{ bgcolor: '#6b7280', color: 'white', fontWeight: 600 }} />;
  };

  return (
    <DashboardLayout breadcrumbs={breadcrumbs} role="instructor">
      <Head title={`Review: ${submission.studentName}`} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header Bar */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            p: 2,
            mb: 0,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton
              component={Link}
              href={`/instructor/assignments/${assignment.id}/submissions/`}
              sx={{ color: 'white' }}
            >
              <IconArrowLeft size={20} />
            </IconButton>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8 }}>
                STUDENT ASSIGNMENT
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {assignment.title}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="body2">
              ATTEMPT: {submission.attemptNumber || 1}
            </Typography>
            {getStatusBadge()}
          </Stack>
        </Paper>

        {/* Main Content */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderTop: 0,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            p: 4,
          }}
        >
          {/* Late Submission Warning */}
          {submission.isLate && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Late submission. {assignment.latePenalty}% penalty will be applied.
            </Alert>
          )}

          {/* Student Answer Section */}
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Answered by student:
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 600, mt: 2, mb: 3 }}>
            {assignment.title}
          </Typography>

          {/* Student's Response */}
          <Box sx={{ mb: 4, lineHeight: 1.8 }}>
            {submission.textContent ? (
              <Typography
                sx={{
                  color: 'text.primary',
                  whiteSpace: 'pre-wrap',
                  fontSize: '0.95rem',
                }}
              >
                {submission.textContent}
              </Typography>
            ) : Array.isArray(submission.media) && submission.media.length > 0 ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Submitted media
                </Typography>
                <Stack spacing={1}>
                  {submission.media.map((media) => (
                    <Stack
                      key={media.id}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography>{media.name}</Typography>
                      <Button
                        component="a"
                        href={resolveMediaUrl(media.path)}
                        size="small"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            ) : (
              <Typography color="text.secondary" fontStyle="italic">
                No response submitted
              </Typography>
            )}
            {Array.isArray(submission.media) && submission.media.length > 0 && submission.textContent ? (
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Submitted media
                </Typography>
                <Stack spacing={1}>
                  {submission.media.map((media) => (
                    <Stack
                      key={media.id}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography>{media.name}</Typography>
                      <Button
                        component="a"
                        href={resolveMediaUrl(media.path)}
                        size="small"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            ) : null}
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Grading Section */}
          <form onSubmit={handleSubmit}>
            {/* Passed/Failed Radio Buttons */}
            <RadioGroup
              row
              value={gradeStatus}
              onChange={(e) => setGradeStatus(e.target.value)}
              sx={{ mb: 3 }}
            >
              <FormControlLabel
                value="passed"
                control={
                  <Radio
                    sx={{
                      '&.Mui-checked': { color: '#10b981' },
                    }}
                  />
                }
                label={
                  <Chip
                    label="Passed"
                    variant={gradeStatus === 'passed' ? 'filled' : 'outlined'}
                    sx={{
                      bgcolor: gradeStatus === 'passed' ? '#10b981' : 'transparent',
                      color: gradeStatus === 'passed' ? 'white' : '#10b981',
                      borderColor: '#10b981',
                      fontWeight: 500,
                    }}
                  />
                }
                sx={{ mr: 2 }}
              />
              <FormControlLabel
                value="failed"
                control={
                  <Radio
                    sx={{
                      '&.Mui-checked': { color: '#6b7280' },
                    }}
                  />
                }
                label={
                  <Chip
                    label="Failed"
                    variant={gradeStatus === 'failed' ? 'filled' : 'outlined'}
                    sx={{
                      bgcolor: gradeStatus === 'failed' ? '#6b7280' : 'transparent',
                      color: gradeStatus === 'failed' ? 'white' : '#6b7280',
                      borderColor: '#6b7280',
                      fontWeight: 500,
                    }}
                  />
                }
              />
            </RadioGroup>

            <TextField
              label={`Score (pass mark ${passThreshold}%)`}
              type="number"
              value={data.score}
              onChange={(e) => setData('score', e.target.value)}
              inputProps={{ min: 0, max: 100, step: 0.5 }}
              sx={{ mb: 3, maxWidth: 220 }}
            />

            {/* Feedback Text Editor */}
            <Paper
              variant="outlined"
              sx={{
                mb: 3,
                overflow: 'hidden',
              }}
            >
              {/* Simple Toolbar */}
              <Box
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  p: 1,
                  bgcolor: 'grey.50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
                  Paragraph
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.feedback.split(/\s+/).filter(Boolean).length} words
                </Typography>
              </Box>
              <Box
                component="textarea"
                value={data.feedback}
                onChange={(e) => setData('feedback', e.target.value)}
                placeholder="Enter feedback for the student..."
                sx={{
                  width: '100%',
                  minHeight: 150,
                  p: 2,
                  border: 'none',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                }}
              />
            </Paper>

            <Stack spacing={2} sx={{ mb: 3 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Review attachments
                </Typography>
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setData('review_attachments', Array.from(e.target.files || []))
                  }
                  accept={assignment.allowedFileTypes?.map((type) => `.${type}`).join(',')}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Review audio
                </Typography>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setData('review_audio', e.target.files?.[0] || null)}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Review video
                </Typography>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setData('review_video', e.target.files?.[0] || null)}
                />
              </Box>
              {Array.isArray(submission.reviewMedia) && submission.reviewMedia.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Existing review media
                  </Typography>
                  <Stack spacing={1}>
                    {submission.reviewMedia.map((media) => (
                      <Stack
                        key={media.id}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography>{media.name}</Typography>
                        <Button
                          component="a"
                          href={resolveMediaUrl(media.path)}
                          size="small"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              )}
            </Stack>

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={processing}
                sx={{
                  bgcolor: 'primary.main',
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {processing ? 'Saving...' : 'Submit Review'}
              </Button>
            </Box>
          </form>
        </Paper>
      </motion.div>
    </DashboardLayout>
  );
}
