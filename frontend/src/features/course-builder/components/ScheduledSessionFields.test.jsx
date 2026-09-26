import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import ScheduledSessionFields from "./ScheduledSessionFields";

vi.mock(
    "@/features/google-workspace/components/GoogleMeetControls",
    async () => {
        const { forwardRef, useImperativeHandle } = await import("react");

        return {
            default: forwardRef(function MockGoogleMeetControls(_, ref) {
                useImperativeHandle(ref, () => ({
                    provision: vi.fn(),
                }));
                return null;
            }),
        };
    },
);

const values = {
    sessionKind: "live_meeting",
    sessionProvider: "google_meet",
    startDate: "2026-08-22",
    endDate: "2026-08-22",
    startTime: "09:00",
    endTime: "10:00",
    timezone: "Africa/Nairobi",
    sessionVisibility: "private",
    reminderMinutes: 10,
    attendanceThreshold: 75,
    preClassNotes: "",
};

describe("ScheduledSessionFields", () => {
    test("keeps the dedicated Google Meet editor focused on meeting details", () => {
        render(
            <ScheduledSessionFields
                values={values}
                errors={{}}
                lessonType="google_meet"
                nodeId={42}
                persisted
                googleMeetControlsRef={createRef()}
                onBlur={vi.fn()}
                onChange={vi.fn()}
                onSaveBeforeMeet={vi.fn()}
            />,
        );

        [
            "Start date",
            "End date",
            "Start time",
            "End time",
            "Timezone",
            "Event visibility",
        ].forEach((label) => {
            expect(screen.getAllByText(label).length).toBeGreaterThan(0);
        });

        [
            "Activity",
            "Provider",
            "Reminder minutes",
            "Attendance threshold (%)",
            "Pre-class notes",
            "Connect Google Calendar",
        ].forEach((label) => {
            expect(screen.queryByText(label)).not.toBeInTheDocument();
        });
    });
});
