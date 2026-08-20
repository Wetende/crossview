import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import { workspaceApi } from "../api/workspaceApi";

const classState = (item, now = new Date()) => {
    if (item.status === "cancelled") return "cancelled";
    if (item.creationState === "failed" || item.lastSyncError) return "failed";
    if (item.creationState !== "ready") return "not_created";
    if (new Date(item.endsAt) < now) return "past";
    return "upcoming";
};

const stateLabel = {
    upcoming: "Upcoming",
    past: "Past",
    cancelled: "Cancelled",
    failed: "Failed",
    not_created: "Not created",
};

export default function LiveClassesDashboard({ program }) {
    const [classes, setClasses] = useState([]);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState(null);
    const [review, setReview] = useState(null);
    const [mapping, setMapping] = useState({});
    const [overrides, setOverrides] = useState({});

    const load = useCallback(async () => {
        try {
            const result = await workspaceApi.liveClasses();
            setClasses(
                (result.results || []).filter(
                    (item) => Number(item.courseId) === Number(program.id),
                ),
            );
            setError("");
        } catch (loadError) {
            setError(loadError.message);
        }
    }, [program.id]);

    useEffect(() => {
        void load();
    }, [load]);

    const grouped = useMemo(() => {
        const result = { upcoming: [], past: [], cancelled: [], failed: [], not_created: [] };
        classes.forEach((item) => result[classState(item)].push(item));
        return result;
    }, [classes]);

    const run = async (item, action) => {
        setBusyId(item.id);
        setError("");
        try {
            await action();
            await load();
        } catch (actionError) {
            setError(actionError.message);
        } finally {
            setBusyId(null);
        }
    };

    const openAttendance = async (item) => {
        setBusyId(item.id);
        try {
            const [attendance, status] = await Promise.all([
                workspaceApi.attendance(item.nodeId),
                workspaceApi.meetStatus(item.nodeId),
            ]);
            setReview({ item, roster: attendance.results || [], unmatched: status.unmatchedParticipants || [] });
        } catch (reviewError) {
            setError(reviewError.message);
        } finally {
            setBusyId(null);
        }
    };

    if (error && classes.length === 0) return <Alert severity="error">{error}</Alert>;

    return (
        <Stack spacing={2}>
            <Box>
                <Typography variant="h5" fontWeight={700}>Live Classes</Typography>
                <Typography color="text.secondary">Create and manage course-linked Google Meet lessons.</Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            {classes.length === 0 && <Alert severity="info">Add a Google Meet lesson in Curriculum to see it here.</Alert>}
            {Object.entries(grouped).map(([state, items]) => items.length > 0 && (
                <Stack key={state} spacing={1}>
                    <Typography variant="subtitle1" fontWeight={700}>{stateLabel[state]}</Typography>
                    {items.map((item) => (
                        <Card key={item.id} variant="outlined">
                            <CardContent>
                                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                                    <Box>
                                        <Typography fontWeight={700}>{item.title}</Typography>
                                        {item.sectionTitle && <Typography variant="caption" color="text.secondary">{item.sectionTitle}</Typography>}
                                        <Typography variant="body2" color="text.secondary">
                                            {new Date(item.startsAt).toLocaleString()} – {new Date(item.endsAt).toLocaleString()} ({item.timezone})
                                        </Typography>
                                    </Box>
                                    <Chip size="small" label={stateLabel[state]} color={state === "failed" ? "error" : state === "upcoming" ? "success" : "default"} />
                                </Stack>
                                {item.lastSyncError && <Alert severity="warning" sx={{ mt: 1 }}>{item.lastSyncError}</Alert>}
                            </CardContent>
                            <CardActions sx={{ flexWrap: "wrap" }}>
                                {item.joinUrl && state === "upcoming" && <Button component="a" href={item.joinUrl} target="_blank" rel="noreferrer">Start</Button>}
                                <Button component="a" href={`/instructor/programs/${program.id}/manage/?tab=curriculum&node=${item.nodeId}`}>Edit / reschedule</Button>
                                {(state === "failed" || state === "not_created") && <Button disabled={busyId === item.id} onClick={() => run(item, () => workspaceApi.createMeet(item.nodeId, { inviteLearners: item.inviteLearners, operationId: crypto.randomUUID() }))}>Retry creation</Button>}
                                {item.calendarHtmlLink && <Button component="a" href={item.calendarHtmlLink} target="_blank" rel="noreferrer">Calendar</Button>}
                                {item.recordingUrl && <Button component="a" href={item.recordingUrl} target="_blank" rel="noreferrer">Recording</Button>}
                                {item.providerEventId && <Button disabled={busyId === item.id} onClick={() => openAttendance(item)}>Attendance</Button>}
                                {state !== "cancelled" && <Button color="error" disabled={busyId === item.id} onClick={() => run(item, () => workspaceApi.cancelSession(item.nodeId))}>Cancel</Button>}
                            </CardActions>
                        </Card>
                    ))}
                </Stack>
            ))}

            <Dialog open={Boolean(review)} onClose={() => setReview(null)} fullWidth maxWidth="md">
                <DialogTitle>Attendance review</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {(review?.roster || []).map((row) => {
                            const override = overrides[row.enrollmentId] || {};
                            const selectedStatus = override.status || row.status;
                            const changed = selectedStatus !== row.status;
                            return (
                                <Card key={row.enrollmentId} variant="outlined">
                                    <CardContent>
                                        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
                                            <Box><Typography>{row.learner.name}</Typography><Typography variant="caption" color="text.secondary">{row.learner.email}</Typography></Box>
                                            <Typography>{row.status} · {row.attendancePercent}%</Typography>
                                        </Stack>
                                        <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 1 }}>
                                            <TextField select size="small" label="Attendance decision" value={selectedStatus} onChange={(event) => setOverrides((current) => ({ ...current, [row.enrollmentId]: { ...current[row.enrollmentId], status: event.target.value } }))} sx={{ minWidth: 190 }}>
                                                <MenuItem value="pending" disabled>Pending</MenuItem>
                                                <MenuItem value="present">Present</MenuItem>
                                                <MenuItem value="absent">Absent</MenuItem>
                                                <MenuItem value="excused">Excused</MenuItem>
                                            </TextField>
                                            {changed && <TextField fullWidth size="small" label="Reason for override" value={override.reason || ""} onChange={(event) => setOverrides((current) => ({ ...current, [row.enrollmentId]: { ...current[row.enrollmentId], reason: event.target.value } }))} />}
                                            {changed && <Button disabled={!override.reason?.trim()} onClick={async () => { await workspaceApi.overrideAttendance(review.item.nodeId, row.enrollmentId, { status: selectedStatus, reason: override.reason }); setOverrides((current) => ({ ...current, [row.enrollmentId]: {} })); await openAttendance(review.item); }}>Apply</Button>}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        {(review?.unmatched || []).map((row) => (
                            <Card key={row.participantName} variant="outlined">
                                <CardContent>
                                    <Typography fontWeight={700}>{row.displayName}</Typography>
                                    {row.anonymous ? <Alert severity="info" sx={{ mt: 1 }}>Anonymous participants cannot be mapped permanently.</Alert> : (
                                        <Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ mt: 1 }}>
                                            <TextField select fullWidth size="small" label="Map to learner" value={mapping[row.participantName] || ""} onChange={(event) => setMapping((current) => ({ ...current, [row.participantName]: event.target.value }))}>
                                                {(review?.roster || []).map((learner) => <MenuItem key={learner.enrollmentId} value={learner.enrollmentId}>{learner.learner.name}</MenuItem>)}
                                            </TextField>
                                            <Button disabled={!mapping[row.participantName]} onClick={async () => { await workspaceApi.mapParticipant(review.item.nodeId, { externalUserId: row.externalUserId, enrollmentId: mapping[row.participantName] }); await workspaceApi.syncMeet(review.item.nodeId); await openAttendance(review.item); }}>Map & resync</Button>
                                        </Stack>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        {(review?.unmatched || []).length === 0 && <Alert severity="success">No unmatched participants.</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setReview(null)}>Close</Button></DialogActions>
            </Dialog>
        </Stack>
    );
}
