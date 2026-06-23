import { useCallback, useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Stack,
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon
} from '@mui/icons-material';

function getReadableIssueMessage(issue) {
    const issueType = issue?.type;
    const message = String(issue?.message || '');

    if (issueType === 'missing_content') {
        return 'Add at least one lesson before publishing.';
    }
    if (issueType === 'missing_assessment') {
        return 'Add at least one quiz or assignment before publishing.';
    }
    if (issueType === 'missing_weight') {
        return 'Set an assessment weight for this item.';
    }
    if (issueType === 'invalid_weight_sum') {
        const match = message.match(/currently\s+(\d+)%/i);
        const total = match?.[1];
        return total
            ? `Current total assessment weight is ${total}%. It must be exactly 100% before publishing.`
            : 'Total assessment weight must be exactly 100% before publishing.';
    }
    if (issueType === 'missing_assessment_prompt') {
        return 'Add assignment instructions or a prompt so learners know what to submit.';
    }
    if (issueType === 'missing_instructor') {
        return 'Assign at least one instructor before publishing.';
    }
    if (issueType === 'missing_description') {
        return 'Add a clear course description before publishing.';
    }
    if (issueType === 'missing_thumbnail') {
        return 'Upload a course thumbnail before publishing.';
    }
    if (issueType === 'missing_learning_outcomes') {
        return "Add what learners will learn before publishing.";
    }
    if (issueType === 'invalid_assignment_mode_config') {
        return 'Review assignment settings. Required question/submission options are incomplete.';
    }
    if (issueType === 'missing_assignment_question_link') {
        return 'This assignment has questions but is not linked correctly. Re-save the assignment questions.';
    }
    if (issueType === 'invalid_submission_type_mapping') {
        return 'Submission type is invalid. Set it to file, text, or both.';
    }
    if (issueType === 'empty_quiz') {
        return 'Add at least one question to this quiz.';
    }
    if (issueType === 'missing_quiz_link') {
        return 'This quiz has questions but is not linked correctly. Re-save the quiz.';
    }
    if (issueType === 'short_instructions') {
        const match = message.match(/\((\d+)\/100\s+chars\)/i);
        const count = match?.[1];
        return count
            ? `Assignment instructions are short (${count}/100 characters). Add more detail for learners.`
            : 'Assignment instructions are short. Add more detail for learners.';
    }
    if (issueType === 'missing_document') {
        return 'Upload a primary document file for this document lesson.';
    }
    if (issueType === 'document_conversion_not_ready') {
        return 'Document processing is not complete yet. Wait for conversion, then try again.';
    }
    if (issueType === 'document_pdf_missing') {
        return 'Tracked PDF is missing for this document lesson. Re-upload the document.';
    }
    if (issueType === 'document_pdf_invalid_path') {
        return 'Document file path is invalid. Re-upload the document file.';
    }
    if (issueType === 'document_pdf_not_found') {
        return 'Tracked document file could not be found. Re-upload the document.';
    }
    if (issueType === 'document_page_count_invalid') {
        return 'Document page count is invalid. Reprocess or re-upload the document.';
    }

    return message || 'Please review this item before publishing.';
}

function formatIssueLine(issue) {
    const readableMessage = getReadableIssueMessage(issue);
    return issue?.node_title
        ? `${issue.node_title}: ${readableMessage}`
        : readableMessage;
}

/**
 * PublishValidationDialog - Pre-publish validation dialog
 * Shows errors, warnings, and course stats before publishing
 */
export default function PublishValidationDialog({
    open,
    onClose,
    programId,
    onPublish
}) {
    const [loading, setLoading] = useState(true);
    const [validation, setValidation] = useState(null);
    const [error, setError] = useState(null);

    const fetchValidation = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/instructor/programs/${programId}/validate/`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to validate program');
            }

            const data = await response.json();
            setValidation(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [programId]);

    useEffect(() => {
        if (open && programId) {
            fetchValidation();
        }
    }, [fetchValidation, open, programId]);

    const handlePublish = () => {
        onPublish?.();
        onClose();
    };

    const renderStats = (details) => {
        if (!details) return null;

        return (
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Chip
                    icon={<InfoIcon />}
                    label={`${details.lesson_count} Lessons`}
                    variant="outlined"
                    color="primary"
                />
                <Chip
                    icon={<InfoIcon />}
                    label={`${details.quiz_count} Quizzes`}
                    variant="outlined"
                    color="secondary"
                />
                <Chip
                    icon={<InfoIcon />}
                    label={`${details.assignment_count} Assignments`}
                    variant="outlined"
                    color="info"
                />
            </Stack>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={1}>
                    {validation?.is_valid ? (
                        <CheckIcon color="success" />
                    ) : (
                        <ErrorIcon color="error" />
                    )}
                    <Typography variant="h6">
                        {loading ? 'Validating...' : validation?.is_valid ? 'Ready to Publish' : 'Validation Issues'}
                    </Typography>
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <>
                        {/* Course stats */}
                        {renderStats(validation?.details)}

                        {/* Assessment weight summary */}
                        {typeof validation?.details?.total_assessment_weight === 'number' && (
                            <Alert
                                severity={validation.details.total_assessment_weight === 100 ? 'success' : 'warning'}
                                sx={{ mb: 2 }}
                            >
                                Assessment weight: {validation.details.total_assessment_weight}% / 100%
                            </Alert>
                        )}

                        {/* Errors */}
                        {validation?.errors?.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="error" gutterBottom>
                                    Required fixes before publishing
                                </Typography>
                                <List dense>
                                    {validation.errors.map((err, idx) => (
                                        <ListItem key={idx}>
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <ErrorIcon color="error" fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={formatIssueLine(err)}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        {/* Warnings */}
                        {validation?.warnings?.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="warning.main" gutterBottom>
                                    Recommended improvements
                                </Typography>
                                <List dense>
                                    {validation.warnings.map((warn, idx) => (
                                        <ListItem key={idx}>
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <WarningIcon color="warning" fontSize="small" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={formatIssueLine(warn)}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        {/* All good */}
                        {validation?.is_valid && validation?.errors?.length === 0 && (
                            <Alert severity="success" icon={<CheckIcon />}>
                                Your course is ready to publish! Students will be able to enroll once published.
                            </Alert>
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePublish}
                    disabled={loading || !validation?.is_valid}
                >
                    Publish Course
                </Button>
            </DialogActions>
        </Dialog>
    );
}
