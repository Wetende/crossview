import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ScheduledSessionRenderer from "./ScheduledSessionRenderer";

const baseSession = {
    id: 1,
    title: "Weekly workshop",
    startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    timezone: "Africa/Nairobi",
    status: "scheduled",
    hasEnded: false,
    calendarUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE",
};

describe("ScheduledSessionRenderer", () => {
    it("renders a Google Meet pre-join stage and opens the provider", () => {
        render(
            <ScheduledSessionRenderer
                session={{
                    ...baseSession,
                    kind: "live_meeting",
                    provider: "google_meet",
                    startsAt: new Date(
                        Date.now() - 5 * 60 * 1000,
                    ).toISOString(),
                    endsAt: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
                    isJoinable: true,
                    hasJoinDetails: true,
                    joinUrl: "https://meet.google.com/abc-defg-hij",
                }}
            />,
        );

        expect(screen.getByText("Google Meet")).toBeInTheDocument();
        expect(
            screen.getByText(/camera and microphone open in Google Meet/i),
        ).toBeInTheDocument();
        const joinLink = screen.getByRole("link", {
            name: /join google meet/i,
        });
        expect(joinLink).toHaveAttribute(
            "href",
            "https://meet.google.com/abc-defg-hij",
        );
        expect(joinLink).toHaveAttribute("target", "_blank");
    });

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
        expect(screen.getByText("Google Meet")).toBeInTheDocument();
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
