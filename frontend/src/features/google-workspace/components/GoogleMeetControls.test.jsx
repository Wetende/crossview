import { createRef } from "react";
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
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
        cancelMeet: vi.fn(),
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

    test("automatically provisions a connected Google Meet lesson with a compact state", async () => {
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

        expect(
            await screen.findByText(
                "The Meet link will be created when this lesson is saved.",
            ),
        ).toBeInTheDocument();

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

        render(
            <GoogleMeetControls
                ref={controlsRef}
                nodeId={88}
                persisted
                automaticCreation
            />,
        );

        expect(
            await screen.findByRole("button", {
                name: "Connect Google Calendar",
            }),
        ).toBeInTheDocument();
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

    test("treats a Meet created by the lesson save as ready", async () => {
        workspaceApi.createMeet.mockResolvedValue({
            created: false,
            session: {
                joinUrl: "https://meet.google.com/already-created",
                creationState: "ready",
            },
        });
        const controlsRef = createRef();

        render(
            <GoogleMeetControls
                ref={controlsRef}
                nodeId={99}
                persisted
                automaticCreation
            />,
        );

        let result;
        await act(async () => {
            result = await controlsRef.current.provision();
        });

        expect(result.ok).toBe(true);
        expect(result.skipped).toBe(true);
        expect(result.session.creationState).toBe("ready");
    });

    test("links a completed Meet lesson to Gradebook attendance", async () => {
        workspaceApi.meetPreview.mockResolvedValue({
            session: {
                nodeId: 99,
                courseId: 5,
                joinUrl: "https://meet.google.com/already-created",
                creationState: "ready",
                hasEnded: true,
            },
        });

        render(<GoogleMeetControls nodeId={99} persisted automaticCreation />);

        expect(
            await screen.findByRole("link", { name: "Review attendance" }),
        ).toHaveAttribute(
            "href",
            "/instructor/programs/5/gradebook/?view=attendance&session=99",
        );
    });

    test("keeps cancellation in the Google Meet lesson editor", async () => {
        workspaceApi.meetPreview.mockResolvedValue({
            session: {
                nodeId: 99,
                courseId: 5,
                joinUrl: "https://meet.google.com/already-created",
                creationState: "ready",
                status: "scheduled",
                hasEnded: false,
            },
        });
        workspaceApi.cancelMeet.mockResolvedValue({
            session: {
                nodeId: 99,
                courseId: 5,
                status: "cancelled",
                joinUrl: "https://meet.google.com/already-created",
            },
        });

        render(<GoogleMeetControls nodeId={99} persisted automaticCreation />);

        fireEvent.click(
            await screen.findByRole("button", { name: "Cancel meeting" }),
        );

        await waitFor(() =>
            expect(workspaceApi.cancelMeet).toHaveBeenCalledWith(99),
        );
        expect(
            await screen.findAllByText("Google Meet cancelled."),
        ).not.toHaveLength(0);
    });
});
