import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { getEntry } from "@/features/question-library/api/questionLibraryApi";
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

vi.mock("@/features/question-library/api/questionLibraryApi", () => ({
    getEntry: vi.fn(),
    errorMessage: (error, fallback) => fallback,
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

describe("AssessmentEditor question banks", () => {
    const libraryQuestion = {
        id: "q_1",
        db_id: 1,
        type: "true_false",
        text: "Old wording",
        points: 1,
        correct: 0,
        fromLibrary: true,
        libraryEntryId: 41,
        libraryEntryVersion: 1,
    };

    test("warns when a bank pool cannot supply its questions", () => {
        render(
            <AssessmentEditor
                type="quiz"
                programId={5}
                onSave={vi.fn()}
                questionBanks={[{ id: 7, name: "Safety bank", scope: "institution" }]}
                node={{
                    id: 25,
                    title: "Quiz 1",
                    properties: {
                        questions: [],
                        question_banks: [
                            {
                                poolId: 3,
                                bankId: 7,
                                name: "Safety bank",
                                questionCount: 5,
                                availableQuestions: 2,
                            },
                        ],
                    },
                }}
            />,
        );

        expect(screen.getByText("Only 2 of 5 available")).toBeInTheDocument();
        expect(screen.getByText("Shared")).toBeInTheDocument();
    });

    test("offers to update a question whose bank copy has changed", async () => {
        const onSave = vi.fn();
        getEntry.mockResolvedValue({
            id: 41,
            snapshot_version: 2,
            question_type: "true_false",
            question_data: {
                question_type: "true_false",
                text: "New wording",
                points: 1,
                answer_data: { correct: false },
                options: [],
                matching_pairs: [],
                gap_answers: [],
                image_matching_pairs: [],
            },
        });

        render(
            <AssessmentEditor
                type="quiz"
                programId={5}
                onSave={onSave}
                questionLibraryVersions={{ 41: { snapshotVersion: 2, bankName: "Safety bank" } }}
                node={{
                    id: 25,
                    title: "Quiz 1",
                    properties: { questions: [libraryQuestion] },
                }}
            />,
        );

        expect(screen.getByText("Newer version in bank")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Update from bank" }));

        await waitFor(() =>
            expect(screen.queryByText("Newer version in bank")).not.toBeInTheDocument(),
        );
        expect(getEntry).toHaveBeenCalledWith(41);
        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        await waitFor(() => expect(onSave).toHaveBeenCalled());

        const saved = onSave.mock.calls.at(-1)[1].properties.questions[0];
        expect(saved).toMatchObject({
            db_id: 1,
            text: "New wording",
            correct: 1,
            libraryEntryId: 41,
            libraryEntryVersion: 2,
        });
    });

    test("does not flag questions that match the bank version", () => {
        render(
            <AssessmentEditor
                type="quiz"
                programId={5}
                onSave={vi.fn()}
                questionLibraryVersions={{ 41: { snapshotVersion: 1 } }}
                node={{
                    id: 25,
                    title: "Quiz 1",
                    properties: { questions: [libraryQuestion] },
                }}
            />,
        );

        expect(screen.getByText("From bank")).toBeInTheDocument();
        expect(screen.queryByText("Newer version in bank")).not.toBeInTheDocument();
    });
});
