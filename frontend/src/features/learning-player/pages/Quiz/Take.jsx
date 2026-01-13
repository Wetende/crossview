import { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  RadioGroup,
  Radio,
  FormControlLabel,
  TextField,
  Alert,
  LinearProgress,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  IconClock,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconSend,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import MatchingQuestion from '../../../components/quiz/MatchingQuestion';
import OrderingQuestion from '../../../components/quiz/OrderingQuestion';
import FillBlankQuestion from '../../../components/quiz/FillBlankQuestion';

export default function Take({ quiz, attempt, questions, attemptsRemaining }) {
  const [answers, setAnswers] = useState(attempt.answers || {});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  // Calculate elapsed time for resuming
  useEffect(() => {
    if (quiz.timeLimit) {
      const startTime = new Date(attempt.startedAt).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = quiz.timeLimit * 60 - elapsed;
      setTimeRemaining(Math.max(0, remaining));
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit(); // Auto-submit on time up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timeRemaining !== null]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    setSubmitting(true);
    router.post(
      `/student/quiz/${quiz.id}/submit/`,
      { answers },
      {
        onFinish: () => setSubmitting(false),
      }
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <>
      <Head title={`Quiz: ${quiz.title}`} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h5">{quiz.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {quiz.nodeTitle}
                </Typography>
              </Box>
              {timeRemaining !== null && (
                <Chip
                  icon={<IconClock size={16} />}
                  label={formatTime(timeRemaining)}
                  color={timeRemaining < 60 ? 'error' : timeRemaining < 300 ? 'warning' : 'default'}
                  size="large"
                />
              )}
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption">
                  {answeredCount} of {questions.length} answered
                </Typography>
                <Typography variant="caption">
                  Attempt #{attempt.attemptNumber}
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          </Paper>

          {/* Question */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Chip label={`Question ${currentIdx + 1}`} color="primary" />
                <Chip label={`${currentQuestion.points} pt${currentQuestion.points > 1 ? 's' : ''}`} variant="outlined" size="small" />
              </Stack>

              <Typography variant="h6" sx={{ mb: 3 }}>
                {currentQuestion.text}
              </Typography>

              {/* MCQ Options */}
              {currentQuestion.type === 'mcq' && currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion.id] ?? ''}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, parseInt(e.target.value))
                  }
                >
                  {currentQuestion.options.map((opt, idx) => (
                    <FormControlLabel
                      key={idx}
                      value={idx}
                      control={<Radio />}
                      label={`${String.fromCharCode(65 + idx)}. ${opt}`}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        mx: 0,
                        p: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    />
                  ))}
                </RadioGroup>
              )}

              {/* True/False */}
              {currentQuestion.type === 'true_false' && (
                <RadioGroup
                  value={answers[currentQuestion.id] ?? ''}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, e.target.value === 'true')
                  }
                >
                  <FormControlLabel
                    value="true"
                    control={<Radio />}
                    label="True"
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      mx: 0,
                      p: 1,
                    }}
                  />
                  <FormControlLabel
                    value="false"
                    control={<Radio />}
                    label="False"
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mx: 0,
                      p: 1,
                    }}
                  />
                </RadioGroup>
              )}

              {/* Short Answer */}
              {currentQuestion.type === 'short_answer' && (
                <TextField
                  value={answers[currentQuestion.id] ?? ''}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, e.target.value)
                  }
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Type your answer here..."
                />
              )}

              {/* Matching */}
              {currentQuestion.type === 'matching' && (
                  <MatchingQuestion
                      question={currentQuestion}
                      value={answers[currentQuestion.id]}
                      onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  />
              )}
              
              {/* Ordering */}
              {currentQuestion.type === 'ordering' && (
                  <OrderingQuestion
                      question={currentQuestion}
                      value={answers[currentQuestion.id]}
                      onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                  />
               )}
               
               {/* Fill Blank */}
               {currentQuestion.type === 'fill_blank' && (
                   <FillBlankQuestion
                       question={currentQuestion}
                       value={answers[currentQuestion.id]}
                       onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
                   />
               )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <Stack direction="row" justifyContent="space-between">
            <Button
              startIcon={<IconChevronLeft />}
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
            >
              Previous
            </Button>

            {/* Question dots */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              {questions.map((q, idx) => (
                <Box
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: answers[q.id] !== undefined ? 'success.main' : 'grey.300',
                    border: idx === currentIdx ? '2px solid' : 'none',
                    borderColor: 'primary.main',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: answers[q.id] !== undefined ? 'white' : 'text.secondary',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                >
                  {idx + 1}
                </Box>
              ))}
            </Stack>

            {currentIdx === questions.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                endIcon={<IconSend />}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            ) : (
              <Button
                endIcon={<IconChevronRight />}
                onClick={() =>
                  setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))
                }
              >
                Next
              </Button>
            )}
          </Stack>

          {attemptsRemaining > 0 && (
            <Alert severity="info" sx={{ mt: 3 }}>
              You have {attemptsRemaining} attempt{attemptsRemaining > 1 ? 's' : ''} remaining
              after this one.
            </Alert>
          )}
        </motion.div>
      </Container>
    </>
  );
}
