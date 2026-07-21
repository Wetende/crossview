import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import Register from "./Register";

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    usePage: () => ({
        props: { platform: { institutionName: "Learning Platform" } },
    }),
    useForm: (initialData) => ({
        data: initialData,
        setData: vi.fn(),
        post: vi.fn(),
        processing: false,
    }),
}));

vi.mock("@/components/common/PlatformLogo", () => ({
    default: () => <div data-testid="platform-logo" />,
}));

vi.mock("@/features/auth/components/GoogleIdentityScript", () => ({
    GoogleSignInButton: () => <button type="button">Sign up with Google</button>,
}));

describe("Register", () => {
    test("public registration only presents the learner account form", () => {
        render(
            <Register
                registrationEnabled
                socialAuth={{}}
            />,
        );

        expect(screen.getByRole("heading", { name: "Learning Platform" })).toBeInTheDocument();
        expect(screen.queryByText("Instructor")).not.toBeInTheDocument();
        expect(screen.queryByText(/admin approval/i)).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    });
});
