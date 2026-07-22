import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import CourseUnitCard from "./CourseUnitCard";
import CurrentLearningCard from "./CurrentLearningCard";
import LearningStatusBadge from "./LearningStatusBadge";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, href, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

describe("learner experience components", () => {
    test("communicates course status with text and an icon", () => {
        render(<LearningStatusBadge status="active" progressPercent={42} />);

        expect(screen.getByText("In progress")).toBeInTheDocument();
    });

    test("features the current course with an explicit resume action", () => {
        render(
            <CurrentLearningCard
                featured
                enrollment={{
                    programId: 8,
                    programName: "Infrastructure Foundations",
                    progressPercent: 42,
                    learnerState: "active",
                    completedNodes: 5,
                    totalNodes: 12,
                    currentPosition: { title: "Build a deployment pipeline" },
                }}
            />,
        );

        expect(
            screen.getByRole("heading", { name: "Infrastructure Foundations" }),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Continue with Build a deployment pipeline"),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: /resume learning/i }),
        ).toHaveAttribute("href", "/student/programs/8/resume/");
    });

    test("makes an available unit one labelled navigation target", () => {
        render(
            <CourseUnitCard
                index={1}
                unit={{
                    title: "Deploy safely",
                    completedCount: 2,
                    totalCount: 5,
                    progressPercent: 40,
                    url: "/student/programs/3/session/9/",
                }}
            />,
        );

        expect(
            screen.getByRole("link", { name: "Open Deploy safely" }),
        ).toHaveAttribute("href", "/student/programs/3/session/9/");
        expect(screen.getByText("2/5 items completed")).toBeInTheDocument();
    });
});
