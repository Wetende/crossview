import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CourseBuilderLayout from "./CourseBuilderLayout";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, preserveState, ...props }) => (
        <a href={href} data-preserve-state={preserveState || undefined} {...props}>
            {children}
        </a>
    ),
    usePage: () => ({ props: { flash: [] } }),
}));

describe("CourseBuilderLayout", () => {
    it("keeps long course names readable without overlapping the tabs", () => {
        const courseName =
            "Introduction to the Web and HTML Basics for Complete Beginners";

        render(
            <CourseBuilderLayout
                program={{ id: 42, name: courseName }}
                appBarActions={<button type="button">Publish</button>}
            >
                <div>Builder content</div>
            </CourseBuilderLayout>,
        );

        const title = screen.getByRole("heading", { name: courseName });
        expect(title).toHaveAttribute("title", courseName);
        expect(title).toHaveStyle({
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
        });

        expect(screen.getByRole("tablist")).toBeInTheDocument();
    });
});
