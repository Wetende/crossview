import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Checkbox, FormControlLabel, Link, Stack } from "@mui/material";
import { workspaceApi } from "../api/workspaceApi";

export default function GoogleMeetControls({ nodeId, persisted, beforeCreate }) {
    const [state, setState] = useState(null);
    const [inviteLearners, setInviteLearners] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const refresh = useCallback(async () => {
        if (!persisted) return;
        try { setState(await workspaceApi.meetPreview(nodeId)); } catch (error) { setMessage({ severity: "info", text: `${error.message} Save the lesson schedule, then retry.` }); }
    }, [nodeId, persisted]);
    useEffect(() => { void refresh(); }, [refresh]);
    if (!persisted) return <Alert severity="info">Save the lesson schedule, then create its Google Meet.</Alert>;
    const connection = state?.connection;
    const calendarAuthorized = connection?.grantedCapabilities?.includes("calendar_events");
    const attendanceAuthorized = connection?.grantedCapabilities?.includes("meet_attendance");
    const session = state?.session;
    const connect = async (capabilities) => {
        setBusy(true); setMessage(null);
        try { const result = await workspaceApi.connect({ capabilities, returnTo: window.location.pathname + window.location.search }); window.location.assign(result.authorizationUrl); }
        catch (error) { setMessage({ severity: "error", text: error.message }); }
        finally { setBusy(false); }
    };
    const create = async () => {
        setBusy(true); setMessage(null);
        try {
            const saveResult = await beforeCreate?.();
            if (saveResult?.ok === false) {
                throw saveResult.error || new Error("Save the lesson schedule before creating the Meet.");
            }
            const result = await workspaceApi.createMeet(nodeId, { inviteLearners, operationId: crypto.randomUUID() }); setState((current) => ({ ...current, session: result.session })); setMessage({ severity: result.created ? "success" : "info", text: result.created ? "Google Meet is ready." : "Google is generating the Meet link. It will retry automatically." });
        }
        catch (error) { setMessage({ severity: "error", text: error.message }); }
        finally { setBusy(false); }
    };
    return <Stack spacing={1.25}>
        {message && <Alert severity={message.severity}>{message.text}</Alert>}
        {connection && !connection.available && <Alert severity="info">Google Workspace is not configured for this deployment.</Alert>}
        {connection?.available && (!connection.connected || !calendarAuthorized) && <Button variant="outlined" disabled={busy} onClick={() => connect(["calendar_events"])}>Connect Google Calendar</Button>}
        {connection?.available && calendarAuthorized && !attendanceAuthorized && <Button variant="text" disabled={busy} onClick={() => connect(["calendar_events", "meet_attendance"])}>Enable attendance and recordings (optional)</Button>}
        {session?.joinUrl ? <Stack spacing={1}><Alert severity="success">Google Meet ready. {session.calendarHtmlLink && <Link href={session.calendarHtmlLink} target="_blank" rel="noreferrer">Open Calendar event</Link>}</Alert>{attendanceAuthorized && <Button variant="outlined" disabled={busy} onClick={async () => { setBusy(true); try { const result = await workspaceApi.syncMeet(nodeId); setState((current) => ({ ...current, session: result.session })); } catch (error) { setMessage({ severity: "error", text: error.message }); } finally { setBusy(false); } }}>Synchronize attendance</Button>}</Stack> : calendarAuthorized && <><Alert severity={session?.creationState === "failed" ? "warning" : "info"}>{session?.creationState === "creating" ? "Google is creating this Meet link." : session?.creationState === "failed" ? session.lastSyncError || "Meet creation failed. Save and retry." : "Google Meet has not been created."}</Alert><FormControlLabel control={<Checkbox checked={inviteLearners} onChange={(event) => setInviteLearners(event.target.checked)} />} label="Invite enrolled learners" /><Button variant="contained" disabled={busy} onClick={create}>{session?.creationState === "failed" ? "Save & retry Google Meet" : "Save & create Google Meet"}</Button></>}
    </Stack>;
}
