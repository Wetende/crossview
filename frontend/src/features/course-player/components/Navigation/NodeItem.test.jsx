import { render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import NodeItem from "./NodeItem";
import { formatUnlockDate } from "./lockStatus";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

const renderNode = (node, props = {}) =>
    render(
        <ul>
            <NodeItem
                node={node}
                enrollmentId={9}
                isActive={false}
                isExpanded
                onToggle={vi.fn()}
                {...props}
            />
        </ul>,
    );

describe("NodeItem", () => {
    test("shows the lesson type line and an open circle while incomplete", () => {
        renderNode({
            id: 2,
            title: "Deployment models",
            nodeType: "lesson",
            properties: { lesson_type: "video", duration: 9 },
            isCompleted: false,
            isLocked: false,
            url: "/student/programs/9/session/2/",
        });

        const link = screen.getByRole("link", { name: /deployment models/i });
        expect(link).toHaveAttribute("href", "/student/programs/9/session/2/");
        expect(within(link).getByText("Video lesson · 9 min")).toBeInTheDocument();
        expect(within(link).getByTestId("lesson-status-incomplete")).toBeInTheDocument();
        expect(within(link).queryByTestId("lesson-status-complete")).not.toBeInTheDocument();
    });

    test("shows a check when the lesson is complete", () => {
        renderNode({
            id: 3,
            title: "Foundation quiz",
            nodeType: "quiz",
            properties: { questions: [{}, {}, {}, {}, {}] },
            isCompleted: true,
            isLocked: false,
        });

        const link = screen.getByRole("link", { name: /foundation quiz/i });
        expect(within(link).getByText("Quiz · 5 questions")).toBeInTheDocument();
        expect(within(link).getByTestId("lesson-status-complete")).toBeInTheDocument();
    });

    test("shows why a locked lesson is locked and when it opens, without a link", () => {
        const unlocksAt = "2026-10-03T09:00:00";
        renderNode({
            id: 4,
            title: "Release strategies",
            nodeType: "lesson",
            properties: { lesson_type: "text" },
            isCompleted: false,
            isLocked: true,
            lockReason: "drip",
            lockReasonText: "This content unlocks later",
            unlocksAt,
            url: "/student/programs/9/session/4/",
        });

        const expected = `This content unlocks later · Unlocks ${formatUnlockDate(unlocksAt)}`;
        expect(screen.getByText(expected)).toBeInTheDocument();
        // Only the icon and title are dimmed; the reason stays fully readable.
        expect(screen.getByText("Release strategies")).toHaveStyle({ opacity: "0.7" });
        expect(screen.getByText(expected)).not.toHaveStyle({ opacity: "0.7" });
        expect(
            screen.queryByRole("link", { name: /release strategies/i }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /release strategies/i }),
        ).toHaveAttribute("aria-disabled", "true");
    });

    test("falls back to a mapped lock reason when no text is sent", () => {
        renderNode({
            id: 5,
            title: "Rollback drills",
            nodeType: "lesson",
            isCompleted: false,
            isLocked: true,
            lockReason: "sequential",
        });

        expect(
            screen.getByText("Complete earlier content first"),
        ).toBeInTheDocument();
    });

    test("formats unlock dates with the date and time", () => {
        const formatted = formatUnlockDate("2026-10-03T09:00:00");
        expect(formatted).toMatch(/2026/);
        expect(formatted).toMatch(/0?9[:.]00/);
    });
});
