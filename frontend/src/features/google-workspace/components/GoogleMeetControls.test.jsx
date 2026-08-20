import { createRef } from "react";
import { act, render } from "@testing-library/react";
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

    test("automatically provisions a connected Google Meet lesson without rendering editor controls", async () => {
        workspaceApi.createMeet.mockResolvedValue({
            created: true,
            session: {
                joinUrl: "https://meet.google.com/abc-defg-hij",
                creationState: "ready",
            },
        });
        const controlsRef = createRef();

        const { container } = render(
            <GoogleMeetControls
                ref={controlsRef}
                nodeId={77}
                persisted
                automaticCreation
            />,
        );

        expect(container).toBeEmptyDOMElement();

        let result;
        await act(async () => {
            result = await controlsRef.current.provision();
        });

        expect(result.ok).toBe(true);
        expect(workspaceApi.createMeet).toHaveBeenCalledWith(
            77,
            expect.objectContaining({ inviteLearners: false }),
        );
    });

    test("does not call Meet creation until Calendar access is connected", async () => {
        workspaceApi.connection.mockResolvedValue({
            available: true,
            connected: false,
            grantedCapabilities: [],
        });
        const controlsRef = createRef();

        const { container } = render(
            <GoogleMeetControls
                ref={controlsRef}
                nodeId={88}
                persisted
                automaticCreation
            />,
        );

        expect(container).toBeEmptyDOMElement();
        let result;
        await act(async () => {
            result = await controlsRef.current.provision();
        });

        expect(result.ok).toBe(false);
        expect(workspaceApi.createMeet).not.toHaveBeenCalled();
        expect(result.error.message).toBe(
            "Connect Google Calendar before creating this lesson.",
        );
    });
});
