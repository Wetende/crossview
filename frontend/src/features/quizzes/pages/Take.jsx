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
import MatchingQuestion from "@/features/quizzes/components/MatchingQuestion";
import OrderingQuestion from "@/features/quizzes/components/OrderingQuestion";
import FillBlankQuestion from "@/features/quizzes/components/FillBlankQuestion";
import ImageMatchingQuestion from "@/features/quizzes/components/ImageMatchingQuestion";
import { getCsrfHeaders } from "@/utils/csrf";
import {
    AnswerOptionCard,
    QuestionNavigator,
} from "@/features/learning-experience/components";
import { isQuestionAnswered } from "@/features/course-player/components/Renderers/quizRendererUtils";

export default function Take({
    quiz,
    attempt,
    questions,
    attemptsRemaining,
    coursePlayer,
}) {
    const [answers, setAnswers] = useState(attempt.answers || {});
    const [currentIdx, setCurrentIdx] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(
        quiz.timeLimit ? quiz.timeLimit * 60 : null,
    );
    const [submitting, setSubmitting] = useState(false);
    const timerRef = useRef(null);
    const saveTimeoutRef = useRef(null);
    const normalizedAnswersRef = useRef(false);

    const normalizeSavedAnswers = useCallback(
        (rawAnswers) => {
            if (!rawAnswers || typeof rawAnswers !== "object") {
                return {};
            }

            const next = { ...rawAnswers };
            (questions || []).forEach((question) => {
                const key = String(question?.id);
                const existing = next[key] ?? next[question?.id];
                if (existing === null || existing === undefined) {
                    return;
                }

                if (
                    !Array.isArray(question?.options) ||
                    question.options.length === 0
                ) {
                    return;
                }

                const optionIdByPosition = new Map(
                    question.options
                        .map((opt) => [Number(opt?.position), opt?.id])
                        .filter(
                            ([pos, id]) =>
                                Number.isFinite(pos) &&
                                id !== null &&
                                id !== undefined,
                        ),
                );
                const optionIds = new Set(
                    question.options
                        .map((opt) =>
                            opt?.id === null || opt?.id === undefined
                                ? null
                                : String(opt.id),
                        )
                        .filter(Boolean),
                );

                const mapTokenToOptionId = (token) => {
                    if (token === null || token === undefined) return null;
                    const asString = String(token).trim();
                    if (!asString) return null;
                    if (optionIds.has(asString)) return asString;
                    const numeric = Number(asString);
                    if (
                        Number.isFinite(numeric) &&
                        optionIdByPosition.has(numeric)
                    ) {
                        return String(optionIdByPosition.get(numeric));
                    }
                    return asString;
                };

                if (question.type === "mcq" || question.type === "true_false") {
                    const mapped = mapTokenToOptionId(existing);
                    if (mapped !== null) {
                        next[key] = mapped;
                    }
                }

                if (question.type === "mcq_multi") {
                    if (!Array.isArray(existing)) {
                        return;
                    }
                    const mapped = existing
                        .map((token) => mapTokenToOptionId(token))
                        .filter((token) => token !== null);
                    next[key] = Array.from(new Set(mapped));
                }
            });

            return next;
        },
        [questions],
    );

    useEffect(() => {
        if (normalizedAnswersRef.current) return;
        normalizedAnswersRef.current = true;
        setAnswers((prev) => normalizeSavedAnswers(prev));
    }, [normalizeSavedAnswers]);

    const persistAnswers = useCallback(
        async (nextAnswers) => {
            const payload = { answers: normalizeSavedAnswers(nextAnswers) };
            if (coursePlayer?.enrollmentId && coursePlayer?.nodeId) {
                payload.enrollment_id = coursePlayer.enrollmentId;
                payload.node_id = coursePlayer.nodeId;
            }

            try {
                const response = await fetch(`/student/quiz/${quiz.id}/save/`, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: getCsrfHeaders({
                        "Content-Type": "application/json",
                    }),
                    body: JSON.stringify(payload),
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
        [
            coursePlayer?.enrollmentId,
            coursePlayer?.nodeId,
            normalizeSavedAnswers,
            quiz.id,
        ],
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

    const handleSubmit = useCallback(() => {
        if (submitting) {
            return;
        }
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        setSubmitting(true);
        const payload = { answers: normalizeSavedAnswers(answers) };
        if (coursePlayer?.enrollmentId && coursePlayer?.nodeId) {
            payload.enrollment_id = coursePlayer.enrollmentId;
            payload.node_id = coursePlayer.nodeId;
        }
        router.post(`/student/quiz/${quiz.id}/submit/`, payload, {
            headers: getCsrfHeaders(),
            onFinish: () => setSubmitting(false),
        });
    }, [
        answers,
        coursePlayer?.enrollmentId,
        coursePlayer?.nodeId,
        normalizeSavedAnswers,
        quiz.id,
        submitting,
    ]);

    useEffect(
        () => () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        },
        [],
    );

    // Calculate elapsed time for resuming
    useEffect(() => {
        if (quiz.timeLimit) {
            const startTime = new Date(attempt.startedAt).getTime();
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = quiz.timeLimit * 60 - elapsed;
            setTimeRemaining(Math.max(0, remaining));
        }
    }, [attempt.startedAt, quiz.timeLimit]);

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
    }, [handleSubmit, timeRemaining]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const quizStyle = quiz.quizStyle || "pagination";
    const isSinglePage = quizStyle === "single_page";
    const currentQuestion = questions[currentIdx];

    const renderQuestionContent = (question) => (
        <>
            {/* MCQ Options */}
            {question.type === "mcq" && question.options && (
                <RadioGroup
                    value={answers[question.id] ?? ""}
                    onChange={(e) =>
                        handleAnswerChange(question.id, e.target.value)
                    }
                >
                    {question.options.map((opt, idx) => (
                        <AnswerOptionCard
                            key={opt.id ?? opt.position ?? idx}
                            selected={
                                String(answers[question.id] ?? "") ===
                                String(opt.id)
                            }
                            control={<Radio value={String(opt.id)} />}
                            label={`${String.fromCharCode(65 + idx)}. ${opt.text}`}
                        />
                    ))}
                </RadioGroup>
            )}

            {/* MCQ Multi */}
            {question.type === "mcq_multi" && question.options && (
                <FormGroup>
                    {question.options.map((opt, idx) => {
                        const currentSelections = Array.isArray(
                            answers[question.id],
                        )
                            ? answers[question.id]
                            : [];
                        const optionId = String(opt.id);
                        const selectedSet = new Set(
                            currentSelections.map((value) => String(value)),
                        );
                        const isSelected = selectedSet.has(optionId);
                        return (
                            <AnswerOptionCard
                                key={opt.id ?? opt.position ?? idx}
                                selected={isSelected}
                                control={
                                    <Checkbox
                                        checked={isSelected}
                                        onChange={(e) => {
                                            const newValue = e.target.checked
                                                ? [
                                                      ...currentSelections.map(
                                                          (v) => String(v),
                                                      ),
                                                      optionId,
                                                  ]
                                                : currentSelections.filter(
                                                      (i) =>
                                                          String(i) !==
                                                          optionId,
                                                  );
                                            handleAnswerChange(
                                                question.id,
                                                Array.from(
                                                    new Set(
                                                        newValue.map((v) =>
                                                            String(v),
                                                        ),
                                                    ),
                                                ),
                                            );
                                        }}
                                    />
                                }
                                label={`${String.fromCharCode(65 + idx)}. ${opt.text}`}
                            />
                        );
                    })}
                </FormGroup>
            )}

            {/* True/False */}
            {question.type === "true_false" && (
                <RadioGroup
                    value={answers[question.id] ?? ""}
                    onChange={(e) =>
                        handleAnswerChange(
                            question.id,
                            e.target.value === "true",
                        )
                    }
                >
                    <AnswerOptionCard
                        selected={answers[question.id] === true}
                        control={<Radio value="true" />}
                        label="True"
                    />
                    <AnswerOptionCard
                        selected={answers[question.id] === false}
                        control={<Radio value="false" />}
                        label="False"
                    />
                </RadioGroup>
            )}

            {/* Short Answer */}
            {question.type === "short_answer" && (
                <TextField
                    value={answers[question.id] ?? ""}
                    onChange={(e) =>
                        handleAnswerChange(question.id, e.target.value)
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
                    value={answers[question.id]}
                    onChange={(val) => handleAnswerChange(question.id, val)}
                />
            )}

            {/* Ordering */}
            {question.type === "ordering" && (
                <OrderingQuestion
                    question={question}
                    value={answers[question.id]}
                    onChange={(val) => handleAnswerChange(question.id, val)}
                />
            )}

            {/* Fill Blank */}
            {question.type === "fill_blank" && (
                <FillBlankQuestion
                    question={question}
                    value={answers[question.id]}
                    onChange={(val) => handleAnswerChange(question.id, val)}
                />
            )}

            {/* Image Matching */}
            {question.type === "image_matching" && (
                <ImageMatchingQuestion
                    question={question}
                    value={answers[question.id]}
                    onChange={(val) => handleAnswerChange(question.id, val)}
                />
            )}
        </>
    );

    const answeredIndexes = questions
        .map((question, index) =>
            isQuestionAnswered(question, answers[question.id]) ? index : null,
        )
        .filter((index) => index !== null);
    const answeredCount = answeredIndexes.length;
    const progress =
        questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

    return (
        <>
            <Head title={`Quiz: ${quiz.title}`} />
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Box>
                    {/* Header */}
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                        >
                            <Box>
                                <Typography variant="h5">
                                    {quiz.title}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
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
                                justifyContent="space-between"
                                sx={{ mb: 0.5 }}
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
                            {!isSinglePage && (
                                <Box sx={{ mt: 2 }}>
                                    <QuestionNavigator
                                        count={questions.length}
                                        currentIndex={currentIdx}
                                        answeredIndexes={answeredIndexes}
                                        onSelect={setCurrentIdx}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Paper>

                    {isSinglePage ? (
                        <>
                            {questions.map((question, idx) => (
                                <Card
                                    key={question.id}
                                    id={`question-${question.id}`}
                                    sx={{ mb: 3 }}
                                >
                                    <CardContent>
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            spacing={2}
                                            sx={{ mb: 2 }}
                                        >
                                            <Chip
                                                label={`Question ${idx + 1}`}
                                                color="primary"
                                            />
                                            <Chip
                                                label={`${question.points} pt${question.points > 1 ? "s" : ""}`}
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Stack>
                                        <Typography variant="h6" sx={{ mb: 3 }}>
                                            {question.text}
                                        </Typography>
                                        {renderQuestionContent(question)}
                                    </CardContent>
                                </Card>
                            ))}
                            <Stack direction="row" justifyContent="flex-end">
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
                            </Stack>
                        </>
                    ) : (
                        <>
                            {/* Question */}
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={2}
                                        sx={{ mb: 2 }}
                                    >
                                        <Chip
                                            label={`Question ${currentIdx + 1}`}
                                            color="primary"
                                        />
                                        <Chip
                                            label={`${currentQuestion.points} pt${currentQuestion.points > 1 ? "s" : ""}`}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </Stack>
                                    <Typography variant="h6" sx={{ mb: 3 }}>
                                        {currentQuestion.text}
                                    </Typography>
                                    {renderQuestionContent(currentQuestion)}
                                </CardContent>
                            </Card>

                            {/* Navigation */}
                            <Stack
                                direction={{ xs: "column-reverse", sm: "row" }}
                                spacing={1}
                                justifyContent="space-between"
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
                </Box>
            </Container>
        </>
    );
}
