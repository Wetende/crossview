import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import DOMPurify from "dompurify";
import {
    Alert,
    Box,
    Button,
    Divider,
    Paper,
    Stack,
    TextField,
    Link,
    Typography,
} from "@mui/material";
import QuizRenderer from "./QuizRenderer";

const normalizeAssignmentMode = (props) => {
    if (!props || typeof props !== "object") return "submission_only";
    const explicit = String(props.assignment_mode || "").trim().toLowerCase();
    if (["submission_only", "question_only", "mixed"].includes(explicit)) {
        return explicit;
    }
    const hasQuestions =
        Array.isArray(props.questions) && props.questions.length > 0;
    return hasQuestions ? "mixed" : "submission_only";
};

const normalizeTypedResponseMode = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized === "short_answer_question"
        ? "short_answer_question"
        : "submission_text";
};

const assignmentRequiresQuestions = (mode, typedResponseMode) => {
    return (
        mode === "question_only" ||
        mode === "mixed" ||
        (mode === "submission_only" &&
            typedResponseMode === "short_answer_question")
    );
};

const assignmentRequiresSubmission = (mode, typedResponseMode) => {
    return (
        mode === "mixed" ||
        (mode === "submission_only" &&
            typedResponseMode === "submission_text")
    );
};

const stripHtml = (value) => String(value || "").replace(/<[^>]*>/g, "").trim();

const AssessmentRenderer = ({
    node,
    enrollmentId,
    discussions = [],
    onComplete,
    forceType = null,
}) => {
    const [assignmentStarted, setAssignmentStarted] = useState(false);
    const [textContent, setTextContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionNotice, setSubmissionNotice] = useState(null);

    const properties = useMemo(() => {
        return node?.properties && typeof node.properties === "object"
            ? node.properties
            : {};
    }, [node?.properties]);

    const nodeType = String(forceType || node?.type || node?.nodeType || node?.node_type || "").toLowerCase();
    const lessonType = String(properties.lesson_type || "").toLowerCase();
    const isQuiz = nodeType === "quiz" || lessonType === "quiz";
    const isAssignment = nodeType === "assignment" || lessonType === "assignment";

    const assignmentMode = normalizeAssignmentMode(properties);
    const typedResponseMode = normalizeTypedResponseMode(
        properties.typed_response_mode,
    );
    const hasQuestions =
        Array.isArray(properties.questions) && properties.questions.length > 0;
    const hasQuizLink = Boolean(properties.quiz_id);
    const hasAssignmentLink = Boolean(properties.assignment_id);
    const materials = Array.isArray(properties.files) ? properties.files : [];
    const assignmentAttempts = Number.isFinite(Number(properties.assignment_attempts))
        ? Number(properties.assignment_attempts)
        : null;

    const shouldShowQuestions =
        isQuiz ||
        (isAssignment &&
            assignmentRequiresQuestions(assignmentMode, typedResponseMode));
    const shouldShowSubmission =
        isAssignment &&
        assignmentRequiresSubmission(assignmentMode, typedResponseMode);

    const handleSubmission = () => {
        if (!hasAssignmentLink || isSubmitting) return;
        if (!textContent.trim()) return;

        setIsSubmitting(true);
        setSubmissionNotice(null);
        const payload = new FormData();
        if (textContent.trim()) payload.append("text_content", textContent.trim());
        if (enrollmentId) payload.append("enrollment_id", String(enrollmentId));
        if (node?.id) payload.append("node_id", String(node.id));

        router.post(`/student/assignment/${properties.assignment_id}/submit/`, payload, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setSubmissionNotice({
                    severity: "success",
                    message: "Assignment submitted successfully.",
                });
                if (onComplete) onComplete();
            },
            onError: () => {
                setSubmissionNotice({
                    severity: "error",
                    message: "Submission failed. Please try again.",
                });
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const renderQuestionsSection = () => {
        if (!shouldShowQuestions) return null;

        if (hasQuizLink || hasQuestions) {
            return (
                <QuizRenderer
                    node={{
                        ...node,
                        properties: {
                            ...properties,
                            quiz_id: properties.quiz_id || null,
                            questions: properties.questions,
                        },
                    }}
                    enrollmentId={enrollmentId}
                    discussions={discussions}
                    onComplete={onComplete}
                    useBackendRuntime={hasQuizLink}
                />
            );
        }

        return (
            <Alert severity="warning" sx={{ mb: shouldShowSubmission ? 2 : 0 }}>
                No questions are available for this lesson yet.
            </Alert>
        );
    };

    const renderAssignmentOverview = () => {
        if (!isAssignment) return null;

        const assessmentPrompt = properties.assessment_prompt || "";
        const instructions = properties.instructions || "";
        const sanitizedPrompt = DOMPurify.sanitize(assessmentPrompt);
        const sanitizedInstructions = DOMPurify.sanitize(instructions);

        return (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 2 }}>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            Requirements
                        </Typography>
                        {stripHtml(assessmentPrompt) ? (
                            <Box
                                sx={{ color: "text.secondary" }}
                                dangerouslySetInnerHTML={{
                                    __html: sanitizedPrompt,
                                }}
                            />
                        ) : (
                            <Alert severity="warning" sx={{ mt: 1 }}>
                                This assignment content is not available yet.
                            </Alert>
                        )}
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                        {assignmentAttempts && assignmentAttempts > 0
                            ? `Attempts allowed: ${assignmentAttempts}`
                            : "Attempts allowed: Unlimited"}
                    </Typography>

                    {shouldShowSubmission && !assignmentStarted ? (
                        <Box>
                            <Button
                                variant="contained"
                                onClick={() => setAssignmentStarted(true)}
                                disabled={!hasAssignmentLink}
                            >
                                Start Assignment
                            </Button>
                        </Box>
                    ) : null}

                    {stripHtml(instructions) ? (
                        <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                                Instructions
                            </Typography>
                            <Box
                                sx={{ color: "text.secondary" }}
                                dangerouslySetInnerHTML={{
                                    __html: sanitizedInstructions,
                                }}
                            />
                        </Box>
                    ) : null}

                    <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                            Materials
                        </Typography>
                        {materials.length === 0 ? (
                            <Typography color="text.secondary">
                                No materials attached.
                            </Typography>
                        ) : (
                            <Stack spacing={1}>
                                {materials.map((file, index) => {
                                    const url = file?.url || file?.path;
                                    if (!url) return null;
                                    return (
                                        <Stack
                                            key={file?.id || `${url}-${index}`}
                                            direction="row"
                                            spacing={2}
                                            alignItems="center"
                                        >
                                            <Typography variant="body2">
                                                {file?.name || `Material ${index + 1}`}
                                            </Typography>
                                            <Link href={url} download>
                                                Download
                                            </Link>
                                            <Link
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Open
                                            </Link>
                                        </Stack>
                                    );
                                })}
                            </Stack>
                        )}
                    </Box>
                </Stack>
            </Paper>
        );
    };

    const renderSubmissionSection = () => {
        if (!shouldShowSubmission || !assignmentStarted) return null;

        return (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            {node?.title || "Assignment Submission"}
                        </Typography>
                    </Box>

                    {!hasAssignmentLink ? (
                        <Alert severity="warning">
                            This assignment is not ready yet. Please contact your instructor.
                        </Alert>
                    ) : (
                        <>
                            {submissionNotice ? (
                                <Alert severity={submissionNotice.severity}>
                                    {submissionNotice.message}
                                </Alert>
                            ) : null}
                            <TextField
                                label="Your response"
                                multiline
                                rows={7}
                                fullWidth
                                value={textContent}
                                onChange={(event) => {
                                    setTextContent(event.target.value);
                                    if (submissionNotice) {
                                        setSubmissionNotice(null);
                                    }
                                }}
                            />

                            <Box>
                                <Button
                                    variant="contained"
                                    onClick={handleSubmission}
                                    disabled={
                                        isSubmitting ||
                                        !hasAssignmentLink ||
                                        !textContent.trim()
                                    }
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Assignment"}
                                </Button>
                            </Box>
                        </>
                    )}
                </Stack>
            </Paper>
        );
    };

    if (!isQuiz && !isAssignment) return null;

    return (
        <Box>
            {renderAssignmentOverview()}
            {renderQuestionsSection()}
            {shouldShowQuestions && shouldShowSubmission ? (
                <Divider sx={{ my: 2 }} />
            ) : null}
            {renderSubmissionSection()}
        </Box>
    );
};

export default AssessmentRenderer;
