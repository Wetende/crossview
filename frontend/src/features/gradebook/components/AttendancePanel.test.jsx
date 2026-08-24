import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { workspaceApi } from "@/features/google-workspace/api/workspaceApi";
import AttendancePanel from "./AttendancePanel";

vi.mock("@/features/google-workspace/api/workspaceApi", () => ({
    workspaceApi: {
        attendanceSessions: vi.fn(),
        connection: vi.fn(),
        attendance: vi.fn(),
        connect: vi.fn(),
        syncMeet: vi.fn(),
        overrideAttendance: vi.fn(),
        mapParticipant: vi.fn(),
    },
}));

const session = {
    id: 7,
    nodeId: 63,
    courseId: 4,
    title: "Project discussion",
    startsAt: "2026-08-21T07:26:00Z",
    endsAt: "2026-08-21T08:26:00Z",
    timezone: "Africa/Nairobi",
    providerEventId: "calendar-event",
    hasEnded: true,
    attendanceThresholdPercent: 50,
    attendanceCounts: {
        present: 1,
        absent: 0,
        excused: 0,
        pending: 0,
        needsReview: 1,
        total: 2,
    },
    unmatchedAttendanceCount: 1,
};

describe("AttendancePanel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.history.replaceState(
            {},
            "",
            "/instructor/programs/4/gradebook/?view=attendance",
        );
        workspaceApi.attendanceSessions.mockResolvedValue({
            results: [session],
        });
        workspaceApi.connection.mockResolvedValue({
            available: true,
            connected: true,
            grantedCapabilities: ["calendar_events", "meet_attendance"],
        });
        workspaceApi.attendance.mockResolvedValue({
            results: [
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
                    verifiedAt: null,
                    auditHistory: [
                        {
                            previousStatus: "absent",
                            resultingStatus: "excused",
                            reason: "Medical note",
                            actor: "Tutor One",
                            createdAt: "2026-08-21T09:00:00Z",
                        },
                    ],
                },
            ],
            unmatchedParticipants: [
                {
                    participantName: "participants/one",
                    externalUserId: "google-user-1",
                    displayName: "Unknown participant",
                    anonymous: false,
                },
            ],
        });
    });

    test("loads only the course sessions and exposes records needing review", async () => {
        render(<AttendancePanel program={{ id: 4 }} />);

        expect(
            await screen.findByText("Project discussion"),
        ).toBeInTheDocument();
        expect(workspaceApi.attendanceSessions).toHaveBeenCalledWith(4);
        expect(screen.getByText("2 need review")).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: "Review attendance" }),
        );

        expect(await screen.findByText("Amina Learner")).toBeInTheDocument();
        expect(screen.getByText("Needs review")).toBeInTheDocument();
        expect(screen.getByText("Unknown participant")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Show audit history (1)" }),
        ).toBeInTheDocument();
    });

    test("requests incremental Meet attendance authorization from Gradebook", async () => {
        workspaceApi.connection.mockResolvedValue({
            available: true,
            connected: true,
            grantedCapabilities: ["calendar_events"],
        });
        workspaceApi.connect.mockRejectedValue(
            new Error("Authorization paused"),
        );

        render(<AttendancePanel program={{ id: 4 }} />);

        fireEvent.click(
            await screen.findByRole("button", { name: "Enable attendance" }),
        );

        await waitFor(() =>
            expect(workspaceApi.connect).toHaveBeenCalledWith({
                capabilities: ["calendar_events", "meet_attendance"],
                returnTo: "/instructor/programs/4/gradebook/?view=attendance",
            }),
        );
    });

    test("synchronizes the selected completed meeting after authorization returns", async () => {
        window.history.replaceState(
            {},
            "",
            "/instructor/programs/4/gradebook/?view=attendance&session=63",
        );
        workspaceApi.connection.mockResolvedValue({
            available: true,
            connected: true,
            grantedCapabilities: ["calendar_events", "meet_attendance"],
            oauthCallback: { status: "success", message: "Connected." },
        });
        workspaceApi.syncMeet.mockResolvedValue({ session });

        render(<AttendancePanel program={{ id: 4 }} />);

        await waitFor(() =>
            expect(workspaceApi.syncMeet).toHaveBeenCalledWith(63),
        );
        expect(await screen.findByText("Amina Learner")).toBeInTheDocument();
    });
});
