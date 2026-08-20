import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { workspaceApi } from "../api/workspaceApi";
import GoogleWorkspaceConnectionCard from "./GoogleWorkspaceConnectionCard";

vi.mock("../api/workspaceApi", () => ({
    workspaceApi: {
        connection: vi.fn(),
        connect: vi.fn(),
        testConnection: vi.fn(),
    },
}));

describe("GoogleWorkspaceConnectionCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "info").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("shows a dashboard connection action when no credential is saved", async () => {
        workspaceApi.connection.mockResolvedValue({
            available: true,
            connected: false,
            status: "disconnected",
            grantedCapabilities: [],
            diagnostics: { calendarAccess: { status: "not_connected" } },
        });

        render(<GoogleWorkspaceConnectionCard />);

        expect(
            await screen.findByRole("button", {
                name: "Connect Google Calendar",
            }),
        ).toBeInTheDocument();
        expect(screen.getByText("Account not saved")).toBeInTheDocument();
        expect(
            screen.getByText(/Diagnostic: not_connected/),
        ).toBeInTheDocument();
    });

    test("runs a live access test and shows the confirmed state", async () => {
        const connected = {
            available: true,
            connected: true,
            status: "connected",
            googleEmail: "teacher@example.test",
            grantedCapabilities: ["calendar_events"],
            diagnostics: { calendarAccess: { status: "granted" } },
        };
        workspaceApi.connection.mockResolvedValue(connected);
        workspaceApi.testConnection.mockResolvedValue({
            ok: true,
            diagnostic: { status: "confirmed" },
            connection: connected,
        });

        render(<GoogleWorkspaceConnectionCard />);

        fireEvent.click(
            await screen.findByRole("button", { name: "Test access" }),
        );

        expect(
            await screen.findByText(/Live Calendar access confirmed/),
        ).toBeInTheDocument();
        expect(workspaceApi.testConnection).toHaveBeenCalledOnce();
        expect(screen.getByText(/Diagnostic: confirmed/)).toBeInTheDocument();
    });
});
