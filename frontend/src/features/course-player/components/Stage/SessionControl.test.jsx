import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SessionControl from "./SessionControl";

describe("SessionControl", () => {
    it("shows a disabled attendance state instead of learner completion", () => {
        const onComplete = vi.fn();

        render(
            <SessionControl
                prevNode={null}
                nextNode={null}
                onNavigate={vi.fn()}
                onComplete={onComplete}
                isCompleted={false}
                canComplete={false}
                completionLabel="Attendance pending"
                completionTooltip="Completion is recorded from verified attendance"
            />,
        );

        const button = screen.getByRole("button", {
            name: "Attendance pending",
        });
        expect(button).toBeDisabled();
        expect(button.querySelector(".MuiButton-endIcon")).toBeNull();
        expect(
            screen.getByText("Completion is recorded from verified attendance"),
        ).toBeVisible();
        expect(button).toHaveAccessibleDescription(
            "Completion is recorded from verified attendance",
        );
        fireEvent.click(button);
        expect(onComplete).not.toHaveBeenCalled();
    });

    const nextNode = { id: 12, title: "Release strategies" };
    const prevNode = { id: 10, title: "Deployment models" };

    const renderControl = (props = {}) => {
        const handlers = { onComplete: vi.fn(), onNavigate: vi.fn() };
        render(
            <SessionControl
                prevNode={prevNode}
                nextNode={nextNode}
                isCompleted={false}
                canComplete
                {...handlers}
                {...props}
            />,
        );
        return handlers;
    };

    it("completes and moves on when the lesson is open and a next lesson exists", () => {
        const { onComplete, onNavigate } = renderControl();

        fireEvent.click(screen.getByRole("button", { name: "Complete & Next" }));

        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledWith(nextNode);
        expect(onNavigate).not.toHaveBeenCalled();
    });

    it("offers only completion on the last lesson", () => {
        const { onComplete } = renderControl({ nextNode: null });

        fireEvent.click(screen.getByRole("button", { name: "Mark complete" }));

        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete.mock.calls[0][0]).toBeFalsy();
    });

    it("navigates without completing again once the lesson is complete", () => {
        const { onComplete, onNavigate } = renderControl({ isCompleted: true });

        fireEvent.click(screen.getByRole("button", { name: "Next" }));

        expect(onNavigate).toHaveBeenCalledWith(nextNode);
        expect(onComplete).not.toHaveBeenCalled();
    });

    it("shows a disabled completed state on the finished last lesson", () => {
        renderControl({ isCompleted: true, nextNode: null });

        expect(screen.getByRole("button", { name: "Completed" })).toBeDisabled();
    });

    it("offers the course summary on the finished last lesson of a completed course", () => {
        const onViewSummary = vi.fn();
        renderControl({ isCompleted: true, nextNode: null, onViewSummary });

        fireEvent.click(
            screen.getByRole("button", { name: "View course summary" }),
        );

        expect(onViewSummary).toHaveBeenCalledTimes(1);
        expect(
            screen.queryByRole("button", { name: "Completed" }),
        ).not.toBeInTheDocument();
    });

    it("keeps Next ahead of the summary while lessons remain", () => {
        const { onNavigate } = renderControl({
            isCompleted: true,
            onViewSummary: vi.fn(),
        });

        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(onNavigate).toHaveBeenCalledWith(nextNode);
    });

    it("still lets the learner move on when completion is blocked", () => {
        const reason = "Watch at least 80% of the video to mark complete";
        const { onComplete, onNavigate } = renderControl({
            canComplete: false,
            completionTooltip: reason,
        });

        expect(
            screen.queryByRole("button", { name: "Complete & Next" }),
        ).not.toBeInTheDocument();
        const next = screen.getByRole("button", { name: "Next" });
        expect(next).toBeEnabled();
        expect(screen.getByText(reason)).toBeVisible();
        expect(next).toHaveAccessibleDescription(reason);

        fireEvent.click(next);
        expect(onNavigate).toHaveBeenCalledWith(nextNode);
        expect(onComplete).not.toHaveBeenCalled();
    });

    it("moves past a live class awaiting attendance", () => {
        const { onNavigate } = renderControl({
            canComplete: false,
            completionLabel: "Attendance pending",
        });

        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(onNavigate).toHaveBeenCalledWith(nextNode);
        expect(screen.getByText("Attendance pending")).toBeVisible();
    });

    it("goes back with the previous button and disables it on the first lesson", () => {
        const { onNavigate } = renderControl();

        fireEvent.click(screen.getByRole("button", { name: "Previous" }));
        expect(onNavigate).toHaveBeenCalledWith(prevNode);
    });

    it("disables previous when there is no earlier lesson", () => {
        renderControl({ prevNode: null });

        expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    });

    it("only navigates in a read-only preview", () => {
        const { onComplete, onNavigate } = renderControl({
            showCompletion: false,
            canComplete: false,
            completionTooltip: "Watch the video first",
        });

        expect(
            screen.queryByRole("button", { name: /complete/i }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Watch the video first")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Next" }));
        expect(onNavigate).toHaveBeenCalledWith(nextNode);
        expect(onComplete).not.toHaveBeenCalled();
    });

    it("disables Next on the last lesson of a read-only preview", () => {
        renderControl({ showCompletion: false, nextNode: null });

        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });
});
