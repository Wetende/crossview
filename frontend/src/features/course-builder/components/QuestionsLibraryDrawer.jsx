import { useMemo, useState } from "react";
import {
    Drawer,
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    Button,
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

const QUESTION_TYPE_LABELS = {
    mcq: "SINGLE CHOICE",
    mcq_multi: "MULTIPLE CHOICE",
    true_false: "TRUE-FALSE",
    matching: "MATCHING",
    image_match: "IMAGE MATCH",
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
    image_match: "#00838f",
    short_answer: "#f57c00",
    fill_blank: "#5d4037",
    ordering: "#455a64",
    question_bank: "#2e7d32",
};

/**
 * Questions Library Drawer - MasterStudy LMS-inspired design
 *
 * Data is passed via props from Django view (Inertia props), no API fetching required.
 * Filtering is done client-side on preloaded data.
 */
export default function QuestionsLibraryDrawer({
    open,
    onClose,
    onAddQuestions,
    existingQuestionIds = [],
    // Inertia props - passed from Django view
    preloadedQuestions = [],
    preloadedCategories = [],
}) {
    // Filters (client-side only)
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    // Selected questions for adding
    const [selectedQuestions, setSelectedQuestions] = useState([]);

    // Extract unique categories from preloaded data
    const categories = useMemo(() => {
        if (preloadedCategories.length > 0) return preloadedCategories;
        const cats = new Set(
            preloadedQuestions.map((q) => q.category).filter(Boolean),
        );
        return Array.from(cats);
    }, [preloadedQuestions, preloadedCategories]);

    // Client-side filtering of preloaded questions
    const filteredQuestions = useMemo(() => {
        return preloadedQuestions.filter((entry) => {
            // Filter by category
            if (selectedCategory && entry.category !== selectedCategory)
                return false;

            // Filter by search query
            if (searchQuery) {
                const text = (entry.question_data?.text || "").toLowerCase();
                if (!text.includes(searchQuery.toLowerCase())) return false;
            }

            return true;
        });
    }, [preloadedQuestions, searchQuery, selectedCategory]);

    const handleToggleQuestion = (questionId) => {
        setSelectedQuestions((prev) =>
            prev.includes(questionId)
                ? prev.filter((id) => id !== questionId)
                : [...prev, questionId],
        );
    };

    const handleAddSelected = () => {
        const questionsToAdd = filteredQuestions.filter((q) =>
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
            PaperProps={{
                sx: { width: { xs: "100%", sm: 380 } },
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
                    <Typography variant="h6" fontWeight={600}>
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
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <SearchIcon
                                            fontSize="small"
                                            color="action"
                                        />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Stack>
                </Box>

                {/* Questions List */}
                <Box sx={{ flex: 1, overflow: "auto", p: 0 }}>
                    {filteredQuestions.length === 0 ? (
                        <Box sx={{ p: 4, textAlign: "center" }}>
                            <Typography color="text.secondary">
                                {preloadedQuestions.length === 0
                                    ? "No questions in library yet."
                                    : "No questions match your filters."}
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                Save questions from quizzes to reuse them here.
                            </Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {filteredQuestions.map((entry) => {
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
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            {entry.category ||
                                                                "Demo Question"}
                                                        </Typography>
                                                    </Stack>
                                                }
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
