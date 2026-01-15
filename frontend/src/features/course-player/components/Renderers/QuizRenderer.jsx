import React, { useState } from 'react';
import { Box, Typography, Button, Radio, RadioGroup, FormControlLabel, FormControl, Paper, LinearProgress, Alert } from '@mui/material';
import { CheckCircleOutline, HighlightOff } from '@mui/icons-material';

const QuizRenderer = ({ quiz, onComplete }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: optionId }
    const [showResults, setShowResults] = useState(false);
    
    // Mock Questions if not provided (for dev/testing)
    const questions = quiz?.questions || [
        { 
            id: 1, 
            text: "What is the primary rule of composition in photography?", 
            options: [
                { id: 'a', text: "Rule of Thirds" },
                { id: 'b', text: "Golden Ratio" },
                { id: 'c', text: "Center Everything" }
            ],
            correctOptionId: 'a'
        },
        { 
            id: 2, 
            text: "Which ISO setting is best for bright daylight?", 
            options: [
                { id: 'a', text: "ISO 3200" },
                { id: 'b', text: "ISO 100" },
                { id: 'c', text: "ISO 800" }
            ],
            correctOptionId: 'b'
        }
    ];

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    const handleOptionChange = (event) => {
        setAnswers({
            ...answers,
            [currentQuestion.id]: event.target.value
        });
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setShowResults(true);
            if (onComplete) onComplete();
        }
    };

    const calculateScore = () => {
        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correctOptionId) score++;
        });
        return Math.round((score / questions.length) * 100);
    };

    if (showResults) {
        const score = calculateScore();
        return (
            <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 2, bgcolor: 'background.paper' }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Quiz Completed!
                </Typography>
                
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Typography variant="h2" color={score >= 70 ? 'success.main' : 'warning.main'} fontWeight={800}>
                            {score}%
                        </Typography>
                    </Box>
                </Box>

                <Typography color="text.secondary" paragraph>
                    {score >= 70 ? "Great job! You've mastered this topic." : "Review the material and try again to improve your score."}
                </Typography>
                
                <Button variant="contained" onClick={() => {
                    setShowResults(false);
                    setCurrentQuestionIndex(0);
                    setAnswers({});
                }}>
                    Retake Quiz
                </Button>
            </Paper>
        );
    }

    return (
        <Paper elevation={0} sx={{ p: { xs: 2, md: 5 }, borderRadius: 2, bgcolor: 'background.paper', minHeight: 400 }}>
            {/* Header / Progress */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        QUESTION {currentQuestionIndex + 1} OF {questions.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {Math.round(progress)}% COMPLETED
                    </Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
            </Box>

            {/* Question */}
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                {currentQuestion.text}
            </Typography>

            {/* Options */}
            <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
                <RadioGroup
                    aria-label="quiz-options"
                    name={`question-${currentQuestion.id}`}
                    value={answers[currentQuestion.id] || ''}
                    onChange={handleOptionChange}
                >
                    {currentQuestion.options.map((option) => (
                        <Paper 
                            key={option.id} 
                            variant="outlined" 
                            sx={{ 
                                mb: 2, 
                                borderRadius: 2,
                                border: answers[currentQuestion.id] === option.id ? '2px solid' : '1px solid',
                                borderColor: answers[currentQuestion.id] === option.id ? 'primary.main' : 'divider',
                                bgcolor: answers[currentQuestion.id] === option.id ? 'primary.lighter' : 'transparent',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <FormControlLabel
                                value={option.id}
                                control={<Radio />}
                                label={option.text}
                                sx={{ p: 2, width: '100%', m: 0 }}
                            />
                        </Paper>
                    ))}
                </RadioGroup>
            </FormControl>

            {/* Footer */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                    variant="contained" 
                    size="large"
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.id]}
                    sx={{ px: 4, borderRadius: 8 }}
                >
                    {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                </Button>
            </Box>
        </Paper>
    );
};

export default QuizRenderer;
