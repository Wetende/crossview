import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/layouts/DashboardLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    router: { reload: vi.fn() },
}));

vi.mock("@/features/question-library/api/questionLibraryApi", () => ({
    promoteBank: vi.fn(),
    listEntries: vi.fn().mockResolvedValue({ count: 0, page: 1, pageSize: 20, totalPages: 1, results: [] }),
    errorMessage: (error, fallback) => fallback,
}));

import { router } from "@inertiajs/react";
import { promoteBank } from "@/features/question-library/api/questionLibraryApi";
import QuestionBanksIndex from "./Index";

const banks = [
    { id: 1, name: "Workshop safety", scope: "institution", entries_count: 12, can_edit: true, can_delete: true },
    { id: 2, name: "Ada's circuits", scope: "instructor", owner_name: "Ada Lovelace", entries_count: 8 },
    { id: 3, name: "Unit 3 bank", scope: "course", program_name: "Electrical", entries_count: 4 },
];

describe("Admin QuestionBanks page", () => {
    beforeEach(() => vi.clearAllMocks());

    it("lists banks that can be shared with their owners and pool use", () => {
        render(<QuestionBanksIndex banks={banks} poolCounts={{ 2: 3 }} tab="promote" />);

        const row = screen.getByText("Ada's circuits").closest("tr");
        expect(within(row).getByText("Ada Lovelace")).toBeInTheDocument();
        expect(within(row).getByText("3")).toBeInTheDocument();
        expect(screen.getByText("Unit 3 bank")).toBeInTheDocument();
        expect(screen.queryByText("Workshop safety")).not.toBeInTheDocument();
    });

    it("shares a bank with every instructor after confirmation", async () => {
        promoteBank.mockResolvedValue({ id: 2, scope: "institution" });
        render(<QuestionBanksIndex banks={banks} poolCounts={{}} tab="promote" />);

        const row = screen.getByText("Ada's circuits").closest("tr");
        fireEvent.click(within(row).getByRole("button", { name: "Share with everyone" }));
        fireEvent.click(await screen.findByRole("button", { name: "Share bank" }));

        await waitFor(() => expect(promoteBank).toHaveBeenCalledWith(2));
        expect(router.reload).toHaveBeenCalledWith({ only: ["banks", "poolCounts"] });
    });
});
