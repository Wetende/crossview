import { render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import CourseOverview from "./CourseOverview";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

describe("CourseOverview", () => {
    test("presents units, assessments, deadlines, and resources in one overview", () => {
        render(
            <CourseOverview
                program={{
                    id: 4,
                    name: "DevOps Engineering Mastery",
                    description: "Build dependable delivery systems.",
                    deliveryMode: "self_paced",
                    resources: [
                        { id: 11, title: "Course guide", url: "/guide.pdf" },
                    ],
                }}
                enrollment={{
                    progressPercent: 50,
                    upcomingDeadlines: [
                        {
                            id: 8,
                            type: "assignment",
                            title: "Deployment review",
                            dueAt: "2026-08-01T10:00:00Z",
                        },
                    ],
                }}
                resumeUrl="/student/programs/4/resume/"
                curriculum={[
                    {
                        id: 1,
                        title: "Delivery foundations",
                        nodeType: "section",
                        children: [
                            {
                                id: 2,
                                title: "Deployment models",
                                nodeType: "lesson",
                                isCompleted: true,
                                isLocked: false,
                                url: "/student/programs/9/session/2/",
                            },
                            {
                                id: 3,
                                title: "Foundation quiz",
                                nodeType: "quiz",
                                isCompleted: false,
                                isLocked: false,
                                url: "/student/programs/9/session/3/",
                            },
                        ],
                    },
                ]}
            />,
        );

        expect(
            screen.getByRole("heading", { name: "DevOps Engineering Mastery" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Learning units" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "Open Delivery foundations" }),
        ).toHaveAttribute("href", "/student/programs/9/session/3/");
        expect(screen.getByText("Foundation quiz")).toBeInTheDocument();
        expect(screen.getByText("Not submitted")).toBeInTheDocument();
        expect(screen.getByText("Deployment review")).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: /course guide/i }),
        ).toHaveAttribute("href", "/guide.pdf");
        expect(
            screen.queryByText("You completed this course."),
        ).not.toBeInTheDocument();
    });

    test("links a completed course to its summary", () => {
        render(
            <CourseOverview
                program={{ id: 4, name: "Data Foundations", resources: [] }}
                enrollment={{ progressPercent: 100, upcomingDeadlines: [] }}
                resumeUrl="/student/programs/4/resume/"
                courseCompleteUrl="/student/programs/9/complete/"
                curriculum={[]}
            />,
        );

        expect(
            screen.getByText("You completed this course."),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "View course summary" }),
        ).toHaveAttribute("href", "/student/programs/9/complete/");
    });

    test("shows course announcements above the notices, pinned ones marked", () => {
        render(
            <CourseOverview
                program={{
                    id: 4,
                    name: "DevOps Engineering Mastery",
                    notices: [{ id: 1, title: "Welcome", content: "Hello" }],
                }}
                enrollment={{ progressPercent: 0 }}
                resumeUrl="/student/programs/4/resume/"
                curriculum={[]}
                announcements={[
                    {
                        id: 21,
                        title: "Lab environment maintenance",
                        content: "The lab is offline on Friday.\nPlan ahead.",
                        isPinned: true,
                        createdAt: new Date().toISOString(),
                        author: { name: "Grace Mentor" },
                    },
                    {
                        id: 22,
                        title: "New reading added",
                        content: "See the resources rail.",
                        isPinned: false,
                        createdAt: new Date().toISOString(),
                        author: { name: "Grace Mentor" },
                    },
                ]}
            />,
        );

        const section = screen.getByRole("region", { name: "Announcements" });
        expect(
            within(section).getByText("Lab environment maintenance"),
        ).toBeInTheDocument();
        expect(within(section).getAllByText("Pinned")).toHaveLength(1);
        expect(
            within(section).getAllByText(/Grace Mentor ·/),
        ).toHaveLength(2);
        expect(
            within(section).getByText(/The lab is offline on Friday/),
        ).toHaveStyle({ whiteSpace: "pre-line" });

        const notices = screen.getByRole("region", { name: "Course notices" });
        expect(
            section.compareDocumentPosition(notices) &
                Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    test("renders rich text announcements as formatted HTML", () => {
        render(
            <CourseOverview
                program={{ id: 4, name: "DevOps Engineering Mastery" }}
                enrollment={{ progressPercent: 0 }}
                curriculum={[]}
                announcements={[
                    {
                        id: 23,
                        title: "Exam window",
                        content:
                            '<p>The exam opens on <strong>Monday</strong>.</p><img src="x" onerror="alert(1)">',
                        isPinned: false,
                        createdAt: new Date().toISOString(),
                        author: { name: "Grace Mentor" },
                    },
                ]}
            />,
        );

        const content = screen.getByTestId("announcement-content");
        expect(content.querySelector("strong")).toHaveTextContent("Monday");
        expect(content).toHaveTextContent("The exam opens on Monday.");
        expect(content).not.toHaveTextContent("<strong>");
        expect(content.querySelector("img")).not.toHaveAttribute("onerror");
    });

    test("omits the announcements section when there are none", () => {
        render(
            <CourseOverview
                program={{ id: 4, name: "DevOps Engineering Mastery" }}
                enrollment={{ progressPercent: 0 }}
                curriculum={[]}
                announcements={[]}
            />,
        );

        expect(
            screen.queryByRole("region", { name: "Announcements" }),
        ).not.toBeInTheDocument();
    });
});
