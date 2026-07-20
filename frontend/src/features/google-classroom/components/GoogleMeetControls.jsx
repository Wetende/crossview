import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Link,
    Stack,
    Typography,
} from "@mui/material";

import { workspaceApi } from "../api/classroomApi";

const REQUIRED_CAPABILITIES = ["calendar_events", "meet_attendance"];

export default function GoogleMeetControls({ nodeId, persisted }) {
    const [preview, setPreview] = useState(null);
    const [status, setStatus] = useState(null);
    const [inviteLearners, setInviteLearners] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    const loadStatus = useCallback(async () => {
        if (!persisted) return;
        try {
            const result = await workspaceApi.meetPreview(nodeId);
            setStatus(result);
            setMessage(null);
        } catch (error) {
            setMessage({
                severity: "info",
                text: `${error.message} Save the current schedule, then check again.`,
            });
        }
    }, [nodeId, persisted]);

    useEffect(() => {
        void loadStatus();
    }, [loadStatus]);

    if (!persisted) {
        return (
            <Alert severity="info">
                Save this lesson first. You can then create its unique Google
                Meet.
            </Alert>
        );
    }

    const connection = status?.connection;
    const capabilities = connection?.grantedCapabilities || [];
    const authorized = REQUIRED_CAPABILITIES.every((item) =>
        capabilities.includes(item),
    );
    const session = status?.session;

    const connect = async () => {
        setBusy(true);
        setMessage(null);
        try {
            const result = await workspaceApi.connect({
                capabilities: REQUIRED_CAPABILITIES,
                returnTo: window.location.pathname + window.location.search,
            });
            if (result.authorizationUrl)
                window.location.assign(result.authorizationUrl);
        } catch (error) {
            setMessage({ severity: "error", text: error.message });
        } finally {
            setBusy(false);
        }
    };

    const openPreview = async () => {
        setBusy(true);
        setMessage(null);
        try {
            const result = await workspaceApi.meetPreview(nodeId);
            setStatus(result);
            setPreview(result.attendees);
        } catch (error) {
            setMessage({ severity: "error", text: error.message });
        } finally {
            setBusy(false);
        }
    };

    const createMeet = async () => {
        setBusy(true);
        setMessage(null);
        try {
            const result = await workspaceApi.createMeet(nodeId, {
                inviteLearners,
                operationId: crypto.randomUUID(),
            });
            setStatus((current) => ({ ...current, session: result.session }));
            setPreview(null);
            setMessage({
                severity: result.created ? "success" : "info",
                text: result.created
                    ? "Google Meet and Calendar event created."
                    : "Google Meet creation is queued for retry.",
            });
        } catch (error) {
            setMessage({ severity: "error", text: error.message });
        } finally {
            setBusy(false);
        }
    };

    const syncMeet = async () => {
        setBusy(true);
        setMessage(null);
        try {
            const result = await workspaceApi.syncMeet(nodeId);
            setStatus((current) => ({ ...current, session: result.session }));
            setMessage({
                severity:
                    result.job?.status === "succeeded" ? "success" : "info",
                text:
                    result.job?.status === "succeeded"
                        ? "Attendance and recording status synchronized."
                        : result.job?.lastError ||
                          "Synchronization is queued for retry.",
            });
        } catch (error) {
            setMessage({ severity: "error", text: error.message });
        } finally {
            setBusy(false);
        }
    };

    return (
        <Stack spacing={1.5}>
            {message && (
                <Alert severity={message.severity}>{message.text}</Alert>
            )}
            {!status && (
                <Button variant="outlined" onClick={loadStatus} disabled={busy}>
                    Check saved Meet setup
                </Button>
            )}
            {connection && !connection.available && (
                <Alert severity="info">
                    Google Workspace is not configured for this deployment.
                </Alert>
            )}
            {connection?.available &&
                (!connection.connected || !authorized) && (
                    <Button
                        variant="outlined"
                        onClick={connect}
                        disabled={busy}
                    >
                        Connect Google Calendar and Meet
                    </Button>
                )}
            {session?.joinUrl ? (
                <Stack spacing={1}>
                    <Alert severity="success">
                        Unique Google Meet created.{" "}
                        {session.calendarHtmlLink && (
                            <Link
                                href={session.calendarHtmlLink}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Open Calendar event
                            </Link>
                        )}
                    </Alert>
                    {session.lastSyncError && (
                        <Alert severity="warning">
                            {session.lastSyncError}
                        </Alert>
                    )}
                    {session.unmatchedAttendanceCount > 0 && (
                        <Alert severity="info">
                            {session.unmatchedAttendanceCount} attendance
                            record(s) need instructor review.
                        </Alert>
                    )}
                    <Button
                        variant="outlined"
                        onClick={syncMeet}
                        disabled={busy}
                    >
                        Sync attendance and recording
                    </Button>
                </Stack>
            ) : (
                connection?.connected &&
                authorized && (
                    <Button
                        variant="outlined"
                        onClick={openPreview}
                        disabled={busy}
                    >
                        {busy ? (
                            <CircularProgress size={20} />
                        ) : (
                            "Create unique Google Meet"
                        )}
                    </Button>
                )
            )}

            <Dialog
                open={Boolean(preview)}
                onClose={() => !busy && setPreview(null)}
            >
                <DialogTitle>Create Google Meet</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Typography>
                            A unique Calendar event and Meet link will be
                            created for this lesson.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {preview?.eligible || 0} active learners can receive
                            a Calendar invitation; {preview?.ineligible || 0}{" "}
                            cannot be invited.
                        </Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={inviteLearners}
                                    onChange={(event) =>
                                        setInviteLearners(event.target.checked)
                                    }
                                />
                            }
                            label="Send Calendar invitations to eligible active learners"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreview(null)} disabled={busy}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={createMeet}
                        disabled={busy}
                    >
                        Create Meet
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
