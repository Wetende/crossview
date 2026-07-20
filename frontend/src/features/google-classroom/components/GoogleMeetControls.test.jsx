import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { workspaceApi } from "../api/classroomApi";
import GoogleMeetControls from "./GoogleMeetControls";

vi.mock("../api/classroomApi", () => ({
    workspaceApi: {
        meetPreview: vi.fn(),
        connect: vi.fn(),
        createMeet: vi.fn(),
    },
}));

const preview = {
    connection: {
        available: true,
        connected: true,
        grantedCapabilities: ["calendar_events", "meet_attendance"],
    },
    session: { joinUrl: "" },
    attendees: {
        eligible: 2,
        ineligible: 1,
        learners: [],
    },
};

describe("GoogleMeetControls", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        workspaceApi.meetPreview.mockResolvedValue(preview);
    });

    it("previews learners and requires an explicit invitation choice", async () => {
        workspaceApi.createMeet.mockResolvedValue({
            created: true,
            session: {
                joinUrl: "https://meet.google.com/abc-defg-hij",
                calendarHtmlLink: "https://calendar.google.com/event?eid=1",
            },
        });
        render(<GoogleMeetControls nodeId={91} persisted />);

        fireEvent.click(
            await screen.findByRole("button", {
                name: "Create unique Google Meet",
            }),
        );
        expect(
            await screen.findByText(/2 active learners/),
        ).toBeInTheDocument();
        fireEvent.click(
            screen.getByRole("checkbox", {
                name: "Send Calendar invitations to eligible active learners",
            }),
        );
        fireEvent.click(screen.getByRole("button", { name: "Create Meet" }));

        await waitFor(() => {
            expect(workspaceApi.createMeet).toHaveBeenCalledWith(
                91,
                expect.objectContaining({ inviteLearners: true }),
            );
        });
        expect(
            await screen.findByText("Google Meet and Calendar event created."),
        ).toBeInTheDocument();
    });

    it("does not attempt authorization before a lesson is persisted", () => {
        render(<GoogleMeetControls nodeId="temp_1" persisted={false} />);

        expect(screen.getByText(/Save this lesson first/)).toBeInTheDocument();
        expect(workspaceApi.meetPreview).not.toHaveBeenCalled();
    });
});
