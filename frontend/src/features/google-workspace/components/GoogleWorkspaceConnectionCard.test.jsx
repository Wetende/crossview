import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { workspaceApi } from "../api/workspaceApi";
import GoogleWorkspaceConnectionCard from "./GoogleWorkspaceConnectionCard";

vi.mock("../api/workspaceApi", () => ({
    workspaceApi: {
        connection: vi.fn(),
        connect: vi.fn(),
    },
}));

describe("GoogleWorkspaceConnectionCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("shows one clean connection action without diagnostics", async () => {
        workspaceApi.connection.mockResolvedValue({
            available: true,
            connected: false,
            grantedCapabilities: [],
        });

        render(<GoogleWorkspaceConnectionCard />);

        expect(
            await screen.findByRole("button", {
                name: "Connect Google Calendar",
            }),
        ).toBeInTheDocument();
        expect(screen.queryByText(/Diagnostic:/)).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Test access" }),
        ).not.toBeInTheDocument();
    });

    test("shows the connected account without raw permission details", async () => {
        workspaceApi.connection.mockResolvedValue({
            available: true,
            connected: true,
            googleEmail: "teacher@example.test",
            grantedCapabilities: ["calendar_events"],
        });

        render(<GoogleWorkspaceConnectionCard />);

        expect(await screen.findByText("Connected")).toBeInTheDocument();
        expect(screen.getByText("teacher@example.test")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Reconnect" }),
        ).toBeInTheDocument();
        expect(screen.queryByText(/scope/i)).not.toBeInTheDocument();
    });

    test("uses a short callback failure message", async () => {
        workspaceApi.connection.mockResolvedValue({
            available: true,
            connected: false,
            grantedCapabilities: [],
            oauthCallback: {
                status: "error",
                message: "Google Calendar could not be connected. Try again.",
            },
        });

        render(<GoogleWorkspaceConnectionCard />);

        expect(
            await screen.findByText(
                "Google Calendar could not be connected. Try again.",
            ),
        ).toBeInTheDocument();
        expect(screen.queryByText(/callback/i)).not.toBeInTheDocument();
    });
});
