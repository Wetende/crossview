import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RosterPreviewPanel from "./RosterPreviewPanel";


describe("RosterPreviewPanel", () => {
    it("shows conflicts and applies only after an explicit teacher action", () => {
        const onApply = vi.fn();
        render(
            <RosterPreviewPanel
                preview={{
                    summary: { matched: 1, conflict: 1 },
                    rows: [
                        {
                            direction: "google_to_lms",
                            email: "conflict@example.test",
                            name: "Conflict Learner",
                            status: "conflict",
                            action: null,
                        },
                    ],
                }}
                onApply={onApply}
                applying={false}
            />,
        );

        expect(screen.getByText(/Conflicting identities will not be changed/)).toBeInTheDocument();
        expect(screen.getByText("conflict@example.test")).toBeInTheDocument();
        expect(onApply).not.toHaveBeenCalled();
        fireEvent.click(
            screen.getByRole("button", {
                name: "Apply safe additions and invitations",
            }),
        );
        expect(onApply).toHaveBeenCalledOnce();
    });
});
