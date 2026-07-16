import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import LearnerManagementToolbar from "./LearnerManagementToolbar";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("axios", () => ({ default: { post } }));

describe("Learner management toolbar", () => {
    beforeEach(() => post.mockReset());

    test("adds an existing learner by email and refreshes the roster", async () => {
        const onComplete = vi.fn();
        post.mockResolvedValue({ data: { status: "enrolled" } });
        render(
            <LearnerManagementToolbar
                programId={42}
                selectedEnrollmentIds={[]}
                onComplete={onComplete}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /add or invite/i }));
        fireEvent.change(screen.getByLabelText(/email address/i), {
            target: { value: "learner@example.com" },
        });
        fireEvent.click(screen.getByRole("button", { name: /continue/i }));

        await waitFor(() => {
            expect(post).toHaveBeenCalledWith(
                "/api/learning-operations/programs/42/invitations/",
                { email: "learner@example.com" },
            );
        });
        expect(
            await screen.findByText("Learner enrolled."),
        ).toBeInTheDocument();
        expect(onComplete).toHaveBeenCalledOnce();
    });

    test("sends an explicit bulk learner action", async () => {
        post.mockResolvedValue({ data: { updated: 2 } });
        render(
            <LearnerManagementToolbar
                programId={42}
                selectedEnrollmentIds={[7, 8]}
                onComplete={() => {}}
            />,
        );

        fireEvent.mouseDown(screen.getByLabelText(/bulk action/i));
        fireEvent.click(
            await screen.findByRole("option", { name: /suspend/i }),
        );
        fireEvent.click(screen.getByRole("button", { name: /apply to 2/i }));

        await waitFor(() => {
            expect(post).toHaveBeenCalledWith(
                "/api/learning-operations/programs/42/learners/bulk/",
                { enrollmentIds: [7, 8], action: "suspend" },
            );
        });
    });
});
