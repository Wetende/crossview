import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    FormControlLabel,
    Switch,
    Stack,
    Checkbox,
    Radio,
    OutlinedInput,
    Collapse,
    Tooltip,
    Divider,
} from "@mui/material";
import {
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
    Image as ImageIcon,
    Edit as EditIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    Add as AddIcon,
    Help as HelpIcon,
} from "@mui/icons-material";
import RichTextEditor from "@/components/RichTextEditor";

// Import specialized editors
import MatchingPairsEditor from "@/features/quizzes/components/MatchingPairsEditor";
import FillBlankEditor from "@/features/quizzes/components/FillBlankEditor";
import OrderingEditor from "@/features/quizzes/components/OrderingEditor";

const QUESTION_TYPES = [
    { value: "mcq", label: "Single choice", color: "#1976d2" },
    { value: "mcq_multi", label: "Multiple choice", color: "#7b1fa2" },
    { value: "true_false", label: "True-False", color: "#388e3c" },
    { value: "short_answer", label: "Short Answer (Typed)", color: "#f57c00" },
    { value: "matching", label: "Matching", color: "#0288d1" },
    { value: "fill_blank", label: "Fill in the Gap", color: "#5d4037" },
    { value: "ordering", label: "Ordering", color: "#455a64" },
];

const normalizeFillBlankText = (text, type) => {
    if (type !== "fill_blank") return text || "";
    if (typeof text !== "string") return "";
    return text
        .replace(/<[^>]*>/g, "")
        .replace(/_{3,}/g, "{{blank}}")
        .replace(/\{\{\s*blank\s*\}\}/gi, "{{blank}}");
};

const getCorrectIndices = (question) => {
    if (Array.isArray(question.correct_indices)) return question.correct_indices;
    if (Array.isArray(question.answer_data?.correct_indices)) {
        return question.answer_data.correct_indices;
    }
    return [];
};

/**
 * QuestionEditorCard - Inline editor for quiz questions
 * Matches STM LMS Quiz Builder design with rich text, media, categories
 */
export default function QuestionEditorCard({
    question,
    onChange,
    onDelete,
    categories = [],
    isNew = false,
    defaultExpanded = false,
}) {
    const [expanded, setExpanded] = useState(defaultExpanded || isNew);
    const [localData, setLocalData] = useState({
        text: normalizeFillBlankText(question.text, question.type || "mcq"),
        type: question.type || "mcq",
        points: question.points || 1,
        options: question.options || ["", "", "", ""],
        correct: question.correct ?? 0,
        correct_indices: getCorrectIndices(question),
        categories: question.categories || [],
        required: question.required ?? true,
        pairs: question.pairs || [],
        gaps: question.gaps || [],
        items: question.items || ["", "", "", ""],
        keywords: question.keywords || [],
        explanations: question.explanations || {},
        media: question.media || null,
    });

    // Keep local state in sync when switching between different questions
    useEffect(() => {
        setLocalData({
            text: normalizeFillBlankText(question.text, question.type || "mcq"),
            type: question.type || "mcq",
            points: question.points || 1,
            options: question.options || ["", "", "", ""],
            correct: question.correct ?? 0,
            correct_indices: getCorrectIndices(question),
            categories: question.categories || [],
            required: question.required ?? true,
            pairs: question.pairs || [],
            gaps: question.gaps || [],
            items: question.items || ["", "", "", ""],
            keywords: question.keywords || [],
            explanations: question.explanations || {},
            media: question.media || null,
        });
        // Reset only when switching cards; syncing every echoed field update
        // would overwrite in-progress edits in the debounced local editor.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question.id]);

    useEffect(() => {
        if (localData.type === "fill_blank") {
            const plainText = normalizeFillBlankText(
                localData.text,
                "fill_blank",
            );
            if (plainText !== localData.text) {
                updateField("text", plainText);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localData.type]);

    // Sync local state to parent
    useEffect(() => {
        const timer = setTimeout(() => {
            onChange({ ...question, ...localData });
        }, 500);
        return () => clearTimeout(timer);
        // Parent callbacks are inline per question row, so localData is the
        // deliberate trigger for debounced saves to the parent editor state.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localData]);

    // Word count
    const wordCount = useMemo(() => {
        const text = localData.text.replace(/<[^>]*>/g, ""); // Strip HTML
        const words = text
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0);
        return words.length;
    }, [localData.text]);

    const updateField = (field, value) => {
        setLocalData((prev) => ({ ...prev, [field]: value }));
    };

    const commitLocalData = (nextData) => {
        setLocalData(nextData);
        onChange({ ...question, ...nextData });
    };

    const handleAddAnswer = () => {
        updateField("options", [...localData.options, ""]);
    };

    const handleQuestionTypeChange = (nextType) => {
        const nextData = { ...localData, type: nextType };

        if (nextType === "mcq" || nextType === "true_false") {
            const current = Array.isArray(localData.correct_indices)
                ? localData.correct_indices
                : [];
            nextData.correct = current.length > 0 ? current[0] : localData.correct ?? 0;
            nextData.correct_indices = [];
        }

        if (nextType === "mcq_multi") {
            nextData.correct_indices =
                localData.type === "mcq_multi"
                    ? localData.correct_indices || []
                    : typeof localData.correct === "number"
                      ? [localData.correct]
                      : [];
            nextData.correct = null;
        }

        commitLocalData(nextData);
    };

    const handleRemoveAnswer = (index) => {
        const newOptions = localData.options.filter((_, i) => i !== index);
        // Adjust correct answer if needed
        let newCorrect = localData.correct;
        if (localData.type === "mcq") {
            if (index === localData.correct) newCorrect = 0;
            else if (index < localData.correct)
                newCorrect = Math.max(0, localData.correct - 1);
        }
        const newCorrectIndices = (localData.correct_indices || [])
            .filter((i) => i !== index)
            .map((i) => (i > index ? i - 1 : i));

        commitLocalData({
            ...localData,
            options: newOptions,
            correct: newCorrect,
            correct_indices: newCorrectIndices,
        });
    };

    const handleUpdateAnswer = (index, value) => {
        const newOptions = [...localData.options];
        newOptions[index] = value;
        updateField("options", newOptions);
    };

    const handleToggleCorrect = (index) => {
        if (localData.type === "mcq" || localData.type === "true_false") {
            // Single choice - only one correct
            commitLocalData({ ...localData, correct: index });
        } else if (localData.type === "mcq_multi") {
            // Multiple choice - toggle in array
            const current = localData.correct_indices || [];
            if (current.includes(index)) {
                commitLocalData({
                    ...localData,
                    correct_indices: current.filter((i) => i !== index),
                });
            } else {
                commitLocalData({
                    ...localData,
                    correct_indices: [...current, index],
                });
            }
        }
    };

    const isAnswerCorrect = (index) => {
        if (localData.type === "mcq" || localData.type === "true_false") {
            return localData.correct === index;
        }
        return (localData.correct_indices || []).includes(index);
    };

    const getTypeInfo = (typeValue) => {
        return (
            QUESTION_TYPES.find((t) => t.value === typeValue) || {
                label: typeValue,
                color: "#757575",
            }
        );
    };

    const typeInfo = getTypeInfo(localData.type);

    return (
        <Paper
            elevation={expanded ? 2 : 0}
            variant={expanded ? "elevation" : "outlined"}
            sx={{
                overflow: "hidden",
                border: expanded ? "2px solid" : "1px solid",
                borderColor: expanded ? "primary.main" : "divider",
                transition: "all 0.2s ease",
            }}
        >
            {/* Header Row - Always Visible */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 2,
                    bgcolor: expanded ? "primary.50" : "transparent",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                }}
                onClick={() => !isNew && setExpanded(!expanded)}
            >
                {/* Drag Handle */}
                <IconButton
                    size="small"
                    sx={{ cursor: "grab" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <DragIcon fontSize="small" />
                </IconButton>

                {/* Question Title Preview */}
                <Box sx={{ flex: 1, overflow: "hidden" }}>
                    <Typography
                        variant="body1"
                        sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                        dangerouslySetInnerHTML={{
                            __html:
                                localData.text ||
                                '<em style="color: #999">Enter your question</em>',
                        }}
                    />
                </Box>

                {/* Type Badge */}
                <Chip
                    label={typeInfo.label}
                    size="small"
                    sx={{
                        bgcolor: typeInfo.color,
                        color: "white",
                        fontWeight: 500,
                        fontSize: "0.75rem",
                    }}
                />

                {/* Expand/Collapse */}
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }}
                >
                    {expanded ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>

                {/* Delete */}
                <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.();
                    }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Expanded Editor */}
            <Collapse in={expanded}>
                <Divider />
                <Box sx={{ p: 2 }}>
                    {/* Media & Rich Text Editor Row */}
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        {/* Media Button */}
                        <Tooltip title="Add Video or Audio">
                            <IconButton
                                sx={{
                                    border: "1px dashed",
                                    borderColor: "divider",
                                    borderRadius: 1,
                                    width: 48,
                                    height: 48,
                                }}
                            >
                                <ImageIcon color="action" />
                            </IconButton>
                        </Tooltip>

                        {/* Rich Text Editor */}
                        <Box sx={{ flex: 1 }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                gutterBottom
                            >
                                Enter your question
                            </Typography>
                            {localData.type === "fill_blank" ? (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1 }}
                                >
                                    Use the “Fill in the Blank” editor below to
                                    enter text with {"{{blank}}"} placeholders.
                                </Typography>
                            ) : (
                                <RichTextEditor
                                    value={localData.text}
                                    onChange={(value) => updateField("text", value)}
                                    placeholder="Enter your question"
                                    minHeight={200}
                                />
                            )}
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ float: "right", mt: 0.5 }}
                            >
                                {wordCount} words
                            </Typography>
                        </Box>
                    </Box>

                    {/* Controls Row */}
                    <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ mb: 3, mt: 4 }}
                    >
                        {/* Question Type */}
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Question Type</InputLabel>
                            <Select
                                value={localData.type}
                                label="Question Type"
                                onChange={(e) =>
                                    handleQuestionTypeChange(e.target.value)
                                }
                            >
                                {QUESTION_TYPES.map((type) => (
                                    <MenuItem
                                        key={type.value}
                                        value={type.value}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: "50%",
                                                    bgcolor: type.color,
                                                }}
                                            />
                                            {type.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Tooltip title="Learn how this question type works">
                            <IconButton size="small" color="info">
                                <HelpIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        {/* Categories */}
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                multiple
                                value={localData.categories}
                                label="Category"
                                onChange={(e) =>
                                    updateField("categories", e.target.value)
                                }
                                input={<OutlinedInput label="Category" />}
                                renderValue={(selected) => (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 0.5,
                                        }}
                                    >
                                        {selected.map((value) => (
                                            <Chip
                                                key={value}
                                                label={value}
                                                size="small"
                                            />
                                        ))}
                                    </Box>
                                )}
                            >
                                {categories.length === 0 ? (
                                    <MenuItem disabled>
                                        <em>No categories</em>
                                    </MenuItem>
                                ) : (
                                    categories.map((cat) => (
                                        <MenuItem key={cat} value={cat}>
                                            <Checkbox
                                                checked={localData.categories.includes(
                                                    cat,
                                                )}
                                                size="small"
                                            />
                                            {cat}
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </FormControl>

                        {/* Required Toggle */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={localData.required}
                                    onChange={(e) =>
                                        updateField(
                                            "required",
                                            e.target.checked,
                                        )
                                    }
                                    size="small"
                                />
                            }
                            label="Required Question"
                        />

                        {/* Points */}
                        <TextField
                            label="Points"
                            type="number"
                            size="small"
                            value={localData.points}
                            onChange={(e) =>
                                updateField(
                                    "points",
                                    parseInt(e.target.value) || 1,
                                )
                            }
                            sx={{ width: 80 }}
                            InputProps={{ inputProps: { min: 1 } }}
                        />
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    {/* Answer Section - Single/Multiple Choice */}
                    {(localData.type === "mcq" ||
                        localData.type === "mcq_multi") && (
                        <Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 2,
                                }}
                            >
                                <Typography variant="subtitle2">
                                    Answers
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {localData.type === "mcq"
                                        ? "Single choice: select one correct answer"
                                        : "Multiple choice: select all correct answers"}
                                </Typography>
                            </Box>

                            <Stack spacing={1}>
                                {localData.options.map((opt, idx) => (
                                    <Box
                                        key={idx}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            p: 1,
                                            bgcolor: isAnswerCorrect(idx)
                                                ? "success.50"
                                                : "grey.50",
                                            borderRadius: 1,
                                            border: "1px solid",
                                            borderColor: isAnswerCorrect(idx)
                                                ? "success.main"
                                                : "divider",
                                        }}
                                    >
                                        <IconButton
                                            size="small"
                                            sx={{ cursor: "grab" }}
                                        >
                                            <DragIcon fontSize="small" />
                                        </IconButton>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder={`Answer ${idx + 1}`}
                                            value={opt}
                                            onChange={(e) =>
                                                handleUpdateAnswer(
                                                    idx,
                                                    e.target.value,
                                                )
                                            }
                                            variant="standard"
                                            InputProps={{
                                                disableUnderline: true,
                                            }}
                                        />
                                        <IconButton size="small">
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.5,
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Correct
                                            </Typography>
                                            {localData.type === "mcq" ? (
                                                <Radio
                                                    checked={isAnswerCorrect(
                                                        idx,
                                                    )}
                                                    onChange={() =>
                                                        handleToggleCorrect(
                                                            idx,
                                                        )
                                                    }
                                                    size="small"
                                                    color="success"
                                                />
                                            ) : (
                                                <Checkbox
                                                    checked={isAnswerCorrect(
                                                        idx,
                                                    )}
                                                    onChange={() =>
                                                        handleToggleCorrect(
                                                            idx,
                                                        )
                                                    }
                                                    size="small"
                                                    color="success"
                                                />
                                            )}
                                        </Box>
                                        {localData.options.length > 2 && (
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() =>
                                                    handleRemoveAnswer(idx)
                                                }
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                ))}
                            </Stack>

                            {/* Add New Answer */}
                            <Box
                                sx={{
                                    mt: 2,
                                    p: 1,
                                    bgcolor: "grey.50",
                                    borderRadius: 1,
                                    border: "1px dashed",
                                    borderColor: "divider",
                                }}
                            >
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Add new answer"
                                    variant="standard"
                                    InputProps={{ disableUnderline: true }}
                                    onKeyPress={(e) => {
                                        if (
                                            e.key === "Enter" &&
                                            e.target.value.trim()
                                        ) {
                                            updateField("options", [
                                                ...localData.options,
                                                e.target.value.trim(),
                                            ]);
                                            e.target.value = "";
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value.trim()) {
                                            updateField("options", [
                                                ...localData.options,
                                                e.target.value.trim(),
                                            ]);
                                            e.target.value = "";
                                        }
                                    }}
                                />
                            </Box>
                            <Button
                                startIcon={<AddIcon />}
                                onClick={handleAddAnswer}
                                size="small"
                                sx={{ mt: 1, textTransform: "none" }}
                            >
                                Add new answer
                            </Button>
                        </Box>
                    )}

                    {/* True/False */}
                    {localData.type === "true_false" && (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Correct Answer
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                {["True", "False"].map((label, idx) => (
                                    <Box
                                        key={label}
                                        onClick={() =>
                                            updateField("correct", idx)
                                        }
                                        sx={{
                                            p: 2,
                                            border: "2px solid",
                                            borderColor:
                                                localData.correct === idx
                                                    ? "success.main"
                                                    : "divider",
                                            borderRadius: 1,
                                            cursor: "pointer",
                                            bgcolor:
                                                localData.correct === idx
                                                    ? "success.50"
                                                    : "transparent",
                                            minWidth: 100,
                                            textAlign: "center",
                                        }}
                                    >
                                        <Typography
                                            fontWeight={
                                                localData.correct === idx
                                                    ? 600
                                                    : 400
                                            }
                                        >
                                            {label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* Matching Pairs */}
                    {localData.type === "matching" && (
                        <MatchingPairsEditor
                            pairs={localData.pairs}
                            onChange={(pairs) => updateField("pairs", pairs)}
                        />
                    )}

                    {/* Fill in the Blank */}
                    {localData.type === "fill_blank" && (
                        <FillBlankEditor
                            text={localData.text}
                            gaps={localData.gaps}
                            onTextChange={(text) => updateField("text", text)}
                            onGapsChange={(gaps) => updateField("gaps", gaps)}
                        />
                    )}

                    {/* Ordering */}
                    {localData.type === "ordering" && (
                        <OrderingEditor
                            items={localData.items}
                            explanations={localData.explanations || {}}
                            onChange={(items) => updateField("items", items)}
                            onExplanationsChange={(explanations) =>
                                updateField("explanations", explanations)
                            }
                        />
                    )}

                    {/* Keywords */}
                    {localData.type === "short_answer" && (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Typed Answer Keywords (Optional)
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Enter keywords separated by commas"
                                value={(localData.keywords || []).join(", ")}
                                onChange={(e) =>
                                    updateField(
                                        "keywords",
                                        e.target.value
                                            .split(",")
                                            .map((k) => k.trim())
                                            .filter((k) => k),
                                    )
                                }
                                size="small"
                                helperText="Use this for auto-checking typed answers. Leave empty for manual review."
                            />
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
}
