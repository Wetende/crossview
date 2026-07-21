import { describe, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import Gradebook from "./Detail";

vi.mock("@inertiajs/react", () => ({
    Head: () => null,
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
    router: { post: vi.fn() },
}));

vi.mock("framer-motion", () => ({
    motion: { div: ({ children }) => <div>{children}</div> },
}));

vi.mock("@/layouts/InstructorLayout", () => ({
    default: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/components/ConfirmDialog", () => ({
    default: ({ title, message, confirmLabel }) => (
        <div>{`${title} ${message} ${confirmLabel}`}</div>
    ),
}));

vi.mock("@/features/reports", () => ({
    ReportToolbar: () => <div>Report tools</div>,
}));

const baseProps = {
    program: { id: 5, name: "DevOps Engineering Mastery" },
    gradingConfig: { type: "weighted", components: [] },
    quizzes: [{ id: 10, title: "Module 1", weight: 20 }],
    assignments: [{ id: 5, title: "Practical", weight: 80 }],
};

describe("Gradebook instructor actions and grade states", () => {
    test("uses release language and removes manual regeneration", () => {
        const html = renderToStaticMarkup(
            <Gradebook {...baseProps} students={[]} />,
        );

        expect(html).toContain("Release results");
        expect(html).toContain('aria-label="Close"');
        expect(html).not.toContain("Regenerate");
        expect(html).not.toContain("recompute");
    });

    test("distinguishes pending grading from an unattempted quiz", () => {
        const html = renderToStaticMarkup(
            <Gradebook
                {...baseProps}
                students={[
                    {
                        enrollmentId: 22,
                        name: "Peter Student",
                        email: "peter@student.com",
                        quizScores: [
                            {
                                quizId: 10,
                                score: null,
                                passed: null,
                                attemptNumber: 1,
                            },
                        ],
                        assignmentScores: [
                            {
                                assignmentId: 5,
                                score: null,
                                status: "not_submitted",
                            },
                        ],
                        overallScore: null,
                        isPublished: false,
                    },
                ]}
            />,
        );

        expect(html).toContain("Awaiting grading");
        expect(html).toContain("Not submitted");
    });
});
