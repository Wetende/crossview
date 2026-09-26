import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Drawer,
    Alert,
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    Button,
    CircularProgress,
    IconButton,
    Stack,
    Chip,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    InputAdornment,
} from "@mui/material";
import {
    Close as CloseIcon,
    Search as SearchIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as UncheckedIcon,
} from "@mui/icons-material";
import BankScopeChip from "@/features/question-library/components/BankScopeChip";
import {
    errorMessage,
    listEntries,
} from "@/features/question-library/api/questionLibraryApi";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

const QUESTION_TYPE_LABELS = {
    mcq: "SINGLE CHOICE",
    mcq_multi: "MULTIPLE CHOICE",
    true_false: "TRUE-FALSE",
    matching: "MATCHING",
    image_matching: "IMAGE MATCH",
    short_answer: "KEYWORDS",
    fill_blank: "FILL IN THE GAP",
    ordering: "ORDERING",
    question_bank: "QUESTION BANK",
};

const QUESTION_TYPE_COLORS = {
    mcq: "#1976d2",
    mcq_multi: "#7b1fa2",
    true_false: "#388e3c",
    matching: "#0288d1",
    image_matching: "#00838f",
    short_answer: "#f57c00",
    fill_blank: "#5d4037",
    ordering: "#455a64",
    question_bank: "#2e7d32",
};

const SOURCE_OPTIONS = [
    ["", "All sources"],
    ["course", "This course"],
    ["instructor", "My library"],
    ["institution", "Shared"],
];

/**
 * Questions Library Drawer - MasterStudy LMS-inspired design
 *
 * Searches every bank the instructor can use in this course: the course's
 * own banks, their personal library and shared banks.
 */
export default function QuestionsLibraryDrawer({
    open,
    onClose,
    onAddQuestions,
    existingQuestionIds = [],
    programId,
    categories = [],
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedDifficulty, setSelectedDifficulty] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [selectedSource, setSelectedSource] = useState("");
    const [tagQuery, setTagQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [debouncedTag, setDebouncedTag] = useState("");

    const [entries, setEntries] = useState([]);
    const [pageInfo, setPageInfo] = useState({ page: 0, totalPages: 0 });
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const requestId = useRef(0);

    // Selected questions for adding
    const [selectedQuestions, setSelectedQuestions] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery.trim());
            setDebouncedTag(tagQuery.trim());
        }, SEARCH_DELAY_MS);
        return () => clearTimeout(timer);
    }, [searchQuery, tagQuery]);

    const filters = useMemo(
        () => ({
            program: programId,
            query: debouncedSearch,
            category: selectedCategory,
            difficulty: selectedDifficulty,
            question_type: selectedType,
            scope: selectedSource,
            tags: debouncedTag,
            page_size: PAGE_SIZE,
        }),
        [
            programId,
            debouncedSearch,
            selectedCategory,
            selectedDifficulty,
            selectedType,
            selectedSource,
            debouncedTag,
        ],
    );

    const loadPage = useCallback(
        async (page) => {
            const current = ++requestId.current;
            setLoading(true);
            setLoadError("");
            try {
                const body = await listEntries({ ...filters, page });
                if (current !== requestId.current) return;
                setEntries((previous) =>
                    page === 1 ? body.results : [...previous, ...body.results],
                );
                setPageInfo({ page: body.page, totalPages: body.totalPages });
            } catch (error) {
                if (current !== requestId.current) return;
                setLoadError(
                    errorMessage(
                        error,
                        "Could not load the question library. Try again.",
                    ),
                );
            } finally {
                if (current === requestId.current) setLoading(false);
            }
        },
        [filters],
    );

    useEffect(() => {
        if (open) loadPage(1);
    }, [open, loadPage]);

    const hasFilters = Boolean(
        debouncedSearch ||
            selectedCategory ||
            selectedDifficulty ||
            selectedType ||
            selectedSource ||
            debouncedTag,
    );
    const hasMore = pageInfo.page > 0 && pageInfo.page < pageInfo.totalPages;

    const handleToggleQuestion = (questionId) => {
        setSelectedQuestions((prev) =>
            prev.includes(questionId)
                ? prev.filter((id) => id !== questionId)
                : [...prev, questionId],
        );
    };

    const handleAddSelected = () => {
        const questionsToAdd = entries.filter((q) =>
            selectedQuestions.includes(q.id),
        );
        onAddQuestions(questionsToAdd);
        setSelectedQuestions([]);
        onClose();
    };

    const handleClose = () => {
        setSelectedQuestions([]);
        setSearchQuery("");
        setSelectedCategory("");
        setSelectedDifficulty("");
        setSelectedType("");
        setSelectedSource("");
        setTagQuery("");
        onClose();
    };

    const isQuestionAlreadyAdded = (entryId) => {
        return existingQuestionIds.includes(entryId);
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={handleClose}
            // The course builder raises its app bar above drawers; keep this
            // drawer above it so its header stays visible.
            sx={{ zIndex: (theme) => theme.zIndex.modal }}
            slotProps={{
                paper: {
                    sx: { width: { xs: "100%", sm: 380 } },
                },
            }}
        >
            <Box
                sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        p: 2,
                        borderBottom: 1,
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Questions Library
                    </Typography>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Filters */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                    <Stack spacing={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="library-source-label">Source</InputLabel>
                            <Select
                                labelId="library-source-label"
                                value={selectedSource}
                                label="Source"
                                onChange={(e) => setSelectedSource(e.target.value)}
                            >
                                {SOURCE_OPTIONS.map(([value, label]) => (
                                    <MenuItem key={value || "all"} value={value}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Category</InputLabel>
                            <Select
                                value={selectedCategory}
                                label="Select Category"
                                onChange={(e) =>
                                    setSelectedCategory(e.target.value)
                                }
                            >
                                <MenuItem value="">
                                    <em>All Categories</em>
                                </MenuItem>
                                {categories.map((cat) => (
                                    <MenuItem key={cat} value={cat}>
                                        {cat}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search questions"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <SearchIcon
                                                fontSize="small"
                                                color="action"
                                            />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <Stack direction="row" spacing={1}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Difficulty</InputLabel>
                                <Select
                                    value={selectedDifficulty}
                                    label="Difficulty"
                                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                                >
                                    <MenuItem value="">Any</MenuItem>
                                    <MenuItem value="easy">Easy</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="hard">Hard</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth size="small">
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={selectedType}
                                    label="Type"
                                    onChange={(e) => setSelectedType(e.target.value)}
                                >
                                    <MenuItem value="">Any</MenuItem>
                                    {Object.entries(QUESTION_TYPE_LABELS)
                                        .filter(([value]) => value !== "question_bank")
                                        .map(([value, label]) => (
                                            <MenuItem key={value} value={value}>{label}</MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                        </Stack>
                        <TextField
                            fullWidth
                            size="small"
                            label="Required tag"
                            value={tagQuery}
                            onChange={(e) => setTagQuery(e.target.value)}
                        />
                    </Stack>
                </Box>

                {/* Questions List */}
                <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 0 }}>
                    {loadError && (
                        <Alert
                            severity="error"
                            sx={{ m: 2 }}
                            action={
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={() => loadPage(1)}
                                >
                                    Retry
                                </Button>
                            }
                        >
                            {loadError}
                        </Alert>
                    )}
                    {!loadError && !loading && entries.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: "center" }}>
                            <Typography color="textSecondary">
                                {hasFilters
                                    ? "No questions match your filters."
                                    : "No questions in library yet."}
                            </Typography>
                            <Typography
                                variant="body2"
                                color="textSecondary"
                                sx={{ mt: 1 }}
                            >
                                Save questions from quizzes to reuse them here.
                            </Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {entries.map((entry) => {
                                const isSelected = selectedQuestions.includes(
                                    entry.id,
                                );
                                const isAlreadyAdded = isQuestionAlreadyAdded(
                                    entry.id,
                                );
                                const typeLabel =
                                    QUESTION_TYPE_LABELS[entry.question_type] ||
                                    entry.question_type?.toUpperCase();
                                const typeColor =
                                    QUESTION_TYPE_COLORS[entry.question_type] ||
                                    "#757575";

                                return (
                                    <ListItem
                                        key={entry.id}
                                        disablePadding
                                        sx={{
                                            borderBottom: "1px solid",
                                            borderColor: "divider",
                                            opacity: isAlreadyAdded ? 0.5 : 1,
                                            bgcolor: isSelected
                                                ? "action.selected"
                                                : "transparent",
                                        }}
                                    >
                                        <ListItemButton
                                            onClick={() =>
                                                !isAlreadyAdded &&
                                                handleToggleQuestion(entry.id)
                                            }
                                            disabled={isAlreadyAdded}
                                            sx={{ py: 1.5, px: 2 }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            display:
                                                                "-webkit-box",
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient:
                                                                "vertical",
                                                            fontWeight: 500,
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        {entry.question_data
                                                            ?.text ||
                                                            "Untitled Question"}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Stack spacing={0.5}>
                                                        <Stack
                                                            direction="row"
                                                            spacing={0.5}
                                                            useFlexGap
                                                            sx={{ flexWrap: "wrap" }}
                                                        >
                                                            <Chip
                                                                label={typeLabel}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor:
                                                                        typeColor,
                                                                    color: "white",
                                                                    fontSize:
                                                                        "0.65rem",
                                                                    fontWeight: 600,
                                                                    height: 20,
                                                                    width: "fit-content",
                                                                }}
                                                            />
                                                            {entry.bank_scope && (
                                                                <BankScopeChip
                                                                    scope={entry.bank_scope}
                                                                />
                                                            )}
                                                        </Stack>
                                                        <Typography
                                                            variant="caption"
                                                            color="textSecondary"
                                                        >
                                                            {[
                                                                entry.bank_name,
                                                                entry.category,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(" · ") ||
                                                                "Uncategorised"}
                                                        </Typography>
                                                    </Stack>
                                                }
                                                slotProps={{
                                                    secondary: { component: "div" },
                                                }}
                                            />
                                            <Checkbox
                                                checked={isSelected}
                                                disabled={isAlreadyAdded}
                                                icon={<UncheckedIcon />}
                                                checkedIcon={
                                                    <CheckCircleIcon color="primary" />
                                                }
                                                sx={{ ml: 1 }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                    {loading && (
                        <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                            <CircularProgress size={24} aria-label="Loading questions" />
                        </Box>
                    )}
                    {hasMore && !loading && (
                        <Box sx={{ p: 2, textAlign: "center" }}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => loadPage(pageInfo.page + 1)}
                            >
                                Load more
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* Footer */}
                <Box
                    sx={{
                        p: 2,
                        borderTop: 1,
                        borderColor: "divider",
                        bgcolor: "background.paper",
                    }}
                >
                    <Button
                        fullWidth
                        variant="contained"
                        disabled={selectedQuestions.length === 0}
                        onClick={handleAddSelected}
                        sx={{ textTransform: "none" }}
                    >
                        Add questions
                        {selectedQuestions.length > 0
                            ? ` (${selectedQuestions.length})`
                            : ""}
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}
