import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { Alert, Divider, Stack, Typography } from "@mui/material";

import { workspaceApi } from "@/features/google-workspace/api/workspaceApi";
import AttendanceBulkDecision from "./attendance/AttendanceBulkDecision";
import AttendanceRosterReview from "./attendance/AttendanceRosterReview";
import AttendanceSessionList from "./attendance/AttendanceSessionList";
import GoogleAttendanceReview from "./attendance/GoogleAttendanceReview";

const ATTENDANCE_PROPS = [
    "attendanceSessions",
    "selectedAttendance",
    "googleWorkspaceConnection",
];

export default function AttendancePanel({
    program,
    attendanceSessions = [],
    selectedAttendance = null,
    googleWorkspaceConnection = null,
}) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [status, setStatus] = useState("present");
    const [reason, setReason] = useState("");
    const [mapping, setMapping] = useState({});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const automaticSyncAttempted = useRef(false);
    const session = selectedAttendance?.session;
    const roster = selectedAttendance?.results || [];
    const physical = session?.kind === "in_person_session";
    const beforeStart = session
        ? new Date() < new Date(session.startsAt)
        : false;

    const actionOptions = useMemo(
        () => ({
            preserveScroll: true,
            only: ATTENDANCE_PROPS,
            onStart: () => {
                setBusy(true);
                setError("");
            },
            onError: (errors) =>
                setError(
                    Object.values(errors || {})[0] || "The action failed.",
                ),
            onFinish: () => setBusy(false),
        }),
        [],
    );

    const selectSession = (nodeId) => {
        setSelectedIds([]);
        setMapping({});
        router.visit(
            `/instructor/programs/${program.id}/gradebook/?view=attendance&session=${nodeId}`,
            {
                only: ATTENDANCE_PROPS,
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const markAttendance = (enrollmentIds, nextStatus, nextReason) => {
        if (!session) return;
        router.post(
            `/instructor/programs/${program.id}/gradebook/attendance/${session.nodeId}/mark/`,
            {
                enrollmentIds,
                status: nextStatus,
                reason: nextReason,
            },
            {
                ...actionOptions,
                onSuccess: () => {
                    setSelectedIds([]);
                    setReason("");
                },
            },
        );
    };

    const synchronize = useCallback(() => {
        if (!session) return;
        router.post(
            `/instructor/programs/${program.id}/gradebook/attendance/${session.nodeId}/sync/`,
            {},
            actionOptions,
        );
    }, [actionOptions, program.id, session]);

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

    const mapParticipant = (participant, enrollmentId) => {
        if (!session) return;
        router.post(
            `/instructor/programs/${program.id}/gradebook/attendance/${session.nodeId}/map-google/`,
            {
                externalUserId: participant.externalUserId,
                enrollmentId,
            },
            actionOptions,
        );
    };

    useEffect(() => {
        if (
            automaticSyncAttempted.current ||
            googleWorkspaceConnection?.oauthCallback?.status !== "success" ||
            !googleWorkspaceConnection?.grantedCapabilities?.includes(
                "meet_attendance",
            ) ||
            !session?.hasEnded ||
            !session?.providerEventId
        ) {
            return;
        }
        automaticSyncAttempted.current = true;
        synchronize();
    }, [googleWorkspaceConnection, session, synchronize]);

    return (
        <Stack spacing={3}>
            <Stack spacing={0.5}>
                <Typography variant="h6" fontWeight={700}>
                    Attendance
                </Typography>
                <Typography color="text.secondary">
                    Review verified Google Meet evidence or record an audited
                    decision for an in-person class.
                </Typography>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
            <AttendanceSessionList
                sessions={attendanceSessions}
                selectedNodeId={session?.nodeId}
                onSelect={selectSession}
            />
            {session && (
                <>
                    <Divider />
                    <Stack spacing={2}>
                        <Typography variant="h6">{session.title}</Typography>
                        <AttendanceBulkDecision
                            selectedCount={selectedIds.length}
                            status={status}
                            reason={reason}
                            disabled={physical && beforeStart}
                            busy={busy}
                            onStatusChange={setStatus}
                            onReasonChange={setReason}
                            onApply={() =>
                                markAttendance(selectedIds, status, reason)
                            }
                        />
                        {!physical && (
                            <GoogleAttendanceReview
                                connection={googleWorkspaceConnection}
                                session={session}
                                unmatched={
                                    selectedAttendance.unmatchedParticipants ||
                                    []
                                }
                                roster={roster}
                                mapping={mapping}
                                busy={busy}
                                onConnect={connectAttendance}
                                onSync={synchronize}
                                onMappingChange={(key, value) =>
                                    setMapping((current) => ({
                                        ...current,
                                        [key]: value,
                                    }))
                                }
                                onMap={mapParticipant}
                            />
                        )}
                        <AttendanceRosterReview
                            rows={roster}
                            session={session}
                            selectable
                            selectedIds={selectedIds}
                            onToggle={(enrollmentId) =>
                                setSelectedIds((current) =>
                                    current.includes(enrollmentId)
                                        ? current.filter(
                                              (value) => value !== enrollmentId,
                                          )
                                        : [...current, enrollmentId],
                                )
                            }
                            onToggleAll={() =>
                                setSelectedIds((current) =>
                                    current.length === roster.length
                                        ? []
                                        : roster.map((row) => row.enrollmentId),
                                )
                            }
                        />
                    </Stack>
                </>
            )}
        </Stack>
    );
}
