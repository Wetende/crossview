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

        fireEvent.click(screen.getByRole("button", { name: /add learners/i }));
        fireEvent.click(
            await screen.findByRole("menuitem", {
                name: /add or invite by email/i,
            }),
        );
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

    test("previews eligibility before applying a bulk access action", async () => {
        post.mockResolvedValueOnce({
            data: { eligible: 2, ineligible: 0, results: [] },
        }).mockResolvedValueOnce({
            data: { processed: 2, skipped: 0, updated: 2 },
        });
        render(
            <LearnerManagementToolbar
                programId={42}
                selectedEnrollmentIds={[7, 8]}
                onClearSelection={() => {}}
                onComplete={() => {}}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /manage access/i }));
        fireEvent.click(
            await screen.findByRole("menuitem", { name: /suspend access/i }),
        );

        await waitFor(() => {
            expect(post).toHaveBeenCalledWith(
                "/api/learning-operations/programs/42/learners/bulk/",
                {
                    enrollmentIds: [7, 8],
                    action: "suspend",
                    reason: "",
                    preview: true,
                },
            );
        });

        fireEvent.click(
            await screen.findByRole("button", { name: /confirm for 2/i }),
        );
        await waitFor(() => {
            expect(post).toHaveBeenLastCalledWith(
                "/api/learning-operations/programs/42/learners/bulk/",
                { enrollmentIds: [7, 8], action: "suspend", reason: "" },
            );
        });
    });

    test("hides bulk controls until learners are selected", () => {
        render(
            <LearnerManagementToolbar
                programId={42}
                selectedEnrollmentIds={[]}
                onClearSelection={() => {}}
                onComplete={() => {}}
            />,
        );

        expect(
            screen.queryByRole("button", { name: /manage access/i }),
        ).not.toBeInTheDocument();
    });
});
