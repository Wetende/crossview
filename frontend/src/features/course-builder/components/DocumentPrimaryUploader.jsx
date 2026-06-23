import { useRef, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    Description as DocIcon,
    PictureAsPdf as PdfIcon,
    Slideshow as SlideIcon,
} from "@mui/icons-material";
import ConfirmDialog from "@/components/ConfirmDialog";
import { getUserErrorMessage } from "@/utils/userMessages";

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.pptx";

const formatBytes = (bytes) => {
    const safeBytes = Number(bytes || 0);
    if (safeBytes <= 0) return "0 B";
    if (safeBytes < 1024) return `${safeBytes} B`;
    if (safeBytes < 1024 * 1024) return `${(safeBytes / 1024).toFixed(1)} KB`;
    return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileIconForExt = (ext) => {
    const normalized = (ext || "").toLowerCase();
    if (normalized === "pdf") {
        return <PdfIcon color="error" />;
    }
    if (normalized === "pptx") {
        return <SlideIcon color="info" />;
    }
    return <DocIcon color="primary" />;
};

export default function DocumentPrimaryUploader({
    nodeId,
    documentData,
    onDocumentChange,
    onError,
}) {
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [deleting, setDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [error, setError] = useState("");

    const handleUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        setUploadProgress(0);
        setError("");
        onError?.("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post(
                `/instructor/nodes/${nodeId}/document/upload/`,
                formData,
                {
                    onUploadProgress: (progressEvent) => {
                        const total = progressEvent.total || 1;
                        const pct = Math.round((progressEvent.loaded * 100) / total);
                        setUploadProgress(pct);
                    },
                },
            );
            onDocumentChange?.(response.data.document || null);
            setUploadProgress(100);
        } catch (err) {
            const message = getUserErrorMessage(
                err,
                "Document upload failed. Please try again.",
            );
            setError(message);
            onError?.(message);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        const dropped = event.dataTransfer.files?.[0];
        if (dropped) {
            handleUpload(dropped);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        setError("");
        onError?.("");
        try {
            await axios.post(`/instructor/nodes/${nodeId}/document/delete/`, {});
            onDocumentChange?.(null);
        } catch (err) {
            const message = getUserErrorMessage(
                err,
                "Could not delete this document. Please try again.",
            );
            setError(message);
            onError?.(message);
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const ext = documentData?.original_ext || "";
    const conversionStatus = (documentData?.conversion_status || "").toLowerCase();

    return (
        <Box>
            <Paper
                variant="outlined"
                onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                sx={{
                    p: 3,
                    borderStyle: "dashed",
                    borderColor: isDragging ? "primary.main" : "divider",
                    bgcolor: isDragging ? "primary.lighter" : "background.default",
                    transition: "all 0.2s",
                }}
            >
                <Stack spacing={2}>
                    {documentData ? (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                p: 1.5,
                                borderRadius: 1,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "background.paper",
                            }}
                        >
                            {fileIconForExt(ext)}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" noWrap>
                                    {documentData.original_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {formatBytes(documentData.size)}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                    <Chip
                                        size="small"
                                        label={`${ext.toUpperCase() || "DOC"} ${
                                            documentData.page_count || 0
                                        } pages`}
                                    />
                                    <Chip
                                        size="small"
                                        color={
                                            conversionStatus === "ready"
                                                ? "success"
                                                : "warning"
                                        }
                                        label={
                                            conversionStatus === "ready"
                                                ? "Conversion ready"
                                                : "Processing"
                                        }
                                    />
                                </Stack>
                            </Box>
                            <Tooltip title="Remove document">
                                <span>
                                    <IconButton
                                        size="small"
                                        disabled={uploading || deleting}
                                        onClick={() => setDeleteDialogOpen(true)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            Upload one primary document (PDF, DOCX, or PPTX). DOCX/PPTX
                            are automatically converted to tracked PDF.
                        </Typography>
                    )}

                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="contained"
                            startIcon={<UploadIcon />}
                            size="small"
                            disabled={uploading || deleting}
                            onClick={() => inputRef.current?.click()}
                            sx={{ textTransform: "none" }}
                        >
                            {documentData ? "Replace document" : "Upload document"}
                        </Button>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ alignSelf: "center" }}
                        >
                            Allowed: PDF, DOCX, PPTX
                        </Typography>
                    </Stack>

                    <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPTED_EXTENSIONS}
                        hidden
                        onChange={(event) => handleUpload(event.target.files?.[0])}
                    />
                </Stack>
            </Paper>

            {uploading && (
                <Box sx={{ mt: 1 }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="caption" color="text.secondary">
                        Uploading and processing...
                    </Typography>
                </Box>
            )}

            {documentData?.conversion_error && (
                <Alert severity="error" sx={{ mt: 1.5 }}>
                    {documentData.conversion_error}
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 1.5 }}>
                    {error}
                </Alert>
            )}

            <ConfirmDialog
                open={deleteDialogOpen}
                onClose={() => {
                    if (!deleting) {
                        setDeleteDialogOpen(false);
                    }
                }}
                onConfirm={handleDelete}
                title="Delete Primary Document"
                message="Remove this document from the lesson?"
                confirmLabel="Delete"
                confirmColor="error"
                loading={deleting}
            />
        </Box>
    );
}
