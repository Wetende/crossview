import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Box, Typography, Button, Radio, RadioGroup, FormControlLabel, FormControl, Paper, LinearProgress } from '@mui/material';

const QuizRenderer = ({ node, enrollmentId, onComplete }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: selectedOptionId }
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Get questions from node properties
    const questions = node?.properties?.questions || [];
    
    // If no questions, show empty state
    if (!questions || questions.length === 0) {
        return (
            <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 2, bgcolor: 'background.paper' }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                    Quiz
                </Typography>
                <Typography color="text.secondary">
                    No questions have been added to this quiz yet.
                </Typography>
            </Paper>
        );
    }

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
            // Submit quiz
            handleSubmitQuiz();
        }
    };

    const handleSubmitQuiz = () => {
        setIsSubmitting(true);
        
        // Calculate score locally for immediate feedback
        let correctCount = 0;
        questions.forEach(q => {
            const selectedOptionId = answers[q.id];
            const correctOption = q.options?.find(opt => opt.isCorrect);
            if (correctOption && selectedOptionId === String(correctOption.id)) {
                correctCount++;
            }
        });
        const calculatedScore = Math.round((correctCount / questions.length) * 100);
        setScore(calculatedScore);
        setShowResults(true);
        
        // Submit to backend
        if (node?.id && enrollmentId) {
            router.post(`/student/programs/${enrollmentId}/session/${node.id}/`, {
                mark_complete: true,
                quiz_answers: answers,
                quiz_score: calculatedScore
            }, {
                preserveScroll: true,
                only: ['isCompleted', 'curriculum'],
                onFinish: () => {
                    setIsSubmitting(false);
                    if (onComplete) onComplete();
                }
            });
        } else {
            setIsSubmitting(false);
            if (onComplete) onComplete();
        }
    };

    const handleRetake = () => {
        setShowResults(false);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setScore(null);
    };

    if (showResults) {
        return (
            <Paper elevation={0} sx={{ p: { xs: 2, md: 5 }, borderRadius: 2, bgcolor: 'background.paper' }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Quiz Completed!
                    </Typography>
                    
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                        <Typography variant="h2" color={score >= 70 ? 'success.main' : 'warning.main'} fontWeight={800}>
                            {score}%
                        </Typography>
                    </Box>

                    <Typography color="text.secondary" paragraph>
                        {score >= 70 
                            ? "Great job! You've mastered this topic." 
                            : "Review the answers below and try again to improve your score."}
                    </Typography>
                </Box>
                
                {/* Detailed Review Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        Review Your Answers
                    </Typography>
                    
                    {questions.map((question, index) => {
                        const selectedOptionId = answers[question.id];
                        const correctOption = question.options?.find(opt => opt.isCorrect);
                        const selectedOption = question.options?.find(opt => String(opt.id) === selectedOptionId);
                        const isCorrect = correctOption && selectedOptionId === String(correctOption.id);
                        
                        return (
                            <Paper 
                                key={question.id} 
                                variant="outlined" 
                                sx={{ 
                                    p: 2, 
                                    mb: 2, 
                                    borderRadius: 2,
                                    borderColor: isCorrect ? 'success.main' : 'error.light',
                                    borderWidth: 2
                                }}
                            >
                                <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            px: 1, 
                                            py: 0.25, 
                                            borderRadius: 1,
                                            bgcolor: isCorrect ? 'success.lighter' : 'error.lighter',
                                            color: isCorrect ? 'success.dark' : 'error.dark',
                                            fontWeight: 600
                                        }}
                                    >
                                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Question {index + 1}
                                    </Typography>
                                </Box>
                                
                                <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
                                    {question.text || question.question}
                                </Typography>
                                
                                <Box sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'divider' }}>
                                    {!isCorrect && selectedOption && (
                                        <Typography variant="body2" color="error.main" sx={{ mb: 0.5 }}>
                                            Your answer: {selectedOption.text}
                                        </Typography>
                                    )}
                                    {correctOption && (
                                        <Typography variant="body2" color="success.main">
                                            Correct answer: {correctOption.text}
                                        </Typography>
                                    )}
                                    {question.explanation && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                                            💡 {question.explanation}
                                        </Typography>
                                    )}
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                    <Button variant="contained" onClick={handleRetake} sx={{ px: 4 }}>
                        Retake Quiz
                    </Button>
                </Box>
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
                {currentQuestion.text || currentQuestion.question}
            </Typography>

            {/* Options */}
            <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
                <RadioGroup
                    aria-label="quiz-options"
                    name={`question-${currentQuestion.id}`}
                    value={answers[currentQuestion.id] || ''}
                    onChange={handleOptionChange}
                >
                    {(currentQuestion.options || []).map((option) => (
                        <Paper 
                            key={option.id} 
                            variant="outlined" 
                            sx={{ 
                                mb: 2, 
                                borderRadius: 2,
                                border: answers[currentQuestion.id] === String(option.id) ? '2px solid' : '1px solid',
                                borderColor: answers[currentQuestion.id] === String(option.id) ? 'primary.main' : 'divider',
                                bgcolor: answers[currentQuestion.id] === String(option.id) ? 'primary.lighter' : 'transparent',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <FormControlLabel
                                value={String(option.id)}
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
                    disabled={!answers[currentQuestion.id] || isSubmitting}
                    sx={{ px: 4, borderRadius: 8 }}
                >
                    {currentQuestionIndex === questions.length - 1 
                        ? (isSubmitting ? 'Submitting...' : 'Finish Quiz') 
                        : 'Next Question'}
                </Button>
            </Box>
        </Paper>
    );
};

export default QuizRenderer;
