import { useEffect, useRef, useState } from "react";
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
import QuestionEditorCard from "@/features/course-builder/components/QuestionEditorCard";
import {
    libraryEntryToBuilderQuestion,
    snapshotForQuestion,
} from "@/features/course-builder/utils/libraryQuestion";
import { createEntry, errorMessage, updateEntry } from "../api/questionLibraryApi";

// The question card reports edits after a 500 ms pause; wait for the last one.
const CARD_SETTLE_MS = 550;

const blankQuestion = () => ({
    id: `new-${Date.now()}`,
    type: "mcq",
    text: "",
    points: 1,
    options: ["", "", "", ""],
    correct: 0,
});

/** Write a new bank question, or edit one. Saving an edit creates a new version. */
export default function EntryEditorDialog({
    open,
    entry = null,
    bank,
    categories = [],
    onClose,
    onSaved,
}) {
    const [question, setQuestion] = useState(blankQuestion);
    const latestQuestion = useRef(question);
    const [category, setCategory] = useState("");
    const [difficulty, setDifficulty] = useState("medium");
    const [tags, setTags] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        const initial = entry
            ? {
                  ...libraryEntryToBuilderQuestion(entry),
                  // Inside the bank this is the original, not a copy.
                  fromLibrary: false,
                  id: `entry-${entry.id}`,
              }
            : blankQuestion();
        setQuestion(initial);
        latestQuestion.current = initial;
        setCategory(entry?.category || "");
        setDifficulty(entry?.difficulty || "medium");
        setTags((entry?.tags || []).join(", "));
        setError("");
    }, [open, entry]);

    const handleQuestionChange = (updated) => {
        latestQuestion.current = updated;
        setQuestion(updated);
    };

    const save = async () => {
        setBusy(true);
        setError("");
        await new Promise((resolve) => setTimeout(resolve, CARD_SETTLE_MS));
        const current = latestQuestion.current;
        if (!String(current.text || "").replace(/<[^>]*>/g, "").trim()) {
            setError("Please write the question before saving.");
            setBusy(false);
            return;
        }
        const payload = {
            category,
            difficulty,
            tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
            questionSnapshot: snapshotForQuestion(current),
        };
        try {
            const saved = entry
                ? await updateEntry(entry.id, payload)
                : await createEntry({ ...payload, bank_id: bank.id });
            onSaved(saved);
            onClose();
        } catch (requestError) {
            setError(errorMessage(requestError, "Could not save the question."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md">
            <DialogTitle>
                {entry ? "Edit bank question" : `New question in ${bank?.name || "bank"}`}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2.5} sx={{ pt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    {entry && (
                        <Alert severity="info">
                            Saving creates version {(entry.snapshot_version || 1) + 1}. Quizzes
                            that already copied this question keep their copy until an
                            instructor chooses to update it.
                        </Alert>
                    )}
                    {open && (
                        <QuestionEditorCard
                            key={question.id}
                            question={question}
                            onChange={handleQuestionChange}
                            categories={categories}
                            showCategories={false}
                            isNew
                            defaultExpanded
                        />
                    )}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                            fullWidth
                            label="Category"
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            slotProps={{ htmlInput: { list: "bank-categories" } }}
                        />
                        <datalist id="bank-categories">
                            {categories.map((value) => (
                                <option key={value} value={value} />
                            ))}
                        </datalist>
                        <FormControl fullWidth>
                            <InputLabel id="entry-difficulty-label">Difficulty</InputLabel>
                            <Select
                                labelId="entry-difficulty-label"
                                label="Difficulty"
                                value={difficulty}
                                onChange={(event) => setDifficulty(event.target.value)}
                            >
                                <MenuItem value="easy">Easy</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="hard">Hard</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                    <TextField
                        label="Tags"
                        value={tags}
                        onChange={(event) => setTags(event.target.value)}
                        helperText="Comma-separated. Pools can require tags."
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={busy}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={save} disabled={busy}>
                    {busy ? "Saving…" : "Save question"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
