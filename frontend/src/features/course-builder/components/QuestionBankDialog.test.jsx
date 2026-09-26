import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import QuestionBankDialog from "./QuestionBankDialog";

describe("QuestionBankDialog", () => {
    test("creates a filtered random pool from a persistent bank", async () => {
        const onSave = vi.fn();
        render(
            <QuestionBankDialog
                open
                onClose={() => {}}
                onSave={onSave}
                banks={[{ id: 12, name: "Core bank", entries_count: 20 }]}
                categories={["Foundations"]}
            />,
        );

        fireEvent.mouseDown(
            screen.getByRole("combobox", { name: /Question bank/i }),
        );
        fireEvent.click(await screen.findByRole("option", { name: /Core bank/i }));
        fireEvent.change(screen.getByLabelText("Questions per attempt"), {
            target: { value: "5" },
        });
        fireEvent.mouseDown(
            screen.getByRole("combobox", { name: /Difficulty/i }),
        );
        fireEvent.click(await screen.findByRole("option", { name: "Hard" }));
        fireEvent.change(screen.getByLabelText("Required tags"), {
            target: { value: "core, exam" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Add pool" }));

        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                bankId: 12,
                name: "Core bank",
                questionCount: 5,
                difficulty: "hard",
                tags: ["core", "exam"],
            }),
        );
    });

    test("shows where each bank comes from", async () => {
        render(
            <QuestionBankDialog
                open
                onClose={() => {}}
                onSave={() => {}}
                banks={[
                    { id: 1, name: "Course bank", scope: "course", entries_count: 4 },
                    { id: 2, name: "Safety", scope: "institution", entries_count: 9 },
                    { id: 3, name: "Mine", scope: "instructor", entries_count: 2 },
                ]}
                categories={[]}
            />,
        );

        fireEvent.mouseDown(screen.getByRole("combobox", { name: /Question bank/i }));

        expect(await screen.findByRole("option", { name: /Safety.*Shared/ })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: /Mine.*My library/ })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: /Course bank.*Course/ })).toBeInTheDocument();
    });
});
