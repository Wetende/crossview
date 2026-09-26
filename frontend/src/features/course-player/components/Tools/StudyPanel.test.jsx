import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import StudyPanel from "./StudyPanel";

vi.mock("@inertiajs/react", () => ({
    router: { post: vi.fn(), reload: vi.fn() },
    usePage: () => ({ props: { flash: {} } }),
}));

const discussions = [
    {
        id: 1,
        title: "Blue-green rollouts",
        content: "When should we switch traffic?",
        isPinned: false,
        isLocked: false,
        createdAt: "2026-09-20T10:00:00Z",
        user: { id: 5, name: "Amina Learner", isInstructor: false },
        posts: [
            {
                id: 11,
                content: "Once the health checks pass on the idle stack.",
                createdAt: "2026-09-20T11:00:00Z",
                user: { id: 7, name: "Grace Mentor", isInstructor: true },
            },
        ],
    },
    {
        id: 2,
        title: "Pipeline caching",
        content: "Which layers are worth caching?",
        isPinned: false,
        isLocked: false,
        createdAt: "2026-09-21T10:00:00Z",
        user: { id: 6, name: "Brian Learner", isInstructor: false },
        posts: [],
    },
];

const renderPanel = (props = {}) =>
    render(
        <StudyPanel
            nodeId={3}
            enrollmentId={9}
            discussions={discussions}
            notes={[]}
            currentVideoTimestamp={null}
            onClose={vi.fn()}
            {...props}
        />,
    );

describe("StudyPanel", () => {
    test("filters threads by title, content and replies", () => {
        renderPanel();
        const search = screen.getByRole("textbox", {
            name: "Search discussions",
        });

        fireEvent.change(search, { target: { value: "CACHING" } });
        expect(screen.getByText("Pipeline caching")).toBeInTheDocument();
        expect(screen.queryByText("Blue-green rollouts")).not.toBeInTheDocument();

        fireEvent.change(search, { target: { value: "health checks" } });
        expect(screen.getByText("Blue-green rollouts")).toBeInTheDocument();
        expect(screen.queryByText("Pipeline caching")).not.toBeInTheDocument();

        fireEvent.change(search, { target: { value: "kubernetes" } });
        expect(screen.getByText(/no discussions match/i)).toBeInTheDocument();
    });

    test("offers a comment button next to the search", () => {
        renderPanel();

        fireEvent.click(screen.getByRole("button", { name: "Comment" }));
        expect(screen.getByPlaceholderText("Enter message")).toBeInTheDocument();
    });

    test("marks instructor replies with an Instructor chip", () => {
        renderPanel();

        expect(screen.getAllByText("Instructor")).toHaveLength(1);
        expect(screen.getByText("Grace Mentor")).toBeInTheDocument();
    });

    test("seeks the video when a note timestamp is clicked", () => {
        const onSeek = vi.fn();
        renderPanel({
            onSeek,
            notes: [
                {
                    id: 4,
                    content: "Compare with canary releases",
                    videoTimestamp: 125,
                    createdAt: "2026-09-22T10:00:00Z",
                },
            ],
        });

        fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
        fireEvent.click(
            screen.getByRole("button", { name: "Jump to 2:05 in the video" }),
        );

        expect(onSeek).toHaveBeenCalledWith(125);
    });

    test("shows note timestamps as plain text when the lesson has no video", () => {
        renderPanel({
            notes: [
                {
                    id: 4,
                    content: "Compare with canary releases",
                    videoTimestamp: 125,
                    createdAt: "2026-09-22T10:00:00Z",
                },
            ],
        });

        fireEvent.click(screen.getByRole("tab", { name: "Notes" }));

        expect(screen.getByText("@ 2:05")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: /jump to/i }),
        ).not.toBeInTheDocument();
    });

    test("offers a seek button for a note taken at 0:00", () => {
        const onSeek = vi.fn();
        renderPanel({
            onSeek,
            notes: [
                {
                    id: 5,
                    content: "Intro framing",
                    videoTimestamp: 0,
                    createdAt: "2026-09-22T10:00:00Z",
                },
            ],
        });

        fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
        fireEvent.click(
            screen.getByRole("button", { name: "Jump to 0:00 in the video" }),
        );

        expect(onSeek).toHaveBeenCalledWith(0);
    });

    test("closes the full-screen panel on phones after seeking", async () => {
        const originalMatchMedia = window.matchMedia;
        window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: true,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));
        try {
            const onSeek = vi.fn();
            const onClose = vi.fn();
            renderPanel({
                onSeek,
                onClose,
                notes: [
                    {
                        id: 4,
                        content: "Compare with canary releases",
                        videoTimestamp: 125,
                        createdAt: "2026-09-22T10:00:00Z",
                    },
                ],
            });

            fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
            await waitFor(() => {
                fireEvent.click(
                    screen.getByRole("button", {
                        name: "Jump to 2:05 in the video",
                    }),
                );
                expect(onClose).toHaveBeenCalled();
            });
            expect(onSeek).toHaveBeenCalledWith(125);
        } finally {
            window.matchMedia = originalMatchMedia;
        }
    });

    test("keeps the side panel open on larger screens after seeking", () => {
        const onClose = vi.fn();
        renderPanel({
            onSeek: vi.fn(),
            onClose,
            notes: [
                {
                    id: 4,
                    content: "Compare with canary releases",
                    videoTimestamp: 125,
                    createdAt: "2026-09-22T10:00:00Z",
                },
            ],
        });

        fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
        fireEvent.click(
            screen.getByRole("button", { name: "Jump to 2:05 in the video" }),
        );

        expect(onClose).not.toHaveBeenCalled();
    });
});
