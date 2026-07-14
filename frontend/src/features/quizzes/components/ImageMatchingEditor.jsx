import { useRef, useState } from "react";
import axios from "axios";
import {
    Stack,
    TextField,
    IconButton,
    Button,
    Typography,
    Box,
    Paper,
    InputAdornment,
} from "@mui/material";
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Add as AddIcon,
    Image as ImageIcon,
    Close as CloseIcon,
} from "@mui/icons-material";
import AnswerExplanationPopover from "./AnswerExplanationPopover";

/**
 * ImageMatchingEditor - STM LMS style image matching question editor
 * Two-column layout: Question (image + text) | Answer (image + text)
 * With drag & drop image upload and answer explanation
 */
export default function ImageMatchingEditor({ nodeId, pairs = [], onChange }) {
    const [editingField, setEditingField] = useState(null);
    const [explanationAnchor, setExplanationAnchor] = useState(null);
    const [activeExplanationIndex, setActiveExplanationIndex] = useState(null);
    const fileInputRefs = useRef({});
    const [imageState, setImageState] = useState({});

    // Ensure we have at least 2 default pairs
    const safePairs =
        pairs.length >= 2
            ? pairs
            : [
                  {
                      question_image: null,
                      question_text: "",
                      answer_image: null,
                      answer_text: "",
                      explanation: "",
                      position: 0,
                  },
                  {
                      question_image: null,
                      question_text: "",
                      answer_image: null,
                      answer_text: "",
                      explanation: "",
                      position: 1,
                  },
              ];

    const handleAddPair = () => {
        const newPairs = [
            ...safePairs,
            {
                question_image: null,
                question_text: "",
                answer_image: null,
                answer_text: "",
                explanation: "",
                position: safePairs.length,
            },
        ];
        onChange(newPairs);
    };

    const handleUpdate = (index, field, value) => {
        const newPairs = [...safePairs];
        newPairs[index] = { ...newPairs[index], [field]: value };
        onChange(newPairs);
    };

    const imageKey = (index, field) => `${index}:${field}`;

    const getPersistedUrl = (pair, field) => {
        const value = pair?.[field];
        if (!value) return "";
        if (typeof value === "string") return value;
        if (typeof value === "object") return value.url || value.preview || "";
        return "";
    };

    const getPreview = (pair, index, field) => {
        const persisted = getPersistedUrl(pair, field);
        const state = imageState[imageKey(index, field)];
        return {
            preview: persisted || state?.preview || "",
            uploading: Boolean(state?.uploading),
            error: state?.error || "",
        };
    };

    const handleRemove = (index) => {
        if (safePairs.length <= 2) return;
        const newPairs = safePairs
            .filter((_, i) => i !== index)
            .map((p, i) => ({ ...p, position: i }));
        onChange(newPairs);
        // Upload previews/errors are index-based; clear to avoid mismatches after reindex.
        setImageState({});
    };

    const uploadImage = async (file) => {
        if (!nodeId) {
            throw new Error("Missing nodeId for upload");
        }

        const formData = new FormData();
        formData.append("file", file);
        const res = await axios.post(
            `/instructor/nodes/${nodeId}/quiz/images/upload/`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
        );
        return res.data?.image?.url;
    };

    const handleImageUpload = async (index, field, event) => {
        const file = event.target.files?.[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            setImageState((prev) => ({
                ...prev,
                [imageKey(index, field)]: {
                    preview,
                    name: file.name,
                    uploading: true,
                    error: "",
                },
            }));
            // Persist only a clean URL string ("" while uploading).
            handleUpdate(index, field, "");
            try {
                const url = await uploadImage(file);
                handleUpdate(index, field, url || "");
                setImageState((prev) => ({
                    ...prev,
                    [imageKey(index, field)]: {
                        preview: url || preview,
                        name: file.name,
                        uploading: false,
                        error: "",
                    },
                }));
            } catch (e) {
                handleUpdate(index, field, "");
                setImageState((prev) => ({
                    ...prev,
                    [imageKey(index, field)]: {
                        preview,
                        name: file.name,
                        uploading: false,
                        error: String(e?.message || e),
                    },
                }));
            }
        }
    };

    const handleImageDrop = async (index, field, event) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            const preview = URL.createObjectURL(file);
            setImageState((prev) => ({
                ...prev,
                [imageKey(index, field)]: {
                    preview,
                    name: file.name,
                    uploading: true,
                    error: "",
                },
            }));
            handleUpdate(index, field, "");
            try {
                const url = await uploadImage(file);
                handleUpdate(index, field, url || "");
                setImageState((prev) => ({
                    ...prev,
                    [imageKey(index, field)]: {
                        preview: url || preview,
                        name: file.name,
                        uploading: false,
                        error: "",
                    },
                }));
            } catch (e) {
                handleUpdate(index, field, "");
                setImageState((prev) => ({
                    ...prev,
                    [imageKey(index, field)]: {
                        preview,
                        name: file.name,
                        uploading: false,
                        error: String(e?.message || e),
                    },
                }));
            }
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleOpenExplanation = (event, index) => {
        setExplanationAnchor(event.currentTarget);
        setActiveExplanationIndex(index);
    };

    const handleCloseExplanation = () => {
        setExplanationAnchor(null);
        setActiveExplanationIndex(null);
    };

    const triggerFileInput = (index, field) => {
        const key = `${index}-${field}`;
        if (fileInputRefs.current[key]) {
            fileInputRefs.current[key].click();
        }
    };

    const ImageUploadBox = ({ index, field, pair }) => {
        const { preview, uploading, error } = getPreview(pair, index, field);
        return (
            <Box
                onDrop={(e) => handleImageDrop(index, field, e)}
                onDragOver={handleDragOver}
                sx={{
                    border: "1px dashed",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 3,
                    textAlign: "center",
                    bgcolor: "background.paper",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "primary.50",
                    },
                    minHeight: 120,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                onClick={() => triggerFileInput(index, field)}
            >
                <input
                    type="file"
                    accept="image/*"
                    hidden
                    ref={(el) =>
                        (fileInputRefs.current[`${index}-${field}`] = el)
                    }
                    onChange={(e) => handleImageUpload(index, field, e)}
                />

                {preview ? (
                    <Box sx={{ position: "relative", width: "100%" }}>
                        <img
                            loading="lazy" src={preview}
                            alt="Uploaded"
                            style={{
                                maxWidth: "100%",
                                maxHeight: 100,
                                objectFit: "contain",
                                borderRadius: 4,
                            }}
                        />
                        <IconButton
                            size="small"
                            sx={{
                                position: "absolute",
                                top: -8,
                                right: -8,
                                bgcolor: "error.main",
                                color: "white",
                                "&:hover": { bgcolor: "error.dark" },
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleUpdate(index, field, "");
                                setImageState((prev) => {
                                    const next = { ...prev };
                                    delete next[imageKey(index, field)];
                                    return next;
                                });
                            }}
                        >
                            <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        {uploading && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 1 }}
                            >
                                Uploading...
                            </Typography>
                        )}
                        {error && (
                            <Typography
                                variant="caption"
                                color="error"
                                sx={{ display: "block", mt: 1 }}
                            >
                                Upload failed: {error}
                            </Typography>
                        )}
                    </Box>
                ) : (
                    <>
                        <ImageIcon
                            sx={{ fontSize: 40, color: "text.disabled", mb: 1 }}
                        />
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                            Drag and drop an image or{" "}
                            <Typography
                                component="span"
                                color="primary.main"
                                sx={{ cursor: "pointer" }}
                            >
                                upload it from your computer
                            </Typography>
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            sx={{ textTransform: "none" }}
                            onClick={(e) => {
                                e.stopPropagation();
                                triggerFileInput(index, field);
                            }}
                        >
                            Upload an image
                        </Button>
                    </>
                )}
            </Box>
        );
    };

    return (
        <Box>
            {/* Header */}
            <Typography
                variant="subtitle1"
                fontWeight={500}
                sx={{ mb: 2, color: "text.secondary" }}
            >
                Questions & Answers
            </Typography>

            {/* Pairs List */}
            <Stack spacing={3}>
                {safePairs.map((pair, index) => (
                    <Paper
                        key={index}
                        variant="outlined"
                        sx={{
                            display: "flex",
                            borderColor: "divider",
                            overflow: "hidden",
                        }}
                    >
                        {/* Question Column */}
                        <Box
                            sx={{
                                flex: 1,
                                p: 2,
                                bgcolor: "grey.50",
                                borderRight: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mb: 1 }}
                            >
                                Question
                            </Typography>

                            {/* Image Upload */}
                            <ImageUploadBox
                                index={index}
                                field="question_image"
                                pair={pair}
                            />

                            {/* Question Text */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mt: 2,
                                }}
                            >
                                <TextField
                                    size="small"
                                    fullWidth
                                    variant="standard"
                                    placeholder="Enter your question"
                                    value={pair.question_text || ""}
                                    onChange={(e) =>
                                        handleUpdate(
                                            index,
                                            "question_text",
                                            e.target.value,
                                        )
                                    }
                                    onFocus={() =>
                                        setEditingField(`${index}-question`)
                                    }
                                    onBlur={() => setEditingField(null)}
                                    InputProps={{
                                        disableUnderline:
                                            editingField !==
                                            `${index}-question`,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <EditIcon
                                                    sx={{
                                                        fontSize: 16,
                                                        color: "text.disabled",
                                                    }}
                                                />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            fontWeight: 500,
                                            "& input": {
                                                color: pair.question_text
                                                    ? "text.primary"
                                                    : "text.secondary",
                                            },
                                        },
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Answer Column */}
                        <Box sx={{ flex: 1, p: 2 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    mb: 1,
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Answer
                                </Typography>
                            </Box>

                            {/* Image Upload */}
                            <ImageUploadBox
                                index={index}
                                field="answer_image"
                                pair={pair}
                            />

                            {/* Answer Text and Actions */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mt: 2,
                                }}
                            >
                                <TextField
                                    size="small"
                                    fullWidth
                                    variant="standard"
                                    placeholder="Enter matching answer"
                                    value={pair.answer_text || ""}
                                    onChange={(e) =>
                                        handleUpdate(
                                            index,
                                            "answer_text",
                                            e.target.value,
                                        )
                                    }
                                    onFocus={() =>
                                        setEditingField(`${index}-answer`)
                                    }
                                    onBlur={() => setEditingField(null)}
                                    InputProps={{
                                        disableUnderline:
                                            editingField !== `${index}-answer`,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <EditIcon
                                                    sx={{
                                                        fontSize: 16,
                                                        color: "text.disabled",
                                                    }}
                                                />
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            fontWeight: 500,
                                            "& input": {
                                                color: pair.answer_text
                                                    ? "text.primary"
                                                    : "text.secondary",
                                            },
                                        },
                                    }}
                                />

                                {/* Add Explanation Button */}
                                <Button
                                    size="small"
                                    startIcon={
                                        <AddIcon sx={{ fontSize: 16 }} />
                                    }
                                    onClick={(e) =>
                                        handleOpenExplanation(e, index)
                                    }
                                    sx={{
                                        textTransform: "none",
                                        whiteSpace: "nowrap",
                                        color: "primary.main",
                                        fontSize: "0.75rem",
                                    }}
                                >
                                    Add explanation
                                </Button>

                                {/* Delete Button */}
                                {safePairs.length > 2 && (
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemove(index)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>
                    </Paper>
                ))}
            </Stack>

            {/* Add New Answer Button */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddPair}
                    sx={{
                        color: "primary.main",
                        textTransform: "none",
                        fontWeight: 500,
                        "&:hover": {
                            bgcolor: "primary.50",
                        },
                    }}
                >
                    Add new answer
                </Button>
            </Box>

            <AnswerExplanationPopover
                open={Boolean(explanationAnchor)}
                anchorEl={explanationAnchor}
                onClose={handleCloseExplanation}
                value={
                    activeExplanationIndex !== null
                        ? safePairs[activeExplanationIndex]?.explanation || ""
                        : ""
                }
                onChange={(value) => {
                    if (activeExplanationIndex !== null) {
                        handleUpdate(
                            activeExplanationIndex,
                            "explanation",
                            value,
                        );
                    }
                }}
            />
        </Box>
    );
}
