import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import LearnerReminderDialog from "./LearnerReminderDialog";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("axios", () => ({ default: { post } }));

describe("learner reminder preview", () => {
    beforeEach(() => post.mockReset());

    test("shows the exact contextual message before an idempotent send", async () => {
        const onSent = vi.fn();
        post.mockResolvedValueOnce({
            data: {
                operationId: "d56fca2c-d808-4506-9a31-9b5fd1e70ca6",
                eligible: 1,
                skipped: 1,
                reminders: [
                    {
                        enrollmentId: 7,
                        learnerName: "Amina Otieno",
                        title: "Start Introduction to AI",
                        message:
                            "Your course is ready. Open your first lesson.",
                        availableChannels: { inApp: true, email: true },
                    },
                ],
            },
        }).mockResolvedValueOnce({
            data: {
                processed: 1,
                skipped: 1,
                unavailableChannels: { inApp: 0, email: 0 },
            },
        });

        render(
            <LearnerReminderDialog
                open
                programId={42}
                enrollmentIds={[7, 8]}
                onClose={() => {}}
                onSent={onSent}
            />,
        );

        expect(
            await screen.findByText("Start Introduction to AI"),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Your course is ready. Open your first lesson."),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(/learner will receive a reminder/i),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("In-app")).not.toBeInTheDocument();
        expect(screen.queryByText("Email")).not.toBeInTheDocument();
        fireEvent.click(
            screen.getByRole("button", { name: /^send reminder$/i }),
        );

        await waitFor(() => {
            expect(post).toHaveBeenLastCalledWith(
                "/api/learning-operations/programs/42/learners/bulk/",
                {
                    enrollmentIds: [7, 8],
                    action: "send_reminder",
                    operationId: "d56fca2c-d808-4506-9a31-9b5fd1e70ca6",
                },
            );
        });
        expect(onSent).toHaveBeenCalledWith(
            expect.objectContaining({ processed: 1 }),
        );
    });
});
