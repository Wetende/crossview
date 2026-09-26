import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { router } from "@inertiajs/react";

import QuizRenderer from "./QuizRenderer";
import {
    evaluateQuizAnswers,
    normalizeQuestions,
    normalizeText,
} from "./quizRendererUtils";

vi.mock("@inertiajs/react", () => ({
    router: {
        visit: vi.fn(),
        post: vi.fn(),
    },
}));

describe("QuizRenderer", () => {
    test("decodes html entities in question text and options", () => {
        const normalized = normalizeQuestions([
            {
                id: 303,
                type: "mcq",
                text: "<p>Define&nbsp;what&nbsp;public&nbsp;relations&#39;&nbsp;role&nbsp;is.</p>",
                options: [
                    "Handles&nbsp;communication",
                    "Only&nbsp;buys&nbsp;ads",
                ],
                correct: 0,
                points: 1,
            },
        ]);

        expect(normalized[0].text).toBe(
            "Define what public relations' role is.",
        );
        expect(normalized[0].options[0].text).toBe("Handles communication");
        expect(normalizeText("Investors&#39;&nbsp;capital")).toBe(
            "Investors' capital",
        );
    });

    test("renders labels when options are plain strings", () => {
        const html = renderToStaticMarkup(
            <QuizRenderer
                node={{
                    id: 1,
                    title: "Knowledge Check",
                    properties: {
                        questions: [
                            {
                                id: 101,
                                type: "mcq",
                                text: "What does CPU stand for?",
                                options: [
                                    "Computer Processing Unit",
                                    "Central Processing Unit",
                                ],
                                correct: 1,
                                points: 1,
                            },
                        ],
                    },
                }}
                enrollmentId={55}
            />,
        );

        expect(html).toContain("Computer Processing Unit");
        expect(html).toContain("Central Processing Unit");
    });

    test("renders labels when options are object arrays", () => {
        const html = renderToStaticMarkup(
            <QuizRenderer
                node={{
                    id: 2,
                    title: "Knowledge Check",
                    properties: {
                        questions: [
                            {
                                id: 202,
                                type: "mcq",
                                text: "Pick one",
                                options: [
                                    { id: "a", text: "Option A" },
                                    { id: "b", text: "Option B" },
                                ],
                                correctAnswer: 1,
                                points: 1,
                            },
                        ],
                    },
                }}
                enrollmentId={55}
            />,
        );

        expect(html).toContain("Option A");
        expect(html).toContain("Option B");
    });

    test("supports question navigation and returning to a saved answer", () => {
        render(
            <QuizRenderer
                node={{
                    id: 2,
                    title: "Knowledge Check",
                    properties: {
                        questions: [
                            {
                                id: 201,
                                type: "mcq",
                                text: "First question",
                                options: ["First answer", "Second answer"],
                                correct: 0,
                            },
                            {
                                id: 202,
                                type: "mcq",
                                text: "Second question",
                                options: ["Third answer", "Fourth answer"],
                                correct: 1,
                            },
                        ],
                    },
                }}
                enrollmentId={55}
            />,
        );

        expect(
            screen.getByRole("navigation", { name: "Quiz questions" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

        fireEvent.click(screen.getByLabelText("First answer"));
        fireEvent.click(screen.getByRole("button", { name: "Next Question" }));

        expect(screen.getByText("Second question")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
        expect(
            screen.getByRole("button", { name: "Question 1, answered" }),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Previous" }));

        expect(screen.getByLabelText("First answer")).toBeChecked();
    });

    test("scores mixed question types and excludes manual short answer from denominator", () => {
        const normalized = normalizeQuestions([
            {
                id: "q1",
                type: "mcq",
                text: "MCQ",
                options: ["A", "B", "C"],
                correct: 1,
                points: 2,
            },
            {
                id: "q2",
                type: "mcq_multi",
                text: "Multi",
                options: ["A", "B", "C"],
                correctAnswers: [0, 2],
                points: 2,
            },
            {
                id: "q3",
                type: "true_false",
                text: "True/False",
                options: ["True", "False"],
                correct: 0,
                points: 1,
            },
            {
                id: "q4",
                type: "matching",
                text: "Match",
                pairs: [
                    { left_text: "One", right_text: "1" },
                    { left_text: "Two", right_text: "2" },
                ],
                points: 4,
            },
            {
                id: "q5",
                type: "fill_blank",
                text: "The capital of France is {{blank}} and Spain is {{blank}}.",
                gaps: [
                    { gap_index: 0, accepted_answers: ["Paris"] },
                    { gap_index: 1, accepted_answers: ["Madrid"] },
                ],
                points: 4,
            },
            {
                id: "q6",
                type: "ordering",
                text: "Order",
                items: ["A", "B", "C"],
                points: 3,
            },
            {
                id: "q7",
                type: "image_matching",
                text: "Image Match",
                image_pairs: [
                    {
                        question_text: "Dog",
                        answer_text: "Bark",
                    },
                    {
                        question_text: "Cat",
                        answer_text: "Meow",
                    },
                ],
                points: 4,
            },
            {
                id: "q8",
                type: "short_answer",
                text: "Keyword",
                keywords: ["servant"],
                points: 2,
            },
            {
                id: "q9",
                type: "short_answer",
                text: "Manual",
                keywords: [],
                points: 5,
            },
        ]);

        const byId = Object.fromEntries(normalized.map((q) => [q.id, q]));
        const imageQuestion = byId.q7;
        const leftIds = imageQuestion.left_items.map((item) => item.id);
        const rightIds = imageQuestion.right_items.map((item) => item.id);

        const answers = {
            q1: byId.q1.correctOptionId,
            q2: byId.q2.correctOptionIds,
            q3: byId.q3.correctOptionId,
            q4: { One: "1", Two: "wrong" },
            q5: { 0: "Paris", 1: "wrong" },
            q6: ["C", "B", "A"],
            q7: {
                [leftIds[0]]: imageQuestion.correctImageMatchingMap[leftIds[0]],
                [leftIds[1]]: rightIds[0],
            },
            q8: "Servant leadership",
            q9: "Needs lecturer review",
        };

        const result = evaluateQuizAnswers(normalized, answers);

        expect(result.pointsEarned).toBe(14);
        expect(result.pointsPossible).toBe(22);
        expect(result.score).toBe(63.64);
        expect(result.ungradedCount).toBe(1);
    });

    test("applies penalized partial credit for multi-select and position-based credit for ordering", () => {
        const normalized = normalizeQuestions([
            {
                id: "multi",
                type: "mcq_multi",
                text: "Select all valid items",
                options: ["A", "B", "C", "D"],
                correctAnswers: [0, 1, 2],
                points: 4,
            },
            {
                id: "order",
                type: "ordering",
                text: "Order the steps",
                items: ["First", "Second", "Third"],
                points: 3,
            },
        ]);

        const byId = Object.fromEntries(normalized.map((q) => [q.id, q]));
        const answers = {
            multi: [
                byId.multi.correctOptionIds[0],
                byId.multi.correctOptionIds[1],
                byId.multi.options.find(
                    (option) =>
                        !byId.multi.correctOptionIds.includes(option.id),
                ).id,
            ],
            order: ["Third", "Second", "First"],
        };

        const result = evaluateQuizAnswers(normalized, answers);

        expect(result.evaluations[0].pointsEarned).toBe(1.33);
        expect(result.evaluations[1].pointsEarned).toBe(1);
        expect(result.pointsEarned).toBe(2.33);
        expect(result.score).toBe(33.29);
    });

    test("reveals a question hint only when the learner asks for it", () => {
        render(
            <QuizRenderer
                node={{
                    id: 3,
                    title: "Hints",
                    properties: {
                        questions: [
                            {
                                id: 301,
                                type: "mcq",
                                text: "How many cores?",
                                options: ["Two", "Four"],
                                correct: 1,
                                hint: "<p>Count the <strong>chips</strong>.</p><script>window.hinted = true</script>",
                            },
                            {
                                id: 302,
                                type: "true_false",
                                text: "No hint here",
                                correct: 0,
                                hint: "<p></p>",
                            },
                        ],
                    },
                }}
                enrollmentId={55}
            />,
        );

        const toggle = screen.getByRole("button", { name: "Show hint" });
        expect(toggle).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByText("chips")).not.toBeInTheDocument();

        fireEvent.click(toggle);

        expect(screen.getByText("chips").tagName).toBe("STRONG");
        expect(
            screen.getByRole("button", { name: "Hide hint" }),
        ).toHaveAttribute("aria-expanded", "true");
        expect(document.querySelector("script")).toBeNull();
        expect(window.hinted).toBeUndefined();

        fireEvent.click(screen.getByLabelText("Four"));
        fireEvent.click(screen.getByRole("button", { name: "Next Question" }));

        expect(screen.getByText("No hint here")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: /hint/i }),
        ).not.toBeInTheDocument();
    });

    test("keeps rich explanations and hints when normalising questions", () => {
        const [question] = normalizeQuestions([
            {
                id: 1,
                type: "short_answer",
                text: "<p>Explain</p>",
                explanation:
                    '<p>Because <span data-type="inline-math" data-latex="x^2"></span></p>',
                hint: "<p><br></p>",
            },
        ]);

        expect(question.text).toBe("Explain");
        expect(question.explanation).toBe(
            '<p>Because <span data-type="inline-math" data-latex="x^2"></span></p>',
        );
        expect(question.hint).toBe("");
    });

    test("uses backend-compatible true/false values when options are omitted", () => {
        const normalized = normalizeQuestions([
            {
                id: "tf",
                type: "true_false",
                text: "It is important to develop a PR strategy.",
                correct: true,
                points: 1,
            },
        ]);

        expect(normalized[0].options.map((option) => option.id)).toEqual([
            "true",
            "false",
        ]);
        expect(normalized[0].correctOptionId).toBe("true");

        const result = evaluateQuizAnswers(normalized, { tf: "true" });

        expect(result.pointsEarned).toBe(1);
        expect(result.score).toBe(100);
    });

    describe("inline quiz completion", () => {
        const inlineNode = {
            id: 7,
            title: "Final check",
            properties: {
                questions: [
                    {
                        id: 701,
                        type: "mcq",
                        text: "Pick the first option",
                        options: ["First option", "Second option"],
                        correct: 0,
                        points: 1,
                    },
                ],
            },
        };

        beforeEach(() => {
            router.post.mockClear();
            router.visit.mockClear();
        });

        const finishQuiz = (onComplete) => {
            render(
                <QuizRenderer
                    node={inlineNode}
                    enrollmentId={9}
                    onComplete={onComplete}
                />,
            );
            fireEvent.click(screen.getByLabelText("First option"));
            fireEvent.click(screen.getByRole("button", { name: "Finish Quiz" }));
            expect(router.post).toHaveBeenCalledTimes(1);
            return router.post.mock.calls[0];
        };

        test("opens the course summary instead of a second completion post", () => {
            const onComplete = vi.fn();
            const [url, , options] = finishQuiz(onComplete);

            expect(url).toBe("/student/programs/9/session/7/");
            expect(options.only).toEqual([
                "isCompleted",
                "curriculum",
                "courseCompleteUrl",
            ]);
            act(() => {
                options.onSuccess({
                    props: { courseCompleteUrl: "/student/programs/9/complete/" },
                });
                options.onFinish();
            });

            expect(router.visit).toHaveBeenCalledWith(
                "/student/programs/9/complete/",
            );
            expect(onComplete).not.toHaveBeenCalled();
        });

        test("keeps the lesson completion flow when the course continues", () => {
            const onComplete = vi.fn();
            const [, , options] = finishQuiz(onComplete);

            act(() => {
                options.onSuccess({ props: { courseCompleteUrl: null } });
                options.onFinish();
            });

            expect(router.visit).not.toHaveBeenCalled();
            expect(onComplete).toHaveBeenCalledTimes(1);
        });
    });
});
