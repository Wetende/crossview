import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import ProgramList from "./Index";

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock("@/layouts/DashboardLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/features/reports", () => ({
    ReportToolbar: () => <div>Progress report</div>,
}));

const enrollments = [
    {
        id: 1,
        programId: 10,
        programName: "DevOps Engineering",
        progressPercent: 68,
        learnerState: "active",
        completedNodes: 8,
        totalNodes: 12,
    },
    {
        id: 2,
        programId: 20,
        programName: "Cloud Foundations",
        progressPercent: 0,
        learnerState: "not_started",
        completedNodes: 0,
        totalNodes: 6,
    },
];

describe("student course collection", () => {
    test("features the most relevant active course and offers accessible filters", () => {
        render(<ProgramList enrollments={enrollments} />);

        expect(
            screen.getByRole("heading", { name: "Your learning focus" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "DevOps Engineering" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Not started (1)" }),
        ).toHaveAttribute("aria-pressed", "false");

        fireEvent.click(
            screen.getByRole("button", { name: "Not started (1)" }),
        );

        expect(
            screen.getByRole("heading", { name: "Cloud Foundations" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("heading", { name: "DevOps Engineering" }),
        ).not.toBeInTheDocument();
    });
});
