import { useState, useEffect, useRef, useCallback } from "react";
import { Head, router } from "@inertiajs/react";
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
    FormGroup,
    Checkbox,
    TextField,
    Alert,
    LinearProgress,
    Chip,
    Card,
    CardContent,
} from "@mui/material";
import {
    IconClock,
    IconChevronLeft,
    IconChevronRight,
    IconSend,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import MatchingQuestion from "@/features/quizzes/components/MatchingQuestion";
import OrderingQuestion from "@/features/quizzes/components/OrderingQuestion";
import FillBlankQuestion from "@/features/quizzes/components/FillBlankQuestion";
import { getCsrfHeaders } from "@/utils/csrf";

// Reusable Question Card component
const QuestionCard = ({
    question,
    index,
    answer,
    onAnswerChange,
    showNumber = true,
}) => {
    return (
        <Card sx={{ mb: 3 }} id={`question-${question.id}`}>
            <CardContent>
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: "center", mb: 2 }}
                >
                    {showNumber && (
                        <Chip label={`Question ${index + 1}`} color="primary" />
                    )}
                    <Chip
                        label={`${question.points} pt${question.points > 1 ? "s" : ""}`}
                        variant="outlined"
                        size="small"
                    />
                </Stack>

                <Typography variant="h6" sx={{ mb: 3 }}>
                    {question.text}
                </Typography>

                {/* MCQ Options */}
                {question.type === "mcq" && question.options && (
                    <RadioGroup
                        value={answer ?? ""}
                        onChange={(e) =>
                            onAnswerChange(
                                question.id,
                                parseInt(e.target.value),
                            )
                        }
                    >
                        {question.options.map((opt, idx) => (
                            <FormControlLabel
                                key={idx}
                                value={idx}
                                control={<Radio />}
                                label={`${String.fromCharCode(65 + idx)}. ${opt}`}
                                sx={{
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 1,
                                    mb: 1,
                                    mx: 0,
                                    p: 1,
                                    "&:hover": { bgcolor: "action.hover" },
                                }}
                            />
                        ))}
                    </RadioGroup>
                )}

                {/* MCQ Multi - Multiple correct answers with Checkboxes */}
                {question.type === "mcq_multi" && question.options && (
                    <FormGroup>
                        {question.options.map((opt, idx) => {
                            const currentSelections = answer || [];
                            const isSelected = currentSelections.includes(idx);
                            return (
                                <FormControlLabel
                                    key={idx}
                                    control={
                                        <Checkbox
                                            checked={isSelected}
                                            onChange={(e) => {
                                                const newValue = e.target
                                                    .checked
                                                    ? [
                                                          ...currentSelections,
                                                          idx,
                                                      ]
                                                    : currentSelections.filter(
                                                          (i) => i !== idx,
                                                      );
                                                onAnswerChange(
                                                    question.id,
                                                    newValue,
                                                );
                                            }}
                                        />
                                    }
                                    label={`${String.fromCharCode(65 + idx)}. ${opt}`}
                                    sx={{
                                        border: "1px solid",
                                        borderColor: isSelected
                                            ? "primary.main"
                                            : "divider",
                                        borderRadius: 1,
                                        mb: 1,
                                        mx: 0,
                                        p: 1,
                                        bgcolor: isSelected
                                            ? "primary.50"
                                            : "transparent",
                                        "&:hover": { bgcolor: "action.hover" },
                                    }}
                                />
                            );
                        })}
                    </FormGroup>
                )}

                {/* True/False */}
                {question.type === "true_false" && (
                    <RadioGroup
                        value={answer ?? ""}
                        onChange={(e) =>
                            onAnswerChange(
                                question.id,
                                e.target.value === "true",
                            )
                        }
                    >
                        <FormControlLabel
                            value="true"
                            control={<Radio />}
                            label="True"
                            sx={{
                                border: "1px solid",
                                borderColor: "divider",
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
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1,
                                mx: 0,
                                p: 1,
                            }}
                        />
                    </RadioGroup>
                )}

                {/* Short Answer */}
                {question.type === "short_answer" && (
                    <TextField
                        value={answer ?? ""}
                        onChange={(e) =>
                            onAnswerChange(question.id, e.target.value)
                        }
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Type your answer here..."
                    />
                )}

                {/* Matching */}
                {question.type === "matching" && (
                    <MatchingQuestion
                        question={question}
                        value={answer}
                        onChange={(val) => onAnswerChange(question.id, val)}
                    />
                )}

                {/* Ordering */}
                {question.type === "ordering" && (
                    <OrderingQuestion
                        question={question}
                        value={answer}
                        onChange={(val) => onAnswerChange(question.id, val)}
                    />
                )}

                {/* Fill Blank */}
                {question.type === "fill_blank" && (
                    <FillBlankQuestion
                        question={question}
                        value={answer}
                        onChange={(val) => onAnswerChange(question.id, val)}
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default function Take({ quiz, attempt, questions, attemptsRemaining }) {
    const [answers, setAnswers] = useState(attempt.answers || {});
    const [currentIdx, setCurrentIdx] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(
        quiz.timeLimit ? quiz.timeLimit * 60 : null,
    );
    const [submitting, setSubmitting] = useState(false);
    const timerRef = useRef(null);
    const saveTimeoutRef = useRef(null);

    const answersRef = useRef(answers);
    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    const persistAnswers = useCallback(
        async (nextAnswers) => {
            try {
                const response = await fetch(`/student/quiz/${quiz.id}/save/`, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: getCsrfHeaders({
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify({ answers: nextAnswers }),
                });

                if (response.status === 409) {
                    const data = await response.json().catch(() => ({}));
                    if (data?.redirectUrl) {
                        router.visit(data.redirectUrl);
                    }
                }
            } catch {
                // Draft save is best-effort to avoid interrupting quiz flow.
            }
        },
        [quiz.id],
    );

    const queuePersistAnswers = useCallback(
        (nextAnswers) => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                persistAnswers(nextAnswers);
            }, 500);
        },
        [persistAnswers],
    );

    // Quiz style: 'pagination' (default) or 'single_page'
    const quizStyle = quiz.quizStyle || "pagination";
    const isSinglePage = quizStyle === "single_page";

    // Calculate elapsed time for resuming
    useEffect(() => {
        if (quiz.timeLimit) {
            const startTime = new Date(attempt.startedAt).getTime();
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = quiz.timeLimit * 60 - elapsed;
            setTimeRemaining(Math.max(0, remaining));
        }
    }, []);

    const handleAutoSubmit = () => {
        if (submitting) return;
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        setSubmitting(true);
        router.post(
            `/student/quiz/${quiz.id}/submit/`,
            { answers: answersRef.current },
            {
                headers: getCsrfHeaders(),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    // Timer countdown
    useEffect(() => {
        if (timeRemaining !== null && timeRemaining > 0) {
            timerRef.current = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleAutoSubmit(); // Auto-submit on time up
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [timeRemaining, submitting]);

    const handleAnswerChange = (questionId, value) => {
        setAnswers((prev) => {
            const nextAnswers = {
                ...prev,
                [questionId]: value,
            };
            queuePersistAnswers(nextAnswers);
            return nextAnswers;
        });
    };

    const handleSubmit = () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        setSubmitting(true);
        router.post(
            `/student/quiz/${quiz.id}/submit/`,
            { answers },
            {
                headers: getCsrfHeaders(),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    useEffect(
        () => () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        },
        [],
    );

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const scrollToQuestion = (idx) => {
        const element = document.getElementById(
            `question-${questions[idx].id}`,
        );
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
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
                    <Paper
                        sx={{
                            p: 2,
                            mb: 3,
                            position: isSinglePage ? "sticky" : "static",
                            top: 0,
                            zIndex: 10,
                        }}
                    >
                        <Stack
                            direction="row"
                            sx={{
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Box>
                                <Typography variant="h5">
                                    {quiz.title}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                >
                                    {quiz.nodeTitle}
                                </Typography>
                            </Box>
                            {timeRemaining !== null && (
                                <Chip
                                    icon={<IconClock size={16} />}
                                    label={formatTime(timeRemaining)}
                                    color={
                                        timeRemaining < 60
                                            ? "error"
                                            : timeRemaining < 300
                                              ? "warning"
                                              : "default"
                                    }
                                    size="large"
                                />
                            )}
                        </Stack>
                        <Box sx={{ mt: 2 }}>
                            <Stack
                                direction="row"
                                sx={{
                                    justifyContent: "space-between",
                                    mb: 0.5,
                                }}
                            >
                                <Typography variant="caption">
                                    {answeredCount} of {questions.length}{" "}
                                    answered
                                </Typography>
                                <Typography variant="caption">
                                    Attempt #{attempt.attemptNumber}
                                </Typography>
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                            />
                        </Box>

                        {/* Question dots for single page mode - serves as quick jump */}
                        {isSinglePage && (
                            <Stack
                                direction="row"
                                spacing={0.5}
                                sx={{
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    mt: 2,
                                }}
                            >
                                {questions.map((q, idx) => (
                                    <Box
                                        key={q.id}
                                        onClick={() => scrollToQuestion(idx)}
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            bgcolor:
                                                answers[q.id] !== undefined
                                                    ? "success.main"
                                                    : "grey.300",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color:
                                                answers[q.id] !== undefined
                                                    ? "white"
                                                    : "text.secondary",
                                            fontSize: 10,
                                            fontWeight: "bold",
                                            "&:hover": {
                                                transform: "scale(1.1)",
                                            },
                                            transition: "transform 0.2s",
                                        }}
                                    >
                                        {idx + 1}
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Paper>

                    {/* Single Page Mode - All questions */}
                    {isSinglePage ? (
                        <>
                            {questions.map((question, idx) => (
                                <QuestionCard
                                    key={question.id}
                                    question={question}
                                    index={idx}
                                    answer={answers[question.id]}
                                    onAnswerChange={handleAnswerChange}
                                />
                            ))}

                            {/* Submit button at bottom */}
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    mt: 4,
                                }}
                            >
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    endIcon={<IconSend />}
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? "Submitting..."
                                        : "Submit Quiz"}
                                </Button>
                            </Box>
                        </>
                    ) : (
                        /* Pagination Mode - One question at a time */
                        <>
                            <QuestionCard
                                question={currentQuestion}
                                index={currentIdx}
                                answer={answers[currentQuestion.id]}
                                onAnswerChange={handleAnswerChange}
                            />

                            {/* Navigation */}
                            <Stack
                                direction="row"
                                sx={{ justifyContent: "space-between" }}
                            >
                                <Button
                                    startIcon={<IconChevronLeft />}
                                    onClick={() =>
                                        setCurrentIdx((prev) =>
                                            Math.max(0, prev - 1),
                                        )
                                    }
                                    disabled={currentIdx === 0}
                                >
                                    Previous
                                </Button>

                                {/* Question dots */}
                                <Stack
                                    direction="row"
                                    spacing={0.5}
                                    sx={{ alignItems: "center" }}
                                >
                                    {questions.map((q, idx) => (
                                        <Box
                                            key={q.id}
                                            onClick={() => setCurrentIdx(idx)}
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: "50%",
                                                bgcolor:
                                                    answers[q.id] !== undefined
                                                        ? "success.main"
                                                        : "grey.300",
                                                border:
                                                    idx === currentIdx
                                                        ? "2px solid"
                                                        : "none",
                                                borderColor: "primary.main",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color:
                                                    answers[q.id] !== undefined
                                                        ? "white"
                                                        : "text.secondary",
                                                fontSize: 10,
                                                fontWeight: "bold",
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
                                        {submitting
                                            ? "Submitting..."
                                            : "Submit Quiz"}
                                    </Button>
                                ) : (
                                    <Button
                                        endIcon={<IconChevronRight />}
                                        onClick={() =>
                                            setCurrentIdx((prev) =>
                                                Math.min(
                                                    questions.length - 1,
                                                    prev + 1,
                                                ),
                                            )
                                        }
                                    >
                                        Next
                                    </Button>
                                )}
                            </Stack>
                        </>
                    )}

                    {attemptsRemaining > 0 && (
                        <Alert severity="info" sx={{ mt: 3 }}>
                            You have {attemptsRemaining} attempt
                            {attemptsRemaining > 1 ? "s" : ""} remaining after
                            this one.
                        </Alert>
                    )}
                </motion.div>
            </Container>
        </>
    );
}
