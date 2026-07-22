import { render, screen } from "@testing-library/react";
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
    });
});
