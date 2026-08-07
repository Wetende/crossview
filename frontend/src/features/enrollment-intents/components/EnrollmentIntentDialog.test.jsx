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

    test("shows the account handoff after a new learner submits details", () => {
        render(
            <EnrollmentIntentDialog
                open
                onClose={vi.fn()}
                program={{ id: 42, name: "Web Development" }}
                success={{
                    accountState: "created",
                    title: "You're enrolled",
                    message: "Your learner account is ready.",
                    email: "mary@example.com",
                    emailInboxUrl: "https://mail.google.com/mail/",
                    loginUrl: "/login/?next=%2Fprograms%2Fenrollment%2Fresume%2F",
                }}
            />,
        );

        expect(screen.getByText("You're enrolled")).toBeInTheDocument();
        expect(screen.getByText("Your learner account is ready.")).toBeInTheDocument();
        expect(screen.getByText(/sign-in details were sent to/i)).toHaveTextContent(
            "mary@example.com",
        );
        expect(screen.getByRole("link", { name: "Open email" })).toHaveAttribute(
            "href",
            "https://mail.google.com/mail/",
        );
    });
});
