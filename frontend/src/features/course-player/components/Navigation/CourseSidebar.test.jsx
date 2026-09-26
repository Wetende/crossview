import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, test, vi } from "vitest";

import CourseSidebar from "./CourseSidebar";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

// The summary-link suite stubs the tree; the preview suite renders it.
const tree = vi.hoisted(() => ({ renderReal: false }));
vi.mock("./CurriculumTree", async (importOriginal) => {
    const actual = await importOriginal();
    const RealTree = actual.default;
    return {
        default: (props) =>
            tree.renderReal ? <RealTree {...props} /> : <div>Curriculum</div>,
    };
});

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

const previewCurriculum = [
    {
        id: 1,
        title: "Getting started",
        nodeType: "Module",
        isLocked: true,
        lockReason: "enrollment_required",
        lockReasonText: "Enroll to unlock",
        url: null,
        children: [
            {
                id: 11,
                title: "Welcome",
                nodeType: "Lesson",
                activityType: "text",
                duration: "10m",
                isPreview: true,
                isLocked: false,
                url: "/programs/preview-course/preview/11/",
                children: [],
            },
            {
                id: 12,
                title: "Deep dive",
                nodeType: "Lesson",
                activityType: "video",
                duration: "25m",
                isPreview: false,
                isLocked: true,
                lockReason: "enrollment_required",
                lockReasonText: "Enroll to unlock",
                url: null,
                children: [],
            },
        ],
    },
];

const preview = {
    programUrl: "/programs/preview-course/",
    enrollCta: { label: "ENROLL NOW", href: "/programs/preview-course/" },
};

describe("CourseSidebar preview mode", () => {
    beforeEach(() => {
        tree.renderReal = true;
    });

    afterEach(() => {
        tree.renderReal = false;
    });

    it("shows learner progress and the overview in the enrolled player", () => {
        render(
            <CourseSidebar
                program={{ id: 3, name: "Preview Course" }}
                progress={40}
                curriculum={[]}
                enrollmentId={9}
            />,
        );

        expect(screen.getByText("Course progress: 40%")).toBeInTheDocument();
        expect(screen.getByRole("progressbar")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
    });

    it("locks enrolled-only lessons and offers enrollment in preview mode", () => {
        render(
            <CourseSidebar
                program={{ id: 3, name: "Preview Course" }}
                progress={0}
                curriculum={previewCurriculum}
                activeNodeId={11}
                activeView="preview"
                preview={preview}
            />,
        );

        expect(screen.getByText("Preview Course")).toBeInTheDocument();
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
        expect(screen.queryByText(/Course progress/)).not.toBeInTheDocument();
        expect(screen.queryByText("Overview")).not.toBeInTheDocument();
        expect(screen.queryByText("End of unit")).not.toBeInTheDocument();
        expect(screen.queryByText("0/2")).not.toBeInTheDocument();

        expect(screen.getByRole("link", { name: /Welcome/ })).toHaveAttribute(
            "href",
            "/programs/preview-course/preview/11/",
        );

        const lockedRow = screen.getByText("Deep dive").closest("li");
        expect(within(lockedRow).getByText("Enroll to unlock")).toBeInTheDocument();
        expect(within(lockedRow).queryByRole("link")).not.toBeInTheDocument();

        expect(screen.getByRole("link", { name: "ENROLL NOW" })).toHaveAttribute(
            "href",
            "/programs/preview-course/",
        );
    });
});
