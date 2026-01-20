import React, { useState, useEffect, useMemo } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    TextField,
    Select,
    MenuItem,
    FormControl,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Checkbox,
    Button,
    Typography,
    IconButton,
    InputAdornment,
    CircularProgress,
    Chip,
} from "@mui/material";
import {
    Search as SearchIcon,
    Close as CloseIcon,
    Article as ArticleIcon,
    OndemandVideo as VideoIcon,
    VideoCameraFront as ZoomIcon,
    Quiz as QuizIcon,
    Assignment as AssignmentIcon,
} from "@mui/icons-material";

// Helper to get icon by type
const getIconForType = (type, lessonType) => {
    const t = (type || "").toLowerCase();
    const lt = (lessonType || "").toLowerCase();
    if (t === "quiz" || lt === "quiz")
        return <QuizIcon sx={{ color: "warning.main" }} />;
    if (t === "assignment" || lt === "assignment")
        return <AssignmentIcon sx={{ color: "error.main" }} />;
    if (lt === "video") return <VideoIcon sx={{ color: "info.main" }} />;
    if (lt === "live_class")
        return <ZoomIcon sx={{ color: "secondary.main" }} />;
    return <ArticleIcon sx={{ color: "primary.main" }} />;
};

/**
 * SearchMaterialsModal - Search and import existing materials into a section
 * Now wired to backend endpoints for fetching and importing materials.
 */
export default function SearchMaterialsModal({
    open,
    onClose,
    sectionName = "Section",
    sectionId, // Target section ID where materials will be imported
    programId, // Current program ID
    onImportComplete, // Callback after successful import
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedIds, setSelectedIds] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState(null);

    // Fetch materials from backend when modal opens or search changes
    useEffect(() => {
        if (!open || !programId) return;

        const fetchMaterials = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                if (searchQuery) params.append("q", searchQuery);
                if (typeFilter && typeFilter !== "all")
                    params.append("type", typeFilter);

                // Use axios with automatic CSRF handling
                const response = await axios.get(
                    `/instructor/programs/${programId}/materials/search/?${params}`,
                );
                const data = response.data;

                if (data.error) {
                    setError(data.error);
                    setMaterials([]);
                } else {
                    setMaterials(data.materials || []);
                }
            } catch (err) {
                setError(
                    err.response?.data?.error || "Failed to fetch materials",
                );
                setMaterials([]);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timer = setTimeout(fetchMaterials, 300);
        return () => clearTimeout(timer);
    }, [open, programId, searchQuery, typeFilter]);

    // Filter materials client-side for instant feedback
    const filteredMaterials = useMemo(() => {
        return materials.filter((material) => {
            const matchesSearch =
                !searchQuery ||
                material.title
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());

            const materialType = (
                material.type ||
                material.node_type ||
                ""
            ).toLowerCase();
            const lessonType = material.properties?.lesson_type || "";

            let matchesType = typeFilter === "all";
            if (typeFilter === "lesson") {
                matchesType =
                    materialType === "lesson" &&
                    !["quiz", "assignment"].includes(lessonType);
            } else if (typeFilter === "quiz") {
                matchesType = materialType === "quiz" || lessonType === "quiz";
            } else if (typeFilter === "assignment") {
                matchesType =
                    materialType === "assignment" ||
                    lessonType === "assignment";
            }

            return matchesSearch && matchesType;
        });
    }, [materials, searchQuery, typeFilter]);

    const toggleSelection = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    };

    const handleImport = () => {
        if (selectedIds.length === 0 || !sectionId) return;

        setImporting(true);
        setError(null);

        // Use Inertia router.post() - backend will redirect back with flash message
        router.post(
            `/instructor/programs/${programId}/materials/import/`,
            {
                source_node_ids: selectedIds,
                target_section_id: sectionId,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    handleClose();
                    if (onImportComplete) {
                        onImportComplete(selectedIds.length);
                    }
                },
                onError: (errors) => {
                    setError(
                        Object.values(errors).flat().join(", ") ||
                            "Failed to import materials",
                    );
                    setImporting(false);
                },
                onFinish: () => {
                    setImporting(false);
                },
            },
        );
    };

    const handleClose = () => {
        setSearchQuery("");
        setTypeFilter("all");
        setSelectedIds([]);
        setMaterials([]);
        setError(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pb: 1,
                }}
            >
                <Typography variant="h6">Search Materials</Typography>
                <IconButton size="small" onClick={handleClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {/* Search and Filter Row */}
                <Box sx={{ display: "flex", gap: 2, mb: 2, mt: 1 }}>
                    <TextField
                        placeholder="Search materials from other programs"
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    {loading ? (
                                        <CircularProgress size={20} />
                                    ) : (
                                        <SearchIcon color="action" />
                                    )}
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            displayEmpty
                        >
                            <MenuItem value="all">All Types</MenuItem>
                            <MenuItem value="lesson">Lesson</MenuItem>
                            <MenuItem value="quiz">Quiz</MenuItem>
                            <MenuItem value="assignment">Assignment</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Error Message */}
                {error && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                {/* Materials List */}
                <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ mb: 1, display: "block" }}
                >
                    AVAILABLE MATERIALS
                </Typography>

                {loading && materials.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: "center" }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : filteredMaterials.length === 0 ? (
                    <Box
                        sx={{
                            py: 4,
                            textAlign: "center",
                            color: "text.secondary",
                        }}
                    >
                        <Typography>
                            {materials.length === 0
                                ? "No materials found in other programs"
                                : "No materials match your search"}
                        </Typography>
                    </Box>
                ) : (
                    <List
                        disablePadding
                        sx={{ maxHeight: 300, overflowY: "auto" }}
                    >
                        {filteredMaterials.map((material) => {
                            const isSelected = selectedIds.includes(
                                material.id,
                            );
                            const materialType =
                                material.type || material.node_type || "Lesson";
                            const lessonType =
                                material.properties?.lesson_type || "";

                            return (
                                <ListItem key={material.id} disablePadding>
                                    <ListItemButton
                                        onClick={() =>
                                            toggleSelection(material.id)
                                        }
                                        sx={{ borderRadius: 1 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            {getIconForType(
                                                materialType,
                                                lessonType,
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={material.title}
                                            secondary={
                                                <Chip
                                                    label={
                                                        material.program_name
                                                    }
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: "0.7rem",
                                                    }}
                                                />
                                            }
                                            primaryTypographyProps={{
                                                variant: "body2",
                                            }}
                                        />
                                        <Checkbox
                                            checked={isSelected}
                                            tabIndex={-1}
                                            disableRipple
                                        />
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClose}
                    fullWidth
                    disabled={importing}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleImport}
                    disabled={selectedIds.length === 0 || importing}
                    fullWidth
                    sx={{
                        bgcolor: "#90caf9",
                        "&:hover": { bgcolor: "#64b5f6" },
                    }}
                >
                    {importing ? (
                        <CircularProgress size={24} color="inherit" />
                    ) : (
                        `Import ${selectedIds.length} to ${sectionName}`
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
