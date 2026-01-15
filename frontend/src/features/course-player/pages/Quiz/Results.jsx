import { Head, Link } from '@inertiajs/react';
import {
  Box,
  Container,
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
} from '@mui/material';
import {
  IconCheck,
  IconX,
  IconRefresh,
  IconArrowLeft,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

export default function Results({ quiz, attempts, canRetry }) {
  const bestAttempt = attempts.reduce(
    (best, a) => (!best || (a.score && a.score > best.score) ? a : best),
    null
  );

  return (
    <>
      <Head title={`Results: ${quiz.title}`} />
      <Container maxWidth="md" sx={{ py: 4 }}>
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
              Back to Dashboard
            </Button>
          </Stack>

          <Typography variant="h4" gutterBottom>
            Quiz Results
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            {quiz.title} • {quiz.nodeTitle}
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
                    {bestAttempt.pointsEarned} / {bestAttempt.pointsPossible} points
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
                  href={`/student/quiz/${quiz.id}/`}
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

          {/* All Attempts */}
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
                        {a.pointsEarned ?? '—'} / {a.pointsPossible ?? '—'}
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
        </motion.div>
      </Container>
    </>
  );
}
