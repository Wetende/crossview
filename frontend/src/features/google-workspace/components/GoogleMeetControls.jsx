import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useState,
} from "react";
import {
    Alert,
    Button,
    Checkbox,
    FormControlLabel,
    Link,
    Stack,
} from "@mui/material";

import { workspaceApi } from "../api/workspaceApi";

const GoogleMeetControls = forwardRef(function GoogleMeetControls(
    { nodeId, persisted, beforeCreate, automaticCreation = false },
    ref,
) {
    const [state, setState] = useState({ connection: null, session: null });
    const [inviteLearners, setInviteLearners] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    const refresh = useCallback(async () => {
        const connection = await workspaceApi.connection();
        let session = null;
        if (persisted) {
            try {
                const preview = await workspaceApi.meetPreview(nodeId);
                session = preview.session;
            } catch {
                // A new lesson has no scheduled session until its form is saved.
            }
        }
        const nextState = { connection, session };
        setState(nextState);
        return nextState;
    }, [nodeId, persisted]);

    useEffect(() => {
        void refresh().catch((error) => {
            setMessage({ severity: "error", text: error.message });
        });
    }, [refresh]);

    const connection = state.connection;
    const session = state.session;
    const calendarAuthorized =
        connection?.grantedCapabilities?.includes("calendar_events");

    const connect = async (capabilities) => {
        setBusy(true);
        setMessage(null);
        try {
            const result = await workspaceApi.connect({
                capabilities,
                returnTo: window.location.pathname + window.location.search,
            });
            window.location.assign(result.authorizationUrl);
        } catch (error) {
            setMessage({ severity: "error", text: error.message });
        } finally {
            setBusy(false);
        }
    };

    const provision = useCallback(
        async ({ saveFirst = false } = {}) => {
            if (!persisted) {
                const error = new Error(
                    "Save the lesson before creating its Google Meet.",
                );
                setMessage({ severity: "error", text: error.message });
                return { ok: false, error };
            }
            let activeConnection = connection;
            let activeSession = session;
            if (!activeConnection) {
                try {
                    const refreshed = await refresh();
                    activeConnection = refreshed.connection;
                    activeSession = refreshed.session;
                } catch (refreshError) {
                    setMessage({
                        severity: "error",
                        text: refreshError.message,
                    });
                    return { ok: false, error: refreshError };
                }
            }
            const hasCalendarAccess =
                activeConnection?.grantedCapabilities?.includes(
                    "calendar_events",
                );
            if (!activeConnection?.available || !hasCalendarAccess) {
                const error = new Error(
                    "Connect Google Calendar before creating this lesson.",
                );
                setMessage({ severity: "error", text: error.message });
                return { ok: false, error };
            }
            if (activeSession?.joinUrl) {
                return { ok: true, skipped: true, session: activeSession };
            }

            setBusy(true);
            setMessage(null);
            try {
                if (saveFirst) {
                    const saveResult = await beforeCreate?.();
                    if (saveResult?.ok === false) {
                        throw (
                            saveResult.error ||
                            new Error(
                                "Save the lesson schedule before creating the Meet.",
                            )
                        );
                    }
                }
                const result = await workspaceApi.createMeet(nodeId, {
                    inviteLearners,
                    operationId: crypto.randomUUID(),
                });
                const ready = Boolean(result.session?.joinUrl);
                const skipped = !result.created && ready;
                setState((current) => ({
                    ...current,
                    session: result.session,
                }));
                setMessage({
                    severity: ready ? "success" : "info",
                    text: ready
                        ? "Google Meet is ready."
                        : "Google is generating the Meet link. It will retry automatically.",
                });
                return { ok: true, skipped, ...result };
            } catch (error) {
                setMessage({ severity: "error", text: error.message });
                return { ok: false, error };
            } finally {
                setBusy(false);
            }
        },
        [
            beforeCreate,
            connection,
            inviteLearners,
            nodeId,
            persisted,
            refresh,
            session,
        ],
    );

    useImperativeHandle(ref, () => ({ provision }), [provision]);

    const cancelMeeting = async () => {
        setBusy(true);
        setMessage(null);
        try {
            const result = await workspaceApi.cancelMeet(nodeId);
            setState((current) => ({
                ...current,
                session: result.session,
            }));
        } catch (error) {
            setMessage({ severity: "error", text: error.message });
        } finally {
            setBusy(false);
        }
    };

    if (automaticCreation) {
        const attendanceUrl = session?.courseId
            ? `/instructor/programs/${session.courseId}/gradebook/?view=attendance&session=${session.nodeId}`
            : null;
        return (
            <Stack spacing={1.25}>
                {message && (
                    <Alert severity={message.severity}>{message.text}</Alert>
                )}
                {connection && !connection.available && (
                    <Alert severity="info">
                        Google Calendar is not available for this deployment.
                    </Alert>
                )}
                {connection?.available && !calendarAuthorized && (
                    <Button
                        variant="outlined"
                        disabled={busy}
                        onClick={() => connect(["calendar_events"])}
                    >
                        Connect Google Calendar
                    </Button>
                )}
                {calendarAuthorized && session?.status === "cancelled" && (
                    <Alert severity="warning">Google Meet cancelled.</Alert>
                )}
                {calendarAuthorized &&
                    session?.joinUrl &&
                    session.status !== "cancelled" && (
                        <Alert severity="success">
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                            >
                                <span>Google Meet ready.</span>
                                {session.calendarHtmlLink && (
                                    <Link
                                        href={session.calendarHtmlLink}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Open Calendar event
                                    </Link>
                                )}
                                {session.recordingUrl && (
                                    <Link
                                        href={session.recordingUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Open recording
                                    </Link>
                                )}
                                {session.hasEnded && attendanceUrl && (
                                    <Link href={attendanceUrl}>
                                        Review attendance
                                    </Link>
                                )}
                                {!session.hasEnded && (
                                    <Button
                                        size="small"
                                        color="error"
                                        disabled={busy}
                                        onClick={cancelMeeting}
                                    >
                                        Cancel meeting
                                    </Button>
                                )}
                            </Stack>
                        </Alert>
                    )}
                {calendarAuthorized && !session?.joinUrl && persisted && (
                    <Alert
                        severity={
                            session?.creationState === "failed"
                                ? "warning"
                                : "info"
                        }
                        action={
                            session?.creationState === "failed" ? (
                                <Button
                                    color="inherit"
                                    disabled={busy}
                                    onClick={() =>
                                        provision({ saveFirst: true })
                                    }
                                >
                                    Retry
                                </Button>
                            ) : null
                        }
                    >
                        {session?.creationState === "creating"
                            ? "Google is creating the Meet link."
                            : session?.creationState === "failed"
                              ? "Google Meet creation failed. Save and retry."
                              : "The Meet link will be created when this lesson is saved."}
                    </Alert>
                )}
            </Stack>
        );
    }

    return (
        <Stack spacing={1.25}>
            {message && (
                <Alert severity={message.severity}>{message.text}</Alert>
            )}
            {connection && !connection.available && (
                <Alert severity="info">
                    Google Workspace is not configured for this deployment.
                </Alert>
            )}
            {connection?.available &&
                (!connection.connected || !calendarAuthorized) && (
                    <>
                        {connection.connected && connection.lastError && (
                            <Alert severity="warning">
                                {connection.lastError}
                            </Alert>
                        )}
                        <Button
                            variant="outlined"
                            disabled={busy}
                            onClick={() => connect(["calendar_events"])}
                        >
                            Connect Google Calendar
                        </Button>
                    </>
                )}
            {calendarAuthorized && !session?.joinUrl && (
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={inviteLearners}
                            onChange={(event) =>
                                setInviteLearners(event.target.checked)
                            }
                        />
                    }
                    label="Add enrolled learners as attendees"
                />
            )}
            {session?.joinUrl ? (
                <Stack spacing={1}>
                    <Alert severity="success">
                        Google Meet ready.{" "}
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
                </Stack>
            ) : calendarAuthorized ? (
                <>
                    <Alert
                        severity={
                            session?.creationState === "failed"
                                ? "warning"
                                : "info"
                        }
                    >
                        {session?.creationState === "creating"
                            ? "Google is creating this Meet link."
                            : session?.creationState === "failed"
                              ? session.lastSyncError ||
                                "Meet creation failed. Save and retry."
                              : automaticCreation
                                ? "The Meet link will be created automatically when you create this lesson."
                                : "Google Meet has not been created."}
                    </Alert>
                    {(!automaticCreation ||
                        session?.creationState === "failed") && (
                        <Button
                            variant="contained"
                            disabled={busy}
                            onClick={() => provision({ saveFirst: true })}
                        >
                            {session?.creationState === "failed"
                                ? "Save & retry Google Meet"
                                : "Save & create Google Meet"}
                        </Button>
                    )}
                </>
            ) : null}
        </Stack>
    );
});

export default GoogleMeetControls;
