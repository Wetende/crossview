import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import LearnerDetailPanel from "./LearnerDetailPanel";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("axios", () => ({ default: { get } }));

const learner = {
    enrollmentId: 7,
    userId: 11,
    name: "Amina Otieno",
    email: "amina@example.com",
    status: "active",
    learnerState: "stalled",
};

const detail = {
    ...learner,
    progressPercent: 40,
    completedNodes: 1,
    totalNodes: 3,
    enrolledAt: "2026-07-01T09:00:00Z",
    lastActivity: "2026-07-10T09:00:00Z",
    expiresAt: null,
    attention: {
        type: "stalled",
        title: "Learning has stalled",
        message: "No recent activity.",
        severity: "warning",
    },
    currentPosition: { nodeId: 2, title: "Lesson two", type: "Session" },
    upcomingDeadlines: [],
    recentActivity: [
        {
            title: "Lesson one",
            detail: "View",
            occurredAt: "2026-07-10T09:00:00Z",
        },
    ],
    publishedGrades: [],
    feedback: [],
    curriculumProgress: {
        results: [
            {
                nodeId: 1,
                title: "Lesson one",
                completed: true,
                completedAt: "2026-07-10T09:00:00Z",
            },
        ],
        pagination: { offset: 0, limit: 25, total: 1, hasMore: false },
    },
};

function Harness() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button onClick={() => setOpen(true)}>Open learner</button>
            <LearnerDetailPanel
                open={open}
                learner={learner}
                programId={42}
                onClose={() => setOpen(false)}
                onAction={() => {}}
            />
        </>
    );
}

describe("learner detail panel", () => {
    beforeEach(() => get.mockReset());

    test("loads details in one panel and restores focus after Escape", async () => {
        get.mockResolvedValue({ data: detail });
        render(<Harness />);
        const opener = screen.getByRole("button", { name: /open learner/i });

        opener.focus();
        fireEvent.click(opener);
        expect(
            screen.getByLabelText(/loading learner details/i),
        ).toBeInTheDocument();
        expect(
            await screen.findByText("Learning has stalled"),
        ).toBeInTheDocument();
        expect(screen.getByText("Lesson two")).toBeInTheDocument();
        expect(get).toHaveBeenCalledWith(
            "/api/learning-operations/programs/42/learners/7/",
        );

        fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
        await waitFor(() => expect(opener).toHaveFocus());
    });

    test("offers a retry when the detail request fails", async () => {
        get.mockRejectedValueOnce({
            response: { data: { detail: "Temporary failure" } },
        }).mockResolvedValueOnce({ data: detail });
        render(<Harness />);
        fireEvent.click(screen.getByRole("button", { name: /open learner/i }));

        expect(
            await screen.findByText("Temporary failure"),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /retry/i }));
        expect(
            await screen.findByText("Learning has stalled"),
        ).toBeInTheDocument();
    });
});
