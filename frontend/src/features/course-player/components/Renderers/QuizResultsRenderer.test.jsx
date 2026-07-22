import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

import QuizResultsRenderer from "./QuizResultsRenderer";

vi.mock("@inertiajs/react", () => ({
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
    router: { visit: vi.fn() },
}));

vi.mock("framer-motion", () => ({
    motion: {
        div: ({ children }) => <div>{children}</div>,
    },
}));

const buildResults = (overrides = {}) => {
    const attempt = {
        id: 12,
        attemptNumber: 2,
        score: 87,
        passed: true,
        pointsEarned: 17.33,
        pointsPossible: 20,
        submittedAt: "2026-07-13T10:00:00Z",
    };
    return {
        quiz: {
            id: 1,
            title: "Knowledge Check",
            nodeTitle: "Unit 6",
            passThreshold: 70,
            maxAttempts: 3,
            answerReleasePolicy: "after_pass_or_final",
            showAttemptHistory: true,
            retryUrl: "/session/1/?start_quiz=1",
            reviewUrl: "/student/quiz/1/results/?enrollment_id=5",
        },
        attempts: [attempt],
        attemptsRemaining: 1,
        canRetry: true,
        correctAnswersReleased: true,
        officialAttempt: attempt,
        reviewedAttempt: attempt,
        retryLockReason: null,
        questionReview: [
            {
                questionId: 101,
                questionText: "It is not mandatory.",
                studentAnswer: true,
                correctAnswer: false,
                isCorrect: false,
                pointsEarned: 0,
                pointsPossible: 1,
            },
        ],
        ...overrides,
    };
};

describe("QuizResultsRenderer", () => {
    test("renders false correct answers instead of falling back to N/A", () => {
        const html = renderToStaticMarkup(
            <QuizResultsRenderer quizResults={buildResults()} />,
        );

        expect(html).toContain("Correct answer: False");
        expect(html).not.toContain("Correct answer: N/A");
    });

    test("lets a passed learner continue and use a remaining attempt", () => {
        const html = renderToStaticMarkup(
            <QuizResultsRenderer
                quizResults={buildResults()}
                nextNode={{ id: 2, url: "/session/2/" }}
            />,
        );

        expect(html).toContain("87%");
        expect(html).toContain("Attempt #2 of 3");
        expect(html).toContain("1 attempt remaining.");
        expect(html).toContain("Continue learning");
        expect(html).toContain("Try again");
        expect(html).not.toContain("All 3 available attempts");
    });

    test("keeps correct answers hidden until the release policy allows them", () => {
        const html = renderToStaticMarkup(
            <QuizResultsRenderer
                quizResults={buildResults({
                    correctAnswersReleased: false,
                    questionReview: [
                        {
                            questionId: 101,
                            questionText: "It is not mandatory.",
                            studentAnswer: true,
                            correctAnswer: null,
                            isCorrect: false,
                            pointsEarned: 0,
                            pointsPossible: 1,
                        },
                    ],
                })}
            />,
        );

        expect(html).toContain(
            "Correct answers will be released after you pass or use your final available attempt.",
        );
        expect(html).not.toContain("Correct answer:");
        expect(html).toContain("Your answer:");
    });

    test("shows a policy lock separately from exhausted attempts", () => {
        const html = renderToStaticMarkup(
            <QuizResultsRenderer
                quizResults={buildResults({
                    canRetry: false,
                    retryLockReason: "passed_retake_disabled",
                })}
            />,
        );

        expect(html).toContain(
            "Further attempts are disabled by the instructor",
        );
        expect(html).toContain("1 remains in the numeric limit");
        expect(html).not.toContain("All 3 available attempts");
    });

    test("selects an older attempt from history", async () => {
        const { router } = await import("@inertiajs/react");
        const olderAttempt = {
            id: 11,
            attemptNumber: 1,
            score: 65,
            passed: false,
            pointsEarned: 13,
            pointsPossible: 20,
            submittedAt: "2026-07-12T10:00:00Z",
        };
        const results = buildResults();
        render(
            <QuizResultsRenderer
                quizResults={{
                    ...results,
                    attempts: [...results.attempts, olderAttempt],
                }}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Review" }));

        expect(router.visit).toHaveBeenCalledWith(
            "/student/quiz/1/results/?enrollment_id=5&attempt_id=11",
        );
    });
});
