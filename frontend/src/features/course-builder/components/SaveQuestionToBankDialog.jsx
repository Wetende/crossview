import { useEffect, useMemo, useState } from "react";
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
import BankScopeChip from "@/features/question-library/components/BankScopeChip";
import {
    createBank as createBankRequest,
    createEntry,
    errorMessage,
} from "@/features/question-library/api/questionLibraryApi";
import { snapshotForQuestion } from "../utils/libraryQuestion";

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
    const [newBankScope, setNewBankScope] = useState("course");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const editableBanks = useMemo(
        () => banks.filter((bank) => bank.can_edit !== false),
        [banks],
    );

    useEffect(() => {
        if (open && editableBanks.length === 1) setBankId(editableBanks[0].id);
    }, [editableBanks, open]);

    const createBank = async () => {
        if (!newBankName.trim()) return;
        setBusy(true);
        setError("");
        try {
            const data = await createBankRequest({
                name: newBankName.trim(),
                category,
                scope: newBankScope,
                program: programId,
            });
            onBankCreated?.(data);
            setBankId(data.id);
            setNewBankName("");
        } catch (requestError) {
            setError(errorMessage(requestError, "Could not create the bank."));
        } finally {
            setBusy(false);
        }
    };

    const save = async () => {
        if (!bankId || !question) return;
        setBusy(true);
        setError("");
        try {
            const data = await createEntry({
                bank_id: bankId,
                program: programId,
                category,
                difficulty,
                tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
                questionSnapshot: snapshotForQuestion(question),
            });
            onSaved?.(data);
            onClose();
        } catch (requestError) {
            setError(errorMessage(requestError, "Could not save the question."));
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
                        <InputLabel id="save-question-bank-label">Question bank</InputLabel>
                        <Select
                            labelId="save-question-bank-label"
                            value={bankId}
                            label="Question bank"
                            onChange={(event) => setBankId(event.target.value)}
                        >
                            {editableBanks.map((bank) => (
                                <MenuItem key={bank.id} value={bank.id}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <span>{bank.name}</span>
                                        <BankScopeChip scope={bank.scope} />
                                    </Stack>
                                </MenuItem>
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
                        <FormControl sx={{ minWidth: 180 }}>
                            <InputLabel id="new-bank-scope-label">New bank belongs to</InputLabel>
                            <Select
                                labelId="new-bank-scope-label"
                                value={newBankScope}
                                label="New bank belongs to"
                                onChange={(event) => setNewBankScope(event.target.value)}
                            >
                                <MenuItem value="course">This course</MenuItem>
                                <MenuItem value="instructor">My library</MenuItem>
                            </Select>
                        </FormControl>
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
