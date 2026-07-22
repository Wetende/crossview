import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import Dashboard from "./Dashboard";

const mockUsePage = vi.fn();

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    usePage: () => mockUsePage(),
}));

vi.mock("@/layouts/DashboardLayout", () => ({
    default: ({ children }) => (
        <div data-testid="dashboard-layout">{children}</div>
    ),
}));

describe("Student dashboard", () => {
    beforeEach(() => {
        mockUsePage.mockReturnValue({
            props: {
                auth: {
                    user: {
                        role: "student",
                    },
                },
            },
        });
    });

    test("renders current courses and real course progress distribution labels", () => {
        render(
            <Dashboard
                role="student"
                enrollments={[
                    {
                        id: 1,
                        programId: 101,
                        programName: "Backend Engineering",
                        programCode: "BE-101",
                        progressPercent: 72,
                        durationHours: 30,
                        enrolledAt: "2026-01-20T00:00:00Z",
                    },
                    {
                        id: 2,
                        programId: 202,
                        programName: "Frontend Foundations",
                        programCode: "FE-202",
                        progressPercent: 40,
                        durationHours: 24,
                        enrolledAt: "2026-01-22T00:00:00Z",
                    },
                ]}
                assignments={[]}
                quizzes={[]}
                recentActivity={[]}
            />,
        );

        expect(
            screen.getByText("Course Progress Distribution"),
        ).toBeInTheDocument();
        expect(screen.getByText("Current Courses")).toBeInTheDocument();
        expect(screen.queryByText("Online Classes")).not.toBeInTheDocument();
        expect(
            screen.getAllByText("Backend Engineering").length,
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByText("Frontend Foundations").length,
        ).toBeGreaterThan(0);
    });

    test("renders contextual empty states when the learner has no work yet", () => {
        render(
            <Dashboard
                role="student"
                enrollments={[]}
                assignments={[]}
                quizzes={[]}
                upcomingDeadlines={[]}
            />,
        );

        expect(screen.getByText("No active courses")).toBeInTheDocument();
        expect(screen.getByText("No upcoming deadlines")).toBeInTheDocument();
        expect(screen.getByText("No assignments")).toBeInTheDocument();
    });
});

describe("Role dashboard variants", () => {
    test("renders instructor workload and review queues", () => {
        mockUsePage.mockReturnValue({
            props: {
                auth: { user: { role: "instructor", firstName: "Amina" } },
            },
        });

        render(
            <Dashboard
                role="instructor"
                stats={{
                    programCount: 3,
                    totalStudents: 18,
                    gradingWorkload: 4,
                    pendingEnrollments: 2,
                }}
                gradingWorkload={{
                    assignments: 2,
                    manualQuizzes: 1,
                    practicum: 1,
                }}
                recentSubmissions={[]}
                pendingEnrollmentRequests={[]}
            />,
        );

        expect(screen.getByText("Welcome back, Amina")).toBeInTheDocument();
        expect(screen.getByText("Recent submissions")).toBeInTheDocument();
        expect(screen.getByText("4 items")).toBeInTheDocument();
        expect(screen.getByText("No pending requests")).toBeInTheDocument();
    });

    test("renders admin metrics, actions, and activity", () => {
        mockUsePage.mockReturnValue({
            props: { auth: { user: { role: "admin", firstName: "Mbua" } } },
        });

        render(
            <Dashboard
                role="admin"
                stats={{
                    totalStudents: 24,
                    totalInstructors: 4,
                    activePrograms: 6,
                    activeEnrollments: 8,
                    completedEnrollments: 2,
                    pendingEnrollmentRequests: 1,
                    pendingPracticumSubmissions: 3,
                }}
                recentActivity={[
                    {
                        description: "Ada enrolled in Robotics",
                        timestamp: "Jul 22, 2026",
                    },
                ]}
            />,
        );

        expect(screen.getByText("Welcome back, Mbua")).toBeInTheDocument();
        expect(screen.getByText("Recent activity")).toBeInTheDocument();
        expect(
            screen.getByText("Ada enrolled in Robotics"),
        ).toBeInTheDocument();
        expect(screen.getByText("20%")).toBeInTheDocument();
    });
});
