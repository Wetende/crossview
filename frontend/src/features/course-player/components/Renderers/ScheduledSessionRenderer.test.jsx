import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ScheduledSessionRenderer from "./ScheduledSessionRenderer";

const baseSession = {
    id: 1,
    title: "Weekly workshop",
    startsAt: "2026-07-21T09:00:00Z",
    endsAt: "2026-07-21T10:00:00Z",
    timezone: "Africa/Nairobi",
    status: "scheduled",
    hasEnded: false,
    calendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE",
};

describe("ScheduledSessionRenderer", () => {
    it("does not expose a meeting link before the server opens joining", () => {
        render(
            <ScheduledSessionRenderer
                session={{
                    ...baseSession,
                    kind: "live_meeting",
                    provider: "google_meet",
                    isJoinable: false,
                    joinUrl: null,
                }}
            />,
        );

        expect(
            screen.queryByRole("link", { name: /join meeting/i }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: /add to calendar/i }),
        ).toBeInTheDocument();
    });

    it("shows the physical location instead of a join action", () => {
        render(
            <ScheduledSessionRenderer
                session={{
                    ...baseSession,
                    kind: "in_person_session",
                    provider: "physical",
                    venue: "Skills Centre",
                    room: "Lab 2",
                    address: "10 Learning Road",
                    isJoinable: false,
                }}
            />,
        );

        expect(screen.getByText("Skills Centre")).toBeInTheDocument();
        expect(screen.getByText("Lab 2")).toBeInTheDocument();
        expect(
            screen.queryByRole("link", { name: /join/i }),
        ).not.toBeInTheDocument();
    });
});
