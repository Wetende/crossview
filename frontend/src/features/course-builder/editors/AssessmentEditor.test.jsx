import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import AssessmentEditor from "./AssessmentEditor";

vi.mock("@/components/RichTextEditor", () => ({
    default: ({ value, onChange, placeholder }) => (
        <textarea
            aria-label={placeholder || "Rich text editor"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />
    ),
}));

vi.mock("../components/QuestionsLibraryDrawer", () => ({
    default: () => null,
}));

vi.mock("../components/QuestionBankDialog", () => ({
    default: () => null,
}));

vi.mock("@/components/ConfirmDialog", () => ({
    default: () => null,
}));

vi.mock("@inertiajs/react", () => ({
    router: {
        post: vi.fn(),
    },
}));

describe("AssessmentEditor multi-select answers", () => {
    test("loads saved correct_indices into the multi-select editor", () => {
        render(
            <AssessmentEditor
                type="quiz"
                programId={5}
                onSave={vi.fn()}
                node={{
                    id: 25,
                    title: "Quiz 1",
                    properties: {
                        questions: [
                            {
                                id: "q_35",
                                db_id: 35,
                                isNew: true,
                                type: "mcq_multi",
                                text: "Which answers are correct?",
                                points: 1,
                                options: ["A", "B", "C", "D"],
                                correct_indices: [1, 3],
                            },
                        ],
                    },
                }}
            />,
        );

        const checkboxes = screen.getAllByRole("checkbox").slice(-4);
        expect(checkboxes).toHaveLength(4);
        expect(checkboxes[0]).not.toBeChecked();
        expect(checkboxes[1]).toBeChecked();
        expect(checkboxes[2]).not.toBeChecked();
        expect(checkboxes[3]).toBeChecked();
    });

    test("does not auto-check the first answer when correct_indices is empty", () => {
        render(
            <AssessmentEditor
                type="quiz"
                programId={5}
                onSave={vi.fn()}
                node={{
                    id: 25,
                    title: "Quiz 1",
                    properties: {
                        questions: [
                            {
                                id: "q_36",
                                db_id: 36,
                                isNew: true,
                                type: "mcq_multi",
                                text: "Which answers are correct?",
                                points: 1,
                                options: ["A", "B", "C", "D"],
                                correct: 0,
                                correct_indices: [],
                            },
                        ],
                    },
                }}
            />,
        );

        const checkboxes = screen.getAllByRole("checkbox").slice(-4);
        expect(checkboxes.every((checkbox) => !checkbox.checked)).toBe(true);
    });

    test("saves the latest multi-select choices as correct_indices only", async () => {
        const onSave = vi.fn();

        render(
            <AssessmentEditor
                type="quiz"
                programId={5}
                onSave={onSave}
                node={{
                    id: 25,
                    title: "Quiz 1",
                    properties: {
                        questions: [
                            {
                                id: "q_35",
                                db_id: 35,
                                isNew: true,
                                type: "mcq_multi",
                                text: "Which answers are correct?",
                                points: 1,
                                options: ["A", "B", "C", "D"],
                                correct_indices: [0],
                            },
                        ],
                    },
                }}
            />,
        );

        const checkboxes = screen.getAllByRole("checkbox").slice(-4);
        fireEvent.click(checkboxes[1]);
        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => expect(onSave).toHaveBeenCalled());

        const savedQuestion =
            onSave.mock.calls[0][1].properties.questions[0];
        expect(savedQuestion.correct_indices).toEqual([0, 1]);
        expect(savedQuestion).not.toHaveProperty("correctAnswers");
    });
});
