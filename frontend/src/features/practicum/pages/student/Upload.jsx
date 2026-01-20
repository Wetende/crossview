/**
 * Practicum Upload Page
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import { useState, useCallback } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    Alert,
    Button,
    LinearProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";
import {
    CloudUpload as UploadIcon,
    CheckCircle as CheckIcon,
    Description as FileIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import DashboardLayout from "@/layouts/DashboardLayout";

const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] },
};

function StatusChip({ status }) {
    const colorMap = {
        pending: "warning",
        approved: "success",
        revision_required: "info",
        rejected: "error",
    };

    const labelMap = {
        pending: "Pending Review",
        approved: "Approved",
        revision_required: "Revision Required",
        rejected: "Rejected",
    };

    return (
        <Chip
            label={labelMap[status] || status}
            color={colorMap[status] || "default"}
            size="small"
        />
    );
}

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function RubricDisplay({ rubric }) {
    if (!rubric) return null;

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Grading Rubric: {rubric.name}
                </Typography>
                {rubric.description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                    >
                        {rubric.description}
                    </Typography>
                )}
                <List dense>
                    {rubric.dimensions.map((dim, index) => (
                        <ListItem key={index}>
                            <ListItemText
                                primary={dim.name}
                                secondary={`Weight: ${dim.weight} • Max Score: ${dim.max_score}`}
                            />
                        </ListItem>
                    ))}
                </List>
                <Typography variant="body2" color="text.secondary">
                    Maximum Total Score: {rubric.maxScore}
                </Typography>
            </CardContent>
        </Card>
    );
}

function CurrentSubmission({ submission }) {
    if (!submission) return null;

    return (
        <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
            <CardContent>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                    }}
                >
                    <Typography variant="subtitle1">
                        Current Submission (Version {submission.version})
                    </Typography>
                    <StatusChip status={submission.status} />
                </Box>
                <Stack direction="row" spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                        Type: {submission.fileType.toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Size: {formatFileSize(submission.fileSize)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Submitted:{" "}
                        {new Date(submission.submittedAt).toLocaleDateString()}
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );
}

export default function PracticumUpload({
    node,
    enrollment,
    config,
    rubric,
    currentSubmission,
}) {
    const [localError, setLocalError] = useState(null);
    const [success, setSuccess] = useState(false);

    const {
        data,
        setData,
        post,
        progress,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        file: null,
        enrollment_id: enrollment.id,
        node_id: node.id,
    });

    const validateFile = useCallback(
        (file) => {
            // Check file type
            const extension = file.name.split(".").pop().toLowerCase();
            if (!config.allowedTypes.includes(extension)) {
                return `File type .${extension} is not allowed. Allowed types: ${config.allowedTypes.join(", ")}`;
            }

            // Check file size
            const maxSizeBytes = config.maxSizeMb * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                return `File size exceeds maximum of ${config.maxSizeMb}MB`;
            }

            return null;
        },
        [config],
    );

    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            const validationError = validateFile(selectedFile);
            if (validationError) {
                setLocalError(validationError);
                setData("file", null);
            } else {
                setLocalError(null);
                clearErrors("file");
                setData("file", selectedFile);
            }
        }
    };

    const handleDrop = useCallback(
        (event) => {
            event.preventDefault();
            const droppedFile = event.dataTransfer.files[0];
            if (droppedFile) {
                const validationError = validateFile(droppedFile);
                if (validationError) {
                    setLocalError(validationError);
                    setData("file", null);
                } else {
                    setLocalError(null);
                    clearErrors("file");
                    setData("file", droppedFile);
                }
            }
        },
        [validateFile, setData, clearErrors],
    );

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleUpload = () => {
        if (!data.file) return;

        post("/api/v1/student/practicum/upload/", {
            preserveScroll: true,
            onSuccess: () => {
                setSuccess(true);
                reset("file");
            },
            onError: () => {
                setSuccess(false);
            },
        });
    };

    const canUpload =
        currentSubmission?.status === "revision_required" || !currentSubmission;

    return (
        <DashboardLayout
            role="student"
            breadcrumbs={[
                { label: "Programs", href: "/student/programs/" },
                {
                    label: enrollment.programName,
                    href: `/student/programs/${enrollment.id}/`,
                },
                { label: node.title },
            ]}
        >
            <Head title={`Upload Practicum - ${node.title}`} />

            <Stack spacing={3}>
                {/* Header */}
                <motion.div {...fadeIn}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {node.title}
                    </Typography>
                    {node.description && (
                        <Typography variant="body1" color="text.secondary">
                            {node.description}
                        </Typography>
                    )}
                </motion.div>

                {/* Rubric */}
                <RubricDisplay rubric={rubric} />

                {/* Current Submission */}
                <CurrentSubmission submission={currentSubmission} />

                {/* Upload Section */}
                {canUpload ? (
                    <motion.div {...fadeIn}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {currentSubmission
                                        ? "Upload Revision"
                                        : "Upload Submission"}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 2 }}
                                >
                                    Allowed file types:{" "}
                                    {config.allowedTypes
                                        .join(", ")
                                        .toUpperCase()}{" "}
                                    • Maximum size: {config.maxSizeMb}MB
                                </Typography>

                                {/* Drop Zone */}
                                <Box
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    sx={{
                                        border: "2px dashed",
                                        borderColor: data.file
                                            ? "primary.main"
                                            : "grey.300",
                                        borderRadius: 2,
                                        p: 4,
                                        textAlign: "center",
                                        bgcolor: data.file
                                            ? "primary.50"
                                            : "grey.50",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        "&:hover": {
                                            borderColor: "primary.main",
                                            bgcolor: "primary.50",
                                        },
                                    }}
                                    component="label"
                                >
                                    <input
                                        type="file"
                                        hidden
                                        accept={config.allowedTypes
                                            .map((t) => `.${t}`)
                                            .join(",")}
                                        onChange={handleFileSelect}
                                    />

                                    {data.file ? (
                                        <Stack alignItems="center" spacing={1}>
                                            <FileIcon
                                                sx={{
                                                    fontSize: 48,
                                                    color: "primary.main",
                                                }}
                                            />
                                            <Typography variant="body1">
                                                {data.file.name}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {formatFileSize(data.file.size)}
                                            </Typography>
                                        </Stack>
                                    ) : (
                                        <Stack alignItems="center" spacing={1}>
                                            <UploadIcon
                                                sx={{
                                                    fontSize: 48,
                                                    color: "grey.400",
                                                }}
                                            />
                                            <Typography variant="body1">
                                                Drag and drop your file here, or
                                                click to browse
                                            </Typography>
                                        </Stack>
                                    )}
                                </Box>

                                {/* Local Validation Error */}
                                {localError && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {localError}
                                    </Alert>
                                )}

                                {/* Server Error */}
                                {errors.file && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {errors.file}
                                    </Alert>
                                )}
                                {/* Fallback general error */}
                                {errors.error && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {errors.error}
                                    </Alert>
                                )}

                                {/* Success */}
                                {success && (
                                    <Alert
                                        severity="success"
                                        sx={{ mt: 2 }}
                                        icon={<CheckIcon />}
                                    >
                                        File uploaded successfully!
                                    </Alert>
                                )}

                                {/* Upload Progress */}
                                {progress && (
                                    <Box sx={{ mt: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={progress.percentage}
                                        />
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 1 }}
                                        >
                                            Uploading... {progress.percentage}%
                                        </Typography>
                                    </Box>
                                )}

                                {/* Upload Button */}
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<UploadIcon />}
                                    onClick={handleUpload}
                                    disabled={!data.file || processing}
                                    sx={{ mt: 3 }}
                                    fullWidth
                                >
                                    {processing
                                        ? "Uploading..."
                                        : "Upload Submission"}
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div {...fadeIn}>
                        <Alert severity="info">
                            Your submission is currently being reviewed. You
                            cannot upload a new version until feedback is
                            provided.
                        </Alert>
                    </motion.div>
                )}
            </Stack>
        </DashboardLayout>
    );
}
