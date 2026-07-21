/**
 * Instructor Gradebook Page
 * Requirements: US-4.1, US-4.2, US-4.3, US-4.4, US-4.5, US-4.6
 */

import { useState } from "react";
import { Head, router, Link } from "@inertiajs/react";
import {
    Box,
    Stack,
    Typography,
    Button,
    Alert,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    IconButton,
} from "@mui/material";
import { motion } from "framer-motion";
import PublishIcon from "@mui/icons-material/Publish";
import {
    IconCheck,
    IconX,
    IconAlertTriangle,
    IconEye,
} from "@tabler/icons-react";

import InstructorLayout from "@/layouts/InstructorLayout";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ReportToolbar } from "@/features/reports";

export default function Gradebook({
    program,
    gradingConfig,
    quizzes = [],
    assignments = [],
    students,
}) {
    const [publishing, setPublishing] = useState(false);
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);

    const gradingMode = gradingConfig?.mode || "summative";

    const handlePublish = () => {
        setPublishDialogOpen(true);
    };

    const handleClosePublishDialog = () => {
        if (publishing) return;
        setPublishDialogOpen(false);
    };

    const handleConfirmPublish = () => {
        setPublishing(true);
        router.post(
            `/instructor/programs/${program.id}/gradebook/publish/`,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setPublishing(false);
                    setPublishDialogOpen(false);
                },
            },
        );
    };

    const hasUnpublished = students.some(
        (s) => !s.isPublished && s.overallScore != null,
    );

    const breadcrumbs = [
        { label: "Programs", href: "/instructor/programs/" },
        { label: program.name, href: `/instructor/programs/${program.id}/` },
        { label: "Gradebook" },
    ];

    const renderScoreCell = (score, passed = null) => {
        if (score === null || score === undefined) {
            return (
                <Typography variant="body2" color="text.secondary">
                    —
                </Typography>
            );
        }
        return (
            <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="body2">{score.toFixed(1)}%</Typography>
                {passed === true && <IconCheck size={14} color="green" />}
                {passed === false && <IconX size={14} color="red" />}
            </Stack>
        );
    };

    const renderQuizScoreCell = (score) => {
        if (score.score !== null && score.score !== undefined) {
            return renderScoreCell(score.score, score.passed);
        }
        return (
            <Chip
                label={score.attemptNumber ? "Awaiting grading" : "Not attempted"}
                size="small"
                variant="outlined"
                color={score.attemptNumber ? "warning" : "default"}
            />
        );
    };

    const calculationDescription = (student) => {
        const calculation = student.calculation || {};
        const count = calculation.gradedAssessments || 0;
        if (calculation.method === "assessment_weights") {
            return `Current weighted grade from ${count} graded assessment${count === 1 ? "" : "s"}. Pending work is excluded.`;
        }
        if (calculation.method === "configured_components") {
            return `Current grade from the configured grading components. ${count} graded assessment${count === 1 ? "" : "s"} included.`;
        }
        return `Current average of ${count} graded assessment${count === 1 ? "" : "s"}. Pending work is excluded.`;
    };

    return (
        <InstructorLayout breadcrumbs={breadcrumbs}>
            <Head title={`Gradebook - ${program.name}`} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
            >
                <Stack spacing={3}>
                    {/* Header */}
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography
                                variant="h4"
                                component="h1"
                                gutterBottom
                            >
                                Gradebook
                            </Typography>
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {program.name}
                                </Typography>
                                <Chip
                                    label={gradingMode.toUpperCase()}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={2}>
                            <ReportToolbar
                                scope="instructor"
                                reportId="instructor.gradebook"
                                queryParams={{ program: program.id }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<PublishIcon />}
                                onClick={handlePublish}
                                disabled={!hasUnpublished || publishing}
                            >
                                {publishing
                                    ? "Publishing..."
                                    : "Release results"}
                            </Button>
                        </Stack>
                    </Box>

                    <Alert severity="info">
                        Grades update automatically from official quiz and assignment
                        results. Pending work is excluded. Release results when learners
                        are ready to see them.
                    </Alert>

                    {/* Gradebook Table */}
                    <TableContainer
                        component={Paper}
                        sx={{ maxWidth: "100%", overflowX: "auto" }}
                    >
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            minWidth: 180,
                                            position: "sticky",
                                            left: 0,
                                            bgcolor: "background.paper",
                                            zIndex: 1,
                                        }}
                                    >
                                        Student
                                    </TableCell>
                                    {quizzes.map((q) => (
                                        <TableCell
                                            key={`quiz-${q.id}`}
                                            align="center"
                                            sx={{ minWidth: 100 }}
                                        >
                                            <Tooltip
                                                title={`${q.title}${q.weight > 0 ? ` (${q.weight}%)` : ""}`}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    noWrap
                                                    sx={{ display: "block" }}
                                                >
                                                    {q.title.length > 15
                                                        ? q.title.slice(0, 15) +
                                                          "…"
                                                        : q.title}
                                                </Typography>
                                            </Tooltip>
                                            <Chip
                                                label={
                                                    q.weight > 0
                                                        ? `${q.weight}%`
                                                        : "Quiz"
                                                }
                                                size="small"
                                                color={
                                                    q.weight > 0
                                                        ? "primary"
                                                        : "default"
                                                }
                                                sx={{ fontSize: 10 }}
                                            />
                                        </TableCell>
                                    ))}
                                    {assignments.map((a) => (
                                        <TableCell
                                            key={`assign-${a.id}`}
                                            align="center"
                                            sx={{ minWidth: 100 }}
                                        >
                                            <Tooltip
                                                title={`${a.title} (${a.weight}%)`}
                                            >
                                                <Typography
                                                    variant="caption"
                                                    noWrap
                                                    sx={{ display: "block" }}
                                                >
                                                    {a.title.length > 15
                                                        ? a.title.slice(0, 15) +
                                                          "…"
                                                        : a.title}
                                                </Typography>
                                            </Tooltip>
                                            <Chip
                                                label={`${a.weight}%`}
                                                size="small"
                                                color="secondary"
                                                sx={{ fontSize: 10 }}
                                            />
                                        </TableCell>
                                    ))}
                                    <TableCell
                                        align="center"
                                        sx={{
                                            minWidth: 80,
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Current grade
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        sx={{ minWidth: 60 }}
                                    >
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {students.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={
                                                quizzes.length +
                                                assignments.length +
                                                3
                                            }
                                            align="center"
                                            sx={{ py: 4 }}
                                        >
                                            <Typography color="text.secondary">
                                                No students enrolled
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    students.map((student) => (
                                        <TableRow
                                            key={student.enrollmentId}
                                            hover
                                        >
                                            <TableCell
                                                sx={{
                                                    position: "sticky",
                                                    left: 0,
                                                    bgcolor: "background.paper",
                                                    zIndex: 1,
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    fontWeight="medium"
                                                >
                                                    {student.name}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {student.email}
                                                </Typography>
                                            </TableCell>
                                            {(student.quizScores || []).map(
                                                (qs) => (
                                                    <TableCell
                                                        key={`q-${qs.quizId}`}
                                                        align="center"
                                                    >
                                                        {renderQuizScoreCell(qs)}
                                                    </TableCell>
                                                ),
                                            )}
                                            {(
                                                student.assignmentScores || []
                                            ).map((as) => (
                                                <TableCell
                                                    key={`a-${as.assignmentId}`}
                                                    align="center"
                                                >
                                                    <Stack
                                                        alignItems="center"
                                                        spacing={0.5}
                                                    >
                                                        {as.status === "not_submitted" ? (
                                                            <Chip
                                                                label="Not submitted"
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        ) : as.score === null ||
                                                          as.score === undefined ? (
                                                            <Chip
                                                                label="Awaiting grading"
                                                                size="small"
                                                                variant="outlined"
                                                                color="warning"
                                                            />
                                                        ) : (
                                                            <>
                                                                {renderScoreCell(
                                                                    as.score,
                                                                )}
                                                                {as.isLate && (
                                                                    <Chip
                                                                        icon={
                                                                            <IconAlertTriangle
                                                                                size={
                                                                                    12
                                                                                }
                                                                            />
                                                                        }
                                                                        label="Late"
                                                                        size="small"
                                                                        color="warning"
                                                                    />
                                                                )}
                                                            </>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            ))}
                                            <TableCell align="center">
                                                <Tooltip
                                                    title={calculationDescription(student)}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight="bold"
                                                        color={
                                                            student.overallScore !== null
                                                                ? student.overallScore >= 70
                                                                    ? "success.main"
                                                                    : "error.main"
                                                                : "text.secondary"
                                                        }
                                                    >
                                                        {student.overallScore !== null
                                                            ? `${student.overallScore}%`
                                                            : "—"}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="View detailed progress">
                                                    <IconButton
                                                        component={Link}
                                                        href={`/instructor/programs/${program.id}/gradebook/student/${student.enrollmentId}/`}
                                                        size="small"
                                                        color="primary"
                                                    >
                                                        <IconEye size={18} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            </motion.div>
            <ConfirmDialog
                open={publishDialogOpen}
                onClose={handleClosePublishDialog}
                onConfirm={handleConfirmPublish}
                title="Release results"
                message="Release the currently calculated results? Learners will be notified and can then see them."
                confirmLabel="Release"
                loading={publishing}
            />
        </InstructorLayout>
    );
}
