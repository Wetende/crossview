import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import CourseSidebar from "./CourseSidebar";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock("./CurriculumTree", () => ({
    default: () => <div>Curriculum</div>,
}));

const renderSidebar = (props = {}) =>
    render(
        <CourseSidebar
            program={{ id: 4, name: "Data Foundations" }}
            progress={100}
            curriculum={[]}
            enrollmentId={9}
            activeView={null}
            {...props}
        />,
    );

describe("CourseSidebar", () => {
    test("links a completed course to its summary", () => {
        renderSidebar({ completionUrl: "/student/programs/9/complete/" });

        expect(
            screen.getByRole("link", {
                name: "Course completed · View summary",
            }),
        ).toHaveAttribute("href", "/student/programs/9/complete/");
    });

    test("marks the summary link as current on the summary page", () => {
        renderSidebar({
            completionUrl: "/student/programs/9/complete/",
            activeView: "course_complete",
        });

        expect(
            screen.getByRole("link", {
                name: "Course completed · View summary",
            }),
        ).toHaveAttribute("aria-current", "page");
    });

    test("shows no summary link while the course is in progress", () => {
        renderSidebar({ progress: 40 });

        expect(
            screen.queryByRole("link", { name: /view summary/i }),
        ).not.toBeInTheDocument();
    });
});
