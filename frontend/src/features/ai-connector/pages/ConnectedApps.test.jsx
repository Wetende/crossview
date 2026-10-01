import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import ConnectedApps from "./ConnectedApps";

const { mockPost, mockUsePage } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    mockUsePage: vi.fn(() => ({ props: {} })),
}));

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    router: { post: (...args) => mockPost(...args) },
    usePage: () => mockUsePage(),
}));

vi.mock("@/layouts/DashboardLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

const connection = {
    id: 7,
    name: "ChatGPT",
    scopes: ["Read courses", "Save confirmed course changes"],
    canWrite: true,
    connectedAt: "2026-09-20T10:00:00Z",
    lastActiveAt: "2026-09-24T08:30:00Z",
};

describe("ConnectedApps", () => {
    beforeEach(() => mockPost.mockClear());

    test("shows the connector URL and each connection", () => {
        render(
            <ConnectedApps
                connections={[connection]}
                canConnect
                connectorUrl="https://lms.test/mcp"
            />,
        );

        expect(screen.getByLabelText("Connector URL")).toHaveValue("https://lms.test/mcp");
        expect(screen.getByText("ChatGPT")).toBeInTheDocument();
        expect(screen.getByText("Save confirmed course changes")).toBeInTheDocument();
    });

    test("asks for confirmation before disconnecting", () => {
        render(<ConnectedApps connections={[connection]} canConnect connectorUrl="https://lms.test/mcp" />);

        fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
        expect(mockPost).not.toHaveBeenCalled();
        expect(screen.getByText("Disconnect ChatGPT?")).toBeInTheDocument();

        const buttons = screen.getAllByRole("button", { name: "Disconnect" });
        fireEvent.click(buttons[buttons.length - 1]);
        expect(mockPost).toHaveBeenCalledWith(
            "/account/connected-apps/7/disconnect/",
            {},
            expect.any(Object),
        );
    });

    test("shows the disconnection confirmation", () => {
        mockUsePage.mockReturnValueOnce({
            props: { flash: [{ type: "success", message: "The AI app was disconnected." }] },
        });
        render(<ConnectedApps connections={[]} canConnect connectorUrl="https://lms.test/mcp" />);

        expect(screen.getByText("The AI app was disconnected.")).toBeInTheDocument();
    });

    test("explains when the account cannot connect", () => {
        render(<ConnectedApps connections={[]} canConnect={false} connectorUrl="https://lms.test/mcp" />);

        expect(screen.getByText("Only instructors and administrators can connect AI apps.")).toBeInTheDocument();
        expect(screen.queryByLabelText("Connector URL")).not.toBeInTheDocument();
        expect(screen.getByText("No AI apps are connected to your account.")).toBeInTheDocument();
    });
});
