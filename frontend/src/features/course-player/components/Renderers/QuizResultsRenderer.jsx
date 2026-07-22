import { Link, router } from "@inertiajs/react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { IconArrowRight, IconEye, IconRefresh } from "@tabler/icons-react";

import {
    AssessmentResultHero,
    AttemptHistory,
} from "@/features/learning-experience/components";
import { formatPoints } from "@/lib/formatPoints";

const formatReviewValue = (value, fallback) => {
    if (value === null || value === undefined || value === "") return fallback;
    if (typeof value === "boolean") return value ? "True" : "False";
    return value;
};

const attemptStatusLabel = (attempt) => {
    if (attempt?.passed === true) return "Passed";
    if (attempt?.passed === false) return "Not passed";
    return "Pending review";
};

const releaseMessage = (policy) => {
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

const submittedLabel = (value) =>
    value ? new Date(value).toLocaleString() : "Not recorded";

const QuizResultsRenderer = ({ quizResults, nextNode = null }) => {
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
    const hasPassedQuiz = bestAttempt?.passed === true;

    const reviewAttempt = (attemptId) => {
        const url = withAttemptId(quiz.reviewUrl, attemptId);
        if (url) router.visit(url);
    };

    const historyItems = attempts.map((attempt) => ({
        id: attempt.id,
        title: `Attempt #${attempt.attemptNumber}`,
        score:
            typeof attempt.score === "number"
                ? `${attempt.score.toFixed(1)}%`
                : "Pending",
        points: `${formatPoints(attempt.pointsEarned)} / ${formatPoints(
            attempt.pointsPossible,
        )}`,
        status: attemptStatusLabel(attempt),
        submittedAt: submittedLabel(attempt.submittedAt),
    }));

    const retryMessage = () => {
        if (canRetry) {
            return `${attemptsRemaining} ${
                attemptsRemaining === 1 ? "attempt" : "attempts"
            } remaining.`;
        }
        if (retryLockReason === "max_attempts_reached") {
            return `All ${quiz.maxAttempts} available ${
                quiz.maxAttempts === 1 ? "attempt has" : "attempts have"
            } been used.`;
        }
        if (retryLockReason === "passed_retake_disabled") {
            return `You passed this quiz. Further attempts are disabled by the instructor, although ${attemptsRemaining} ${
                attemptsRemaining === 1 ? "remains" : "remain"
            } in the numeric limit.`;
        }
        return null;
    };

    return (
        <Box sx={{ px: { xs: 0.5, sm: 2 }, py: { xs: 1, md: 2 } }}>
            <Box sx={{ mb: 2.5 }}>
                <Typography component="h1" variant="h5">
                    Quiz results
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {quiz.title}
                    {quiz.nodeTitle ? ` · ${quiz.nodeTitle}` : ""}
                </Typography>
            </Box>

            {activeAttempt && (
                <Box sx={{ mb: 3 }}>
                    <AssessmentResultHero
                        title={
                            hasPassedQuiz
                                ? "Activity completed"
                                : "Attempt complete"
                        }
                        score={activeAttempt.score}
                        passed={activeAttempt.passed}
                        attemptLabel={`Attempt #${activeAttempt.attemptNumber} of ${quiz.maxAttempts}`}
                        metrics={[
                            {
                                label: "Points",
                                value: `${formatPoints(activeAttempt.pointsEarned)} / ${formatPoints(activeAttempt.pointsPossible)}`,
                            },
                            {
                                label: "Required",
                                value: `${quiz.passThreshold}%`,
                            },
                            {
                                label: "Best score",
                                value:
                                    typeof bestAttempt?.score === "number"
                                        ? `${Math.round(bestAttempt.score)}%`
                                        : "Pending",
                            },
                            {
                                label: "Attempts remaining",
                                value: attemptsRemaining,
                            },
                        ]}
                    >
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            useFlexGap
                            flexWrap="wrap"
                        >
                            {hasPassedQuiz && nextNode?.url && (
                                <Button
                                    component={Link}
                                    href={nextNode.url}
                                    variant="contained"
                                    endIcon={<IconArrowRight size={18} />}
                                >
                                    Continue learning
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
                                    Try again
                                </Button>
                            )}
                        </Stack>
                        {retryMessage() && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1.5 }}
                            >
                                {retryMessage()}
                            </Typography>
                        )}
                    </AssessmentResultHero>
                </Box>
            )}

            <Box id="quiz-answer-review" sx={{ scrollMarginTop: 24, mb: 3 }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={0.5}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    sx={{ mb: 1.5 }}
                >
                    <Typography component="h2" variant="h6">
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
                        {releaseMessage(quiz.answerReleasePolicy)}
                    </Alert>
                )}

                {questionReview.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                        <Typography color="text.secondary">
                            Question-level review is not available for this
                            attempt.
                        </Typography>
                    </Paper>
                ) : (
                    <Stack spacing={1.5}>
                        {questionReview.map((item, index) => {
                            const status =
                                item.isCorrect === true
                                    ? { label: "Correct", color: "success" }
                                    : item.isCorrect === false
                                      ? { label: "Incorrect", color: "error" }
                                      : {
                                            label: "Pending review",
                                            color: "info",
                                        };

                            return (
                                <Paper
                                    key={`${item.questionId}-${index}`}
                                    variant="outlined"
                                    sx={{
                                        p: { xs: 2, sm: 2.5 },
                                        borderRadius: 2,
                                    }}
                                >
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={1}
                                        justifyContent="space-between"
                                        alignItems={{ sm: "flex-start" }}
                                        sx={{ mb: 1.25 }}
                                    >
                                        <Box>
                                            <Typography
                                                variant="overline"
                                                color="text.secondary"
                                            >
                                                Question {index + 1}
                                            </Typography>
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight={800}
                                            >
                                                {item.questionText}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            size="small"
                                            label={status.label}
                                            color={status.color}
                                            sx={{ fontWeight: 700 }}
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
                )}
            </Box>

            {quiz.showAttemptHistory && (
                <AttemptHistory
                    attempts={historyItems}
                    selectedId={activeAttempt?.id}
                    onReview={reviewAttempt}
                />
            )}
        </Box>
    );
};

export default QuizResultsRenderer;
