import { useEffect, useState } from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
} from "@mui/material";
import { createBank, errorMessage, updateBank } from "../api/questionLibraryApi";

const SCOPE_HELP = {
    course: "Shared with the instructors of one course.",
    instructor: "Only you can edit it; use it in every course you teach.",
    institution: "Every instructor can use it; only administrators can edit it.",
};

/**
 * Create a bank, or rename an existing one. The bank type is chosen once,
 * when the bank is created.
 */
export default function BankFormDialog({
    open,
    bank = null,
    programs = [],
    canCreateShared = false,
    defaultScope,
    onClose,
    onSaved,
}) {
    const isEdit = Boolean(bank);
    const scopeOptions = [
        programs.length > 0 && ["course", "Course bank"],
        ["instructor", "My library"],
        canCreateShared && ["institution", "Shared bank"],
    ].filter(Boolean);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [scope, setScope] = useState("instructor");
    const [programId, setProgramId] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        setName(bank?.name || "");
        setDescription(bank?.description || "");
        setCategory(bank?.category || "");
        setScope(bank?.scope || defaultScope || scopeOptions[0]?.[0] || "instructor");
        setProgramId(programs[0]?.id || "");
        setError("");
        // Reset only when the dialog opens for a bank.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, bank]);

    const submit = async (event) => {
        event.preventDefault();
        if (!name.trim()) {
            setError("Please enter a bank name.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            const payload = { name: name.trim(), description, category };
            const saved = isEdit
                ? await updateBank(bank.id, payload)
                : await createBank({
                      ...payload,
                      scope,
                      program: scope === "course" ? programId : undefined,
                  });
            onSaved(saved);
            onClose();
        } catch (requestError) {
            setError(errorMessage(requestError, "Could not save the bank."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <form onSubmit={submit}>
                <DialogTitle>{isEdit ? "Edit bank" : "New question bank"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <TextField
                            autoFocus
                            required
                            label="Bank name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        {!isEdit && (
                            <FormControl fullWidth>
                                <InputLabel id="bank-scope-label">Bank type</InputLabel>
                                <Select
                                    labelId="bank-scope-label"
                                    label="Bank type"
                                    value={scope}
                                    onChange={(event) => setScope(event.target.value)}
                                >
                                    {scopeOptions.map(([value, label]) => (
                                        <MenuItem key={value} value={value}>
                                            {label}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>{SCOPE_HELP[scope]}</FormHelperText>
                            </FormControl>
                        )}
                        {!isEdit && scope === "course" && (
                            <FormControl fullWidth>
                                <InputLabel id="bank-course-label">Course</InputLabel>
                                <Select
                                    labelId="bank-course-label"
                                    label="Course"
                                    value={programId}
                                    onChange={(event) => setProgramId(event.target.value)}
                                >
                                    {programs.map((program) => (
                                        <MenuItem key={program.id} value={program.id}>
                                            {program.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        <TextField
                            label="Category"
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            helperText="Optional. Pools can draw from one category."
                        />
                        <TextField
                            label="Description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            multiline
                            minRows={2}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={busy}>
                        {isEdit ? "Save bank" : "Create bank"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
