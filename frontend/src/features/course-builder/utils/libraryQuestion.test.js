import { describe, expect, it } from "vitest";
import {
    libraryEntryToBuilderQuestion,
    snapshotForQuestion,
} from "./libraryQuestion";

const entryFor = (questionData, extra = {}) => ({
    id: 41,
    snapshot_version: 3,
    question_type: questionData.question_type,
    question_data: {
        options: [],
        matching_pairs: [],
        gap_answers: [],
        image_matching_pairs: [],
        answer_data: {},
        points: 1,
        ...questionData,
    },
    ...extra,
});

const withoutKeys = (items) =>
    items.map((item) => {
        const copy = { ...item };
        delete copy.key;
        delete copy.id;
        return copy;
    });

describe("libraryEntryToBuilderQuestion", () => {
    it("marks library copies with their entry and version", () => {
        const question = libraryEntryToBuilderQuestion(
            entryFor({ question_type: "mcq", text: "Pick one" }),
        );

        expect(question.fromLibrary).toBe(true);
        expect(question.libraryEntryId).toBe(41);
        expect(question.libraryEntryVersion).toBe(3);
    });

    it("maps true/false answers to the editor's True/False buttons", () => {
        const trueQuestion = libraryEntryToBuilderQuestion(
            entryFor({ question_type: "true_false", answer_data: { correct: true } }),
        );
        const falseQuestion = libraryEntryToBuilderQuestion(
            entryFor({ question_type: "true_false", answer_data: { correct: false } }),
        );

        expect(trueQuestion.correct).toBe(0);
        expect(falseQuestion.correct).toBe(1);
    });

    it("keeps short-answer keywords and grading mode", () => {
        const question = libraryEntryToBuilderQuestion(
            entryFor({
                question_type: "short_answer",
                answer_data: { keywords: ["ohm", "resistance"], manual_grading: false },
            }),
        );

        expect(question.keywords).toEqual(["ohm", "resistance"]);
        expect(question.manual_grading).toBe(false);
    });

    it("keeps ordering explanations and image matching pairs", () => {
        const ordering = libraryEntryToBuilderQuestion(
            entryFor({
                question_type: "ordering",
                answer_data: {
                    items: ["Plan", "Build"],
                    explanations: { item_0: "Plan first" },
                },
            }),
        );
        const imageMatching = libraryEntryToBuilderQuestion(
            entryFor({
                question_type: "image_matching",
                image_matching_pairs: [
                    {
                        key: 9,
                        question_text: "Resistor",
                        question_image: "",
                        answer_text: "",
                        answer_image: "media/quiz_images/resistor.png",
                        explanation: "",
                        position: 0,
                    },
                ],
            }),
        );

        expect(ordering.items).toEqual(["Plan", "Build"]);
        expect(ordering.explanations).toEqual({ item_0: "Plan first" });
        expect(imageMatching.image_pairs).toEqual([
            {
                question_text: "Resistor",
                question_image: "",
                answer_text: "",
                answer_image: "media/quiz_images/resistor.png",
                explanation: "",
                position: 0,
            },
        ]);
    });

    it("finds the correct choice from option flags", () => {
        const question = libraryEntryToBuilderQuestion(
            entryFor({
                question_type: "mcq",
                options: [
                    { id: 1, text: "Volt", is_correct: false, position: 0 },
                    { id: 2, text: "Ampere", is_correct: true, position: 1 },
                ],
            }),
        );

        expect(question.options).toEqual(["Volt", "Ampere"]);
        expect(question.correct).toBe(1);
    });
});

describe("snapshotForQuestion round trip", () => {
    const cases = [
        {
            question_type: "mcq",
            text: "Unit of current?",
            points: 2,
            answer_data: { correct: 1 },
            options: [
                { id: 1, text: "Volt", is_correct: false, position: 0 },
                { id: 2, text: "Ampere", is_correct: true, position: 1 },
            ],
        },
        {
            question_type: "mcq_multi",
            text: "Conductors?",
            points: 1,
            answer_data: { correct_indices: [0, 2] },
            options: [
                { id: 1, text: "Copper", is_correct: true, position: 0 },
                { id: 2, text: "Glass", is_correct: false, position: 1 },
                { id: 3, text: "Silver", is_correct: true, position: 2 },
            ],
        },
        {
            question_type: "true_false",
            text: "Glass conducts well.",
            points: 1,
            answer_data: { correct: false },
        },
        {
            question_type: "short_answer",
            text: "Name the unit of resistance.",
            points: 1,
            answer_data: { keywords: ["ohm"], manual_grading: false },
        },
        {
            question_type: "matching",
            text: "Match the units.",
            points: 1,
            matching_pairs: [
                { key: 5, left_text: "Current", right_text: "Ampere", explanation: "", position: 0 },
                { key: 6, left_text: "Voltage", right_text: "Volt", explanation: "", position: 1 },
            ],
        },
        {
            question_type: "fill_blank",
            text: "The unit of power is {{blank}}.",
            points: 1,
            gap_answers: [
                { key: 7, gap_index: 0, accepted_answers: ["watt"], explanation: "" },
            ],
        },
        {
            question_type: "ordering",
            text: "Order the steps.",
            points: 1,
            answer_data: { items: ["Isolate", "Test"], explanations: { item_1: "Test last" } },
        },
    ];

    it.each(cases)("preserves a $question_type question", (questionData) => {
        const entry = entryFor(questionData);
        const snapshot = snapshotForQuestion(libraryEntryToBuilderQuestion(entry));
        const expected = entry.question_data;

        expect(snapshot.question_type).toBe(expected.question_type);
        expect(snapshot.text).toBe(expected.text);
        expect(snapshot.points).toBe(expected.points);
        expect(snapshot.answer_data).toMatchObject(expected.answer_data);
        expect(snapshot.options.map(({ text, is_correct, position }) => ({
            text,
            is_correct,
            position,
        }))).toEqual(withoutKeys(expected.options));
        expect(withoutKeys(snapshot.matching_pairs)).toEqual(
            withoutKeys(expected.matching_pairs),
        );
        expect(withoutKeys(snapshot.gap_answers)).toEqual(
            withoutKeys(expected.gap_answers),
        );
    });
});
