import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Collapse,
    Divider,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import { workspaceApi } from "@/features/google-workspace/api/workspaceApi";

const statusColor = {
    present: "success",
    absent: "error",
    excused: "info",
    pending: "warning",
    "needs-review": "warning",
};

const statusLabel = {
    present: "Present",
    absent: "Absent",
    excused: "Excused",
    pending: "Pending",
    "needs-review": "Needs review",
};

const sourceLabel = {
    provider: "Google Meet",
    instructor_override: "Instructor override",
    import: "Imported",
};

const durationLabel = (seconds = 0) => {
    const minutes = Math.floor(Number(seconds) / 60);
    const remainder = Number(seconds) % 60;
    if (!minutes) return `${remainder} sec`;
    return `${minutes} min${remainder ? ` ${remainder} sec` : ""}`;
};

const formatDateTime = (value) =>
    value
        ? new Intl.DateTimeFormat(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
          }).format(new Date(value))
        : "Not synchronized";

const reviewStatus = (row, session) =>
    row.status === "pending" && session?.hasEnded ? "needs-review" : row.status;

export default function AttendancePanel({ program }) {
    const initialSessionId = useMemo(() => {
        if (typeof window === "undefined") return null;
        return new URLSearchParams(window.location.search).get("session");
    }, []);
    const [sessions, setSessions] = useState([]);
    const [connection, setConnection] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(initialSessionId);
    const [roster, setRoster] = useState([]);
    const [unmatched, setUnmatched] = useState([]);
    const [overrides, setOverrides] = useState({});
    const [mapping, setMapping] = useState({});
    const [expandedAudit, setExpandedAudit] = useState({});
    const [loading, setLoading] = useState(true);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const automaticSyncAttempted = useRef(false);
    const reviewRequestId = useRef(0);

    const selectedSession = sessions.find(
        (session) => String(session.nodeId) === String(selectedNodeId),
    );
    const attendanceAuthorized =
        connection?.grantedCapabilities?.includes("meet_attendance");

    const loadSessions = useCallback(async () => {
        const [sessionResult, connectionResult] = await Promise.all([
            workspaceApi.attendanceSessions(program.id),
            workspaceApi.connection(),
        ]);
        setSessions(sessionResult.results || []);
        setConnection(connectionResult);
        return { sessionResult, connectionResult };
    }, [program.id]);

    const loadReview = useCallback(async (nodeId) => {
        if (!nodeId) return;
        const requestId = ++reviewRequestId.current;
        setReviewLoading(true);
        try {
            const attendanceResult = await workspaceApi.attendance(nodeId);
            if (requestId !== reviewRequestId.current) return;
            setRoster(attendanceResult.results || []);
            setUnmatched(attendanceResult.unmatchedParticipants || []);
        } catch (loadError) {
            if (requestId === reviewRequestId.current) throw loadError;
        } finally {
            if (requestId === reviewRequestId.current) setReviewLoading(false);
        }
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        loadSessions()
            .catch((loadError) => {
                if (active) setError(loadError.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [loadSessions]);

    useEffect(() => {
        if (!selectedNodeId) {
            setRoster([]);
            setUnmatched([]);
            return;
        }
        setError("");
        void loadReview(selectedNodeId).catch((loadError) =>
            setError(loadError.message),
        );
        return () => {
            reviewRequestId.current += 1;
        };
    }, [loadReview, selectedNodeId]);

    useEffect(() => {
        if (
            automaticSyncAttempted.current ||
            connection?.oauthCallback?.status !== "success" ||
            !attendanceAuthorized ||
            !selectedSession?.hasEnded ||
            !selectedSession?.providerEventId
        ) {
            return;
        }
        automaticSyncAttempted.current = true;
        setBusy(true);
        workspaceApi
            .syncMeet(selectedSession.nodeId)
            .then(() =>
                Promise.all([
                    loadSessions(),
                    loadReview(selectedSession.nodeId),
                ]),
            )
            .catch((syncError) => setError(syncError.message))
            .finally(() => setBusy(false));
    }, [
        attendanceAuthorized,
        connection,
        loadReview,
        loadSessions,
        selectedSession,
    ]);

    const connectAttendance = async () => {
        setBusy(true);
        setError("");
        try {
            const result = await workspaceApi.connect({
                capabilities: ["calendar_events", "meet_attendance"],
                returnTo: window.location.pathname + window.location.search,
            });
            window.location.assign(result.authorizationUrl);
        } catch (connectError) {
            setError(connectError.message);
            setBusy(false);
        }
    };

    const selectSession = (nodeId) => {
        if (busy || String(nodeId) === String(selectedNodeId)) return;
        reviewRequestId.current += 1;
        setRoster([]);
        setUnmatched([]);
        setReviewLoading(true);
        setSelectedNodeId(String(nodeId));
        setOverrides({});
        setMapping({});
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("view", "attendance");
            url.searchParams.set("session", nodeId);
            window.history.replaceState({}, "", url);
        }
    };

    const synchronize = async () => {
        if (!selectedSession) return;
        setBusy(true);
        setError("");
        try {
            await workspaceApi.syncMeet(selectedSession.nodeId);
            await Promise.all([
                loadSessions(),
                loadReview(selectedSession.nodeId),
            ]);
        } catch (syncError) {
            setError(syncError.message);
        } finally {
            setBusy(false);
        }
    };

    const applyOverride = async (row) => {
        const override = overrides[row.enrollmentId] || {};
        setBusy(true);
        setError("");
        try {
            await workspaceApi.overrideAttendance(
                selectedSession.nodeId,
                row.enrollmentId,
                { status: override.status, reason: override.reason },
            );
            setOverrides((current) => ({
                ...current,
                [row.enrollmentId]: {},
            }));
            await Promise.all([
                loadSessions(),
                loadReview(selectedSession.nodeId),
            ]);
        } catch (overrideError) {
            setError(overrideError.message);
        } finally {
            setBusy(false);
        }
    };

    const mapParticipant = async (participant) => {
        const participantKey =
            participant.externalUserId || participant.participantName;
        setBusy(true);
        setError("");
        try {
            await workspaceApi.mapParticipant(selectedSession.nodeId, {
                externalUserId: participant.externalUserId,
                enrollmentId: mapping[participantKey],
            });
            await workspaceApi.syncMeet(selectedSession.nodeId);
            await Promise.all([
                loadSessions(),
                loadReview(selectedSession.nodeId),
            ]);
        } catch (mappingError) {
            setError(mappingError.message);
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <Typography color="text.secondary">Loading attendance…</Typography>
        );
    }

    return (
        <Stack spacing={2.5}>
            <Box>
                <Typography variant="h5" fontWeight={700}>
                    Google Meet attendance
                </Typography>
                <Typography color="text.secondary">
                    Verified participation is separate from Calendar invitations
                    and grades.
                </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}
            {connection?.available && !attendanceAuthorized && (
                <Alert
                    severity="info"
                    action={
                        <Button
                            color="inherit"
                            disabled={busy}
                            onClick={connectAttendance}
                        >
                            Enable attendance
                        </Button>
                    }
                >
                    Authorize Google Meet attendance when you are ready to
                    review a completed class.
                </Alert>
            )}

            {sessions.length === 0 ? (
                <Alert severity="info">
                    This course has no Google Meet lessons yet. Add one in
                    Curriculum.
                </Alert>
            ) : (
                <Stack spacing={1}>
                    {sessions.map((session) => {
                        const counts = session.attendanceCounts || {};
                        const needsReview =
                            Number(counts.needsReview || 0) +
                            Number(session.unmatchedAttendanceCount || 0);
                        const selected =
                            String(selectedNodeId) === String(session.nodeId);
                        return (
                            <Card
                                key={session.id}
                                variant="outlined"
                                sx={{
                                    borderColor: selected
                                        ? "primary.main"
                                        : undefined,
                                }}
                            >
                                <CardContent>
                                    <Stack
                                        direction={{ xs: "column", md: "row" }}
                                        justifyContent="space-between"
                                        gap={2}
                                    >
                                        <Box>
                                            <Typography fontWeight={700}>
                                                {session.title}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {formatDateTime(
                                                    session.startsAt,
                                                )}{" "}
                                                · {session.timezone}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Last sync:{" "}
                                                {formatDateTime(
                                                    session.lastSyncAt,
                                                )}
                                            </Typography>
                                        </Box>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            flexWrap="wrap"
                                            useFlexGap
                                        >
                                            <Chip
                                                size="small"
                                                label={`${counts.present || 0} present`}
                                                color="success"
                                                variant="outlined"
                                            />
                                            <Chip
                                                size="small"
                                                label={`${counts.absent || 0} absent`}
                                                color="error"
                                                variant="outlined"
                                            />
                                            {Number(counts.excused || 0) >
                                                0 && (
                                                <Chip
                                                    size="small"
                                                    label={`${counts.excused} excused`}
                                                    color="info"
                                                    variant="outlined"
                                                />
                                            )}
                                            <Chip
                                                size="small"
                                                label={
                                                    session.lastSyncError
                                                        ? "Sync failed"
                                                        : session.lastSyncAt
                                                          ? "Synchronized"
                                                          : "Awaiting synchronization"
                                                }
                                                color={
                                                    session.lastSyncError
                                                        ? "error"
                                                        : "default"
                                                }
                                                variant="outlined"
                                            />
                                            {needsReview > 0 && (
                                                <Chip
                                                    size="small"
                                                    label={`${needsReview} need review`}
                                                    color="warning"
                                                />
                                            )}
                                            <Button
                                                size="small"
                                                disabled={busy}
                                                variant={
                                                    selected
                                                        ? "contained"
                                                        : "outlined"
                                                }
                                                onClick={() =>
                                                    selectSession(
                                                        session.nodeId,
                                                    )
                                                }
                                            >
                                                Review attendance
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>
            )}

            {selectedSession && (
                <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack spacing={2}>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            gap={1}
                        >
                            <Box>
                                <Typography variant="h6" fontWeight={700}>
                                    {selectedSession.title}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Attendance threshold:{" "}
                                    {selectedSession.attendanceThresholdPercent ||
                                        50}
                                    %
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                                {selectedSession.calendarHtmlLink && (
                                    <Button
                                        component="a"
                                        href={selectedSession.calendarHtmlLink}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Calendar
                                    </Button>
                                )}
                                {selectedSession.recordingUrl && (
                                    <Button
                                        component="a"
                                        href={selectedSession.recordingUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Recording
                                    </Button>
                                )}
                                {attendanceAuthorized ? (
                                    <Button
                                        variant="outlined"
                                        disabled={busy}
                                        onClick={synchronize}
                                    >
                                        Synchronize
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        disabled={busy}
                                        onClick={connectAttendance}
                                    >
                                        Enable attendance
                                    </Button>
                                )}
                            </Stack>
                        </Stack>

                        <Divider />

                        {reviewLoading && (
                            <Typography role="status" color="text.secondary">
                                Loading class attendance…
                            </Typography>
                        )}

                        {roster.map((row) => {
                            const displayedStatus = reviewStatus(
                                row,
                                selectedSession,
                            );
                            const override = overrides[row.enrollmentId] || {};
                            const selectedStatus =
                                override.status || row.status;
                            const changed = selectedStatus !== row.status;
                            const audits = row.auditHistory || [];
                            return (
                                <Card key={row.enrollmentId} variant="outlined">
                                    <CardContent>
                                        <Stack spacing={1.5}>
                                            <Stack
                                                direction={{
                                                    xs: "column",
                                                    md: "row",
                                                }}
                                                justifyContent="space-between"
                                                gap={1}
                                            >
                                                <Box>
                                                    <Typography
                                                        fontWeight={700}
                                                    >
                                                        {row.learner.name}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {row.learner.email}
                                                    </Typography>
                                                </Box>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                    flexWrap="wrap"
                                                    useFlexGap
                                                >
                                                    <Chip
                                                        size="small"
                                                        color={
                                                            statusColor[
                                                                displayedStatus
                                                            ]
                                                        }
                                                        label={
                                                            statusLabel[
                                                                displayedStatus
                                                            ]
                                                        }
                                                    />
                                                    <Typography variant="body2">
                                                        {durationLabel(
                                                            row.attendedSeconds,
                                                        )}{" "}
                                                        ·{" "}
                                                        {row.attendancePercent}%
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                    >
                                                        {sourceLabel[
                                                            row.source
                                                        ] ||
                                                            "No verified Google identity"}
                                                    </Typography>
                                                </Stack>
                                            </Stack>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Verified:{" "}
                                                {formatDateTime(row.verifiedAt)}
                                            </Typography>
                                            {row.source ===
                                                "instructor_override" &&
                                                audits[0]?.reason && (
                                                    <Typography variant="body2">
                                                        Override reason:{" "}
                                                        {audits[0].reason}
                                                    </Typography>
                                                )}
                                            <Stack
                                                direction={{
                                                    xs: "column",
                                                    md: "row",
                                                }}
                                                spacing={1}
                                            >
                                                <TextField
                                                    select
                                                    size="small"
                                                    label="Attendance decision"
                                                    value={selectedStatus}
                                                    onChange={(event) =>
                                                        setOverrides(
                                                            (current) => ({
                                                                ...current,
                                                                [row.enrollmentId]:
                                                                    {
                                                                        ...current[
                                                                            row
                                                                                .enrollmentId
                                                                        ],
                                                                        status: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                            }),
                                                        )
                                                    }
                                                    sx={{ minWidth: 190 }}
                                                >
                                                    <MenuItem
                                                        value="pending"
                                                        disabled
                                                    >
                                                        Pending
                                                    </MenuItem>
                                                    <MenuItem value="present">
                                                        Present
                                                    </MenuItem>
                                                    <MenuItem value="absent">
                                                        Absent
                                                    </MenuItem>
                                                    <MenuItem value="excused">
                                                        Excused
                                                    </MenuItem>
                                                </TextField>
                                                {changed && (
                                                    <>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            label="Required override reason"
                                                            value={
                                                                override.reason ||
                                                                ""
                                                            }
                                                            onChange={(event) =>
                                                                setOverrides(
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        [row.enrollmentId]:
                                                                            {
                                                                                ...current[
                                                                                    row
                                                                                        .enrollmentId
                                                                                ],
                                                                                reason: event
                                                                                    .target
                                                                                    .value,
                                                                            },
                                                                    }),
                                                                )
                                                            }
                                                        />
                                                        <Button
                                                            disabled={
                                                                busy ||
                                                                !override.reason?.trim()
                                                            }
                                                            onClick={() =>
                                                                applyOverride(
                                                                    row,
                                                                )
                                                            }
                                                        >
                                                            Apply
                                                        </Button>
                                                    </>
                                                )}
                                            </Stack>
                                            {audits.length > 0 && (
                                                <Box>
                                                    <Button
                                                        size="small"
                                                        onClick={() =>
                                                            setExpandedAudit(
                                                                (current) => ({
                                                                    ...current,
                                                                    [row.enrollmentId]:
                                                                        !current[
                                                                            row
                                                                                .enrollmentId
                                                                        ],
                                                                }),
                                                            )
                                                        }
                                                    >
                                                        {expandedAudit[
                                                            row.enrollmentId
                                                        ]
                                                            ? "Hide"
                                                            : "Show"}{" "}
                                                        audit history (
                                                        {audits.length})
                                                    </Button>
                                                    <Collapse
                                                        in={Boolean(
                                                            expandedAudit[
                                                                row.enrollmentId
                                                            ],
                                                        )}
                                                    >
                                                        <Stack
                                                            spacing={0.5}
                                                            sx={{ mt: 1 }}
                                                        >
                                                            {audits.map(
                                                                (
                                                                    audit,
                                                                    index,
                                                                ) => (
                                                                    <Typography
                                                                        key={`${audit.createdAt}-${index}`}
                                                                        variant="caption"
                                                                        color="text.secondary"
                                                                    >
                                                                        {formatDateTime(
                                                                            audit.createdAt,
                                                                        )}{" "}
                                                                        —{" "}
                                                                        {
                                                                            audit.actor
                                                                        }
                                                                        :{" "}
                                                                        {
                                                                            audit.previousStatus
                                                                        }{" "}
                                                                        →{" "}
                                                                        {
                                                                            audit.resultingStatus
                                                                        }
                                                                        .{" "}
                                                                        {
                                                                            audit.reason
                                                                        }
                                                                    </Typography>
                                                                ),
                                                            )}
                                                        </Stack>
                                                    </Collapse>
                                                </Box>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        <Box>
                            <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                gutterBottom
                            >
                                Unmatched Google participants
                            </Typography>
                            {unmatched.length === 0 ? (
                                <Alert severity="success">
                                    No unmatched participants.
                                </Alert>
                            ) : (
                                <Stack spacing={1}>
                                    {unmatched.map((participant, index) => {
                                        const participantKey =
                                            participant.externalUserId ||
                                            participant.participantName ||
                                            index;
                                        return (
                                            <Card
                                                key={participantKey}
                                                variant="outlined"
                                            >
                                                <CardContent>
                                                    <Typography
                                                        fontWeight={700}
                                                    >
                                                        {participant.displayName ||
                                                            "Anonymous participant"}
                                                    </Typography>
                                                    {participant.anonymous ? (
                                                        <Alert
                                                            severity="warning"
                                                            sx={{ mt: 1 }}
                                                        >
                                                            Anonymous
                                                            participants cannot
                                                            be permanently
                                                            mapped. Make an
                                                            audited learner
                                                            override above and
                                                            explain the evidence
                                                            in the reason.
                                                        </Alert>
                                                    ) : (
                                                        <Stack
                                                            direction={{
                                                                xs: "column",
                                                                md: "row",
                                                            }}
                                                            spacing={1}
                                                            sx={{ mt: 1 }}
                                                        >
                                                            <TextField
                                                                select
                                                                fullWidth
                                                                size="small"
                                                                label="Permanently map to learner"
                                                                value={
                                                                    mapping[
                                                                        participantKey
                                                                    ] || ""
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    setMapping(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            [participantKey]:
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                        }),
                                                                    )
                                                                }
                                                            >
                                                                {roster.map(
                                                                    (
                                                                        learner,
                                                                    ) => (
                                                                        <MenuItem
                                                                            key={
                                                                                learner.enrollmentId
                                                                            }
                                                                            value={
                                                                                learner.enrollmentId
                                                                            }
                                                                        >
                                                                            {
                                                                                learner
                                                                                    .learner
                                                                                    .name
                                                                            }
                                                                        </MenuItem>
                                                                    ),
                                                                )}
                                                            </TextField>
                                                            <Button
                                                                disabled={
                                                                    busy ||
                                                                    !mapping[
                                                                        participantKey
                                                                    ]
                                                                }
                                                                onClick={() =>
                                                                    mapParticipant(
                                                                        participant,
                                                                    )
                                                                }
                                                            >
                                                                Map and resync
                                                            </Button>
                                                        </Stack>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                    </Stack>
                </Paper>
            )}
        </Stack>
    );
}
