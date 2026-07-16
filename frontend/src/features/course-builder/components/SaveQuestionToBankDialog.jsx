import { useEffect, useState } from "react";
import axios from "axios";
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
} from "@mui/material";

const snapshotForQuestion = (question) => {
    const type = question?.type || "mcq";
    const options = (question?.options || []).map((text, position) => ({
        text,
        position,
        is_correct:
            type === "mcq"
                ? position === question.correct
                : type === "mcq_multi"
                  ? (question.correct_indices || []).includes(position)
                  : false,
    }));
    const answerData = {};
    if (type === "mcq") answerData.correct = question.correct ?? 0;
    if (type === "mcq_multi") {
        answerData.correct_indices = question.correct_indices || [];
    }
    if (type === "true_false") answerData.correct = (question.correct ?? 0) === 0;
    if (type === "short_answer") {
        answerData.keywords = question.keywords || [];
        answerData.manual_grading = question.manual_grading ?? true;
    }
    if (type === "ordering") {
        answerData.items = question.items || [];
        answerData.explanations = question.explanations || {};
    }
    return {
        question_type: type,
        text: question?.text || "",
        points: question?.points || 1,
        answer_data: answerData,
        options,
        matching_pairs: question?.pairs || [],
        gap_answers: question?.gaps || [],
        image_matching_pairs: question?.image_pairs || [],
    };
};

export default function SaveQuestionToBankDialog({
    open,
    question,
    programId,
    banks,
    categories,
    onClose,
    onSaved,
    onBankCreated,
}) {
    const [bankId, setBankId] = useState("");
    const [category, setCategory] = useState("");
    const [difficulty, setDifficulty] = useState("medium");
    const [tags, setTags] = useState("");
    const [newBankName, setNewBankName] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open && banks.length === 1) setBankId(banks[0].id);
    }, [banks, open]);

    const createBank = async () => {
        if (!newBankName.trim()) return;
        setBusy(true);
        setError("");
        try {
            const { data } = await axios.post(
                `/assessments/programs/${programId}/question-library/banks/`,
                { name: newBankName.trim(), category },
            );
            onBankCreated?.(data);
            setBankId(data.id);
            setNewBankName("");
        } catch (requestError) {
            setError(requestError?.response?.data?.message || "Could not create the bank.");
        } finally {
            setBusy(false);
        }
    };

    const save = async () => {
        if (!bankId || !question) return;
        setBusy(true);
        setError("");
        try {
            const { data } = await axios.post(
                `/assessments/programs/${programId}/question-library/entries/`,
                {
                    bank_id: bankId,
                    category,
                    difficulty,
                    tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
                    questionSnapshot: snapshotForQuestion(question),
                },
            );
            onSaved?.(data);
            onClose();
        } catch (requestError) {
            setError(requestError?.response?.data?.message || "Could not save the question.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Save question to library</DialogTitle>
            <DialogContent>
                <Stack spacing={2.5} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <FormControl fullWidth>
                        <InputLabel>Question bank</InputLabel>
                        <Select
                            value={bankId}
                            label="Question bank"
                            onChange={(event) => setBankId(event.target.value)}
                        >
                            {banks.map((bank) => (
                                <MenuItem key={bank.id} value={bank.id}>{bank.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <TextField
                            fullWidth
                            label="New bank name"
                            value={newBankName}
                            onChange={(event) => setNewBankName(event.target.value)}
                        />
                        <Button variant="outlined" disabled={busy || !newBankName.trim()} onClick={createBank}>
                            Create bank
                        </Button>
                    </Stack>
                    <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={category}
                            label="Category"
                            onChange={(event) => setCategory(event.target.value)}
                        >
                            <MenuItem value="">Uncategorized</MenuItem>
                            {categories.map((value) => (
                                <MenuItem key={value} value={value}>{value}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Difficulty</InputLabel>
                        <Select
                            value={difficulty}
                            label="Difficulty"
                            onChange={(event) => setDifficulty(event.target.value)}
                        >
                            <MenuItem value="easy">Easy</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="hard">Hard</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Tags"
                        value={tags}
                        onChange={(event) => setTags(event.target.value)}
                        helperText="Comma-separated"
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" disabled={busy || !bankId} onClick={save}>
                    Save reusable copy
                </Button>
            </DialogActions>
        </Dialog>
    );
}
