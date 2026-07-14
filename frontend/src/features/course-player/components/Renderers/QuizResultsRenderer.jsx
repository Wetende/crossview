import { Link, router } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import {
    IconArrowRight,
    IconCheck,
    IconEye,
    IconRefresh,
    IconX,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

import { formatPoints } from "@/lib/formatPoints";

const formatReviewValue = (value, fallback) => {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "boolean") return value ? "True" : "False";
    return value;
};

const getAttemptStatus = (attempt) => {
    if (attempt?.passed === true) {
        return {
            label: "Passed",
            color: "success",
            icon: <IconCheck size={15} />,
        };
    }
    if (attempt?.passed === false) {
        return {
            label: "Not passed",
            color: "error",
            icon: <IconX size={15} />,
        };
    }
    return { label: "Pending review", color: "default", icon: null };
};

const getReleaseMessage = (policy) => {
    if (policy === "after_pass_or_final") {
        return "Correct answers will be released after you pass or use your final available attempt.";
    }
    if (policy === "after_final_attempt") {
        return "Correct answers will be released after your final available attempt.";
    }
    return "Correct answers are not released for this quiz.";
};

const withAttemptId = (url, attemptId) => {
    if (!url || !attemptId) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}attempt_id=${attemptId}`;
};

export default function QuizResultsRenderer({ quizResults, nextNode = null }) {
    const {
        quiz,
        attempts = [],
        attemptsRemaining = 0,
        canRetry = false,
        correctAnswersReleased: releasedAnswers,
        officialAttempt,
        questionReview = [],
        reviewedAttempt,
        retryLockReason,
    } = quizResults;
    const correctAnswersReleased =
        releasedAnswers ?? Boolean(quiz.showCorrectAnswer);

    const activeAttempt = reviewedAttempt || attempts[0] || null;
    const bestAttempt =
        officialAttempt ||
        attempts.reduce((best, attempt) => {
            const score =
                typeof attempt?.score === "number" ? attempt.score : -1;
            const bestScore = typeof best?.score === "number" ? best.score : -1;
            return !best || score > bestScore ? attempt : best;
        }, null);
    const status = getAttemptStatus(activeAttempt);
    const hasPassedQuiz = bestAttempt?.passed === true;

    const reviewAttempt = (attemptId) => {
        const url = withAttemptId(quiz.reviewUrl, attemptId);
        if (url) router.visit(url);
    };

    return (
        <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, md: 3 } }}>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="h5" fontWeight={750}>
                        Quiz results
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {quiz.title}
                        {quiz.nodeTitle ? ` · ${quiz.nodeTitle}` : ""}
                    </Typography>
                </Box>

                {activeAttempt && (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 2, sm: 3 },
                            mb: 3,
                            borderTop: "4px solid",
                            borderTopColor:
                                activeAttempt.passed === true
                                    ? "success.main"
                                    : activeAttempt.passed === false
                                      ? "warning.main"
                                      : "info.main",
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={{ xs: 2, md: 4 }}
                            sx={{
                                alignItems: { xs: "flex-start", md: "center" },
                            }}
                        >
                            <Box sx={{ minWidth: { md: 180 } }}>
                                <Chip
                                    size="small"
                                    icon={status.icon}
                                    label={status.label}
                                    color={status.color}
                                    sx={{ mb: 1 }}
                                />
                                <Typography
                                    variant="h3"
                                    sx={{ fontWeight: 800, lineHeight: 1 }}
                                >
                                    {typeof activeAttempt.score === "number"
                                        ? `${Math.round(activeAttempt.score)}%`
                                        : "Pending"}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.75 }}
                                >
                                    Attempt #{activeAttempt.attemptNumber} of{" "}
                                    {quiz.maxAttempts}
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "repeat(2, minmax(0, 1fr))",
                                        sm: "repeat(4, minmax(110px, 1fr))",
                                    },
                                    gap: { xs: 2, sm: 3 },
                                    width: "100%",
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Points
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        fontWeight={700}
                                    >
                                        {formatPoints(
                                            activeAttempt.pointsEarned,
                                        )}{" "}
                                        /{" "}
                                        {formatPoints(
                                            activeAttempt.pointsPossible,
                                        )}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Required
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        fontWeight={700}
                                    >
                                        {quiz.passThreshold}%
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Best score
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        fontWeight={700}
                                    >
                                        {typeof bestAttempt?.score === "number"
                                            ? `${Math.round(bestAttempt.score)}%`
                                            : "Pending"}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Attempts remaining
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        fontWeight={700}
                                    >
                                        {attemptsRemaining}
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>

                        <Divider sx={{ my: 2.5 }} />

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.25}
                            useFlexGap
                            sx={{
                                alignItems: { xs: "stretch", sm: "center" },
                                flexWrap: "wrap",
                            }}
                        >
                            {hasPassedQuiz && nextNode?.url && (
                                <Button
                                    component={Link}
                                    href={nextNode.url}
                                    variant="contained"
                                    endIcon={<IconArrowRight size={18} />}
                                >
                                    Continue to next lesson
                                </Button>
                            )}
                            {questionReview.length > 0 && (
                                <Button
                                    component="a"
                                    href="#quiz-answer-review"
                                    variant="outlined"
                                    startIcon={<IconEye size={18} />}
                                >
                                    Review answers
                                </Button>
                            )}
                            {canRetry && (
                                <Button
                                    component={Link}
                                    href={quiz.retryUrl}
                                    variant="outlined"
                                    startIcon={<IconRefresh size={18} />}
                                >
                                    Retake quiz
                                </Button>
                            )}
                        </Stack>

                        {canRetry && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1.5 }}
                            >
                                {attemptsRemaining} attempt
                                {attemptsRemaining === 1 ? "" : "s"} remaining.
                            </Typography>
                        )}
                        {!canRetry &&
                            retryLockReason === "max_attempts_reached" && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1.5 }}
                                >
                                    All {quiz.maxAttempts} available attempt
                                    {quiz.maxAttempts === 1
                                        ? " has"
                                        : "s have"}{" "}
                                    been used.
                                </Typography>
                            )}
                        {!canRetry &&
                            retryLockReason === "passed_retake_disabled" && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1.5 }}
                                >
                                    You passed this quiz. Further attempts are
                                    disabled by the instructor, although{" "}
                                    {attemptsRemaining}{" "}
                                    {attemptsRemaining === 1
                                        ? "remains"
                                        : "remain"}{" "}
                                    in the numeric limit.
                                </Typography>
                            )}
                    </Paper>
                )}

                <Box
                    id="quiz-answer-review"
                    sx={{ scrollMarginTop: 24, mb: 3 }}
                >
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={0.5}
                        sx={{
                            mb: 1.5,
                            justifyContent: "space-between",
                            alignItems: { xs: "flex-start", sm: "center" },
                        }}
                    >
                        <Typography variant="h6" fontWeight={750}>
                            Answer review
                        </Typography>
                        {activeAttempt && (
                            <Typography variant="body2" color="text.secondary">
                                Reviewing attempt #{activeAttempt.attemptNumber}
                            </Typography>
                        )}
                    </Stack>

                    {!correctAnswersReleased && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            {getReleaseMessage(quiz.answerReleasePolicy)}
                        </Alert>
                    )}

                    <Stack spacing={1.5}>
                        {questionReview.map((item, index) => {
                            const questionStatus =
                                item.isCorrect === true
                                    ? { label: "Correct", color: "success" }
                                    : item.isCorrect === false
                                      ? { label: "Incorrect", color: "error" }
                                      : {
                                            label: "Pending review",
                                            color: "default",
                                        };

                            return (
                                <Paper
                                    key={`${item.questionId}-${index}`}
                                    variant="outlined"
                                    sx={{ p: { xs: 2, sm: 2.5 } }}
                                >
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{
                                            mb: 1.25,
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <Box>
                                            <Typography
                                                variant="overline"
                                                color="text.secondary"
                                                sx={{ lineHeight: 1.4 }}
                                            >
                                                Question {index + 1}
                                            </Typography>
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight={700}
                                            >
                                                {item.questionText}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            size="small"
                                            label={questionStatus.label}
                                            color={questionStatus.color}
                                        />
                                    </Stack>

                                    <Stack spacing={0.75}>
                                        <Typography variant="body2">
                                            <Box
                                                component="span"
                                                color="text.secondary"
                                            >
                                                Your answer:{" "}
                                            </Box>
                                            {formatReviewValue(
                                                item.studentAnswer,
                                                "Not answered",
                                            )}
                                        </Typography>
                                        {correctAnswersReleased && (
                                            <Typography
                                                variant="body2"
                                                color="success.dark"
                                                fontWeight={700}
                                            >
                                                Correct answer:{" "}
                                                {formatReviewValue(
                                                    item.correctAnswer,
                                                    "N/A",
                                                )}
                                            </Typography>
                                        )}
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            Points:{" "}
                                            {formatPoints(item.pointsEarned)} /{" "}
                                            {formatPoints(item.pointsPossible)}
                                        </Typography>
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </Stack>
                </Box>

                {quiz.showAttemptHistory && attempts.length > 0 && (
                    <Box>
                        <Typography
                            variant="h6"
                            fontWeight={750}
                            sx={{ mb: 1.5 }}
                        >
                            Attempt history
                        </Typography>
                        <Paper variant="outlined">
                            <TableContainer>
                                <Table size="small" sx={{ minWidth: 680 }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Attempt</TableCell>
                                            <TableCell>Score</TableCell>
                                            <TableCell>Points</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Submitted</TableCell>
                                            <TableCell align="right">
                                                Review
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {attempts.map((attempt) => {
                                            const attemptStatus =
                                                getAttemptStatus(attempt);
                                            const isSelected =
                                                attempt.id ===
                                                activeAttempt?.id;
                                            return (
                                                <TableRow
                                                    key={attempt.id}
                                                    hover
                                                    selected={isSelected}
                                                    sx={{ cursor: "pointer" }}
                                                    onClick={() =>
                                                        reviewAttempt(
                                                            attempt.id,
                                                        )
                                                    }
                                                >
                                                    <TableCell>
                                                        #{attempt.attemptNumber}
                                                    </TableCell>
                                                    <TableCell>
                                                        {typeof attempt.score ===
                                                        "number"
                                                            ? `${attempt.score.toFixed(1)}%`
                                                            : "Pending"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatPoints(
                                                            attempt.pointsEarned,
                                                        )}{" "}
                                                        /{" "}
                                                        {formatPoints(
                                                            attempt.pointsPossible,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            icon={
                                                                attemptStatus.icon
                                                            }
                                                            label={
                                                                attemptStatus.label
                                                            }
                                                            color={
                                                                attemptStatus.color
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {attempt.submittedAt
                                                            ? new Date(
                                                                  attempt.submittedAt,
                                                              ).toLocaleString()
                                                            : "—"}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Button
                                                            size="small"
                                                            startIcon={
                                                                <IconEye
                                                                    size={16}
                                                                />
                                                            }
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();
                                                                reviewAttempt(
                                                                    attempt.id,
                                                                );
                                                            }}
                                                            disabled={
                                                                isSelected
                                                            }
                                                        >
                                                            {isSelected
                                                                ? "Viewing"
                                                                : "Review"}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>
                )}
            </motion.div>
        </Box>
    );
}
