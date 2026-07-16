import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import CourseContentTabs from "./CourseContentTabs";
import CourseDetailsPanel from "./CourseDetailsPanel";

const program = {
    name: "Introduction to AI",
    description: "<p>Course <strong>description</strong></p>",
    what_you_learn_html: "<ul><li>Use AI responsibly</li></ul>",
    duration_hours: 1.5,
    lecture_count: 3,
    assessment_count: 2,
    level: "Beginner",
    resources: [
        {
            id: 1,
            title: "Course handbook",
            type: "PDF",
            url: "/handbook.pdf",
        },
    ],
    faq: [
        {
            question: "Do I need experience?",
            answer: "<p>No prior experience.</p><script>window.__faqInjected = true</script>",
        },
        {
            question: "Is a certificate included?",
            answer: "<p>Yes, after completion.</p>",
        },
    ],
    notices: [
        {
            title: "Course update",
            content: "<p>New material is available.</p><img src=x onerror=alert(1)>",
        },
        "Bring a notebook.",
    ],
    reviews: [
        {
            id: 4,
            rating: 5,
            reviewText: "<p>Very practical.</p>",
            user: { name: "Ada Student" },
            updatedAt: "2026-07-16T00:00:00Z",
        },
    ],
};

const curriculum = [
    {
        id: 10,
        title: "Introduction",
        children: [
            {
                id: 11,
                title: "A deliberately long lesson title that needs to wrap cleanly",
                type: "Lesson",
                duration: 10,
                isPreview: false,
            },
            {
                id: 12,
                title: "Knowledge Check",
                type: "Quiz",
                isPreview: true,
            },
        ],
    },
    {
        id: 20,
        title: "Advanced Topics",
        children: [
            {
                id: 21,
                title: "Deep Dive",
                type: "Video",
                duration: 15,
                isPreview: false,
            },
        ],
    },
    {
        id: 30,
        title: "Coming Soon",
        children: [],
    },
];

describe("shared course presentation", () => {
    test("renders the grey course-details metric rows with separators", () => {
        render(<CourseDetailsPanel program={program} />);

        const panel = screen.getByTestId("course-details-panel");
        expect(within(panel).getByText("Course details")).toBeInTheDocument();
        expect(within(panel).getByTestId("course-detail-row-duration")).toHaveTextContent("1.5 hours");
        expect(within(panel).getByTestId("course-detail-row-lessons")).toHaveTextContent("3");
        expect(within(panel).getByTestId("course-detail-row-assessments")).toHaveTextContent("2");
        expect(within(panel).getByTestId("course-detail-row-level")).toHaveTextContent("Beginner");
        expect(within(panel).getAllByRole("separator")).toHaveLength(4);
    });

    test("opens the first curriculum section and keeps only one section open", () => {
        render(<CourseContentTabs program={program} curriculum={curriculum} />);
        fireEvent.click(screen.getByRole("tab", { name: "Curriculum" }));

        const introduction = screen.getByRole("button", { name: "Introduction" });
        const advanced = screen.getByRole("button", { name: "Advanced Topics" });
        expect(introduction).toHaveAttribute("aria-expanded", "true");
        expect(advanced).toHaveAttribute("aria-expanded", "false");
        expect(screen.getByText("10 min")).toBeInTheDocument();
        expect(screen.getByText("Preview")).toBeInTheDocument();
        const lockedLesson = screen.getByTestId("curriculum-lesson-11");
        expect(within(lockedLesson).getByLabelText("Locked content")).toBeInTheDocument();
        expect(lockedLesson).toHaveTextContent(
            "A deliberately long lesson title that needs to wrap cleanly",
        );

        fireEvent.click(advanced);
        expect(introduction).toHaveAttribute("aria-expanded", "false");
        expect(advanced).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByText("Deep Dive")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Coming Soon" }));
        expect(screen.getByText("No lessons in this section yet.")).toBeInTheDocument();
    });

    test("keeps FAQ and Notice collapsed, single-open, and sanitized", () => {
        const { container } = render(
            <CourseContentTabs program={program} curriculum={curriculum} />,
        );

        fireEvent.click(screen.getByRole("tab", { name: "FAQ" }));
        const firstFaq = screen.getByRole("button", { name: "Do I need experience?" });
        const secondFaq = screen.getByRole("button", { name: "Is a certificate included?" });
        expect(firstFaq).toHaveAttribute("aria-expanded", "false");
        expect(secondFaq).toHaveAttribute("aria-expanded", "false");

        fireEvent.click(firstFaq);
        expect(screen.getByText("No prior experience.")).toBeInTheDocument();
        expect(container.querySelector("script")).not.toBeInTheDocument();
        fireEvent.click(secondFaq);
        expect(firstFaq).toHaveAttribute("aria-expanded", "false");
        expect(secondFaq).toHaveAttribute("aria-expanded", "true");

        fireEvent.click(screen.getByRole("tab", { name: "Notice" }));
        const firstNotice = screen.getByRole("button", { name: "Course update" });
        const secondNotice = screen.getByRole("button", { name: "Notice 2" });
        expect(firstNotice).toHaveAttribute("aria-expanded", "false");
        expect(secondNotice).toHaveAttribute("aria-expanded", "false");
        fireEvent.click(firstNotice);
        expect(screen.getByText("New material is available.")).toBeInTheDocument();
        expect(container.querySelector("[onerror]")).not.toBeInTheDocument();
    });

    test("retains the resource and review-specific layouts", () => {
        render(<CourseContentTabs program={program} curriculum={curriculum} />);

        fireEvent.click(screen.getByRole("tab", { name: "Resources" }));
        expect(screen.getByRole("link", { name: "Course handbook" })).toHaveAttribute(
            "href",
            "/handbook.pdf",
        );
        expect(screen.getByRole("link", { name: "Download" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("tab", { name: "Reviews" }));
        expect(screen.getByText("Ada Student")).toBeInTheDocument();
        expect(screen.getByText("Very practical.")).toBeInTheDocument();
    });

    test("shows stable empty states for content collections", () => {
        render(
            <CourseContentTabs
                program={{ name: "Empty course", description: "" }}
                curriculum={[]}
            />,
        );

        fireEvent.click(screen.getByRole("tab", { name: "Curriculum" }));
        expect(screen.getByText("Curriculum details coming soon.")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("tab", { name: "FAQ" }));
        expect(screen.getByText("No FAQs available for this course.")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("tab", { name: "Notice" }));
        expect(screen.getByText("No notices for this course.")).toBeInTheDocument();
    });
});
