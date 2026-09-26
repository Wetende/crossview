import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import Take from "./Take";

const postMock = vi.fn();

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    router: {
        post: (...args) => postMock(...args),
        visit: vi.fn(),
    },
}));

vi.mock("framer-motion", () => ({
    motion: {
        div: ({ children }) => <div>{children}</div>,
    },
}));

describe("Quiz Take page", () => {
    test("submits the latest selected answer even before the debounced save runs", () => {
        render(
            <Take
                quiz={{
                    id: 5,
                    title: "Quiz 1",
                    nodeTitle: "Module 1",
                    timeLimit: null,
                    quizStyle: "single_page",
                }}
                attempt={{
                    id: 10,
                    attemptNumber: 1,
                    answers: {},
                    startedAt: new Date().toISOString(),
                }}
                questions={[
                    {
                        id: 35,
                        type: "mcq_multi",
                        text: "Pick the correct answer",
                        points: 1,
                        options: [
                            { id: 213, text: "Correct", position: 0 },
                            { id: 214, text: "Wrong", position: 1 },
                        ],
                    },
                ]}
                attemptsRemaining={0}
            />,
        );

        act(() => {
            fireEvent.click(screen.getByRole("checkbox", { name: /Correct/i }));
            fireEvent.click(screen.getByRole("button", { name: /Submit Quiz/i }));
        });

        expect(postMock).toHaveBeenCalledWith(
            "/student/quiz/5/submit/",
            {
                answers: {
                    35: ["213"],
                },
            },
            expect.any(Object),
        );
    });

    test("lets the learner reveal a question hint", () => {
        render(
            <Take
                quiz={{
                    id: 6,
                    title: "Quiz 2",
                    nodeTitle: "Module 2",
                    timeLimit: null,
                    quizStyle: "pagination",
                }}
                attempt={{
                    id: 11,
                    attemptNumber: 1,
                    answers: {},
                    startedAt: new Date().toISOString(),
                }}
                questions={[
                    {
                        id: 36,
                        type: "short_answer",
                        text: "Name the unit of resistance",
                        points: 1,
                        hint: "<p>It is named after <em>Georg Ohm</em>.</p>",
                    },
                ]}
                attemptsRemaining={0}
            />,
        );

        expect(screen.queryByText("Georg Ohm")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Show hint" }));

        expect(screen.getByText("Georg Ohm")).toBeInTheDocument();
    });
});
