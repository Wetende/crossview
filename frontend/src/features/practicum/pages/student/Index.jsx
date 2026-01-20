/**
 * Practicum History Page
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { Head, router } from "@inertiajs/react";
import {
    Box,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Pagination,
    Select,
    Stack,
    Typography,
    Alert,
    Button,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";
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
        pending: "Pending",
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

function SubmissionCard({ submission }) {
    // Download URL is now passed directly from backend as submission.downloadUrl
    const handleDownload = () => {
        if (submission.downloadUrl) {
            window.open(submission.downloadUrl, "_blank");
        }
    };

    return (
        <motion.div {...fadeIn}>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 1,
                        }}
                    >
                        <Box>
                            <Typography variant="h6" component="h3">
                                {submission.nodeTitle}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {submission.programName} • Version{" "}
                                {submission.version}
                            </Typography>
                        </Box>
                        <StatusChip status={submission.status} />
                    </Box>

                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Type: {submission.fileType.toUpperCase()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Size: {formatFileSize(submission.fileSize)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Submitted:{" "}
                            {new Date(
                                submission.submittedAt,
                            ).toLocaleDateString()}
                        </Typography>
                    </Stack>

                    {submission.review && (
                        <Box
                            sx={{
                                mt: 2,
                                p: 2,
                                bgcolor: "grey.50",
                                borderRadius: 1,
                            }}
                        >
                            <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                gutterBottom
                            >
                                Review Feedback
                            </Typography>
                            {submission.review.totalScore !== null && (
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Score: {submission.review.totalScore}
                                </Typography>
                            )}
                            {submission.review.comments && (
                                <Typography variant="body2">
                                    {submission.review.comments}
                                </Typography>
                            )}
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 1 }}
                            >
                                Reviewed:{" "}
                                {new Date(
                                    submission.review.reviewedAt,
                                ).toLocaleDateString()}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownload}
                        >
                            Download
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function PracticumHistory({
    submissions,
    pagination,
    filters,
    programOptions,
    statusOptions,
}) {
    const handleFilterChange = (key, value) => {
        router.visit("/student/practicum/", {
            data: {
                ...filters,
                [key]: value,
                page: 1,
            },
            only: ["submissions", "pagination", "filters"],
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (event, page) => {
        router.visit("/student/practicum/", {
            data: {
                ...filters,
                page,
            },
            only: ["submissions", "pagination"],
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout role="student">
            <Head title="Practicum Submissions" />

            <Stack spacing={3}>
                <motion.div {...fadeIn}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Practicum Submissions
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        View your submission history and feedback
                    </Typography>
                </motion.div>

                {/* Filters */}
                <motion.div {...fadeIn}>
                    <Card>
                        <CardContent>
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2}
                            >
                                <FormControl
                                    size="small"
                                    sx={{ minWidth: 200 }}
                                >
                                    <InputLabel>Program</InputLabel>
                                    <Select
                                        value={filters.program}
                                        label="Program"
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "program",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {programOptions.map((option) => (
                                            <MenuItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl
                                    size="small"
                                    sx={{ minWidth: 150 }}
                                >
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={filters.status}
                                        label="Status"
                                        onChange={(e) =>
                                            handleFilterChange(
                                                "status",
                                                e.target.value,
                                            )
                                        }
                                    >
                                        {statusOptions.map((option) => (
                                            <MenuItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Submissions */}
                {submissions.length === 0 ? (
                    <motion.div {...fadeIn}>
                        <Alert severity="info">
                            No practicum submissions found. Submit your first
                            practicum from a practicum node in your program.
                        </Alert>
                    </motion.div>
                ) : (
                    <>
                        {submissions.map((submission) => (
                            <SubmissionCard
                                key={submission.id}
                                submission={submission}
                            />
                        ))}

                        {pagination.totalPages > 1 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    mt: 3,
                                }}
                            >
                                <Pagination
                                    count={pagination.totalPages}
                                    page={pagination.page}
                                    onChange={handlePageChange}
                                    color="primary"
                                />
                            </Box>
                        )}
                    </>
                )}
            </Stack>
        </DashboardLayout>
    );
}
