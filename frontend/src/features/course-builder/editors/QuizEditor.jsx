import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Paper,
  Divider,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  Tab,
  Tabs
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Quiz as QuizIcon
} from '@mui/icons-material';

// Import specialized editors from Quizzes feature
import MatchingPairsEditor from '@/features/quizzes/components/MatchingPairsEditor';
import FillBlankEditor from '@/features/quizzes/components/FillBlankEditor';
import OrderingEditor from '@/features/quizzes/components/OrderingEditor';

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True/False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'matching', label: 'Matching Pairs' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'ordering', label: 'Ordering / Sequence' },
];

export default function QuizEditor({ node, onSave }) {
    const [title, setTitle] = useState(node.title);
    const [activeTab, setActiveTab] = useState('questions');
    
    // Quiz Settings State
    const [description, setDescription] = useState(node.description || '');
    const [quizDuration, setQuizDuration] = useState(node.properties?.quiz_duration || '');
    const [quizTimeUnit, setQuizTimeUnit] = useState(node.properties?.quiz_time_unit || 'Minutes');
    const [passingGrade, setPassingGrade] = useState(node.properties?.passing_grade || 80);
    const [maxAttempts, setMaxAttempts] = useState(node.properties?.max_attempts || 1);
    const [randomizeQuestions, setRandomizeQuestions] = useState(node.properties?.randomize_questions || false);
    const [retakePenalty, setRetakePenalty] = useState(node.properties?.retake_penalty || 0);

    // Questions State (In-Memory)
    const [questions, setQuestions] = useState(node.properties?.questions || []);
    
    // Add Question Dialog State
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

    const handleSave = () => {
        onSave(node.id, {
            title,
            description,
            properties: {
                ...node.properties,
                quiz_duration: quizDuration,
                quiz_time_unit: quizTimeUnit,
                passing_grade: passingGrade,
                max_attempts: maxAttempts,
                randomize_questions: randomizeQuestions,
                retake_penalty: retakePenalty,
                questions: questions, // Save the full array
            }
        });
    };

    const handleAddQuestion = () => {
        const questionToAdd = {
            id: Date.now(), // Temporary ID for frontend key
            type: newQuestion.questionType,
            text: newQuestion.text,
            points: newQuestion.points,
            // Process specific fields based on type
            answerData: {
                options: newQuestion.options.filter(o => o.trim() !== ''),
                correct: newQuestion.correctAnswer,
                keywords: newQuestion.keywords,
                manualGrading: newQuestion.manualGrading,
                pairs: newQuestion.pairs,
                gaps: newQuestion.gaps,
                items: newQuestion.items.filter(i => i && i.trim() !== ''),
            }
        };
        
        setQuestions([...questions, questionToAdd]);
        setAddDialogOpen(false);
        // Reset form
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
    };

    const handleDeleteQuestion = (id) => {
        if (confirm("Delete this question?")) {
            setQuestions(questions.filter(q => q.id !== id));
        }
    };

    return (
        <Box>
             {/* Header */}
             <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                    <QuizIcon />
                    <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>Quiz</Typography>
                </Box>
                <TextField 
                    variant="standard" 
                    placeholder="Enter quiz title" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    fullWidth
                    InputProps={{ sx: { fontSize: '1.2rem', fontWeight: 500 } }}
                />
                <Button variant="contained" onClick={handleSave} size="medium" startIcon={<SaveIcon />} sx={{ ml: 2 }}>Save</Button>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                    <Tab label={`Questions (${questions.length})`} value="questions" sx={{ textTransform: 'none' }} />
                    <Tab label="Settings" value="settings" sx={{ textTransform: 'none' }} />
                </Tabs>
            </Box>

            {/* Questions Tab */}
            {activeTab === 'questions' && (
                <Stack spacing={3}>
                    {questions.length === 0 ? (
                        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                            <Typography color="text.secondary" paragraph>No questions yet.</Typography>
                            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>Add Question</Button>
                        </Paper>
                    ) : (
                        <Stack spacing={2}>
                            {questions.map((q, idx) => (
                                <Card key={q.id || idx} variant="outlined">
                                    <CardContent sx={{ pb: '16px !important' }}>
                                        <Stack direction="row" alignItems="flex-start" spacing={2}>
                                            <Chip label={idx + 1} size="small" color="primary" variant="outlined" />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography fontWeight={500}>{q.text}</Typography>
                                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                    <Chip size="small" label={QUESTION_TYPES.find(t => t.value === q.type)?.label || q.type} variant="outlined" sx={{ fontSize: '0.75rem' }} />
                                                    <Chip size="small" label={`${q.points} pts`} sx={{ fontSize: '0.75rem' }} />
                                                </Stack>
                                            </Box>
                                            <IconButton size="small" color="error" onClick={() => handleDeleteQuestion(q.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                            <Button 
                                variant="dashed" 
                                startIcon={<AddIcon />} 
                                onClick={() => setAddDialogOpen(true)}
                                sx={{ border: '1px dashed', borderColor: 'divider', py: 2 }}
                            >
                                Add another question
                            </Button>
                        </Stack>
                    )}
                </Stack>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <Stack spacing={3}>
                     <TextField 
                        label="Description"
                        multiline
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        fullWidth
                    />
                    
                    <Stack direction="row" spacing={2}>
                         <TextField 
                            label="Duration" 
                            type="number" 
                            value={quizDuration} 
                            onChange={e => setQuizDuration(e.target.value)}
                            size="small"
                            sx={{ width: 150 }}
                         />
                         <FormControl size="small" sx={{ width: 120 }}>
                            <InputLabel>Unit</InputLabel>
                            <Select value={quizTimeUnit} label="Unit" onChange={e => setQuizTimeUnit(e.target.value)}>
                                <MenuItem value="Minutes">Minutes</MenuItem>
                                <MenuItem value="Hours">Hours</MenuItem>
                            </Select>
                         </FormControl>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <TextField 
                            label="Passing Grade (%)" 
                            type="number"
                            value={passingGrade} 
                            onChange={e => setPassingGrade(e.target.value)}
                            size="small"
                        />
                        <TextField 
                            label="Max Attempts" 
                            type="number"
                            value={maxAttempts} 
                            onChange={e => setMaxAttempts(e.target.value)}
                            size="small"
                        />
                    </Stack>

                    <Stack direction="column" spacing={1}>
                        <FormControlLabel control={<Switch checked={randomizeQuestions} onChange={e => setRandomizeQuestions(e.target.checked)} />} label="Randomize Questions" />
                    </Stack>
                </Stack>
            )}

            {/* Add Question Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Add Question</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Question Type</InputLabel>
                            <Select
                                value={newQuestion.questionType}
                                label="Question Type"
                                onChange={(e) => setNewQuestion({ ...newQuestion, questionType: e.target.value })}
                            >
                                {QUESTION_TYPES.map(type => (
                                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Type Specific Fields */}
                        {newQuestion.questionType === 'matching' && (
                            <MatchingPairsEditor pairs={newQuestion.pairs} onChange={pairs => setNewQuestion({...newQuestion, pairs})} />
                        )}
                        {newQuestion.questionType === 'fill_blank' && (
                            <FillBlankEditor 
                                text={newQuestion.text} 
                                gaps={newQuestion.gaps} 
                                onTextChange={val => setNewQuestion({...newQuestion, text: val})}
                                onGapsChange={gaps => setNewQuestion({...newQuestion, gaps})}
                            />
                        )}
                        {newQuestion.questionType === 'ordering' && (
                            <OrderingEditor items={newQuestion.items} onChange={items => setNewQuestion({...newQuestion, items})} />
                        )}

                        {/* Default Text Input (Unless Fill Blank) */}
                        {newQuestion.questionType !== 'fill_blank' && (
                            <TextField 
                                label="Question Text"
                                multiline
                                rows={2}
                                fullWidth
                                value={newQuestion.text}
                                onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                            />
                        )}

                        <TextField 
                            label="Points"
                            type="number"
                            value={newQuestion.points}
                            onChange={e => setNewQuestion({...newQuestion, points: parseInt(e.target.value)})}
                            sx={{ width: 120 }}
                        />

                        {/* MCQ Options */}
                        {newQuestion.questionType === 'mcq' && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>Options</Typography>
                                <RadioGroup value={newQuestion.correctAnswer} onChange={e => setNewQuestion({...newQuestion, correctAnswer: parseInt(e.target.value)})}>
                                    {newQuestion.options.map((opt, idx) => (
                                        <Stack key={idx} direction="row" alignItems="center" spacing={1} mb={1}>
                                            <FormControlLabel value={idx} control={<Radio />} label="" />
                                            <TextField 
                                                fullWidth 
                                                size="small" 
                                                placeholder={`Option ${idx + 1}`} 
                                                value={opt}
                                                onChange={e => {
                                                    const newOpts = [...newQuestion.options];
                                                    newOpts[idx] = e.target.value;
                                                    setNewQuestion({...newQuestion, options: newOpts});
                                                }}
                                            />
                                        </Stack>
                                    ))}
                                </RadioGroup>
                            </Box>
                        )}
                         
                         {/* True/False */}
                         {newQuestion.questionType === 'true_false' && (
                            <Box>
                                <Typography variant="subtitle2">Correct Answer</Typography>
                                <RadioGroup row value={newQuestion.correctAnswer ? 'true' : 'false'} onChange={e => setNewQuestion({...newQuestion, correctAnswer: e.target.value === 'true'})}>
                                    <FormControlLabel value="true" control={<Radio />} label="True" />
                                    <FormControlLabel value="false" control={<Radio />} label="False" />
                                </RadioGroup>
                            </Box>
                         )}

                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddQuestion} disabled={!newQuestion.text && newQuestion.questionType !== 'fill_blank'}>Add Question</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
