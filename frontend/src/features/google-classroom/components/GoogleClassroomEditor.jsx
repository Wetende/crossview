import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Divider,
    FormControl,
    InputLabel,
    Link,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import { classroomApi } from "../api/classroomApi";
import RosterPreviewPanel from "./RosterPreviewPanel";

export default function GoogleClassroomEditor({ program }) {
    const [status, setStatus] = useState(null);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedResources, setSelectedResources] = useState([]);
    const [newCourse, setNewCourse] = useState({ name: program.name, section: "" });
    const [preview, setPreview] = useState(null);
    const [syncPreview, setSyncPreview] = useState(null);
    const [history, setHistory] = useState(null);
    const [message, setMessage] = useState(null);
    const [busy, setBusy] = useState(false);

    const run = useCallback(async (action, successMessage = "") => {
        setBusy(true);
        setMessage(null);
        try {
            const result = await action();
            if (successMessage) {
                setMessage({ severity: "success", text: successMessage });
            }
            return result;
        } catch (error) {
            setMessage({ severity: "error", text: error.message });
            return null;
        } finally {
            setBusy(false);
        }
    }, []);

    const loadStatus = useCallback(async () => {
        const result = await run(() => classroomApi.linkStatus(program.id));
        if (result) {
            setStatus(result);
        }
    }, [program.id, run]);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    const connect = async (capabilities = ["course_manage"]) => {
        const result = await run(() =>
            classroomApi.connect({
                capabilities,
                returnTo: `/instructor/programs/${program.id}/manage/?tab=classroom`,
            }),
        );
        if (result?.authorizationUrl) {
            window.location.assign(result.authorizationUrl);
        }
    };

    const hasCapabilities = (...capabilities) =>
        capabilities.every((capability) =>
            (status?.connection?.grantedCapabilities || []).includes(capability),
        );

    const authorizeCapabilities = async (capabilities) => {
        await connect(capabilities);
        return false;
    };

    const discoverCourses = async () => {
        const result = await run(() => classroomApi.courses());
        if (result) {
            setCourses(result.results || []);
        }
    };

    const linkCourse = async (courseId = selectedCourse) => {
        if (!courseId) {
            setMessage({ severity: "warning", text: "Select a Classroom course first." });
            return;
        }
        const result = await run(
            () => classroomApi.linkCourse(program.id, courseId),
            "Google Classroom course linked.",
        );
        if (result) {
            await loadStatus();
        }
    };

    const createCourse = async () => {
        const result = await run(() => classroomApi.createCourse(newCourse));
        if (result?.id) {
            await linkCourse(result.id);
        }
    };

    const previewRoster = async () => {
        if (!hasCapabilities("roster_read", "roster_manage")) {
            await authorizeCapabilities(["roster_read", "roster_manage"]);
            return;
        }
        const result = await run(() => classroomApi.previewRoster(program.id));
        if (result) {
            setPreview(result);
        }
    };

    const applyRoster = async () => {
        const result = await run(
            () => classroomApi.applyRoster(program.id, preview.confirmationToken),
            "Roster additions and invitations applied.",
        );
        if (result) {
            setPreview(null);
        }
    };

    const publishResources = async () => {
        const resourceLookup = new Map(
            (program.googleClassroom?.publishableResources || []).map((item) => [
                `${item.localType}:${item.localId}`,
                item,
            ]),
        );
        const resources = selectedResources.map((key) => resourceLookup.get(key));
        const capabilities = ["content"];
        if (resources.some((item) => ["assignment", "quiz"].includes(item?.localType))) {
            capabilities.push("grades", "roster_read");
        }
        if (!hasCapabilities(...capabilities)) {
            await authorizeCapabilities(capabilities);
            return;
        }
        const result = await run(
            () => classroomApi.publishResources(program.id, resources),
            "Selected course resources synchronized.",
        );
        if (result) {
            setSelectedResources([]);
        }
    };

    const previewSynchronization = async () => {
        if (!hasCapabilities("content")) {
            await authorizeCapabilities(["content"]);
            return;
        }
        const result = await run(() => classroomApi.previewSync(program.id));
        if (result) setSyncPreview(result);
    };

    const resolveResourceDrift = async (item) => {
        const result = await run(
            () =>
                classroomApi.publishResources(program.id, [
                    {
                        localType: item.localType,
                        localId: item.localId,
                        force: true,
                    },
                ]),
            "The course-platform version was synchronized to Classroom.",
        );
        if (result) await previewSynchronization();
    };

    const unlinkMissingResource = async (item) => {
        const result = await run(
            () => classroomApi.unlinkResource(program.id, item.mappingId),
            "The missing Classroom post was unlinked. Publish it again only if you want a new post.",
        );
        if (result) await previewSynchronization();
    };

    const linked = status?.link?.connected;
    const connected = status?.connection?.connected;

    return (
        <Stack spacing={3}>
            <Stack spacing={0.5}>
                <Typography variant="h5" fontWeight="bold">Google Classroom</Typography>
                <Typography color="text.secondary">
                    Use Classroom as a companion while this course platform remains authoritative for
                    enrollment, content, submissions, grades and progress.
                </Typography>
            </Stack>
            {message && <Alert severity={message.severity}>{message.text}</Alert>}
            {status && !status.configurationAvailable && (
                <Alert severity="info">
                    Google Classroom is not configured for this deployment.
                </Alert>
            )}
            {status?.configurationAvailable && !connected && (
                <Button variant="contained" onClick={() => connect()} disabled={busy}>
                    Connect Google teacher account
                </Button>
            )}
            {connected && (
                <Stack spacing={2}>
                    <Alert severity="success">
                        Connected as {status.connection.googleEmail}
                    </Alert>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button variant="outlined" onClick={discoverCourses} disabled={busy}>
                            Find my Classroom courses
                        </Button>
                        <Button
                            color="error"
                            onClick={async () => {
                                const result = await run(() => classroomApi.disconnect());
                                if (result) await loadStatus();
                            }}
                            disabled={busy}
                        >
                            Disconnect Google
                        </Button>
                    </Stack>
                </Stack>
            )}

            {connected && !linked && (
                <Stack spacing={2}>
                    {courses.length > 0 && (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                            <FormControl fullWidth>
                                <InputLabel>Classroom course</InputLabel>
                                <Select
                                    value={selectedCourse}
                                    label="Classroom course"
                                    onChange={(event) => setSelectedCourse(event.target.value)}
                                >
                                    {courses.map((course) => (
                                        <MenuItem key={course.id} value={course.id}>
                                            {course.name} · {course.courseState}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button variant="contained" onClick={() => linkCourse()} disabled={busy}>
                                Link selected course
                            </Button>
                        </Stack>
                    )}
                    <Divider>or create a class</Divider>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <TextField
                            label="Class name"
                            value={newCourse.name}
                            onChange={(event) => setNewCourse({ ...newCourse, name: event.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Section"
                            value={newCourse.section}
                            onChange={(event) => setNewCourse({ ...newCourse, section: event.target.value })}
                            fullWidth
                        />
                        <Button variant="outlined" onClick={createCourse} disabled={busy || !newCourse.name}>
                            Create and link
                        </Button>
                    </Stack>
                </Stack>
            )}

            {linked && (
                <Stack spacing={3}>
                    <Alert severity={status.link.needsActivation ? "warning" : "success"}>
                        Linked to {status.link.name}. {status.link.needsActivation && "Activate the provisioned class in Google Classroom before inviting learners."}
                    </Alert>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <Typography>Class code: <strong>{status.link.enrollmentCode || "Not available"}</strong></Typography>
                        {status.link.alternateLink && (
                            <Link href={status.link.alternateLink} target="_blank" rel="noreferrer">Open Classroom</Link>
                        )}
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button variant="outlined" onClick={previewRoster} disabled={busy}>Preview roster</Button>
                        <Button
                            variant="outlined"
                            onClick={previewSynchronization}
                            disabled={busy}
                        >
                            Preview sync
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => run(() => classroomApi.syncNow(program.id), "Synchronization processed.")}
                            disabled={busy}
                        >
                            Sync now
                        </Button>
                    </Stack>
                    <RosterPreviewPanel preview={preview} onApply={applyRoster} applying={busy} />
                    {syncPreview && (
                        <Stack spacing={1}>
                            <Alert severity={syncPreview.resources?.some((item) => ["drift", "remote_deleted"].includes(item.status)) ? "warning" : "info"}>
                                Sync preview: {(syncPreview.resources || []).filter((item) => item.status === "drift").length} changed and {(syncPreview.resources || []).filter((item) => item.status === "remote_deleted").length} deleted resource(s).
                            </Alert>
                            {(syncPreview.resources || []).filter((item) => ["drift", "remote_deleted"].includes(item.status)).map((item) => (
                                <Stack key={item.mappingId} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                                    <Typography variant="body2" sx={{ flex: 1 }}>
                                        {item.localType} {item.localId}: {item.status.replaceAll("_", " ")}
                                    </Typography>
                                    {item.status === "drift" ? (
                                        <Button size="small" onClick={() => resolveResourceDrift(item)} disabled={busy}>
                                            Resync course-platform version
                                        </Button>
                                    ) : (
                                        <Button size="small" color="warning" onClick={() => unlinkMissingResource(item)} disabled={busy}>
                                            Unlink missing post
                                        </Button>
                                    )}
                                </Stack>
                            ))}
                        </Stack>
                    )}
                    <Divider />
                    <Typography variant="h6">Publish course content</Typography>
                    <FormControl fullWidth>
                        <InputLabel>Lessons, topics and assessments</InputLabel>
                        <Select
                            multiple
                            value={selectedResources}
                            label="Lessons, topics and assessments"
                            onChange={(event) => setSelectedResources(event.target.value)}
                        >
                            {(program.googleClassroom?.publishableResources || []).map((item) => {
                                const key = `${item.localType}:${item.localId}`;
                                return <MenuItem key={key} value={key}>{item.title} · {item.localType}</MenuItem>;
                            })}
                        </Select>
                    </FormControl>
                    <Button variant="contained" onClick={publishResources} disabled={busy || !selectedResources.length}>
                        Publish selected resources
                    </Button>
                    <Divider />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Button
                            variant="text"
                            onClick={async () => {
                                const result = await run(() => classroomApi.history(program.id));
                                if (result) setHistory(result);
                            }}
                        >
                            View sync history
                        </Button>
                        <Button
                            color="error"
                            onClick={async () => {
                                const result = await run(() => classroomApi.unlinkCourse(program.id));
                                if (result) await loadStatus();
                            }}
                            disabled={busy}
                        >
                            Unlink course
                        </Button>
                    </Stack>
                    {history && (
                        <Box sx={{ maxHeight: 240, overflow: "auto" }}>
                            {(history.jobs || []).map((job) => (
                                <Typography key={job.id} variant="body2">
                                    {job.type}: {job.status}{job.errorCategory ? ` · ${job.errorCategory}` : ""}
                                </Typography>
                            ))}
                        </Box>
                    )}
                </Stack>
            )}
        </Stack>
    );
}
