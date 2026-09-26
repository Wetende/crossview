import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/question-library/api/questionLibraryApi", () => ({
    listEntries: vi.fn(),
    errorMessage: (error, fallback) => fallback,
}));

import { listEntries } from "@/features/question-library/api/questionLibraryApi";
import QuestionsLibraryDrawer from "./QuestionsLibraryDrawer";

const entry = (id, text, extra = {}) => ({
    id,
    question_type: "true_false",
    bank_name: "Safety bank",
    bank_scope: "institution",
    category: "Safety",
    question_data: { text },
    ...extra,
});

const page = (results, pageNumber, totalPages) => ({
    count: results.length,
    page: pageNumber,
    pageSize: 20,
    totalPages,
    results,
});

describe("QuestionsLibraryDrawer", () => {
    beforeEach(() => {
        listEntries.mockReset();
    });

    it("searches the library for the current course and shows each question's bank", async () => {
        listEntries.mockResolvedValueOnce(page([entry(1, "Wear goggles")], 1, 1));

        render(
            <QuestionsLibraryDrawer open programId={5} onClose={() => {}} onAddQuestions={() => {}} />,
        );

        expect(await screen.findByText("Wear goggles")).toBeInTheDocument();
        expect(screen.getByText("Shared")).toBeInTheDocument();
        expect(screen.getByText(/Safety bank/)).toBeInTheDocument();
        expect(listEntries).toHaveBeenCalledWith(
            expect.objectContaining({ program: 5, page: 1 }),
        );
    });

    it("loads further pages on request", async () => {
        listEntries
            .mockResolvedValueOnce(page([entry(1, "First question")], 1, 2))
            .mockResolvedValueOnce(page([entry(2, "Second question")], 2, 2));

        render(
            <QuestionsLibraryDrawer open programId={5} onClose={() => {}} onAddQuestions={() => {}} />,
        );
        fireEvent.click(await screen.findByRole("button", { name: /load more/i }));

        expect(await screen.findByText("Second question")).toBeInTheDocument();
        expect(screen.getByText("First question")).toBeInTheDocument();
        expect(listEntries).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
        expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
    });

    it("filters by where questions come from", async () => {
        listEntries.mockResolvedValue(page([], 1, 1));

        render(
            <QuestionsLibraryDrawer open programId={5} onClose={() => {}} onAddQuestions={() => {}} />,
        );
        await screen.findByText(/no questions/i);
        fireEvent.mouseDown(screen.getByLabelText("Source"));
        fireEvent.click(await screen.findByRole("option", { name: "My library" }));

        await waitFor(() =>
            expect(listEntries).toHaveBeenLastCalledWith(
                expect.objectContaining({ scope: "instructor", page: 1 }),
            ),
        );
    });

    it("returns the selected entries and skips ones already in the quiz", async () => {
        const onAddQuestions = vi.fn();
        listEntries.mockResolvedValueOnce(
            page([entry(1, "Already there"), entry(2, "New one")], 1, 1),
        );

        render(
            <QuestionsLibraryDrawer
                open
                programId={5}
                onClose={() => {}}
                onAddQuestions={onAddQuestions}
                existingQuestionIds={[1]}
            />,
        );
        fireEvent.click(await screen.findByText("New one"));
        fireEvent.click(screen.getByRole("button", { name: /add questions \(1\)/i }));

        expect(onAddQuestions).toHaveBeenCalledWith([expect.objectContaining({ id: 2 })]);
        expect(screen.getByText("Already there").closest("[aria-disabled='true']")).not.toBeNull();
    });

    it("shows a retry message when the library cannot load", async () => {
        listEntries.mockRejectedValueOnce(new Error("offline"));

        render(
            <QuestionsLibraryDrawer open programId={5} onClose={() => {}} onAddQuestions={() => {}} />,
        );

        expect(await screen.findByText(/could not load the question library/i)).toBeInTheDocument();
    });
});
