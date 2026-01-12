import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconCheck,
  IconX,
  IconPlayerPlay,
  IconEye,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import MatchingPairsEditor from '../../../components/quiz/MatchingPairsEditor';
import FillBlankEditor from '../../../components/quiz/FillBlankEditor';
import OrderingEditor from '../../../components/quiz/OrderingEditor';

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True/False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'matching', label: 'Matching Pairs' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'ordering', label: 'Ordering / Sequence' },
];

export default function Edit({ quiz, questions }) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    questionType: 'mcq',
    text: '',
    points: 1,
    options: ['', '', '', ''],
    correctAnswer: 0,
    keywords: [],
    manualGrading: true,
    pairs: [], // For matching
    gaps: [], // For fill_blank
    items: ['', '', '', ''], // For ordering
  });

  const { data, setData, post, processing } = useForm({
    title: quiz.title,
    description: quiz.description,
    timeLimit: quiz.timeLimit || '',
    maxAttempts: quiz.maxAttempts,
    passThreshold: quiz.passThreshold,
    randomizeQuestions: quiz.randomizeQuestions || false,
    showAnswers: quiz.showAnswers !== false, // default true
    retakePenalty: quiz.retakePenalty || 0,
    action: 'update_settings',
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setData('action', 'update_settings');
    post(`/instructor/quizzes/${quiz.id}/edit/`, {
      preserveScroll: true,
    });
  };

  const handleAddQuestion = () => {
    router.post(
      `/instructor/quizzes/${quiz.id}/edit/`,
      {
        action: 'add_question',
        questionType: newQuestion.questionType,
        text: newQuestion.text,
        points: newQuestion.points,
        options: newQuestion.options.filter((o) => o.trim() !== ''),
        correctAnswer: newQuestion.correctAnswer,
        keywords: newQuestion.keywords,
        manualGrading: newQuestion.manualGrading,
        pairs: newQuestion.pairs,
        gaps: newQuestion.gaps,
        items: newQuestion.items.filter(i => i && i.trim() !== ''),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setAddDialogOpen(false);
          setNewQuestion({
            questionType: 'mcq',
            text: '',
            points: 1,
            options: ['', '', '', ''],
            correctAnswer: 0,
            keywords: [],
            manualGrading: true,
            pairs: [],
            gaps: [],
            items: ['', '', '', ''],
          });
        },
      }
    );
  };

  const handleDeleteQuestion = (questionId) => {
    if (confirm('Delete this question?')) {
      router.post(
        `/instructor/quizzes/${quiz.id}/edit/`,
        { action: 'delete_question', questionId },
        { preserveScroll: true }
      );
    }
  };

  const handlePublish = () => {
    router.post(
      `/instructor/quizzes/${quiz.id}/edit/`,
      { action: quiz.isPublished ? 'unpublish' : 'publish' },
      { preserveScroll: true }
    );
  };

  return (
    <>
      <Head title={`Edit Quiz: ${quiz.title}`} />
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
              href={`/instructor/lesson/${quiz.nodeId}/quizzes/`}
              startIcon={<IconArrowLeft />}
              variant="outlined"
            >
              Back
            </Button>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4">{quiz.title}</Typography>
              <Typography color="text.secondary">
                {quiz.programName} / {quiz.nodeTitle}
              </Typography>
            </Box>
            <Chip
              label={quiz.isPublished ? 'Published' : 'Draft'}
              color={quiz.isPublished ? 'success' : 'default'}
            />
            <Button
              variant={quiz.isPublished ? 'outlined' : 'contained'}
              color={quiz.isPublished ? 'warning' : 'success'}
              onClick={handlePublish}
              startIcon={quiz.isPublished ? <IconX /> : <IconPlayerPlay />}
            >
              {quiz.isPublished ? 'Unpublish' : 'Publish'}
            </Button>
          </Stack>

          {/* Settings */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quiz Settings
            </Typography>
            <form onSubmit={handleSaveSettings}>
              <Stack spacing={2}>
                <TextField
                  label="Title"
                  value={data.title}
                  onChange={(e) => setData('title', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                />
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Time Limit (minutes)"
                    type="number"
                    value={data.timeLimit}
                    onChange={(e) => setData('timeLimit', e.target.value)}
                    sx={{ width: 200 }}
                    placeholder="No limit"
                  />
                  <TextField
                    label="Max Attempts"
                    type="number"
                    value={data.maxAttempts}
                    onChange={(e) => setData('maxAttempts', parseInt(e.target.value))}
                    sx={{ width: 150 }}
                    inputProps={{ min: 1 }}
                  />

                  <TextField
                    label="Pass Threshold (%)"
                    type="number"
                    value={data.passThreshold}
                    onChange={(e) => setData('passThreshold', parseInt(e.target.value))}
                    sx={{ width: 150 }}
                    inputProps={{ min: 0, max: 100 }}
                  />
                </Stack>
                <Stack direction="row" spacing={3} alignItems="center">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={data.randomizeQuestions}
                        onChange={(e) => setData('randomizeQuestions', e.target.checked)}
                      />
                    }
                    label="Randomize Questions"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={data.showAnswers}
                        onChange={(e) => setData('showAnswers', e.target.checked)}
                      />
                    }
                    label="Show Answers After Submit"
                  />
                  <TextField 
                    label="Retake Penalty (%)"
                    type="number"
                    value={data.retakePenalty}
                    onChange={(e) => setData('retakePenalty', parseInt(e.target.value))}
                    sx={{ width: 180 }}
                  />
                </Stack>
                <Box>
                  <Button type="submit" variant="contained" disabled={processing}>
                    Save Settings
                  </Button>
                </Box>
              </Stack>
            </form>
          </Paper>

          {/* Questions */}
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">
                Questions ({questions.length})
              </Typography>
              <Button
                startIcon={<IconPlus />}
                variant="contained"
                onClick={() => setAddDialogOpen(true)}
              >
                Add Question
              </Button>
            </Stack>

            {questions.length === 0 ? (
              <Alert severity="info">
                No questions yet. Add questions to make this quiz ready for students.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {questions.map((q, idx) => (
                  <Card key={q.id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" alignItems="flex-start" spacing={2}>
                        <Chip label={`Q${idx + 1}`} size="small" />
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight="medium">{q.text}</Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              size="small"
                              label={QUESTION_TYPES.find((t) => t.value === q.type)?.label}
                              variant="outlined"
                            />
                            <Chip size="small" label={`${q.points} pt${q.points > 1 ? 's' : ''}`} />
                          </Stack>
                          {q.type === 'mcq' && q.answerData?.options && (
                            <Box sx={{ mt: 1 }}>
                              {q.answerData.options.map((opt, i) => (
                                <Typography
                                  key={i}
                                  variant="body2"
                                  color={i === q.answerData.correct ? 'success.main' : 'text.secondary'}
                                >
                                  {i === q.answerData.correct && '✓ '}
                                  {String.fromCharCode(65 + i)}. {opt}
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </Box>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteQuestion(q.id)}
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>
        </motion.div>

        {/* Add Question Dialog */}
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Add Question</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={newQuestion.questionType}
                  label="Question Type"
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, questionType: e.target.value })
                  }
                >
                  {QUESTION_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {newQuestion.questionType === 'matching' && (
                <MatchingPairsEditor 
                  pairs={newQuestion.pairs} 
                  onChange={(pairs) => setNewQuestion({...newQuestion, pairs})} 
                />
              )}

              {newQuestion.questionType === 'fill_blank' && (
                <FillBlankEditor 
                  text={newQuestion.text}
                  gaps={newQuestion.gaps}
                  onTextChange={(val) => setNewQuestion({...newQuestion, text: val})}
                  onGapsChange={(gaps) => setNewQuestion({...newQuestion, gaps})}
                />
              )}

              {newQuestion.questionType === 'ordering' && (
                 <OrderingEditor
                   items={newQuestion.items}
                   onChange={(items) => setNewQuestion({...newQuestion, items})}
                 />
              )}
              
              {/* Only show default text input if NOT fill_blank (which has its own text editor) */}
              {newQuestion.questionType !== 'fill_blank' && (
                  <TextField
                    label="Question Text"
                    value={newQuestion.text}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, text: e.target.value })
                    }
                    fullWidth
                    multiline
                    rows={2}
                  />
              )}

              <TextField
                label="Points"
                type="number"
                value={newQuestion.points}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })
                }
                sx={{ width: 100 }}
                inputProps={{ min: 1 }}
              />

              {newQuestion.questionType === 'mcq' && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Options (select correct answer)
                  </Typography>
                  <RadioGroup
                    value={newQuestion.correctAnswer}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        correctAnswer: parseInt(e.target.value),
                      })
                    }
                  >
                    {newQuestion.options.map((opt, idx) => (
                      <Stack key={idx} direction="row" alignItems="center" spacing={1}>
                        <FormControlLabel
                          value={idx}
                          control={<Radio />}
                          label=""
                        />
                        <TextField
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          value={opt}
                          onChange={(e) => {
                            const opts = [...newQuestion.options];
                            opts[idx] = e.target.value;
                            setNewQuestion({ ...newQuestion, options: opts });
                          }}
                          size="small"
                          fullWidth
                        />
                      </Stack>
                    ))}
                  </RadioGroup>
                </Box>
              )}

              {newQuestion.questionType === 'true_false' && (
                <FormControl>
                  <Typography variant="subtitle2" gutterBottom>
                    Correct Answer
                  </Typography>
                  <RadioGroup
                    row
                    value={newQuestion.correctAnswer ? 'true' : 'false'}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        correctAnswer: e.target.value === 'true',
                      })
                    }
                  >
                    <FormControlLabel value="true" control={<Radio />} label="True" />
                    <FormControlLabel value="false" control={<Radio />} label="False" />
                  </RadioGroup>
                </FormControl>
              )}

              {newQuestion.questionType === 'short_answer' && (
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newQuestion.manualGrading}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            manualGrading: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Requires manual grading"
                  />
                  {!newQuestion.manualGrading && (
                    <TextField
                      label="Keywords (comma-separated)"
                      helperText="Answer must contain at least one of these keywords"
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          keywords: e.target.value.split(',').map((k) => k.trim()),
                        })
                      }
                    />
                  )}
                </Stack>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAddQuestion}
              variant="contained"
              disabled={!newQuestion.text.trim()}
            >
              Add Question
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
