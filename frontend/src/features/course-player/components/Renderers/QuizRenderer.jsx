import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
    LinearProgress,
    Paper,
    Radio,
    RadioGroup,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import MatchingQuestion from '@/features/quizzes/components/MatchingQuestion';
import OrderingQuestion from '@/features/quizzes/components/OrderingQuestion';
import FillBlankQuestion from '@/features/quizzes/components/FillBlankQuestion';
import ImageMatchingQuestion from '@/features/quizzes/components/ImageMatchingQuestion';
import { formatPoints } from '@/lib/formatPoints';
import { getCsrfHeaders } from '@/utils/csrf';
import {
    evaluateQuizAnswers,
    formatAnswer,
    isQuestionAnswered,
    normalizeQuestions,
} from './quizRendererUtils';

const renderQuestionInput = ({
    question,
    answer,
    onAnswerChange,
}) => {
    const answerKey = String(question.id);

    if (question.type === 'mcq' || question.type === 'true_false') {
        return (
            <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
                <RadioGroup
                    aria-label="quiz-options"
                    name={`question-${answerKey}`}
                    value={answer || ''}
                    onChange={(event) => onAnswerChange(answerKey, event.target.value)}
                >
                    {(question.options || []).map((option, index) => (
                        <Paper
                            key={`${answerKey}-${option.id}-${index}`}
                            variant="outlined"
                            sx={{
                                mb: 2,
                                borderRadius: 2,
                                border:
                                    String(answer || '') === String(option.id)
                                        ? '2px solid'
                                        : '1px solid',
                                borderColor:
                                    String(answer || '') === String(option.id)
                                        ? 'primary.main'
                                        : 'divider',
                                bgcolor:
                                    String(answer || '') === String(option.id)
                                        ? 'primary.lighter'
                                        : 'transparent',
                                transition: 'all 0.2s ease',
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
        );
    }

    if (question.type === 'mcq_multi') {
        const selected = Array.isArray(answer) ? answer.map((value) => String(value)) : [];

        return (
            <FormGroup sx={{ mb: 4 }}>
                {(question.options || []).map((option, index) => {
                    const checked = selected.includes(String(option.id));
                    return (
                        <Paper
                            key={`${answerKey}-${option.id}-${index}`}
                            variant="outlined"
                            sx={{
                                mb: 2,
                                borderRadius: 2,
                                border: checked ? '2px solid' : '1px solid',
                                borderColor: checked ? 'primary.main' : 'divider',
                                bgcolor: checked ? 'primary.lighter' : 'transparent',
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={checked}
                                        onChange={(event) => {
                                            const next = event.target.checked
                                                ? [...selected, String(option.id)]
                                                : selected.filter(
                                                      (value) => value !== String(option.id),
                                                  );
                                            onAnswerChange(answerKey, next);
                                        }}
                                    />
                                }
                                label={option.text}
                                sx={{ p: 2, width: '100%', m: 0 }}
                            />
                        </Paper>
                    );
                })}
            </FormGroup>
        );
    }

    if (question.type === 'short_answer') {
        return (
            <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Type your answer here..."
                value={answer || ''}
                onChange={(event) => onAnswerChange(answerKey, event.target.value)}
                sx={{ mb: 4 }}
            />
        );
    }

    if (question.type === 'matching') {
        return (
            <Box sx={{ mb: 4 }}>
                <MatchingQuestion
                    question={question}
                    value={answer || {}}
                    onChange={(value) => onAnswerChange(answerKey, value)}
                />
            </Box>
        );
    }

    if (question.type === 'ordering') {
        return (
            <Box sx={{ mb: 4 }}>
                <OrderingQuestion
                    question={question}
                    value={answer || []}
                    onChange={(value) => onAnswerChange(answerKey, value)}
                />
            </Box>
        );
    }

    if (question.type === 'fill_blank') {
        return (
            <Box sx={{ mb: 4 }}>
                <FillBlankQuestion
                    question={question}
                    value={answer || {}}
                    onChange={(value) => onAnswerChange(answerKey, value)}
                />
            </Box>
        );
    }

    if (question.type === 'image_matching') {
        return (
            <Box sx={{ mb: 4 }}>
                <ImageMatchingQuestion
                    question={question}
                    value={answer || {}}
                    onChange={(value) => onAnswerChange(answerKey, value)}
                />
            </Box>
        );
    }

    return (
        <Alert severity="warning" sx={{ mb: 4 }}>
            Unsupported question type: {question.type}
        </Alert>
    );
};

const QuizRenderer = ({ node, enrollmentId, onComplete, useBackendRuntime = false }) => {
    const quizId = node?.properties?.quiz_id;
    const nodeType = String(node?.type || node?.nodeType || node?.node_type || '').toLowerCase();
    const lessonType = String(node?.properties?.lesson_type || '').toLowerCase();
    const isQuizNode = nodeType === 'quiz' || lessonType === 'quiz';
    const shouldUseBackendRuntime = Boolean(useBackendRuntime || (quizId && isQuizNode));

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [resultSummary, setResultSummary] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingRuntime, setIsLoadingRuntime] = useState(shouldUseBackendRuntime);
    const [runtimeError, setRuntimeError] = useState('');
    const [runtimeQuestions, setRuntimeQuestions] = useState([]);
    const [runtimeAttemptsRemaining, setRuntimeAttemptsRemaining] = useState(null);

    const saveTimeoutRef = useRef(null);

    const localQuestions = useMemo(
        () => normalizeQuestions(node?.properties?.questions || []),
        [node?.properties?.questions],
    );
    const questions = shouldUseBackendRuntime ? runtimeQuestions : localQuestions;

    useEffect(() => {
        setCurrentQuestionIndex(0);
        setAnswers({});
        setResultSummary(null);
        setRuntimeError('');
        setRuntimeQuestions([]);
        setRuntimeAttemptsRemaining(null);
        if (shouldUseBackendRuntime) {
            setIsLoadingRuntime(true);
        }
    }, [node?.id, quizId, shouldUseBackendRuntime]);

    const buildRuntimeQuery = useCallback(() => {
        const params = new URLSearchParams();
        params.set('response', 'json');
        if (enrollmentId) {
            params.set('enrollment_id', String(enrollmentId));
        }
        if (node?.id) {
            params.set('node_id', String(node.id));
        }
        return params.toString();
    }, [enrollmentId, node?.id]);

    const loadRuntime = useCallback(async () => {
        if (!shouldUseBackendRuntime || !quizId) return;

        setIsLoadingRuntime(true);
        setRuntimeError('');

        try {
            const query = buildRuntimeQuery();
            const response = await fetch(`/student/quiz/${quizId}/?${query}`, {
                credentials: 'same-origin',
            });

            if (response.status === 409) {
                const payload = await response.json().catch(() => ({}));
                if (payload?.redirectUrl) {
                    router.visit(payload.redirectUrl);
                    return;
                }
                setRuntimeError('No quiz attempt is available for this lesson.');
                return;
            }

            if (!response.ok) {
                setRuntimeError('Unable to load this quiz right now.');
                return;
            }

            const payload = await response.json();
            const normalizedQuestions = normalizeQuestions(payload?.questions || []);
            const initialAnswers =
                payload?.attempt?.answers && typeof payload.attempt.answers === 'object'
                    ? payload.attempt.answers
                    : {};
            const rawIndex = Number(payload?.attempt?.runtimeState?.current_question_index ?? 0);
            const maxIndex = Math.max(0, normalizedQuestions.length - 1);
            const normalizedIndex = Number.isFinite(rawIndex)
                ? Math.max(0, Math.min(rawIndex, maxIndex))
                : 0;

            setRuntimeQuestions(normalizedQuestions);
            setAnswers(initialAnswers);
            setCurrentQuestionIndex(normalizedIndex);
            setRuntimeAttemptsRemaining(
                typeof payload?.attemptsRemaining === 'number'
                    ? payload.attemptsRemaining
                    : null,
            );
            setResultSummary(null);
        } catch {
            setRuntimeError('Unable to load this quiz right now.');
        } finally {
            setIsLoadingRuntime(false);
        }
    }, [buildRuntimeQuery, quizId, shouldUseBackendRuntime]);

    useEffect(() => {
        if (!shouldUseBackendRuntime) return;
        loadRuntime();
    }, [loadRuntime, shouldUseBackendRuntime]);

    const persistRuntimeState = useCallback(
        async (nextAnswers, nextQuestionIndex) => {
            if (!shouldUseBackendRuntime || !quizId) return;

            const payload = {
                response: 'json',
                answers: nextAnswers,
                runtime_state: {
                    current_question_index: nextQuestionIndex,
                },
            };
            if (enrollmentId) {
                payload.enrollment_id = enrollmentId;
            }
            if (node?.id) {
                payload.node_id = node.id;
            }

            try {
                const response = await fetch(`/student/quiz/${quizId}/save/`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: getCsrfHeaders({
                        'Content-Type': 'application/json',
                    }),
                    body: JSON.stringify(payload),
                });

                if (response.status === 409) {
                    const data = await response.json().catch(() => ({}));
                    if (data?.redirectUrl) {
                        router.visit(data.redirectUrl);
                    }
                    return;
                }

                if (response.ok) {
                    const data = await response.json().catch(() => ({}));
                    if (typeof data?.attemptsRemaining === 'number') {
                        setRuntimeAttemptsRemaining(data.attemptsRemaining);
                    }
                }
            } catch {
                // Best-effort save: do not interrupt quiz flow on transient errors.
            }
        },
        [enrollmentId, node?.id, quizId, shouldUseBackendRuntime],
    );

    const queueRuntimePersist = useCallback(
        (nextAnswers, nextQuestionIndex) => {
            if (!shouldUseBackendRuntime) return;
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                persistRuntimeState(nextAnswers, nextQuestionIndex);
            }, 350);
        },
        [persistRuntimeState, shouldUseBackendRuntime],
    );

    useEffect(
        () => () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        },
        [],
    );

    const handleAnswerChange = (questionId, value) => {
        setAnswers((previous) => {
            const nextAnswers = {
                ...previous,
                [String(questionId)]: value,
            };
            queueRuntimePersist(nextAnswers, currentQuestionIndex);
            return nextAnswers;
        });
    };

    const handleSubmitQuiz = async () => {
        if (isSubmitting) return;

        if (!shouldUseBackendRuntime || !quizId) {
            setIsSubmitting(true);

            const summary = evaluateQuizAnswers(questions, answers);
            setResultSummary(summary);

            if (node?.id && enrollmentId) {
                router.post(
                    `/student/programs/${enrollmentId}/session/${node.id}/`,
                    {
                        mark_complete: true,
                        quiz_answers: answers,
                        quiz_score: summary.score,
                    },
                    {
                        preserveScroll: true,
                        only: ['isCompleted', 'curriculum'],
                        onFinish: () => {
                            setIsSubmitting(false);
                            if (onComplete) onComplete();
                        },
                    },
                );
            } else {
                setIsSubmitting(false);
                if (onComplete) onComplete();
            }
            return;
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        setIsSubmitting(true);
        setRuntimeError('');

        const payload = {
            response: 'json',
            answers,
            runtime_state: {
                current_question_index: currentQuestionIndex,
            },
        };
        if (enrollmentId) {
            payload.enrollment_id = enrollmentId;
        }
        if (node?.id) {
            payload.node_id = node.id;
        }

        try {
            const response = await fetch(`/student/quiz/${quizId}/submit/`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: getCsrfHeaders({
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(payload),
            });

            if (response.status === 409) {
                const data = await response.json().catch(() => ({}));
                if (data?.redirectUrl) {
                    router.visit(data.redirectUrl);
                    return;
                }
                setRuntimeError('No active attempt was found for submission.');
                return;
            }

            if (!response.ok) {
                setRuntimeError('Failed to submit quiz. Please try again.');
                return;
            }

            const data = await response.json();
            if (data?.redirectUrl) {
                router.visit(data.redirectUrl);
                return;
            }
            setResultSummary({
                runtime: true,
                score: Number(data?.score || 0),
                passed: data?.passed,
                pointsEarned: data?.pointsEarned,
                pointsPossible: data?.pointsPossible,
                attemptNumber: data?.attemptNumber,
                maxAttempts: data?.maxAttempts,
                attemptsRemaining: data?.attemptsRemaining,
                canRetry: Boolean(data?.canRetry),
                nextNode: data?.nextNode || null,
            });
            if (typeof data?.attemptsRemaining === 'number') {
                setRuntimeAttemptsRemaining(data.attemptsRemaining);
            }

            router.reload({
                preserveScroll: true,
                only: ['curriculum', 'isCompleted', 'nextNode', 'progress'],
            });
        } catch {
            setRuntimeError('Failed to submit quiz. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            queueRuntimePersist(answers, nextIndex);
        } else {
            handleSubmitQuiz();
        }
    };

    const handleRetake = () => {
        if (shouldUseBackendRuntime) {
            loadRuntime();
            return;
        }
        setResultSummary(null);
        setCurrentQuestionIndex(0);
        setAnswers({});
    };

    if (isLoadingRuntime) {
        return (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
                <Typography color="text.secondary">Loading quiz...</Typography>
            </Paper>
        );
    }

    if (runtimeError) {
        return (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 2, bgcolor: 'background.paper' }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {runtimeError}
                </Alert>
                {shouldUseBackendRuntime && (
                    <Button variant="contained" onClick={loadRuntime}>
                        Retry
                    </Button>
                )}
            </Paper>
        );
    }

    if (quizId && (!questions || questions.length === 0) && !shouldUseBackendRuntime) {
        const query = new URLSearchParams();
        if (enrollmentId) {
            query.set('enrollment_id', String(enrollmentId));
        }
        if (node?.id) {
            query.set('node_id', String(node.id));
        }
        const startQuizUrl = `/student/quiz/${quizId}/${query.toString() ? `?${query.toString()}` : ''}`;

        return (
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 5 },
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    textAlign: 'center',
                }}
            >
                <Typography variant="h5" fontWeight={600} gutterBottom>
                    {node?.title || 'Quiz'}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Open this quiz when you are ready to begin.
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => router.visit(startQuizUrl)}
                    sx={{ px: 4, borderRadius: 8 }}
                >
                    Start Quiz
                </Button>
            </Paper>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 5,
                    textAlign: 'center',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                }}
            >
                <Typography variant="h5" fontWeight={600} gutterBottom>
                    Quiz
                </Typography>
                <Typography color="text.secondary">
                    No questions have been added to this quiz yet.
                </Typography>
            </Paper>
        );
    }

    const currentQuestion = questions[currentQuestionIndex] || questions[0];
    const answeredCount = questions.filter((question) =>
        isQuestionAnswered(question, answers[String(question.id)]),
    ).length;
    const progress = (answeredCount / questions.length) * 100;

    if (resultSummary) {
        if (resultSummary.runtime) {
            return (
                <Paper
                    elevation={0}
                    sx={{ p: { xs: 2, md: 5 }, borderRadius: 2, bgcolor: 'background.paper' }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography variant="h4" fontWeight={700} gutterBottom>
                            Quiz Completed
                        </Typography>

                        <Typography
                            variant="h2"
                            color={resultSummary.passed ? 'success.main' : 'warning.main'}
                            fontWeight={800}
                            sx={{ mb: 1 }}
                        >
                            {Math.round(resultSummary.score)}%
                        </Typography>

                        <Typography color="text.secondary">
                            Attempt #{resultSummary.attemptNumber}
                            {resultSummary.maxAttempts
                                ? ` of ${resultSummary.maxAttempts}`
                                : ''}
                            {typeof resultSummary.pointsEarned === 'number' &&
                            typeof resultSummary.pointsPossible === 'number'
                                ? ` • ${formatPoints(resultSummary.pointsEarned)}/${formatPoints(resultSummary.pointsPossible)} points`
                                : ''}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap">
                        {resultSummary.passed && resultSummary.nextNode?.url && (
                            <Button
                                variant="contained"
                                onClick={() => router.visit(resultSummary.nextNode.url)}
                            >
                                Continue to Next Lesson
                            </Button>
                        )}
                        {resultSummary.canRetry && (
                            <Button variant="outlined" onClick={handleRetake}>
                                Try Again
                            </Button>
                        )}
                        {!resultSummary.canRetry && runtimeAttemptsRemaining === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                No retakes remaining.
                                {resultSummary.maxAttempts
                                    ? ` This quiz allows ${resultSummary.maxAttempts} total attempt${
                                          resultSummary.maxAttempts > 1 ? 's' : ''
                                      }.`
                                    : ''}
                            </Typography>
                        )}
                    </Stack>
                </Paper>
            );
        }

        return (
            <Paper
                elevation={0}
                sx={{ p: { xs: 2, md: 5 }, borderRadius: 2, bgcolor: 'background.paper' }}
            >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Quiz Completed
                    </Typography>

                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                        <Typography
                            variant="h2"
                            color={resultSummary.score >= 70 ? 'success.main' : 'warning.main'}
                            fontWeight={800}
                        >
                            {resultSummary.score}%
                        </Typography>
                    </Box>

                    <Typography color="text.secondary" paragraph>
                        {resultSummary.score >= 70
                            ? "Great job. You've mastered this topic."
                            : 'Review the answers below and try again to improve your score.'}
                    </Typography>

                    {resultSummary.ungradedCount > 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            {resultSummary.ungradedCount} question
                            {resultSummary.ungradedCount > 1 ? 's are' : ' is'} manual grade only and
                            excluded from auto-score.
                        </Alert>
                    )}
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        Review Your Answers
                    </Typography>

                    {resultSummary.evaluations.map((entry, index) => {
                        const { question, answer, graded, isCorrect } = entry;
                        const statusLabel = !graded
                            ? 'Needs Review'
                            : isCorrect
                              ? 'Correct'
                              : 'Incorrect';
                        const statusColor = !graded
                            ? 'info'
                            : isCorrect
                              ? 'success'
                              : 'error';

                        let correctAnswerDisplay = null;
                        if (question.type === 'mcq' || question.type === 'true_false') {
                            correctAnswerDisplay = formatAnswer(
                                question,
                                question.correctOptionId,
                                true,
                            );
                        } else if (question.type === 'mcq_multi') {
                            correctAnswerDisplay = formatAnswer(
                                question,
                                question.correctOptionIds,
                                true,
                            );
                        } else if (question.type === 'short_answer') {
                            correctAnswerDisplay = formatAnswer(
                                question,
                                question.keywords,
                                true,
                            );
                        } else if (question.type === 'matching') {
                            correctAnswerDisplay = formatAnswer(
                                question,
                                question.correctMatchingMap,
                                true,
                            );
                        } else if (question.type === 'fill_blank') {
                            const gapMap = Object.fromEntries(
                                (question.gaps || []).map((gap) => [
                                    gap.gap_index,
                                    (gap.accepted_answers || []).join(' / '),
                                ]),
                            );
                            correctAnswerDisplay = formatAnswer(question, gapMap, true);
                        } else if (question.type === 'ordering') {
                            correctAnswerDisplay = formatAnswer(
                                question,
                                question.correctOrdering,
                                true,
                            );
                        } else if (question.type === 'image_matching') {
                            correctAnswerDisplay = formatAnswer(
                                question,
                                question.correctImageMatchingMap,
                                true,
                            );
                        }

                        return (
                            <Paper
                                key={`${question.id}-${index}`}
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    mb: 2,
                                    borderRadius: 2,
                                    borderColor:
                                        statusColor === 'success'
                                            ? 'success.main'
                                            : statusColor === 'error'
                                              ? 'error.light'
                                              : 'info.light',
                                    borderWidth: 2,
                                }}
                            >
                                <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            px: 1,
                                            py: 0.25,
                                            borderRadius: 1,
                                            bgcolor: `${statusColor}.lighter`,
                                            color: `${statusColor}.dark`,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {statusLabel}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Question {index + 1}
                                    </Typography>
                                </Stack>

                                <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
                                    {question.text}
                                </Typography>

                                <Box sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'divider' }}>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        Your answer: {formatAnswer(question, answer)}
                                    </Typography>
                                    {correctAnswerDisplay && (
                                        <Typography variant="body2" color="success.main" sx={{ mb: 0.5 }}>
                                            Correct answer: {correctAnswerDisplay}
                                        </Typography>
                                    )}
                                    {question.explanation && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 1, fontStyle: 'italic' }}
                                        >
                                            Note: {question.explanation}
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

    const currentAnswer = answers[String(currentQuestion.id)];

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, md: 5 },
                borderRadius: 2,
                bgcolor: 'background.paper',
                minHeight: 400,
            }}
        >
            {typeof runtimeAttemptsRemaining === 'number' && shouldUseBackendRuntime && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {runtimeAttemptsRemaining} retake
                    {runtimeAttemptsRemaining === 1 ? '' : 's'} remaining.
                </Alert>
            )}

            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        QUESTION {currentQuestionIndex + 1} OF {questions.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {Math.round(progress)}% COMPLETED
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 8, borderRadius: 4 }}
                />
            </Box>

            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                {currentQuestion.text}
            </Typography>

            {renderQuestionInput({
                question: currentQuestion,
                answer: currentAnswer,
                onAnswerChange: handleAnswerChange,
            })}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleNext}
                    disabled={!isQuestionAnswered(currentQuestion, currentAnswer) || isSubmitting}
                    sx={{ px: 4, borderRadius: 8 }}
                >
                    {currentQuestionIndex === questions.length - 1
                        ? isSubmitting
                            ? 'Submitting...'
                            : 'Finish Quiz'
                        : 'Next Question'}
                </Button>
            </Box>
        </Paper>
    );
};

export default QuizRenderer;
