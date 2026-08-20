import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { workspaceApi } from "../api/workspaceApi";
import LiveClassesDashboard from "./LiveClassesDashboard";

vi.mock("../api/workspaceApi", () => ({
    workspaceApi: {
        connection: vi.fn(),
        liveClasses: vi.fn(),
    },
}));

describe("LiveClassesDashboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        workspaceApi.liveClasses.mockResolvedValue({ results: [] });
        workspaceApi.connection.mockResolvedValue({
            available: true,
            connected: false,
            grantedCapabilities: [],
        });
    });

    test("places the one-time Calendar connection outside the lesson editor", async () => {
        render(<LiveClassesDashboard program={{ id: 42 }} />);

        expect(
            await screen.findByRole("button", {
                name: "Connect Google Calendar",
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Connect once before creating Google Meet lessons.",
            ),
        ).toBeInTheDocument();
    });
});
