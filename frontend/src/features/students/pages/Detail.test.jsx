import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import InstructorStudentDetail from "./Detail";

const mockRouterPost = vi.hoisted(() => vi.fn());

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    Link: React.forwardRef(function MockLink(
        { href, children, ...props },
        ref,
    ) {
        return (
            <a ref={ref} href={href} {...props}>
                {children}
            </a>
        );
    }),
    router: { post: mockRouterPost },
}));

vi.mock("framer-motion", () => ({
    motion: { div: ({ children }) => <div>{children}</div> },
}));

vi.mock("@/layouts/InstructorLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

const student = { id: 3, name: "Amina Otieno", email: "amina@example.com" };
const buildEnrollment = (overrides = {}) => ({
    id: 7,
    programId: 42,
    programName: "Introduction to AI",
    status: "active",
    allowedStatuses: ["suspended", "withdrawn"],
    completions: 2,
    enrolledAt: "2026-09-01T08:00:00Z",
    ...overrides,
});

const openStatusDialog = (buttonName = "Suspend") => {
    fireEvent.click(screen.getByRole("button", { name: buttonName }));
    return screen.getByRole("dialog");
};

const chooseStatus = (dialog, label) => {
    fireEvent.mouseDown(within(dialog).getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: label }));
};

describe("enrollment status dialog", () => {
    beforeEach(() => {
        mockRouterPost.mockReset();
    });

    test("offers only the transitions the server allows", () => {
        render(
            <InstructorStudentDetail
                student={student}
                enrollments={[buildEnrollment()]}
            />,
        );

        const dialog = openStatusDialog();
        const update = within(dialog).getByRole("button", {
            name: "Update Status",
        });
        expect(update).toBeDisabled();

        fireEvent.mouseDown(within(dialog).getByRole("combobox"));
        const options = screen
            .getAllByRole("option")
            .map((option) => option.textContent);
        expect(options).toEqual(["Suspended", "Withdrawn"]);
        fireEvent.click(screen.getByRole("option", { name: "Withdrawn" }));

        expect(update).toBeEnabled();
        fireEvent.click(update);

        expect(mockRouterPost).toHaveBeenCalledWith(
            "/instructor/enrollments/7/status/",
            { status: "withdrawn" },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
            }),
        );
    });

    test("shows a rejected change inline and keeps the dialog open", () => {
        const serverMessage =
            "A active enrollment cannot be changed to suspended.";
        mockRouterPost.mockImplementation((url, data, options) => {
            options.onError({ status: serverMessage });
            options.onFinish();
        });
        render(
            <InstructorStudentDetail
                student={student}
                enrollments={[buildEnrollment()]}
            />,
        );

        const dialog = openStatusDialog();
        chooseStatus(dialog, "Suspended");
        fireEvent.click(
            within(dialog).getByRole("button", { name: "Update Status" }),
        );

        expect(within(dialog).getByText(serverMessage)).toBeInTheDocument();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(
            within(dialog).getByRole("button", { name: "Update Status" }),
        ).toBeDisabled();
    });

    test("does not offer any change for a completed enrollment", () => {
        render(
            <InstructorStudentDetail
                student={student}
                enrollments={[
                    buildEnrollment({ status: "completed", allowedStatuses: [] }),
                ]}
            />,
        );

        const dialog = openStatusDialog();

        expect(within(dialog).queryByRole("combobox")).not.toBeInTheDocument();
        expect(
            within(dialog).getByText(
                "This enrollment's status can no longer be changed.",
            ),
        ).toBeInTheDocument();
        expect(
            within(dialog).getByRole("button", { name: "Update Status" }),
        ).toBeDisabled();
    });
});
