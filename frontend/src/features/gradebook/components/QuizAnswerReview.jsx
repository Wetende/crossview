/**
 * QuizAnswerReview Component
 * Displays detailed per-question review of a quiz attempt
 * Used by instructors to see student's answers with correct/incorrect highlighting
 */

import { useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Stack,
    Collapse,
    IconButton,
    Chip,
    Divider,
} from "@mui/material";
import {
    IconChevronDown,
    IconChevronUp,
    IconCheck,
    IconX,
    IconCircleCheck,
    IconCircleX,
} from "@tabler/icons-react";
import { formatPoints } from "@/lib/formatPoints";

/**
 * Single question review card
 */
const QuestionReviewCard = ({
    questionNumber,
    question,
    studentAnswer,
    correctAnswer,
    isCorrect,
    explanation,
    pointsEarned,
    pointsTotal,
}) => {
    const borderColor = isCorrect ? "success.main" : "error.main";
    const bgColor = isCorrect ? "success.lighter" : "error.lighter";

    const renderAnswer = (
        answer,
        type,
        isStudentAnswer = false,
        showCorrect = false,
    ) => {
        if (answer === null || answer === undefined) {
            return (
                <Typography color="text.secondary" fontStyle="italic">
                    No answer provided
                </Typography>
            );
        }

        // Handle different question types
        switch (type) {
            case "mcq":
            case "mcq_multi": {
                // Options-based questions
                const selectedIndices = Array.isArray(answer)
                    ? answer
                    : [answer];
                return (
                    <Stack spacing={0.5}>
                        {question.options?.map((opt, idx) => {
                            const isSelected = selectedIndices.includes(idx);
                            const isCorrectOption = Array.isArray(correctAnswer)
                                ? correctAnswer.includes(idx)
                                : correctAnswer === idx;

                            return (
                                <Box
                                    key={idx}
                                    sx={{
                                        p: 1,
                                        borderRadius: 1,
                                        border: "1px solid",
                                        borderColor: isSelected
                                            ? isCorrectOption
                                                ? "success.main"
                                                : "error.main"
                                            : showCorrect && isCorrectOption
                                              ? "success.main"
                                              : "divider",
                                        bgcolor: isSelected
                                            ? isCorrectOption
                                                ? "success.lighter"
                                                : "error.lighter"
                                            : showCorrect && isCorrectOption
                                              ? "success.lighter"
                                              : "transparent",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    {isSelected &&
                                        (isCorrectOption ? (
                                            <IconCircleCheck
                                                size={16}
                                                color="green"
                                            />
                                        ) : (
                                            <IconCircleX
                                                size={16}
                                                color="red"
                                            />
                                        ))}
                                    {!isSelected &&
                                        showCorrect &&
                                        isCorrectOption && (
                                            <IconCircleCheck
                                                size={16}
                                                color="green"
                                            />
                                        )}
                                    <Typography variant="body2">
                                        <strong>
                                            {String.fromCharCode(65 + idx)}.
                                        </strong>{" "}
                                        {opt}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Stack>
                );
            }

            case "true_false":
                return (
                    <Chip
                        label={answer ? "True" : "False"}
                        color={
                            isStudentAnswer
                                ? isCorrect
                                    ? "success"
                                    : "error"
                                : "success"
                        }
                        variant="outlined"
                    />
                );

            case "short_answer":
                return (
                    <Paper
                        variant="outlined"
                        sx={{ p: 1.5, bgcolor: "grey.50" }}
                    >
                        <Typography variant="body2">{answer}</Typography>
                    </Paper>
                );

            case "matching":
                // Display pairs
                return (
                    <Stack spacing={0.5}>
                        {Object.entries(answer || {}).map(([key, value]) => (
                            <Typography key={key} variant="body2">
                                {key} → {value}
                            </Typography>
                        ))}
                    </Stack>
                );

            case "ordering":
                // Display ordered items
                return (
                    <Stack spacing={0.5}>
                        {(Array.isArray(answer) ? answer : []).map(
                            (item, idx) => (
                                <Box key={idx}>
                                    <Typography variant="body2">
                                        {idx + 1}. {item}
                                    </Typography>
                                    {!isStudentAnswer &&
                                        question.orderingExplanations?.[
                                            `item_${idx}`
                                        ] && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ ml: 2 }}
                                            >
                                                {question.orderingExplanations[
                                                    `item_${idx}`
                                                ]}
                                            </Typography>
                                        )}
                                </Box>
                            ),
                        )}
                    </Stack>
                );

            case "fill_blank":
                // Display blanks
                return (
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {(Array.isArray(answer) ? answer : [answer]).map(
                            (blank, idx) => (
                                <Chip
                                    key={idx}
                                    label={blank || "(empty)"}
                                    variant="outlined"
                                />
                            ),
                        )}
                    </Stack>
                );

            default:
                return (
                    <Typography variant="body2">
                        {JSON.stringify(answer)}
                    </Typography>
                );
        }
    };

    return (
        <Paper
            sx={{
                border: "2px solid",
                borderColor,
                borderRadius: 2,
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.5,
                    bgcolor: bgColor,
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    {isCorrect ? (
                        <IconCircleCheck size={24} color="green" />
                    ) : (
                        <IconCircleX size={24} color="red" />
                    )}
                    <Typography variant="subtitle1" fontWeight="bold">
                        Question {questionNumber}
                    </Typography>
                    <Chip
                        label={question.type?.replace("_", " ").toUpperCase()}
                        size="small"
                        variant="outlined"
                    />
                </Stack>
                <Chip
                    label={`${formatPoints(pointsEarned)}/${formatPoints(pointsTotal)} pts`}
                    color={isCorrect ? "success" : "error"}
                    size="small"
                />
            </Box>

            {/* Content */}
            <Box sx={{ p: 2 }}>
                {/* Question Text */}
                <Typography variant="body1" fontWeight="medium" sx={{ mb: 2 }}>
                    {question.text}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* For MCQ types, show combined view */}
                {["mcq", "mcq_multi"].includes(question.type) ? (
                    <Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 1, display: "block" }}
                        >
                            {isCorrect
                                ? "✓ Student selected correctly"
                                : "✗ Incorrect selection"}
                        </Typography>
                        {renderAnswer(studentAnswer, question.type, true, true)}
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {/* Student's Answer */}
                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight="medium"
                            >
                                Student&apos;s Answer:
                            </Typography>
                            {renderAnswer(studentAnswer, question.type, true)}
                        </Box>

                        {/* Correct Answer */}
                        {!isCorrect && (
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="success.main"
                                    fontWeight="medium"
                                >
                                    Correct Answer:
                                </Typography>
                                {renderAnswer(
                                    correctAnswer,
                                    question.type,
                                    false,
                                )}
                            </Box>
                        )}
                    </Stack>
                )}

                {/* Explanation */}
                {explanation && (
                    <Box
                        sx={{
                            mt: 2,
                            p: 1.5,
                            bgcolor: "info.lighter",
                            borderRadius: 1,
                        }}
                    >
                        <Typography
                            variant="caption"
                            color="info.main"
                            fontWeight="bold"
                        >
                            Explanation:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {explanation}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

/**
 * QuizAnswerReview - Expandable container for quiz attempt review
 */
export default function QuizAnswerReview({
    attempt,
    questions,
    defaultExpanded = false,
}) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    if (!attempt || !questions) return null;

    const {
        answers = {},
        score = 0,
        passed = false,
        attemptNumber = 1,
        completedAt,
        questionResults = [],
    } = attempt;

    // Calculate stats
    const correctCount = questionResults.filter((r) => r.isCorrect).length;
    const totalQuestions = questions.length;

    return (
        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            {/* Collapsible Header */}
            <Box
                onClick={() => setExpanded(!expanded)}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.5,
                    cursor: "pointer",
                    bgcolor: "grey.50",
                    "&:hover": { bgcolor: "grey.100" },
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="subtitle2" fontWeight="bold">
                        Attempt #{attemptNumber}
                    </Typography>
                    <Chip
                        icon={
                            passed ? (
                                <IconCheck size={14} />
                            ) : (
                                <IconX size={14} />
                            )
                        }
                        label={`${score.toFixed(0)}%`}
                        color={passed ? "success" : "error"}
                        size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                        {correctCount}/{totalQuestions} correct
                    </Typography>
                    {completedAt && (
                        <Typography variant="caption" color="text.secondary">
                            {new Date(completedAt).toLocaleString()}
                        </Typography>
                    )}
                </Stack>
                <IconButton size="small">
                    {expanded ? (
                        <IconChevronUp size={20} />
                    ) : (
                        <IconChevronDown size={20} />
                    )}
                </IconButton>
            </Box>

            {/* Expanded Content */}
            <Collapse in={expanded}>
                <Box sx={{ p: 2 }}>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                    >
                        Detailed answers for this attempt:
                    </Typography>
                    <Stack spacing={2}>
                        {questions.map((question, idx) => {
                            const result =
                                questionResults.find(
                                    (r) => r.questionId === question.id,
                                ) || {};
                            return (
                                <QuestionReviewCard
                                    key={question.id}
                                    questionNumber={idx + 1}
                                    question={question}
                                    studentAnswer={answers[String(question.id)]}
                                    correctAnswer={
                                        result.correctAnswer ||
                                        question.correctAnswer
                                    }
                                    isCorrect={result.isCorrect ?? false}
                                    explanation={question.explanation}
                                    pointsEarned={result.pointsEarned ?? 0}
                                    pointsTotal={question.points ?? 1}
                                />
                            );
                        })}
                    </Stack>
                </Box>
            </Collapse>
        </Paper>
    );
}
