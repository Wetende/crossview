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
} from '@mui/material';
import {
  IconArrowLeft,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

import DashboardLayout from '@/layouts/DashboardLayout';

export default function Grade({ submission, assignment }) {
  const [gradeStatus, setGradeStatus] = useState(
    submission.score !== null && submission.score >= 50 ? 'passed' : 'failed'
  );
  
  const { data, setData, post, processing } = useForm({
    score: submission.score || '',
    feedback: submission.feedback || '',
    status: 'graded',
  });

  const breadcrumbs = [
    { label: 'Assignments', href: '/instructor/assignments/' },
    { label: assignment.title, href: `/instructor/assignments/${assignment.id}/submissions/` },
    { label: 'Review' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Set score based on passed/failed status
    const finalScore = gradeStatus === 'passed' ? Math.max(data.score || 50, 50) : Math.min(data.score || 0, 49);
    setData('score', finalScore);
    post(`/instructor/submissions/${submission.id}/grade/`);
  };

  const getStatusBadge = () => {
    if (submission.status === 'graded') {
      if (submission.score >= 50) {
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
              ATTEMPT: 1
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
            ) : submission.fileName ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">Uploaded File:</Typography>
                <Typography>{submission.fileName}</Typography>
                {/* TODO: Add download link */}
              </Paper>
            ) : (
              <Typography color="text.secondary" fontStyle="italic">
                No response submitted
              </Typography>
            )}
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
