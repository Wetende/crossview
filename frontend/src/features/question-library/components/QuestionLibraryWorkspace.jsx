import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    IconButton,
    InputAdornment,
    InputLabel,
    List,
    ListItemButton,
    ListItemText,
    ListSubheader,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Snackbar,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    Add as AddIcon,
    Archive as ArchiveIcon,
    Delete as DeleteIcon,
    DriveFileMove as MoveIcon,
    Edit as EditIcon,
    Search as SearchIcon,
    Unarchive as UnarchiveIcon,
} from "@mui/icons-material";
import ConfirmDialog from "@/components/ConfirmDialog";
import BankScopeChip from "./BankScopeChip";
import BankFormDialog from "./BankFormDialog";
import EntryEditorDialog from "./EntryEditorDialog";
import {
    deleteBank,
    deleteEntry,
    errorMessage,
    listEntries,
    updateBank,
    updateEntry,
} from "../api/questionLibraryApi";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

const GROUPS = [
    ["course", "Course banks"],
    ["instructor", "My library"],
    ["institution", "Shared banks"],
];

const TYPE_LABELS = {
    mcq: "Single choice",
    mcq_multi: "Multiple choice",
    true_false: "True/false",
    short_answer: "Short answer",
    matching: "Matching",
    image_matching: "Image match",
    fill_blank: "Fill in the gap",
    ordering: "Ordering",
};

const bankSubtitle = (bank) => {
    const count = `${bank.entries_count ?? 0} question${bank.entries_count === 1 ? "" : "s"}`;
    return bank.program_name ? `${bank.program_name} · ${count}` : count;
};

/**
 * Two-pane question library: banks on the left, the selected bank's
 * questions on the right. Used by the instructor Question Library page and
 * the administrators' shared-bank page.
 */
export default function QuestionLibraryWorkspace({
    banks: initialBanks,
    programs = [],
    categories = [],
    canCreateShared = false,
    scopes = GROUPS.map(([scope]) => scope),
    initialBankId = null,
    defaultScope,
}) {
    const [banks, setBanks] = useState(initialBanks);
    useEffect(() => setBanks(initialBanks), [initialBanks]);
    const [showArchived, setShowArchived] = useState(false);
    const shownBanks = useMemo(
        () =>
            banks.filter(
                (bank) => scopes.includes(bank.scope) && (showArchived || !bank.is_archived),
            ),
        [banks, scopes, showArchived],
    );
    const [selectedBankId, setSelectedBankId] = useState(
        initialBankId ? Number(initialBankId) : shownBanks[0]?.id ?? null,
    );
    const selectedBank = banks.find((bank) => bank.id === selectedBankId) || null;
    const editableBanks = banks.filter((bank) => bank.can_edit && !bank.is_archived);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [questionType, setQuestionType] = useState("");
    const [entries, setEntries] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const requestId = useRef(0);

    const [bankForm, setBankForm] = useState({ open: false, bank: null });
    const [entryEditor, setEntryEditor] = useState({ open: false, entry: null });
    const [moveTarget, setMoveTarget] = useState({ entry: null, bankId: "" });
    const [confirm, setConfirm] = useState(null);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DELAY_MS);
        return () => clearTimeout(timer);
    }, [search]);

    const loadEntries = useCallback(
        async (pageNumber = 1) => {
            if (!selectedBankId) {
                setEntries([]);
                return;
            }
            const current = ++requestId.current;
            setLoading(true);
            setLoadError("");
            try {
                const body = await listEntries({
                    bank_id: selectedBankId,
                    query: debouncedSearch,
                    question_type: questionType,
                    include_archived: selectedBank?.is_archived ? 1 : undefined,
                    page: pageNumber,
                    page_size: PAGE_SIZE,
                });
                if (current !== requestId.current) return;
                setEntries(body.results);
                setPage(body.page);
                setTotalPages(body.totalPages);
            } catch (error) {
                if (current !== requestId.current) return;
                setLoadError(errorMessage(error, "Could not load the questions. Try again."));
            } finally {
                if (current === requestId.current) setLoading(false);
            }
        },
        [selectedBankId, selectedBank?.is_archived, debouncedSearch, questionType],
    );

    useEffect(() => {
        loadEntries(1);
    }, [loadEntries]);

    const replaceBank = (updated) =>
        setBanks((current) =>
            current.map((bank) => (bank.id === updated.id ? { ...bank, ...updated } : bank)),
        );

    const adjustCount = (bankId, delta) =>
        setBanks((current) =>
            current.map((bank) =>
                bank.id === bankId
                    ? { ...bank, entries_count: Math.max(0, (bank.entries_count || 0) + delta) }
                    : bank,
            ),
        );

    const handleBankSaved = (saved) => {
        if (banks.some((bank) => bank.id === saved.id)) {
            replaceBank(saved);
        } else {
            setBanks((current) => [...current, saved]);
            setSelectedBankId(saved.id);
        }
        setNotice({ severity: "success", message: "Bank saved" });
    };

    const toggleArchive = async () => {
        try {
            const saved = await updateBank(selectedBank.id, {
                is_archived: !selectedBank.is_archived,
            });
            replaceBank(saved);
            if (saved.is_archived) setShowArchived(true);
            setNotice({
                severity: "success",
                message: saved.is_archived
                    ? "Bank archived. Existing quiz pools keep drawing from it."
                    : "Bank restored",
            });
        } catch (error) {
            setNotice({ severity: "error", message: errorMessage(error, "Could not update the bank.") });
        }
    };

    const confirmDeleteBank = () =>
        setConfirm({
            title: "Delete bank",
            message: `Delete "${selectedBank.name}" and its questions? Quizzes keep the questions they already copied.`,
            onConfirm: async () => {
                try {
                    await deleteBank(selectedBank.id);
                    setBanks((current) => current.filter((bank) => bank.id !== selectedBank.id));
                    setSelectedBankId(null);
                    setNotice({ severity: "success", message: "Bank deleted" });
                } catch (error) {
                    setNotice({
                        severity: "error",
                        message: errorMessage(error, "Could not delete the bank."),
                    });
                }
            },
        });

    const confirmDeleteEntry = (entry) =>
        setConfirm({
            title: "Delete question",
            message: "Delete this bank question? Quizzes keep the copies they already made.",
            onConfirm: async () => {
                try {
                    await deleteEntry(entry.id);
                    adjustCount(selectedBankId, -1);
                    loadEntries(page);
                } catch (error) {
                    setNotice({
                        severity: "error",
                        message: errorMessage(error, "Could not delete the question."),
                    });
                }
            },
        });

    const moveEntry = async () => {
        try {
            await updateEntry(moveTarget.entry.id, { bank_id: moveTarget.bankId });
            adjustCount(selectedBankId, -1);
            adjustCount(moveTarget.bankId, 1);
            setMoveTarget({ entry: null, bankId: "" });
            setNotice({ severity: "success", message: "Question moved" });
            loadEntries(page);
        } catch (error) {
            setNotice({ severity: "error", message: errorMessage(error, "Could not move the question.") });
        }
    };

    const readOnly = selectedBank && !selectedBank.can_edit;

    return (
        <Stack direction={{ xs: "column", lg: "row" }} spacing={3} alignItems="flex-start">
            <Paper variant="outlined" sx={{ width: { xs: "100%", lg: 320 }, flexShrink: 0 }}>
                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
                >
                    <Typography variant="subtitle1" fontWeight={600}>
                        Banks
                    </Typography>
                    <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => setBankForm({ open: true, bank: null })}
                    >
                        New bank
                    </Button>
                </Stack>
                <List dense disablePadding sx={{ maxHeight: { lg: "65vh" }, overflow: "auto" }}>
                    {GROUPS.filter(([scope]) => scopes.includes(scope)).map(([scope, title]) => {
                        const groupBanks = shownBanks.filter((bank) => bank.scope === scope);
                        if (groupBanks.length === 0) return null;
                        return (
                            <li key={scope}>
                                <ul style={{ padding: 0 }}>
                                    <ListSubheader>{title}</ListSubheader>
                                    {groupBanks.map((bank) => (
                                        <ListItemButton
                                            key={bank.id}
                                            selected={bank.id === selectedBankId}
                                            onClick={() => setSelectedBankId(bank.id)}
                                        >
                                            <ListItemText
                                                primary={bank.name}
                                                secondary={bankSubtitle(bank)}
                                            />
                                            {bank.is_archived && (
                                                <Chip size="small" label="Archived" />
                                            )}
                                        </ListItemButton>
                                    ))}
                                </ul>
                            </li>
                        );
                    })}
                    {shownBanks.length === 0 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                No banks yet. Create one to start collecting reusable questions.
                            </Typography>
                        </Box>
                    )}
                </List>
                <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: "divider" }}>
                    <FormControlLabel
                        control={
                            <Switch
                                size="small"
                                checked={showArchived}
                                onChange={(event) => setShowArchived(event.target.checked)}
                            />
                        }
                        label="Show archived"
                    />
                </Box>
            </Paper>

            <Paper variant="outlined" sx={{ flex: 1, width: "100%", minWidth: 0 }}>
                {!selectedBank ? (
                    <Box sx={{ p: 4 }}>
                        <Typography color="text.secondary">
                            Select a bank to see its questions.
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            alignItems={{ sm: "center" }}
                            justifyContent="space-between"
                            sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Typography variant="h6">{selectedBank.name}</Typography>
                                <BankScopeChip scope={selectedBank.scope} />
                                {readOnly && <Chip size="small" label="Read only" />}
                            </Stack>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                {selectedBank.can_edit && (
                                    <>
                                        <Tooltip title="Edit bank">
                                            <IconButton
                                                aria-label="Edit bank"
                                                onClick={() =>
                                                    setBankForm({ open: true, bank: selectedBank })
                                                }
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip
                                            title={selectedBank.is_archived ? "Restore bank" : "Archive bank"}
                                        >
                                            <IconButton
                                                aria-label={
                                                    selectedBank.is_archived ? "Restore bank" : "Archive bank"
                                                }
                                                onClick={toggleArchive}
                                            >
                                                {selectedBank.is_archived ? (
                                                    <UnarchiveIcon fontSize="small" />
                                                ) : (
                                                    <ArchiveIcon fontSize="small" />
                                                )}
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )}
                                {selectedBank.can_delete && (
                                    <Tooltip title="Delete bank">
                                        <IconButton aria-label="Delete bank" onClick={confirmDeleteBank}>
                                            <DeleteIcon fontSize="small" color="error" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {selectedBank.can_edit && !selectedBank.is_archived && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => setEntryEditor({ open: true, entry: null })}
                                    >
                                        New question
                                    </Button>
                                )}
                            </Stack>
                        </Stack>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ p: 2 }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Search questions"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <SearchIcon fontSize="small" color="action" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel id="library-type-label">Type</InputLabel>
                                <Select
                                    labelId="library-type-label"
                                    label="Type"
                                    value={questionType}
                                    onChange={(event) => setQuestionType(event.target.value)}
                                >
                                    <MenuItem value="">Any type</MenuItem>
                                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                                        <MenuItem key={value} value={value}>
                                            {label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>

                        {loadError && (
                            <Alert
                                severity="error"
                                sx={{ mx: 2, mb: 2 }}
                                action={
                                    <Button color="inherit" size="small" onClick={() => loadEntries(page)}>
                                        Retry
                                    </Button>
                                }
                            >
                                {loadError}
                            </Alert>
                        )}
                        {loading && (
                            <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
                                <CircularProgress size={24} aria-label="Loading questions" />
                            </Box>
                        )}
                        {!loading && !loadError && entries.length === 0 && (
                            <Box sx={{ px: 2, pb: 4 }}>
                                <Typography color="text.secondary">
                                    {debouncedSearch || questionType
                                        ? "No questions match your filters."
                                        : "This bank has no questions yet."}
                                </Typography>
                            </Box>
                        )}
                        {!loading && entries.length > 0 && (
                            <List disablePadding>
                                {entries.map((entry) => (
                                    <Box
                                        key={entry.id}
                                        sx={{
                                            px: 2,
                                            py: 1.5,
                                            borderTop: 1,
                                            borderColor: "divider",
                                            display: "flex",
                                            gap: 2,
                                            alignItems: "flex-start",
                                        }}
                                    >
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                                sx={{ overflowWrap: "anywhere" }}
                                            >
                                                {entry.question_data?.text || "Untitled question"}
                                            </Typography>
                                            <Stack
                                                direction="row"
                                                spacing={0.5}
                                                sx={{ mt: 0.75 }}
                                                flexWrap="wrap"
                                                useFlexGap
                                            >
                                                <Chip
                                                    size="small"
                                                    label={TYPE_LABELS[entry.question_type] || entry.question_type}
                                                />
                                                <Chip size="small" variant="outlined" label={entry.difficulty} />
                                                {(entry.tags || []).map((tag) => (
                                                    <Chip key={tag} size="small" variant="outlined" label={tag} />
                                                ))}
                                                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                                                    Used {entry.usage_count || 0} time{entry.usage_count === 1 ? "" : "s"} · version{" "}
                                                    {entry.snapshot_version || 1}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                        {entry.can_edit && (
                                            <>
                                                <Tooltip title="Edit question">
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Edit question"
                                                        onClick={() => setEntryEditor({ open: true, entry })}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Move to another bank">
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Move question"
                                                        onClick={() => setMoveTarget({ entry, bankId: "" })}
                                                    >
                                                        <MoveIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                        {entry.can_delete && (
                                            <Tooltip title="Delete question">
                                                <IconButton
                                                    size="small"
                                                    aria-label="Delete question"
                                                    onClick={() => confirmDeleteEntry(entry)}
                                                >
                                                    <DeleteIcon fontSize="small" color="error" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                ))}
                            </List>
                        )}
                        {totalPages > 1 && (
                            <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                                <Pagination
                                    count={totalPages}
                                    page={page}
                                    onChange={(_, value) => loadEntries(value)}
                                />
                            </Box>
                        )}
                    </>
                )}
            </Paper>

            <BankFormDialog
                open={bankForm.open}
                bank={bankForm.bank}
                programs={programs}
                canCreateShared={canCreateShared}
                defaultScope={defaultScope}
                onClose={() => setBankForm({ open: false, bank: null })}
                onSaved={handleBankSaved}
            />
            <EntryEditorDialog
                open={entryEditor.open}
                entry={entryEditor.entry}
                bank={selectedBank}
                categories={categories}
                onClose={() => setEntryEditor({ open: false, entry: null })}
                onSaved={() => {
                    if (!entryEditor.entry) adjustCount(selectedBankId, 1);
                    setNotice({ severity: "success", message: "Question saved" });
                    loadEntries(entryEditor.entry ? page : 1);
                }}
            />
            <Dialog
                open={Boolean(moveTarget.entry)}
                onClose={() => setMoveTarget({ entry: null, bankId: "" })}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Move question</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 1 }}>
                        <InputLabel id="move-bank-label">Move to</InputLabel>
                        <Select
                            labelId="move-bank-label"
                            label="Move to"
                            value={moveTarget.bankId}
                            onChange={(event) =>
                                setMoveTarget((current) => ({ ...current, bankId: event.target.value }))
                            }
                        >
                            {editableBanks
                                .filter((bank) => bank.id !== selectedBankId)
                                .map((bank) => (
                                    <MenuItem key={bank.id} value={bank.id}>
                                        {bank.name}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMoveTarget({ entry: null, bankId: "" })}>Cancel</Button>
                    <Button variant="contained" disabled={!moveTarget.bankId} onClick={moveEntry}>
                        Move
                    </Button>
                </DialogActions>
            </Dialog>
            <ConfirmDialog
                open={Boolean(confirm)}
                title={confirm?.title}
                message={confirm?.message}
                confirmLabel="Delete"
                confirmColor="error"
                onClose={() => setConfirm(null)}
                onConfirm={async () => {
                    const action = confirm?.onConfirm;
                    setConfirm(null);
                    await action?.();
                }}
            />
            <Snackbar
                open={Boolean(notice)}
                autoHideDuration={5000}
                onClose={() => setNotice(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                {notice ? (
                    <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ width: "100%" }}>
                        {notice.message}
                    </Alert>
                ) : (
                    <span />
                )}
            </Snackbar>
        </Stack>
    );
}
