import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CourseContentTabs from "./CourseContentTabs";
import PreviewCourseButton from "./PreviewCourseButton";
import { findFirstPreviewUrl } from "../utils/previewLessons";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

const curriculum = [
    {
        id: 10,
        title: "Introduction",
        children: [
            { id: 11, title: "Locked lesson", type: "Lesson", isPreview: false, previewUrl: null },
            {
                id: 12,
                title: "Free welcome",
                type: "Lesson",
                isPreview: true,
                previewUrl: "/programs/intro-ai/preview/12/",
            },
        ],
    },
    {
        id: 20,
        title: "Advanced",
        children: [
            {
                id: 21,
                title: "Free tour",
                type: "Video",
                isPreview: true,
                previewUrl: "/programs/intro-ai/preview/21/",
            },
            { id: 22, title: "Draft preview", type: "Lesson", isPreview: true, previewUrl: null },
        ],
    },
];

describe("free preview lessons on the public course page", () => {
    it("links the Preview chip to the lesson's preview URL", () => {
        render(<CourseContentTabs program={{ name: "Intro to AI" }} curriculum={curriculum} />);
        fireEvent.click(screen.getByRole("tab", { name: "Curriculum" }));

        const previewRow = screen.getByTestId("curriculum-lesson-12");
        expect(
            within(previewRow).getByRole("link", { name: "Preview Free welcome" }),
        ).toHaveAttribute("href", "/programs/intro-ai/preview/12/");

        const lockedRow = screen.getByTestId("curriculum-lesson-11");
        expect(within(lockedRow).queryByRole("link")).not.toBeInTheDocument();
        expect(within(lockedRow).getByLabelText("Locked content")).toBeInTheDocument();
    });

    it("keeps an unlinked Preview chip when no preview URL is available", () => {
        render(<CourseContentTabs program={{ name: "Intro to AI" }} curriculum={curriculum} />);
        fireEvent.click(screen.getByRole("tab", { name: "Curriculum" }));
        fireEvent.click(screen.getByRole("button", { name: "Advanced" }));

        const draftRow = screen.getByTestId("curriculum-lesson-22");
        expect(within(draftRow).getByText("Preview")).toBeInTheDocument();
        expect(within(draftRow).queryByRole("link")).not.toBeInTheDocument();
    });

    it("finds the first preview lesson in curriculum order", () => {
        expect(findFirstPreviewUrl(curriculum)).toBe("/programs/intro-ai/preview/12/");
        expect(findFirstPreviewUrl([])).toBeNull();
        expect(findFirstPreviewUrl(undefined)).toBeNull();
    });

    it("offers a Preview this course button only when a preview lesson exists", () => {
        const { rerender } = render(
            <PreviewCourseButton href={findFirstPreviewUrl(curriculum)} />,
        );
        expect(screen.getByRole("link", { name: "Preview this course" })).toHaveAttribute(
            "href",
            "/programs/intro-ai/preview/12/",
        );

        rerender(<PreviewCourseButton href={null} />);
        expect(screen.queryByRole("link", { name: "Preview this course" })).not.toBeInTheDocument();
    });
});
