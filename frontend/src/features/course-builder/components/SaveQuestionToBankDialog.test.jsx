import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/question-library/api/questionLibraryApi", () => ({
    createBank: vi.fn(),
    createEntry: vi.fn(),
    errorMessage: (error, fallback) => fallback,
}));

import {
    createBank,
    createEntry,
} from "@/features/question-library/api/questionLibraryApi";
import SaveQuestionToBankDialog from "./SaveQuestionToBankDialog";

const banks = [
    { id: 1, name: "Course bank", scope: "course", can_edit: true },
    { id: 2, name: "Shared safety", scope: "institution", can_edit: false },
];

const question = { type: "true_false", text: "Metals conduct.", points: 1, correct: 0 };

const renderDialog = (props = {}) =>
    render(
        <SaveQuestionToBankDialog
            open
            question={question}
            programId={9}
            banks={banks}
            categories={[]}
            onClose={() => {}}
            {...props}
        />,
    );

describe("SaveQuestionToBankDialog", () => {
    beforeEach(() => {
        createBank.mockReset();
        createEntry.mockReset();
    });

    it("only offers banks the trainer can add to", async () => {
        renderDialog();

        fireEvent.mouseDown(screen.getByLabelText("Question bank"));
        const listbox = await screen.findByRole("listbox");

        expect(within(listbox).getByText("Course bank")).toBeInTheDocument();
        expect(within(listbox).queryByText("Shared safety")).not.toBeInTheDocument();
    });

    it("creates a personal library bank from the builder", async () => {
        const onBankCreated = vi.fn();
        createBank.mockResolvedValue({ id: 7, name: "My physics", scope: "instructor", can_edit: true });
        renderDialog({ onBankCreated });

        fireEvent.change(screen.getByLabelText("New bank name"), {
            target: { value: "My physics" },
        });
        fireEvent.mouseDown(screen.getByLabelText("New bank belongs to"));
        fireEvent.click(await screen.findByRole("option", { name: "My library" }));
        fireEvent.click(screen.getByRole("button", { name: "Create bank" }));

        await waitFor(() =>
            expect(createBank).toHaveBeenCalledWith({
                name: "My physics",
                category: "",
                scope: "instructor",
                program: 9,
            }),
        );
        expect(onBankCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
    });

    it("saves a reusable copy of the question", async () => {
        const onSaved = vi.fn();
        createEntry.mockResolvedValue({ id: 30 });
        renderDialog({ onSaved, banks: [banks[0]] });

        fireEvent.click(await screen.findByRole("button", { name: "Save reusable copy" }));

        await waitFor(() => expect(createEntry).toHaveBeenCalled());
        const payload = createEntry.mock.calls[0][0];
        expect(payload.bank_id).toBe(1);
        expect(payload.program).toBe(9);
        expect(payload.questionSnapshot).toMatchObject({
            question_type: "true_false",
            answer_data: { correct: true },
        });
        expect(onSaved).toHaveBeenCalledWith({ id: 30 });
    });
});
