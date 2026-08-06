import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const post = vi.fn();
const setData = vi.fn();
const clearErrors = vi.fn();

vi.mock("@inertiajs/react", () => ({
    useForm: () => ({
        data: { name: "Mary Learner", email: "mary@example.com", phone: "0712345678" },
        setData,
        post,
        processing: false,
        errors: {},
        clearErrors,
    }),
}));

import EnrollmentIntentDialog from "./EnrollmentIntentDialog";

describe("EnrollmentIntentDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("submits learner details through the Inertia enrollment action", () => {
        render(
            <EnrollmentIntentDialog
                open
                onClose={vi.fn()}
                program={{ id: 42, name: "Web Development" }}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Continue" }));

        expect(post).toHaveBeenCalledWith(
            "/programs/42/enrollment-intent/",
            { preserveScroll: true },
        );
    });
});
