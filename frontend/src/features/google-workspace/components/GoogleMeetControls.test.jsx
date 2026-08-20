import { createRef } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { workspaceApi } from "../api/workspaceApi";
import GoogleMeetControls from "./GoogleMeetControls";

vi.mock("../api/workspaceApi", () => ({
    workspaceApi: {
        connection: vi.fn(),
        meetPreview: vi.fn(),
        createMeet: vi.fn(),
        connect: vi.fn(),
        syncMeet: vi.fn(),
    },
}));

describe("GoogleMeetControls", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        workspaceApi.connection.mockResolvedValue({
            available: true,
            connected: true,
            grantedCapabilities: ["calendar_events"],
        });
        workspaceApi.meetPreview.mockRejectedValue(
            new Error("No scheduled session"),
        );
    });

    test("automatically provisions a connected Google Meet lesson without a second create button", async () => {
        workspaceApi.createMeet.mockResolvedValue({
            created: true,
            session: {
                joinUrl: "https://meet.google.com/abc-defg-hij",
                creationState: "ready",
            },
        });
        const controlsRef = createRef();

        render(
            <GoogleMeetControls
                ref={controlsRef}
                nodeId={77}
                persisted
                automaticCreation
            />,
        );

        await screen.findByText(
            "The Meet link will be created automatically when you create this lesson.",
        );
        expect(
            screen.queryByRole("button", { name: "Save & create Google Meet" }),
        ).not.toBeInTheDocument();

        let result;
        await act(async () => {
            result = await controlsRef.current.provision();
        });

        expect(result.ok).toBe(true);
        expect(workspaceApi.createMeet).toHaveBeenCalledWith(
            77,
            expect.objectContaining({ inviteLearners: false }),
        );
        await waitFor(() =>
            expect(screen.getByText(/Google Meet ready/)).toBeInTheDocument(),
        );
    });

    test("does not call Meet creation until Calendar access is connected", async () => {
        workspaceApi.connection.mockResolvedValue({
            available: true,
            connected: false,
            grantedCapabilities: [],
        });
        const controlsRef = createRef();

        render(
            <GoogleMeetControls
                ref={controlsRef}
                nodeId={88}
                persisted
                automaticCreation
            />,
        );

        await screen.findByRole("button", { name: "Connect Google Calendar" });
        let result;
        await act(async () => {
            result = await controlsRef.current.provision();
        });

        expect(result.ok).toBe(false);
        expect(workspaceApi.createMeet).not.toHaveBeenCalled();
        expect(
            screen.getByText(
                "Connect Google Calendar before creating this lesson.",
            ),
        ).toBeInTheDocument();
    });
});
