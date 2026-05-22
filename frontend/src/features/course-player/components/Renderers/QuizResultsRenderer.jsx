import { Link } from '@inertiajs/react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import {
  IconCheck,
  IconX,
  IconRefresh,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { formatPoints } from '@/lib/formatPoints';

const formatReviewValue = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  return value;
};

/**
 * Renders quiz results inline within the CoursePlayer Whiteboard.
 * Shows score card, question review, attempt history, and retry button.
 */
export default function QuizResultsRenderer({ quizResults }) {
  const { quiz, attempts, canRetry, questionReview = [] } = quizResults;

  const bestAttempt = attempts.reduce(
    (best, a) => {
      const score = typeof a?.score === 'number' ? a.score : -1;
      const bestScore = typeof best?.score === 'number' ? best.score : -1;
      return !best || score > bestScore ? a : best;
    },
    null
  );

  const retryUrl = quiz.retryUrl || `/student/quiz/${quiz.id}/`;

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h5" gutterBottom>
          Quiz Results
        </Typography>
        <Typography color="text.secondary" gutterBottom sx={{ mb: 2 }}>
          Quiz: {quiz.title} • {quiz.nodeTitle}
        </Typography>

        {/* Best Score Card */}
        {bestAttempt && (
          <Paper
            sx={{
              p: 3,
              mb: 3,
              bgcolor: bestAttempt.passed ? 'success.light' : 'error.light',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={3}>
              {bestAttempt.passed ? (
                <IconCheck size={48} color="green" />
              ) : (
                <IconX size={48} color="red" />
              )}
              <Box>
                <Typography variant="h3">
                  {bestAttempt.score?.toFixed(1)}%
                </Typography>
                <Typography>
                  {bestAttempt.passed ? 'Passed!' : 'Not Passed'}
                  {' • '}Required: {quiz.passThreshold}%
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }} />
              <Box textAlign="right">
                <Typography variant="body2">
                  {formatPoints(bestAttempt.pointsEarned)} / {formatPoints(bestAttempt.pointsPossible)} points
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Best of {attempts.length} attempt{attempts.length > 1 ? 's' : ''}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Retry Button */}
        {canRetry && !bestAttempt?.passed && (
          <Alert
            severity="info"
            action={
              <Button
                component={Link}
                href={retryUrl}
                color="inherit"
                startIcon={<IconRefresh />}
              >
                Try Again
              </Button>
            }
            sx={{ mb: 3 }}
          >
            You have {quiz.maxAttempts - attempts.length} attempt
            {quiz.maxAttempts - attempts.length > 1 ? 's' : ''} remaining.
          </Alert>
        )}

        {/* Correct Answer Review */}
        {quiz.showCorrectAnswer && questionReview.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Correct Answer Review
            </Typography>
            <Stack spacing={2}>
              {questionReview.map((item, index) => (
                <Box key={`${item.questionId}-${index}`}>
                  <Stack direction="row" spacing={1} sx={{ mb: 0.75 }}>
                    <Chip
                      size="small"
                      label={
                        item.isCorrect === true
                          ? 'Correct'
                          : item.isCorrect === false
                            ? 'Incorrect'
                            : 'Pending Review'
                      }
                      color={
                        item.isCorrect === true
                          ? 'success'
                          : item.isCorrect === false
                            ? 'error'
                            : 'default'
                      }
                    />
                    <Typography variant="caption" color="text.secondary">
                      Question {index + 1}
                    </Typography>
                  </Stack>
                  <Typography variant="subtitle2">{item.questionText}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your answer: {formatReviewValue(item.studentAnswer, 'Not answered')}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Correct answer: {formatReviewValue(item.correctAnswer, 'N/A')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Points: {formatPoints(item.pointsEarned)} / {formatPoints(item.pointsPossible)}
                  </Typography>
                  {index < questionReview.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                </Box>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Attempt History */}
        {quiz.showAttemptHistory && (
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Attempt</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Points</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attempts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>#{a.attemptNumber}</TableCell>
                      <TableCell>
                        {a.score !== null ? `${a.score.toFixed(1)}%` : 'Pending'}
                      </TableCell>
                      <TableCell>
                        {formatPoints(a.pointsEarned)} / {formatPoints(a.pointsPossible)}
                      </TableCell>
                      <TableCell>
                        {a.passed === true && (
                          <Chip
                            icon={<IconCheck size={14} />}
                            label="Passed"
                            color="success"
                            size="small"
                          />
                        )}
                        {a.passed === false && (
                          <Chip
                            icon={<IconX size={14} />}
                            label="Failed"
                            color="error"
                            size="small"
                          />
                        )}
                        {a.passed === null && (
                          <Chip label="Pending Review" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {a.submittedAt
                          ? new Date(a.submittedAt).toLocaleString()
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </motion.div>
    </Box>
  );
}
