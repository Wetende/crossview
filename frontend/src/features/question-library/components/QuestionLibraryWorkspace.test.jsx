import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/questionLibraryApi", () => ({
    listEntries: vi.fn(),
    createBank: vi.fn(),
    updateBank: vi.fn(),
    deleteBank: vi.fn(),
    createEntry: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn(),
    errorMessage: (error, fallback) => error?.response?.data?.message || fallback,
}));

vi.mock("./EntryEditorDialog", () => ({ default: () => null }));

import {
    createBank,
    deleteBank,
    listEntries,
    updateEntry,
} from "../api/questionLibraryApi";
import QuestionLibraryWorkspace from "./QuestionLibraryWorkspace";

const banks = [
    {
        id: 1, name: "Unit 1 bank", scope: "course", program_name: "Electrical",
        entries_count: 2, can_edit: true, can_delete: true, is_archived: false,
    },
    {
        id: 2, name: "My circuits", scope: "instructor",
        entries_count: 1, can_edit: true, can_delete: true, is_archived: false,
    },
    {
        id: 3, name: "Workshop safety", scope: "institution",
        entries_count: 5, can_edit: false, can_delete: false, is_archived: false,
    },
];

const page = (results) => ({
    count: results.length, page: 1, pageSize: 20, totalPages: 1, results,
});

const entry = {
    id: 90,
    question_type: "true_false",
    difficulty: "easy",
    tags: ["core"],
    usage_count: 3,
    can_edit: true,
    can_delete: true,
    question_data: { text: "Copper conducts electricity." },
};

const renderWorkspace = (props = {}) =>
    render(
        <QuestionLibraryWorkspace
            banks={banks}
            programs={[{ id: 4, name: "Electrical" }]}
            categories={[]}
            {...props}
        />,
    );

describe("QuestionLibraryWorkspace", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        listEntries.mockResolvedValue(page([entry]));
    });

    it("groups banks by type and loads the selected bank's questions", async () => {
        renderWorkspace();

        expect(screen.getByText("Course banks")).toBeInTheDocument();
        expect(screen.getByText("Shared banks")).toBeInTheDocument();
        expect(await screen.findByText("Copper conducts electricity.")).toBeInTheDocument();
        expect(listEntries).toHaveBeenCalledWith(expect.objectContaining({ bank_id: 1, page: 1 }));
    });

    it("shows shared banks as read only for instructors", async () => {
        listEntries.mockResolvedValue(page([{ ...entry, can_edit: false, can_delete: false }]));
        renderWorkspace();

        fireEvent.click(screen.getByText("Workshop safety"));

        expect(await screen.findByText("Read only")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "New question" })).not.toBeInTheDocument();
        await waitFor(() =>
            expect(listEntries).toHaveBeenLastCalledWith(expect.objectContaining({ bank_id: 3 })),
        );
        expect(screen.queryByRole("button", { name: /edit question/i })).not.toBeInTheDocument();
    });

    it("creates a personal library bank and selects it", async () => {
        createBank.mockResolvedValue({
            id: 8, name: "Motors", scope: "instructor", entries_count: 0,
            can_edit: true, can_delete: true, is_archived: false,
        });
        renderWorkspace();

        fireEvent.click(screen.getByRole("button", { name: "New bank" }));
        fireEvent.change(screen.getByLabelText(/Bank name/), { target: { value: "Motors" } });
        fireEvent.mouseDown(screen.getByLabelText("Bank type"));
        fireEvent.click(await screen.findByRole("option", { name: "My library" }));
        fireEvent.click(screen.getByRole("button", { name: "Create bank" }));

        await waitFor(() =>
            expect(createBank).toHaveBeenCalledWith(
                expect.objectContaining({ name: "Motors", scope: "instructor" }),
            ),
        );
        await waitFor(() =>
            expect(listEntries).toHaveBeenLastCalledWith(expect.objectContaining({ bank_id: 8 })),
        );
    });

    it("explains why a bank in use cannot be deleted", async () => {
        deleteBank.mockRejectedValue({
            response: { data: { message: "Unlink this bank from active quiz pools before deleting it." } },
        });
        renderWorkspace();
        await screen.findByText("Copper conducts electricity.");

        fireEvent.click(screen.getByRole("button", { name: "Delete bank" }));
        const dialog = await screen.findByRole("dialog");
        fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

        expect(
            await screen.findByText("Unlink this bank from active quiz pools before deleting it."),
        ).toBeInTheDocument();
    });

    it("moves a question to another bank the trainer can edit", async () => {
        updateEntry.mockResolvedValue({ ...entry, bank: 2 });
        renderWorkspace();

        fireEvent.click(await screen.findByRole("button", { name: /move question/i }));
        const dialog = await screen.findByRole("dialog");
        fireEvent.mouseDown(within(dialog).getByLabelText("Move to"));
        const listbox = await screen.findByRole("listbox");
        expect(within(listbox).queryByText("Workshop safety")).not.toBeInTheDocument();
        fireEvent.click(within(listbox).getByText("My circuits"));
        fireEvent.click(within(dialog).getByRole("button", { name: "Move" }));

        await waitFor(() => expect(updateEntry).toHaveBeenCalledWith(90, { bank_id: 2 }));
    });
});
