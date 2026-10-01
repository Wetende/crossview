import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import AnalyticsIndex from "./AnalyticsIndex";

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

vi.mock("@/layouts/InstructorLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

describe("instructor analytics index", () => {
    test("links each assigned course to its analytics page", () => {
        render(
            <AnalyticsIndex
                programs={[
                    {
                        id: 42,
                        title: "Data Literacy",
                        code: "DL-101",
                        isPublished: false,
                        learnerCount: 1500,
                        analyticsUrl: "/instructor/programs/42/analytics/",
                    },
                ]}
            />,
        );

        expect(
            screen.getByRole("link", {
                name: "View analytics for Data Literacy",
            }),
        ).toHaveAttribute("href", "/instructor/programs/42/analytics/");
        expect(screen.getByText("1,500")).toBeInTheDocument();
        expect(screen.getByText("Draft")).toBeInTheDocument();
    });

    test("explains when no course is assigned", () => {
        render(<AnalyticsIndex programs={[]} />);

        expect(
            screen.getByText(/no courses assigned yet/i),
        ).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
});
