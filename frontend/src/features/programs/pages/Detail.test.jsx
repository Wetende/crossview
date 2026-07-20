import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import Detail from "./Detail";

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
}));

vi.mock("framer-motion", () => ({
    motion: { div: ({ children }) => <div>{children}</div> },
}));

vi.mock("@/layouts/InstructorLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

describe("instructor course detail", () => {
    test("promotes learner management and shows compact learner health", () => {
        render(
            <Detail
                program={{
                    id: 42,
                    name: "Introduction to AI",
                    code: "AI101",
                    description: "Course description",
                    resources: [],
                }}
                curriculum={[]}
                learnerSummary={{ total: 12, needsAttention: 4, completed: 3 }}
            />,
        );

        expect(
            screen.getByRole("link", { name: /manage learners/i }),
        ).toHaveAttribute("href", "/instructor/programs/42/students/");
        expect(screen.getByText("Total learners")).toBeInTheDocument();
        expect(screen.getByText("Needs attention")).toBeInTheDocument();
        expect(screen.getByText("Completed")).toBeInTheDocument();
        expect(
            screen.queryByText(/enrolled students/i),
        ).not.toBeInTheDocument();
    });
});
