import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import QuizAnswerReview from "./QuizAnswerReview";

describe("QuizAnswerReview grading states", () => {
    test("preserves false correct answers from per-question results", () => {
        const html = renderToStaticMarkup(
            <QuizAnswerReview
                defaultExpanded
                attempt={{
                    id: 22,
                    score: 0,
                    passed: false,
                    answers: { 101: true },
                    questionResults: [
                        {
                            questionId: 101,
                            isCorrect: false,
                            correctAnswer: false,
                            pointsEarned: 0,
                            gradingStatus: "graded",
                        },
                    ],
                }}
                questions={[
                    {
                        id: 101,
                        text: "It is not mandatory.",
                        type: "true_false",
                        points: 1,
                        correctAnswer: true,
                    },
                ]}
            />,
        );

        expect(html).toContain("Correct Answer:");
        expect(html).toContain("False");
        expect(html).not.toContain("No answer provided");
    });

    test("shows a manual response as awaiting grading instead of failed", () => {
        const html = renderToStaticMarkup(
            <QuizAnswerReview
                defaultExpanded
                questions={[
                    {
                        id: 7,
                        text: "Explain immutable infrastructure.",
                        type: "short_answer",
                        points: 10,
                    },
                ]}
                attempt={{
                    id: 4,
                    attemptNumber: 1,
                    score: null,
                    passed: null,
                    answers: { 7: "Infrastructure is replaced, not edited." },
                    questionResults: [
                        {
                            questionId: 7,
                            isCorrect: null,
                            gradingStatus: "awaiting_manual_grade",
                            pointsEarned: null,
                        },
                    ],
                }}
            />,
        );

        expect(html).toContain("Awaiting grading");
        expect(html).toContain("1 response awaiting grading");
        expect(html).not.toContain("0%");
        expect(html).not.toContain("Correct Answer:");
    });
});
