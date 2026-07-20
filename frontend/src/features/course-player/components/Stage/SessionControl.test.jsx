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
        fireEvent.click(button);
        expect(onComplete).not.toHaveBeenCalled();
    });
});
