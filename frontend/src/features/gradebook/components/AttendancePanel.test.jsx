import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { router } from "@inertiajs/react";

import { workspaceApi } from "@/features/google-workspace/api/workspaceApi";
import AttendancePanel from "./AttendancePanel";

vi.mock("@inertiajs/react", () => ({
    router: {
        visit: vi.fn(),
        post: vi.fn(),
    },
}));

vi.mock("@/features/google-workspace/api/workspaceApi", () => ({
    workspaceApi: {
        connect: vi.fn(),
    },
}));

const physicalSession = {
    id: 7,
    nodeId: 63,
    title: "Practical workshop",
    startsAt: "2026-08-21T07:26:00Z",
    endsAt: "2026-08-21T08:26:00Z",
    kind: "in_person_session",
    provider: "physical",
    hasEnded: true,
    attendanceCounts: {
        present: 0,
        absent: 0,
        excused: 0,
        pending: 0,
        needsReview: 2,
        total: 2,
    },
};

const meetSession = {
    ...physicalSession,
    id: 8,
    nodeId: 64,
    title: "Project discussion",
    kind: "live_meeting",
    provider: "google_meet",
    providerEventId: "calendar-event",
    unmatchedAttendanceCount: 1,
};

const roster = [
    {
        enrollmentId: 12,
        learner: {
            name: "Amina Learner",
            email: "amina@example.test",
        },
        status: "pending",
        source: null,
        attendedSeconds: 0,
        attendancePercent: 0,
        auditHistory: [],
    },
    {
        enrollmentId: 13,
        learner: {
            name: "Brian Learner",
            email: "brian@example.test",
        },
        status: "present",
        source: "instructor_override",
        attendedSeconds: 1800,
        attendancePercent: 50,
        auditHistory: [
            {
                previousStatus: "pending",
                resultingStatus: "present",
                reason: "Signed register",
                actor: "Tutor One",
                createdAt: "2026-08-21T09:00:00Z",
            },
        ],
    },
];

describe("AttendancePanel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.history.replaceState(
            {},
            "",
            "/instructor/programs/4/gradebook/?view=attendance",
        );
    });

    test("selects sessions through an Inertia partial visit", () => {
        render(
            <AttendancePanel
                program={{ id: 4 }}
                attendanceSessions={[physicalSession]}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Review attendance" }),
        );

        expect(router.visit).toHaveBeenCalledWith(
            "/instructor/programs/4/gradebook/?view=attendance&session=63",
            expect.objectContaining({
                only: [
                    "attendanceSessions",
                    "selectedAttendance",
                    "googleWorkspaceConnection",
                ],
            }),
        );
    });

    test("bulk marks an in-person roster without Google controls", () => {
        render(
            <AttendancePanel
                program={{ id: 4 }}
                attendanceSessions={[physicalSession]}
                selectedAttendance={{
                    session: physicalSession,
                    results: roster,
                    unmatchedParticipants: [],
                }}
                googleWorkspaceConnection={null}
            />,
        );

        expect(screen.getByText("Amina Learner")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Enable attendance" }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Synchronize Google Meet" }),
        ).not.toBeInTheDocument();

        fireEvent.click(screen.getByLabelText("Select all 2 learners"));
        fireEvent.change(screen.getByLabelText("Audited reason"), {
            target: { value: "Signed class register" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Mark 2" }));

        expect(router.post).toHaveBeenCalledWith(
            "/instructor/programs/4/gradebook/attendance/63/mark/",
            {
                enrollmentIds: [12, 13],
                status: "present",
                reason: "Signed class register",
            },
            expect.any(Object),
        );
    });

    test("keeps Google synchronization, mapping, and audit review isolated", () => {
        render(
            <AttendancePanel
                program={{ id: 4 }}
                attendanceSessions={[meetSession]}
                selectedAttendance={{
                    session: meetSession,
                    results: roster,
                    unmatchedParticipants: [
                        {
                            displayName: "Unknown participant",
                            externalUserId: "google-user-1",
                            anonymous: false,
                        },
                    ],
                }}
                googleWorkspaceConnection={{
                    connected: true,
                    grantedCapabilities: ["calendar_events", "meet_attendance"],
                }}
            />,
        );

        expect(
            screen.getByRole("button", { name: "Synchronize Google Meet" }),
        ).toBeInTheDocument();
        expect(screen.getByText("Unknown participant")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Show audit history (1)" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByText("Attendance opens at the scheduled start time."),
        ).not.toBeInTheDocument();
    });

    test("requests incremental Meet attendance authorization", async () => {
        workspaceApi.connect.mockRejectedValue(
            new Error("Authorization paused"),
        );
        render(
            <AttendancePanel
                program={{ id: 4 }}
                attendanceSessions={[meetSession]}
                selectedAttendance={{
                    session: meetSession,
                    results: roster,
                    unmatchedParticipants: [],
                }}
                googleWorkspaceConnection={{
                    connected: true,
                    grantedCapabilities: ["calendar_events"],
                }}
            />,
        );

        fireEvent.click(
            screen.getByRole("button", { name: "Enable attendance" }),
        );

        await waitFor(() =>
            expect(workspaceApi.connect).toHaveBeenCalledWith({
                capabilities: ["calendar_events", "meet_attendance"],
                returnTo: "/instructor/programs/4/gradebook/?view=attendance",
            }),
        );
    });
});
