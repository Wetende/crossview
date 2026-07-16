import { useState } from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { AccountBalance as BankIcon } from "@mui/icons-material";

const QUESTION_TYPES = [
    ["", "Any question type"],
    ["mcq", "Single choice"],
    ["mcq_multi", "Multiple choice"],
    ["true_false", "True / false"],
    ["short_answer", "Short answer"],
    ["matching", "Matching"],
    ["image_matching", "Image matching"],
    ["fill_blank", "Fill in the blank"],
    ["ordering", "Ordering"],
];

export default function QuestionBankDialog({
    open,
    onClose,
    onSave,
    banks = [],
    categories = [],
}) {
    const [bankId, setBankId] = useState("");
    const [questionCount, setQuestionCount] = useState(10);
    const [category, setCategory] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [questionType, setQuestionType] = useState("");
    const [tags, setTags] = useState("");

    const reset = () => {
        setBankId("");
        setQuestionCount(10);
        setCategory("");
        setDifficulty("");
        setQuestionType("");
        setTags("");
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSave = () => {
        const selectedBank = banks.find((bank) => String(bank.id) === String(bankId));
        if (!selectedBank || questionCount < 1) return;
        onSave({
            bankId: selectedBank.id,
            name: selectedBank.name,
            questionCount,
            category,
            difficulty,
            questionType,
            tags: tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            isActive: true,
        });
        reset();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <BankIcon color="success" />
                <Typography component="span" variant="h6">
                    Add random question pool
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2.5} sx={{ pt: 1 }}>
                    <Alert severity="info">
                        Each attempt receives a stable random selection from the filters below.
                        A new attempt receives a new selection.
                    </Alert>
                    {banks.length === 0 ? (
                        <Alert severity="warning">
                            Create a persistent question bank and save questions to it before adding a pool.
                        </Alert>
                    ) : (
                        <FormControl fullWidth required>
                            <InputLabel id="question-pool-bank-label">Question bank</InputLabel>
                            <Select
                                id="question-pool-bank"
                                labelId="question-pool-bank-label"
                                value={bankId}
                                label="Question bank"
                                onChange={(event) => setBankId(event.target.value)}
                            >
                                {banks.map((bank) => (
                                    <MenuItem key={bank.id} value={bank.id}>
                                        {bank.name} ({bank.entries_count} questions)
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <TextField
                        label="Questions per attempt"
                        type="number"
                        value={questionCount}
                        onChange={(event) =>
                            setQuestionCount(Math.max(1, Number(event.target.value) || 1))
                        }
                        slotProps={{ htmlInput: { min: 1, max: 500 } }}
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <FormControl fullWidth>
                            <InputLabel id="question-pool-category-label">Category</InputLabel>
                            <Select
                                id="question-pool-category"
                                labelId="question-pool-category-label"
                                value={category}
                                label="Category"
                                onChange={(event) => setCategory(event.target.value)}
                            >
                                <MenuItem value="">Any category</MenuItem>
                                {categories.map((value) => (
                                    <MenuItem key={value} value={value}>{value}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel id="question-pool-difficulty-label">Difficulty</InputLabel>
                            <Select
                                id="question-pool-difficulty"
                                labelId="question-pool-difficulty-label"
                                value={difficulty}
                                label="Difficulty"
                                onChange={(event) => setDifficulty(event.target.value)}
                            >
                                <MenuItem value="">Any difficulty</MenuItem>
                                <MenuItem value="easy">Easy</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="hard">Hard</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                    <FormControl fullWidth>
                        <InputLabel id="question-pool-type-label">Question type</InputLabel>
                        <Select
                            id="question-pool-type"
                            labelId="question-pool-type-label"
                            value={questionType}
                            label="Question type"
                            onChange={(event) => setQuestionType(event.target.value)}
                        >
                            {QUESTION_TYPES.map(([value, label]) => (
                                <MenuItem key={value || "any"} value={value}>{label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Required tags"
                        value={tags}
                        onChange={(event) => setTags(event.target.value)}
                        helperText="Comma-separated. Every tag must match."
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={handleSave}
                    disabled={!bankId || questionCount < 1}
                >
                    Add pool
                </Button>
            </DialogActions>
        </Dialog>
    );
}
