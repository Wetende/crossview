import { useEffect, useState } from "react";
import axios from "axios";
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
    Divider,
    Stack,
    Typography,
} from "@mui/material";

const baseUrl = (programId) => `/api/learning-operations/programs/${programId}`;

export default function LearnerReminderDialog({
    open,
    programId,
    enrollmentIds,
    onClose,
    onSent,
}) {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const loadPreview = async () => {
        if (!enrollmentIds?.length) return;
        setLoading(true);
        setError("");
        try {
            const { data } = await axios.post(
                `${baseUrl(programId)}/learners/reminder-preview/`,
                { enrollmentIds },
            );
            setPreview(data);
        } catch (requestError) {
            setError(
                requestError?.response?.data?.detail ||
                    "The reminder preview could not be loaded.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        setPreview(null);
        loadPreview();
        // A new selection opens a new preview operation.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, programId, enrollmentIds?.join(",")]);

    const send = async () => {
        if (!preview?.eligible) return;
        setSending(true);
        setError("");
        try {
            const { data } = await axios.post(
                `${baseUrl(programId)}/learners/bulk/`,
                {
                    enrollmentIds,
                    action: "send_reminder",
                    operationId: preview.operationId,
                },
            );
            onSent(data);
        } catch (requestError) {
            setError(
                requestError?.response?.data?.detail ||
                    "The reminders could not be sent. Try again safely; the operation will not duplicate messages.",
            );
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={() => !sending && onClose()}
            fullWidth
            maxWidth="sm"
            aria-labelledby="reminder-preview-title"
        >
            <DialogTitle id="reminder-preview-title">
                Review learner reminders
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Stack spacing={2} sx={{ py: 5, alignItems: "center" }}>
                        <CircularProgress aria-label="Loading reminder preview" />
                        <Typography color="text.secondary">
                            Choosing the most useful reminder for each learner…
                        </Typography>
                    </Stack>
                ) : error && !preview ? (
                    <Alert
                        severity="error"
                        action={<Button onClick={loadPreview}>Retry</Button>}
                    >
                        {error}
                    </Alert>
                ) : preview ? (
                    <Stack spacing={2}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <Alert severity={preview.skipped ? "warning" : "info"}>
                            {preview.eligible} learner
                            {preview.eligible === 1 ? "" : "s"} will receive a
                            reminder; {preview.skipped} will be skipped because
                            no contextual reminder is currently needed.
                        </Alert>
                        {preview.reminders
                            .slice(0, 25)
                            .map((reminder, index) => (
                                <Box
                                    key={reminder.enrollmentId}
                                    sx={{
                                        border: 1,
                                        borderColor: "divider",
                                        borderRadius: 2,
                                        p: 2,
                                    }}
                                >
                                    <Stack spacing={1}>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            useFlexGap
                                            sx={{ flexWrap: "wrap" }}
                                        >
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    flex: 1,
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {reminder.learnerName}
                                            </Typography>
                                            {reminder.availableChannels
                                                .inApp && (
                                                <Chip
                                                    size="small"
                                                    label="In-app"
                                                />
                                            )}
                                            {reminder.availableChannels
                                                .email && (
                                                <Chip
                                                    size="small"
                                                    label="Email"
                                                />
                                            )}
                                        </Stack>
                                        <Divider />
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                        >
                                            {reminder.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {reminder.message}
                                        </Typography>
                                        {index === 24 &&
                                            preview.reminders.length > 25 && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Additional learners use the
                                                    same contextual selection
                                                    rules.
                                                </Typography>
                                            )}
                                    </Stack>
                                </Box>
                            ))}
                        {!preview.eligible && (
                            <Typography color="text.secondary">
                                No messages will be sent from this selection.
                            </Typography>
                        )}
                    </Stack>
                ) : null}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={sending}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={send}
                    disabled={!preview?.eligible || loading || sending}
                >
                    {sending ? "Sending…" : `Send to ${preview?.eligible || 0}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
