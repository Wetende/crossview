import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import Analytics from "./Analytics";

const { routerGet } = vi.hoisted(() => ({ routerGet: vi.fn() }));

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
    router: { get: routerGet },
}));

vi.mock("@/layouts/InstructorLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

vi.mock("recharts", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        ResponsiveContainer: ({ children }) => (
            <div>
                {React.cloneElement(children, { width: 640, height: 260 })}
            </div>
        ),
    };
});

const program = {
    id: 42,
    title: "Data Literacy",
    url: "/instructor/programs/42/",
};

const links = {
    overview: "/instructor/programs/42/",
    roster: "/instructor/programs/42/students/",
    gradebook: "/instructor/programs/42/gradebook/",
    builder: "/instructor/programs/42/manage/",
};

const lessonRow = (overrides) => ({
    type: "Session",
    started: 0,
    completed: 0,
    completionRate: 0,
    dropOff: null,
    avgActiveSeconds: null,
    ...overrides,
});

const baseProps = {
    program,
    range: "30d",
    ranges: ["7d", "30d", "90d", "all"],
    summary: {
        totalLearners: 1240,
        newLearners: 18,
        activeLearners: 300,
        completedLearners: 95,
        needsAttention: 42,
        averageProgress: 57.5,
        certificatesIssued: 80,
        pendingGrading: 3,
    },
    statusBreakdown: [
        { status: "active", count: 300 },
        { status: "stalled", count: 42 },
        { status: "completed", count: 95 },
    ],
    enrollmentTrend: {
        granularity: "day",
        since: "2026-09-20",
        points: [
            { date: "2026-09-25", count: 5 },
            { date: "2026-09-26", count: 13 },
        ],
        total: 18,
    },
    lessonEngagement: {
        learnerCount: 1240,
        total: 3,
        truncated: false,
        results: [
            lessonRow({
                id: 1,
                position: 1,
                title: "Welcome",
                started: 1000,
                completed: 900,
                completionRate: 72.6,
                avgActiveSeconds: 95,
            }),
            lessonRow({
                id: 2,
                position: 2,
                title: "Cleaning data",
                type: "video",
                started: 550,
                completed: 300,
                completionRate: 24.2,
                dropOff: 45,
            }),
            lessonRow({
                id: 3,
                position: 3,
                title: "Charts",
                started: 500,
                completed: 480,
                completionRate: 38.7,
                dropOff: 9.1,
            }),
        ],
    },
    assessments: [
        {
            id: 7,
            kind: "quiz",
            title: "Checkpoint quiz",
            attempts: 12,
            learners: 10,
            graded: 10,
            passed: 8,
            passRate: 80,
            averageScore: 74.5,
            pending: 0,
            passThreshold: 60,
            url: null,
        },
        {
            id: 9,
            kind: "assignment",
            title: "Final project",
            attempts: 6,
            learners: 6,
            graded: 3,
            passed: 1,
            passRate: 33.3,
            averageScore: 81,
            pending: 3,
            passThreshold: 50,
            url: "/instructor/assignments/9/submissions/",
        },
    ],
    links,
};

function lessonTitles() {
    const table = screen.getByRole("table", { name: "Lesson engagement" });
    return within(table)
        .getAllByRole("row")
        .slice(1)
        .map(
            (row) =>
                within(row).getAllByRole("cell")[1].querySelector("p")
                    .textContent,
        );
}

describe("instructor course analytics page", () => {
    beforeEach(() => {
        routerGet.mockClear();
    });

    test("renders stats, charts, lesson and assessment tables from props", () => {
        render(<Analytics {...baseProps} />);

        expect(
            screen.getByRole("heading", { name: "Course analytics" }),
        ).toBeInTheDocument();
        expect(screen.getByText("Total learners")).toBeInTheDocument();
        expect(screen.getByText("1,240")).toBeInTheDocument();
        expect(screen.getByText("57.5%")).toBeInTheDocument();
        expect(screen.getByText("80 certificates issued")).toBeInTheDocument();

        expect(
            screen.getByRole("figure", {
                name: "New enrollments per day: 18 in the last 30 days",
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("figure", {
                name: "Learners by status: Active 300, Stalled 42, Completed 95",
            }),
        ).toBeInTheDocument();

        expect(lessonTitles()).toEqual(["Welcome", "Cleaning data", "Charts"]);
        expect(screen.getByText("1m 35s")).toBeInTheDocument();

        const assessments = screen.getByRole("table", {
            name: "Assessment performance",
        });
        expect(
            within(assessments).getByText("Checkpoint quiz"),
        ).toBeInTheDocument();
        const project = within(assessments)
            .getByText("Final project")
            .closest("tr");
        expect(
            within(project)
                .getAllByRole("cell")
                .slice(1, 7)
                .map((cell) => cell.textContent),
        ).toEqual(["6", "6", "3", "33.3%", "81%", "3"]);
        expect(screen.getByText(/3 pending grading/)).toBeInTheDocument();
        expect(
            screen.getByText(/including\s+withdrawn, suspended and expired/),
        ).toBeInTheDocument();
        expect(
            within(assessments).getByRole("link", { name: "Review" }),
        ).toHaveAttribute("href", "/instructor/assignments/9/submissions/");

        expect(
            screen.getByRole("link", { name: /manage learners/i }),
        ).toHaveAttribute("href", links.roster);
        expect(
            screen
                .getAllByRole("link", { name: /gradebook/i })
                .map((link) => link.getAttribute("href")),
        ).toContain(links.gradebook);
        expect(
            screen.getByRole("link", { name: /course builder/i }),
        ).toHaveAttribute("href", links.builder);
    });

    test("shows an empty state when the course has no learners", () => {
        render(
            <Analytics
                {...baseProps}
                summary={{ ...baseProps.summary, totalLearners: 0 }}
                statusBreakdown={[]}
                lessonEngagement={{
                    ...baseProps.lessonEngagement,
                    results: [],
                }}
            />,
        );

        expect(screen.getByText("No learners yet")).toBeInTheDocument();
        expect(screen.queryByText("Total learners")).not.toBeInTheDocument();
        expect(
            screen.queryByRole("table", { name: "Lesson engagement" }),
        ).not.toBeInTheDocument();
    });

    test("shows the trend empty state when the range has no enrollments", () => {
        render(
            <Analytics
                {...baseProps}
                enrollmentTrend={{
                    ...baseProps.enrollmentTrend,
                    points: baseProps.enrollmentTrend.points.map((point) => ({
                        ...point,
                        count: 0,
                    })),
                    total: 0,
                }}
            />,
        );

        expect(
            screen.getByText("No enrollments in this period."),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("figure", { name: /new enrollments per/i }),
        ).not.toBeInTheDocument();
    });

    test("names each chart once", () => {
        render(<Analytics {...baseProps} />);

        const figures = screen.getAllByRole("figure");
        expect(figures).toHaveLength(2);
        for (const figure of figures) {
            const svgTitles = [...figure.querySelectorAll("svg title")];
            expect(svgTitles.every((title) => !title.textContent.trim())).toBe(
                true,
            );
        }
    });

    test("range toggle reloads the page through the Inertia router", () => {
        render(<Analytics {...baseProps} />);

        expect(screen.getByRole("button", { name: "30 days" })).toHaveAttribute(
            "aria-pressed",
            "true",
        );
        fireEvent.click(screen.getByRole("button", { name: "7 days" }));

        expect(routerGet).toHaveBeenCalledWith(
            "/instructor/programs/42/analytics/",
            { range: "7d" },
            expect.objectContaining({ preserveState: true }),
        );

        routerGet.mockClear();
        fireEvent.click(screen.getByRole("button", { name: "30 days" }));
        expect(routerGet).not.toHaveBeenCalled();
    });

    test("highlights drop-off above 30% only", () => {
        render(<Analytics {...baseProps} />);

        const highlighted = screen.getAllByTitle("High drop-off");
        expect(highlighted).toHaveLength(1);
        const row = highlighted[0].closest("tr");
        expect(within(row).getByText("Cleaning data")).toBeInTheDocument();
        expect(within(row).getByText("45%")).toBeInTheDocument();

        const calmRow = screen.getByText("Charts").closest("tr");
        expect(within(calmRow).getByText("9.1%")).toBeInTheDocument();
        expect(within(calmRow).queryByTitle("High drop-off")).toBeNull();
    });

    test("sorts lessons by completion", () => {
        render(<Analytics {...baseProps} />);

        const orderHeader = screen.getByRole("columnheader", { name: "#" });
        expect(orderHeader).toHaveAttribute("aria-sort", "ascending");
        expect(
            within(orderHeader).getByRole("button", { name: "#" }),
        ).not.toHaveAttribute("aria-label");

        fireEvent.click(
            screen.getByRole("button", { name: "Sort by completion" }),
        );
        expect(lessonTitles()).toEqual(["Welcome", "Charts", "Cleaning data"]);

        fireEvent.click(
            screen.getByRole("button", { name: "Sort by completion" }),
        );
        expect(lessonTitles()).toEqual(["Cleaning data", "Charts", "Welcome"]);
    });
});
