import { useCallback, useEffect, useState } from "react";
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
    Chip,
    IconButton,
    Snackbar,
    Alert,
    Menu,
    Tooltip,
    CircularProgress,
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Quiz as QuizIcon,
    Assignment as AssignmentIcon,
    LibraryBooks as LibraryIcon,
    KeyboardArrowDown as ArrowDownIcon,
    AccountBalance as BankIcon,
} from "@mui/icons-material";
import { router } from "@inertiajs/react";

import QuestionsLibraryDrawer from "../components/QuestionsLibraryDrawer";
import QuestionBankDialog from "../components/QuestionBankDialog";
import QuestionEditorCard from "../components/QuestionEditorCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import RichTextEditor from "@/components/RichTextEditor";

const QUESTION_TYPES = [
    { value: "mcq", label: "Single Choice", color: "#1976d2" },
    { value: "mcq_multi", label: "Multiple Choice", color: "#7b1fa2" },
    { value: "true_false", label: "True/False", color: "#388e3c" },
    { value: "short_answer", label: "Short Answer (Typed)", color: "#f57c00" },
    { value: "matching", label: "Matching", color: "#0288d1" },
    { value: "fill_blank", label: "Fill in the Gap", color: "#5d4037" },
    { value: "ordering", label: "Ordering", color: "#455a64" },
];

const QUIZ_STYLES = [
    { value: "default", label: "Default" },
    { value: "pagination", label: "Pagination" },
    { value: "global", label: "Global" },
];

const getPlainTextLength = (value) => {
    return String(value || "").replace(/<[^>]*>/g, "").trim().length;
};

// Pill-style tab component
function PillTabs({ value, onChange, tabs, questionCount }) {
    return (
        <Box
            sx={{
                display: "flex",
                gap: 0.5,
                bgcolor: "#e3f2fd",
                p: 0.5,
                borderRadius: 1,
                width: "fit-content",
            }}
        >
            {tabs.map((tab) => (
                <Button
                    key={tab.value}
                    onClick={() => onChange(tab.value)}
                    sx={{
                        px: 3,
                        py: 1,
                        borderRadius: 1,
                        textTransform: "none",
                        fontWeight: 500,
                        bgcolor: value === tab.value ? "white" : "transparent",
                        color:
                            value === tab.value
                                ? "primary.main"
                                : "text.secondary",
                        boxShadow: value === tab.value ? 1 : 0,
                        "&:hover": {
                            bgcolor:
                                value === tab.value
                                    ? "white"
                                    : "rgba(255,255,255,0.5)",
                        },
                    }}
                >
                    {tab.label}
                    {tab.value === "questions" && questionCount > 0 && (
                        <Chip
                            label={questionCount}
                            size="small"
                            color="primary"
                            sx={{ ml: 1, height: 20, minWidth: 20 }}
                        />
                    )}
                </Button>
            ))}
        </Box>
    );
}

/**
 * AssessmentEditor - Unified editor for quizzes and assignments
 * STM LMS-inspired design with tabs, question banks, and library drawer
 */
export default function AssessmentEditor({
    node,
    onSave,
    type = "quiz",
    programId,
    questionLibrary = [],
    categories = [],
}) {
    const normalizeQuestion = (question) => {
        if (!question) return question;
        const normalized = { ...question };
        normalized.required = normalized.required ?? true;

        if (normalized.type === "ordering") {
            const candidate = normalized.items || normalized.correct_order;
            if (Array.isArray(candidate)) {
                normalized.items = candidate.filter(
                    (item) => typeof item === "string",
                );
            }
        }

        if (
            normalized.type === "fill_blank" &&
            typeof normalized.text === "string"
        ) {
            normalized.text = normalized.text
                .replace(/<[^>]*>/g, "")
                .replace(/_{3,}/g, "{{blank}}")
                .replace(/\{\{\s*blank\s*\}\}/gi, "{{blank}}");
        }

        return normalized;
    };

    const isQuiz = type === "quiz";
    const isAssignment = type === "assignment";

    // Common state
    const [title, setTitle] = useState(node.title);
    const [activeTab, setActiveTab] = useState("questions");
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // Quiz-specific state
    const [description, setDescription] = useState(
        node.properties?.description || node.properties?.lesson_content || "",
    );
    const [quizDuration, setQuizDuration] = useState(
        node.properties?.quiz_duration || 30,
    );
    const [quizTimeUnit] = useState(
        node.properties?.quiz_time_unit || "Minutes",
    );
    const [quizStyle, setQuizStyle] = useState(
        node.properties?.quiz_style || "default",
    );
    const [passingGrade, setPassingGrade] = useState(
        node.properties?.passing_grade || 80,
    );
    const [maxAttempts, setMaxAttempts] = useState(
        node.properties?.max_attempts || 1,
    );
    const [randomizeQuestions, setRandomizeQuestions] = useState(
        node.properties?.randomize_questions || false,
    );
    const [randomizeAnswers, setRandomizeAnswers] = useState(
        node.properties?.randomize_answers || false,
    );
    const [showCorrectAnswer, setShowCorrectAnswer] = useState(
        node.properties?.show_correct_answer || false,
    );
    const [quizAttemptHistory, setQuizAttemptHistory] = useState(
        node.properties?.quiz_attempt_history || false,
    );
    const [retakeAfterPass] = useState(
        node.properties?.retake_after_pass || false,
    );
    const [limitedRetakeAttempts] = useState(
        node.properties?.limited_retake_attempts || false,
    );
    const [retakePenalty] = useState(
        node.properties?.retake_penalty || 0,
    );
    const [pointsCutAfterRetake] = useState(
        node.properties?.points_cut_after_retake || 0,
    );
    const [questions, setQuestions] = useState(
        (node.properties?.questions || []).map(normalizeQuestion),
    );
    const [questionBanks, setQuestionBanks] = useState(
        node.properties?.question_banks || [],
    );
    // Q&A state (backed by discussion threads)
    const [qaThreads, setQaThreads] = useState([]);
    const [qaLoading, setQaLoading] = useState(false);
    const [qaError, setQaError] = useState("");
    const [newQAQuestion, setNewQAQuestion] = useState("");
    const [creatingQuestion, setCreatingQuestion] = useState(false);
    const [replyDrafts, setReplyDrafts] = useState({});
    const [replyingByThreadId, setReplyingByThreadId] = useState({});
    const [togglingByThreadId, setTogglingByThreadId] = useState({});

    // Assignment-specific state
    const [assessmentPrompt, setAssessmentPrompt] = useState(
        node.properties?.assessment_prompt || "",
    );
    const [assignmentAttempts, setAssignmentAttempts] = useState(
        node.properties?.assignment_attempts ?? "",
    );
    const [points] = useState(node.properties?.points || 100);
    const [weight, setWeight] = useState(
        node.properties?.weight ?? (isQuiz ? 0 : 20),
    );
    const [allowLate] = useState(
        node.properties?.allow_late_submission ?? node.properties?.allow_late ?? false,
    );
    const [assignmentSubmissionType, setAssignmentSubmissionType] = useState(
        node.properties?.submission_type || "text",
    );
    const [allowedFileTypes, setAllowedFileTypes] = useState(
        Array.isArray(node.properties?.allowed_file_types)
            ? node.properties.allowed_file_types.join(", ")
            : "",
    );
    const [maxFileSizeMb, setMaxFileSizeMb] = useState(
        node.properties?.max_file_size_mb ?? 10,
    );
    const [materialFiles] = useState(
        Array.isArray(node.properties?.files) ? node.properties.files : [],
    );

    // UI state
    const [libraryDrawerOpen, setLibraryDrawerOpen] = useState(false);
    const [questionBankDialogOpen, setQuestionBankDialogOpen] = useState(false);
    const [addQuestionMenuAnchor, setAddQuestionMenuAnchor] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: "Confirm Action",
        message: "",
        actionType: null,
        actionId: null,
    });

    const totalQuestionCount =
        questions.length +
        questionBanks.reduce((sum, bank) => sum + bank.questionCount, 0);

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const isFormValid = () => {
        if (!title || title.trim().length < 5 || title.length > 100)
            return false;
        if (isAssignment && getPlainTextLength(assessmentPrompt) === 0)
            return false;
        const hasQuestionContent = questions.length > 0 || questionBanks.length > 0;
        const requiresQuestions = isQuiz;
        if (requiresQuestions && !hasQuestionContent) return false;
        return true;
    };

    const handleSave = () => {
        if (!isFormValid()) {
            setSnackbar({
                open: true,
                message: "Please fix validation errors",
                severity: "error",
            });
            return;
        }

        const properties = {
            ...node.properties,
        };

        const questionSettings = {
            questions,
            question_banks: questionBanks,
            description,
            weight,
            quiz_duration: quizDuration,
            quiz_time_unit: quizTimeUnit,
            quiz_style: quizStyle,
            passing_grade: passingGrade,
            max_attempts: maxAttempts,
            randomize_questions: randomizeQuestions,
            randomize_answers: randomizeAnswers,
            show_correct_answer: showCorrectAnswer,
            quiz_attempt_history: quizAttemptHistory,
            retake_after_pass: retakeAfterPass,
            limited_retake_attempts: limitedRetakeAttempts,
            retake_penalty: retakePenalty,
            points_cut_after_retake: pointsCutAfterRetake,
        };

        if (isQuiz) {
            Object.assign(properties, questionSettings);
        } else {
            const parsedAttempts = parseInt(String(assignmentAttempts).trim(), 10);
            const normalizedAllowedFileTypes = allowedFileTypes
                .split(",")
                .map((value) => value.trim().replace(/^\./, "").toLowerCase())
                .filter(Boolean);
            properties.assignment_mode = "submission_only";
            properties.typed_response_mode = "submission_text";
            properties.assessment_prompt = assessmentPrompt;
            properties.instructions = assessmentPrompt;
            properties.points = points;
            properties.weight = weight;
            properties.assignment_attempts =
                Number.isFinite(parsedAttempts) && parsedAttempts > 0
                    ? parsedAttempts
                    : null;
            properties.files = materialFiles;
            properties.allow_late_submission = allowLate;
            properties.allow_late = allowLate;
            properties.submission_type = assignmentSubmissionType;
            properties.allowed_file_types = normalizedAllowedFileTypes;
            properties.max_file_size_mb = Math.max(
                1,
                parseInt(maxFileSizeMb, 10) || 10,
            );
            properties.questions = [];
            properties.question_banks = [];
            delete properties.quiz_id;
        }

        onSave(node.id, { title, properties });
        setSnackbar({
            open: true,
            message: `${isQuiz ? "Quiz" : "Assignment"} saved!`,
            severity: "success",
        });
    };

    // Question Menu handlers
    const handleOpenQuestionMenu = (event) => {
        setAddQuestionMenuAnchor(event.currentTarget);
    };

    const handleCloseQuestionMenu = () => {
        setAddQuestionMenuAnchor(null);
    };

    const handleSelectQuestionType = (type) => {
        // Create a new question and add it to the list (inline editing)
        const newQuestionItem = {
            id: Date.now(),
            db_id: null,
            type: type,
            text: "",
            points: 1,
            options: ["", "", "", ""],
            correct: 0,
            correctAnswers: [],
            categories: [],
            required: true,
            keywords: [],
            pairs: [],
            gaps: [],
            items: ["", "", "", ""],
            isNew: true, // Flag for expanded state
        };
        setQuestions([...questions, newQuestionItem]);
        setAddQuestionMenuAnchor(null);
    };

    const openDeleteDialog = ({ title, message, actionType, actionId }) => {
        setConfirmDialog({
            open: true,
            title,
            message,
            actionType,
            actionId,
        });
    };

    const closeDeleteDialog = () => {
        setConfirmDialog({
            open: false,
            title: "Confirm Action",
            message: "",
            actionType: null,
            actionId: null,
        });
    };

    const handleConfirmDelete = () => {
        if (!confirmDialog.actionType || confirmDialog.actionId == null) {
            closeDeleteDialog();
            return;
        }

        if (confirmDialog.actionType === "question") {
            setQuestions(
                questions.filter((q) => q.id !== confirmDialog.actionId),
            );
        }

        if (confirmDialog.actionType === "questionBank") {
            setQuestionBanks(
                questionBanks.filter((b) => b.id !== confirmDialog.actionId),
            );
        }

        closeDeleteDialog();
    };

    const handleDeleteQuestion = (id) => {
        openDeleteDialog({
            title: "Delete Question",
            message: "Delete this question?",
            actionType: "question",
            actionId: id,
        });
    };

    const handleDeleteQuestionBank = (bankId) => {
        openDeleteDialog({
            title: "Delete Question Bank",
            message: "Delete this question bank?",
            actionType: "questionBank",
            actionId: bankId,
        });
    };

    // Handle adding questions from library
    const handleAddFromLibrary = (libraryEntries) => {
        const existingLibraryIds = new Set(
            questions
                .filter((q) => q.libraryEntryId)
                .map((q) => q.libraryEntryId),
        );
        const existingTexts = new Set(
            questions.map((q) => q.text?.toLowerCase().trim()),
        );

        const newQuestions = libraryEntries
            .filter((entry) => {
                if (existingLibraryIds.has(entry.id)) return false;
                const text = (entry.question_data?.text || "")
                    .toLowerCase()
                    .trim();
                if (text && existingTexts.has(text)) return false;
                return true;
            })
            .map((entry) =>
                normalizeQuestion({
                    id: Date.now() + Math.random(),
                    db_id: null,
                    type:
                        entry.question_data?.question_type ||
                        entry.question_type ||
                        "mcq",
                    text: entry.question_data?.text || "",
                    points: entry.question_data?.points || 1,
                    options: (entry.question_data?.options || [])
                        .map((o) => (typeof o === "string" ? o : o?.text))
                        .filter(Boolean),
                    correct: entry.question_data?.answer_data?.correct ?? 0,
                    correctAnswers:
                        entry.question_data?.answer_data?.correct_indices || [],
                    pairs: entry.question_data?.matching_pairs || [],
                    gaps: entry.question_data?.gap_answers || [],
                    items:
                        (
                            entry.question_data?.answer_data?.items ||
                            entry.question_data?.answer_data?.correct_order ||
                            []
                        ).filter((item) => typeof item === "string"),
                    fromLibrary: true,
                    libraryEntryId: entry.id,
                }),
            );

        if (newQuestions.length === 0) {
            setSnackbar({
                open: true,
                message:
                    "All selected questions are already in this assessment",
                severity: "warning",
            });
            return;
        }

        const skipped = libraryEntries.length - newQuestions.length;
        setQuestions((prev) => [...prev, ...newQuestions]);
        setSnackbar({
            open: true,
            message: `Added ${newQuestions.length} question(s)${skipped > 0 ? ` (${skipped} duplicates skipped)` : ""}`,
            severity: "success",
        });
    };

    // Handle adding question bank
    const handleAddQuestionBank = (bank) => {
        setQuestionBanks([...questionBanks, { ...bank, id: Date.now() }]);
        setQuestionBankDialogOpen(false);
        setSnackbar({
            open: true,
            message: "Question bank added!",
            severity: "success",
        });
    };

    const loadQaThreads = useCallback(async () => {
        if (!node?.id || String(node.id).startsWith("temp_")) {
            setQaThreads([]);
            return;
        }

        setQaLoading(true);
        setQaError("");
        try {
            const response = await fetch(
                `/instructor/nodes/${node.id}/discussions/`,
                {
                    credentials: "same-origin",
                    headers: { Accept: "application/json" },
                },
            );
            if (!response.ok) {
                throw new Error("Failed to load Q&A threads");
            }
            const data = await response.json();
            setQaThreads(Array.isArray(data?.discussions) ? data.discussions : []);
        } catch (error) {
            setQaError(error?.message || "Failed to load Q&A threads");
        } finally {
            setQaLoading(false);
        }
    }, [node?.id]);

    const handleCreateQaQuestion = () => {
        const content = newQAQuestion.trim();
        if (!content || !node?.id || String(node.id).startsWith("temp_")) return;

        setCreatingQuestion(true);
        const title = content.slice(0, 80);
        router.post(
            `/instructor/nodes/${node.id}/discussions/create/`,
            { title, content },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewQAQuestion("");
                    loadQaThreads();
                },
                onFinish: () => setCreatingQuestion(false),
            },
        );
    };

    const handleReplyToQaThread = (threadId) => {
        const content = (replyDrafts[threadId] || "").trim();
        if (!content) return;

        setReplyingByThreadId((prev) => ({ ...prev, [threadId]: true }));
        router.post(
            "/instructor/discussions/reply/",
            { thread: threadId, content },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReplyDrafts((prev) => ({ ...prev, [threadId]: "" }));
                    loadQaThreads();
                },
                onFinish: () =>
                    setReplyingByThreadId((prev) => ({
                        ...prev,
                        [threadId]: false,
                    })),
            },
        );
    };

    const handleToggleThreadPin = (threadId) => {
        setTogglingByThreadId((prev) => ({ ...prev, [threadId]: true }));
        router.post(
            `/instructor/discussions/${threadId}/toggle-pin/`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => loadQaThreads(),
                onFinish: () =>
                    setTogglingByThreadId((prev) => ({
                        ...prev,
                        [threadId]: false,
                    })),
            },
        );
    };

    const handleToggleThreadLock = (threadId) => {
        setTogglingByThreadId((prev) => ({ ...prev, [threadId]: true }));
        router.post(
            `/instructor/discussions/${threadId}/toggle-lock/`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => loadQaThreads(),
                onFinish: () =>
                    setTogglingByThreadId((prev) => ({
                        ...prev,
                        [threadId]: false,
                    })),
            },
        );
    };

    const assignmentHasQuestionSection = false;
    const tabs = [
        ...(isQuiz || assignmentHasQuestionSection
            ? [{ value: "questions", label: "Questions" }]
            : []),
        { value: "settings", label: "Settings" },
        { value: "qa", label: "Q&A" },
    ];

    useEffect(() => {
        const tabValues = new Set(
            isQuiz || assignmentHasQuestionSection
                ? ["questions", "settings", "qa"]
                : ["settings", "qa"],
        );
        if (!tabValues.has(activeTab)) {
            setActiveTab("settings");
        }
    }, [activeTab, assignmentHasQuestionSection, isQuiz]);

    useEffect(() => {
        if (activeTab === "qa") {
            loadQaThreads();
        }
    }, [activeTab, loadQaThreads]);

    return (
        <Box>
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 3,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flex: 1,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 2,
                            py: 0.75,
                            bgcolor: "primary.50",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "primary.200",
                        }}
                    >
                        {isQuiz ? (
                            <QuizIcon sx={{ fontSize: 18, color: "primary.main" }} />
                        ) : (
                            <AssignmentIcon sx={{ fontSize: 18, color: "primary.main" }} />
                        )}
                        <Typography
                            variant="body2"
                            color="primary.main"
                            fontWeight={500}
                        >
                            {isQuiz ? "Quiz" : "Assignment"}
                        </Typography>
                    </Box>
                    <TextField
                        variant="standard"
                        placeholder={`${isQuiz ? "Quiz" : "Assignment"} Title`}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        sx={{ flex: 1, maxWidth: 400 }}
                        InputProps={{
                            sx: { fontSize: "1rem" },
                            disableUnderline: true,
                        }}
                    />
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<LibraryIcon />}
                        onClick={() => setLibraryDrawerOpen(true)}
                        disabled={isAssignment && !assignmentHasQuestionSection}
                    >
                        Questions library
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        startIcon={<SaveIcon />}
                        disabled={!isFormValid()}
                    >
                        Save
                    </Button>
                </Stack>
            </Box>

            {/* Tabs */}
            <Box sx={{ mb: 3 }}>
                <PillTabs
                    value={activeTab}
                    onChange={setActiveTab}
                    tabs={tabs}
                    questionCount={totalQuestionCount}
                />
            </Box>

            {/* Questions Tab - Available for both Quiz and Assignment */}
            {activeTab === "questions" && (
                <Stack spacing={2}>
                    {/* Questions List - Using QuestionEditorCard */}
                    {questions.map((q, idx) => (
                        <QuestionEditorCard
                            key={q.id || idx}
                            question={q}
                            onChange={(updatedQuestion) => {
                                const newQuestions = [...questions];
                                // Clear isNew flag after first edit
                                newQuestions[idx] = {
                                    ...updatedQuestion,
                                    isNew: false,
                                };
                                setQuestions(newQuestions);
                            }}
                            onDelete={() => handleDeleteQuestion(q.id)}
                            categories={categories}
                            defaultExpanded={q.isNew || false}
                            isNew={q.isNew || false}
                        />
                    ))}

                    {/* Question Banks */}
                    {questionBanks.map((bank) => (
                        <Paper
                            key={bank.id}
                            sx={{
                                p: 2,
                                bgcolor: "#e8f5e9",
                                border: "1px solid #a5d6a7",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <Box>
                                <Typography color="primary" fontWeight={500}>
                                    Questions Bank
                                </Typography>
                                <Typography variant="body2">
                                    {bank.name}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                }}
                            >
                                <Typography color="primary">
                                    {bank.questionCount} questions
                                </Typography>
                                <Tooltip title="The Question Bank cannot be edited. You can delete it or create a new one.">
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            handleDeleteQuestionBank(bank.id)
                                        }
                                    >
                                        <DeleteIcon
                                            fontSize="small"
                                            color="error"
                                        />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Paper>
                    ))}

                    {/* Empty State */}
                    {questions.length === 0 && questionBanks.length === 0 && (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 4,
                                textAlign: "center",
                                bgcolor: "action.hover",
                            }}
                        >
                            <Typography color="text.secondary" paragraph>
                                No questions yet.
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Add questions manually or import from library
                            </Typography>
                        </Paper>
                    )}

                    {/* Action Buttons */}
                    <Box
                        sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "center",
                            pt: 2,
                        }}
                    >
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            endIcon={<ArrowDownIcon />}
                            onClick={handleOpenQuestionMenu}
                            sx={{ textTransform: "none" }}
                        >
                            + Question
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<BankIcon />}
                            onClick={() => setQuestionBankDialogOpen(true)}
                            sx={{ textTransform: "none" }}
                        >
                            + Question Bank
                        </Button>
                    </Box>

                    {/* Question Type Menu */}
                    <Menu
                        anchorEl={addQuestionMenuAnchor}
                        open={Boolean(addQuestionMenuAnchor)}
                        onClose={handleCloseQuestionMenu}
                    >
                        {QUESTION_TYPES.map((type) => (
                            <MenuItem
                                key={type.value}
                                onClick={() =>
                                    handleSelectQuestionType(type.value)
                                }
                            >
                                <Chip
                                    label={type.label}
                                    size="small"
                                    sx={{
                                        bgcolor: type.color,
                                        color: "white",
                                        mr: 1,
                                        fontSize: "0.75rem",
                                    }}
                                />
                            </MenuItem>
                        ))}
                    </Menu>
                </Stack>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
                <Stack spacing={3}>
                    {isAssignment && (
                        <>
                            <Typography variant="h6">Assignment</Typography>
                            <TextField
                                label="Assignment attempts"
                                type="number"
                                value={assignmentAttempts}
                                onChange={(e) =>
                                    setAssignmentAttempts(e.target.value)
                                }
                                placeholder="Leave empty for unlimited"
                                sx={{ width: 260 }}
                                InputProps={{ inputProps: { min: 1 } }}
                                helperText="Leave empty for unlimited attempts"
                            />
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                                <FormControl sx={{ minWidth: 220 }}>
                                    <InputLabel>Submission type</InputLabel>
                                    <Select
                                        value={assignmentSubmissionType}
                                        label="Submission type"
                                        onChange={(e) =>
                                            setAssignmentSubmissionType(
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <MenuItem value="text">
                                            Text response
                                        </MenuItem>
                                        <MenuItem value="file">
                                            File upload
                                        </MenuItem>
                                        <MenuItem value="both">
                                            Text + file upload
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Allowed file types"
                                    value={allowedFileTypes}
                                    onChange={(e) =>
                                        setAllowedFileTypes(e.target.value)
                                    }
                                    placeholder="pdf, docx, mp3, mp4"
                                    disabled={assignmentSubmissionType === "text"}
                                    helperText="Comma-separated extensions"
                                    sx={{ minWidth: 260 }}
                                />
                                <TextField
                                    label="Max file size (MB)"
                                    type="number"
                                    value={maxFileSizeMb}
                                    onChange={(e) =>
                                        setMaxFileSizeMb(e.target.value)
                                    }
                                    disabled={assignmentSubmissionType === "text"}
                                    sx={{ width: 180 }}
                                    InputProps={{ inputProps: { min: 1, max: 500 } }}
                                />
                            </Stack>
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    gutterBottom
                                    color="text.secondary"
                                >
                                    Assignment content
                                </Typography>
                                <RichTextEditor
                                    value={assessmentPrompt}
                                    onChange={setAssessmentPrompt}
                                    placeholder="Write the assignment requirements and task description..."
                                    minHeight={220}
                                />
                                <Typography
                                    variant="caption"
                                    color={
                                        getPlainTextLength(assessmentPrompt) ===
                                        0
                                            ? "error.main"
                                            : "text.secondary"
                                    }
                                >
                                    {getPlainTextLength(assessmentPrompt)} characters
                                    {getPlainTextLength(assessmentPrompt) === 0
                                        ? " (required)"
                                        : ""}
                                </Typography>
                            </Box>
                        </>
                    )}

                    {(isQuiz || assignmentHasQuestionSection) && (
                        <>
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    gutterBottom
                                    color="text.secondary"
                                >
                                    Assessment Description
                                </Typography>
                                <RichTextEditor
                                    value={description}
                                    onChange={setDescription}
                                    placeholder="Add a short introduction for learners..."
                                    minHeight={120}
                                />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {getPlainTextLength(description)} characters
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Duration"
                                    type="number"
                                    value={quizDuration}
                                    onChange={(e) =>
                                        setQuizDuration(
                                            parseInt(e.target.value) || 0,
                                        )
                                    }
                                    sx={{ width: 160 }}
                                    InputProps={{ inputProps: { min: 1 } }}
                                />
                                <TextField
                                    label="Passing Grade (%)"
                                    type="number"
                                    value={passingGrade}
                                    onChange={(e) =>
                                        setPassingGrade(
                                            parseInt(e.target.value) || 0,
                                        )
                                    }
                                    sx={{ width: 180 }}
                                    InputProps={{
                                        inputProps: { min: 0, max: 100 },
                                    }}
                                />
                                <TextField
                                    label="Max Attempts"
                                    type="number"
                                    value={maxAttempts}
                                    onChange={(e) =>
                                        setMaxAttempts(
                                            parseInt(e.target.value) || 1,
                                        )
                                    }
                                    sx={{ width: 150 }}
                                    InputProps={{ inputProps: { min: 1 } }}
                                />
                                <TextField
                                    label="Weight (%)"
                                    type="number"
                                    value={weight}
                                    onChange={(e) =>
                                        setWeight(
                                            Math.min(
                                                100,
                                                Math.max(
                                                    0,
                                                    parseInt(e.target.value) ||
                                                        0,
                                                ),
                                            ),
                                        )
                                    }
                                    sx={{ width: 150 }}
                                    InputProps={{ inputProps: { min: 0, max: 100 } }}
                                />
                            </Stack>

                            <FormControl fullWidth>
                                <InputLabel>Quiz style</InputLabel>
                                <Select
                                    value={quizStyle}
                                    label="Quiz style"
                                    onChange={(e) => setQuizStyle(e.target.value)}
                                >
                                    {QUIZ_STYLES.map((style) => (
                                        <MenuItem
                                            key={style.value}
                                            value={style.value}
                                        >
                                            {style.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gap: 1,
                                }}
                            >
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={randomizeQuestions}
                                            onChange={(e) =>
                                                setRandomizeQuestions(
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                    }
                                    label="Randomize questions"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={randomizeAnswers}
                                            onChange={(e) =>
                                                setRandomizeAnswers(
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                    }
                                    label="Randomize answers"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={showCorrectAnswer}
                                            onChange={(e) =>
                                                setShowCorrectAnswer(
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                    }
                                    label="Show correct answer"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={quizAttemptHistory}
                                            onChange={(e) =>
                                                setQuizAttemptHistory(
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                    }
                                    label="Quiz attempt history"
                                />
                            </Box>

                        </>
                    )}

                    {isAssignment && (
                        <Alert severity="info">
                            Students can submit text, files, or both based on these settings.
                            Audio and video evidence can also be added from the learner submission page.
                        </Alert>
                    )}
                </Stack>
            )}

            {/* Q&A Tab */}
            {activeTab === "qa" && (
                <Stack spacing={3}>
                    <Box>
                        <Typography
                            variant="subtitle1"
                            fontWeight={500}
                            gutterBottom
                        >
                            Ask or answer learner questions
                        </Typography>
                        <TextField
                            multiline
                            rows={3}
                            fullWidth
                            placeholder="Type a learner-facing question for this assessment..."
                            value={newQAQuestion}
                            onChange={(e) => setNewQAQuestion(e.target.value)}
                            sx={{ mb: 2 }}
                            disabled={
                                !node?.id ||
                                String(node.id).startsWith("temp_") ||
                                creatingQuestion
                            }
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCreateQaQuestion}
                            disabled={
                                !newQAQuestion.trim() ||
                                creatingQuestion ||
                                !node?.id ||
                                String(node.id).startsWith("temp_")
                            }
                            sx={{ textTransform: "none" }}
                        >
                            {creatingQuestion ? "Posting..." : "Post Question"}
                        </Button>
                        {(!node?.id || String(node.id).startsWith("temp_")) && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 1 }}
                            >
                                Save this quiz first to enable live Q&A.
                            </Typography>
                        )}
                    </Box>

                    {qaLoading && (
                        <Box sx={{ py: 4, textAlign: "center" }}>
                            <CircularProgress size={24} />
                        </Box>
                    )}

                    {qaError && !qaLoading && (
                        <Alert severity="error">{qaError}</Alert>
                    )}

                    {!qaLoading && qaThreads.length > 0 && (
                        <Stack spacing={2}>
                            <Typography
                                variant="subtitle2"
                                color="text.secondary"
                            >
                                Questions ({qaThreads.length})
                            </Typography>
                            {qaThreads.map((thread, idx) => (
                                <Paper
                                    key={thread.id}
                                    variant="outlined"
                                    sx={{ p: 2 }}
                                >
                                    <Stack spacing={1.5}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >
                                            <Typography
                                                variant="body1"
                                                fontWeight={500}
                                            >
                                                Q{idx + 1}: {thread.content || thread.title || "Untitled question"}
                                            </Typography>
                                            <Stack direction="row" spacing={1}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() =>
                                                        handleToggleThreadPin(
                                                            thread.id,
                                                        )
                                                    }
                                                    disabled={
                                                        !!togglingByThreadId[
                                                            thread.id
                                                        ]
                                                    }
                                                >
                                                    {thread.is_pinned
                                                        ? "Unpin"
                                                        : "Pin"}
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() =>
                                                        handleToggleThreadLock(
                                                            thread.id,
                                                        )
                                                    }
                                                    disabled={
                                                        !!togglingByThreadId[
                                                            thread.id
                                                        ]
                                                    }
                                                >
                                                    {thread.is_locked
                                                        ? "Unlock"
                                                        : "Lock"}
                                                </Button>
                                            </Stack>
                                        </Box>

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            Asked by {thread.author || "Learner"}
                                        </Typography>

                                        {(thread.posts || []).length > 0 ? (
                                            <Stack spacing={1}>
                                                {(thread.posts || []).map(
                                                    (post) => (
                                                        <Box
                                                            key={post.id}
                                                            sx={{
                                                                pl: 1.5,
                                                                py: 0.5,
                                                                borderLeft:
                                                                    "2px solid",
                                                                borderColor:
                                                                    post.is_instructor
                                                                        ? "success.main"
                                                                        : "divider",
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {post.is_instructor
                                                                    ? "Instructor"
                                                                    : "Reply"}
                                                                : {post.author}
                                                            </Typography>
                                                            <Typography variant="body2">
                                                                {post.content}
                                                            </Typography>
                                                        </Box>
                                                    ),
                                                )}
                                            </Stack>
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                color="warning.main"
                                            >
                                                Awaiting instructor answer...
                                            </Typography>
                                        )}

                                        <Box
                                            sx={{
                                                display: "flex",
                                                gap: 1,
                                                alignItems: "flex-start",
                                            }}
                                        >
                                            <TextField
                                                size="small"
                                                fullWidth
                                                placeholder="Write your answer..."
                                                value={replyDrafts[thread.id] || ""}
                                                disabled={
                                                    !!thread.is_locked ||
                                                    !!replyingByThreadId[
                                                        thread.id
                                                    ]
                                                }
                                                onChange={(event) =>
                                                    setReplyDrafts((prev) => ({
                                                        ...prev,
                                                        [thread.id]:
                                                            event.target.value,
                                                    }))
                                                }
                                            />
                                            <Button
                                                variant="contained"
                                                size="small"
                                                disabled={
                                                    !!thread.is_locked ||
                                                    !!replyingByThreadId[
                                                        thread.id
                                                    ] ||
                                                    !(replyDrafts[thread.id] || "")
                                                        .trim()
                                                }
                                                onClick={() =>
                                                    handleReplyToQaThread(
                                                        thread.id,
                                                    )
                                                }
                                            >
                                                Reply
                                            </Button>
                                        </Box>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    )}

                    {!qaLoading && qaThreads.length === 0 && !newQAQuestion && (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 4,
                                textAlign: "center",
                                bgcolor: "action.hover",
                            }}
                        >
                            <Typography color="text.secondary">
                                No questions yet. Learners will ask here,
                                and you can answer directly.
                            </Typography>
                        </Paper>
                    )}
                </Stack>
            )}

            {/* Add Question Dialog - REMOVED: Using inline QuestionEditorCard instead */}

            {/* Question Bank Dialog */}
            <QuestionBankDialog
                open={questionBankDialogOpen}
                onClose={() => setQuestionBankDialogOpen(false)}
                onSave={handleAddQuestionBank}
                categories={categories}
            />

            {/* Questions Library Drawer */}
            <QuestionsLibraryDrawer
                open={libraryDrawerOpen}
                onClose={() => setLibraryDrawerOpen(false)}
                programId={programId}
                onAddQuestions={handleAddFromLibrary}
                existingQuestionIds={questions
                    .map((q) => q.libraryEntryId)
                    .filter(Boolean)}
                preloadedQuestions={questionLibrary}
                preloadedCategories={categories}
            />

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <ConfirmDialog
                open={confirmDialog.open}
                onClose={closeDeleteDialog}
                onConfirm={handleConfirmDelete}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmLabel="Delete"
                confirmColor="error"
            />
        </Box>
    );
}
